// @flow

/* flow-include
type optionsObjectOrString = string|{
  host?: string,
  port?: number,
  lazyConnect?: boolean
}
*/

const Redis = require('ioredis')
const EventEmitter = require('events')

const defaultOptions = {
  lazyConnect: false,
  serialize: JSON.stringify,
  unserialize: JSON.parse,
  // Amount of time to wait on XREAD - ideally we call client UNBLOCK on-demand, so this tunable shouldn't really matter much
  blockingInterval: 5000
}

// $FlowIssue (logger takes any number of arguments)
function logger () {
  if (process.env.RSA_DEBUG === 'true') console.log.apply(console, arguments) // eslint-disable-line
}

function RedisStreamsAggregator (options /*: optionsObjectOrString */) {
  // Stores a list of subscriptions by subscription key, with the value as Array<subscribers, offset>
  this.subscriptions = {}
  // Indicates if the read stream is currently blocked by an XREAD call
  this.readStreamActive = false
  this.events = new EventEmitter()
  this.on = this.events.on
  // Default options
  if (typeof options === 'string') options = { host: options }
  this.options = Object.assign({}, defaultOptions, options)

  // Create redis read & write handles with debugable connection names
  const r = `${Math.floor(Math.random() * 10000000)}`
  const readName = `read:${r}`
  const writeName = `write:${r}`
  this.handles = {
    read: new Redis(Object.assign(this.options, { connectionName: readName })),
    write: new Redis(Object.assign(this.options, { connectionName: writeName })),
    readName,
    writeName
  }
  logger('RedisStreamsAggregator()', { readName, writeName })

  // We need to retrieve the read connections "client id" so that we can call CLIENT UNBLOCK on it later
  const getReadClientId = () => {
    if (this.handles.read.status === 'connect' && this.handles.write.status === 'connect') {
      this.handles.read.client('id').then(id => {
        this.readId = id
        this.events.emit('ready')
      })
    }
  }

  this.handles.write.on('connect', getReadClientId)
  this.handles.read.on('connect', getReadClientId)

  // Class methods below
  this.connect = function () {
    if (!this.handles.read.connected) this.handles.read.connect()
    if (!this.handles.write.connected) this.handles.write.connect()
  }

  this.disconnect = function () {
    this.readId = false
    this.events.removeAllListeners()
    return Promise.all([this.handles.read.disconnect(), this.handles.write.disconnect()])
  }

  this.unsubscribe = function (id /*: string */, onEvent /*: Function */) {
    if (!this.subscriptions[id]) return
    if (this.subscriptions[id][0] > 0) {
      this.events.removeListener(id, onEvent)
      this.subscriptions[id][0] -= 1
    }
    if (this.subscriptions[id][0] === 0) delete this.subscriptions[id]
  }

  this.subscribe = function (id /*: string */, offset /*: string */, onEvent /*: Function */) {
    if (typeof this.readId !== 'number') return
    if (!this.subscriptions[id]) {
      this.subscriptions[id] = [1, offset]
      this.readStream()
    } else {
      this.subscriptions[id][0] += 1
    }
    this.events.on(id, onEvent)
  }

  this.add = function (id /*: string */, type /*: string */, content /*: Object */, msgId = '*') {
    if (typeof this.readId !== 'number') return
    const body = typeof content === 'object' ? this.options.serialize(content) : content
    return this.handles.write.xadd(id, msgId, type, body)
  }

  this.unblock = function () {
    if (!this.readStreamActive) return
    this.handles.write.client('unblock', this.readId).then(() => (this.readStreamActive = false))
  }

  this.readStream = async function () {
    if (typeof this.readId !== 'number') return
    if (this.readStreamActive) await this.unblock()
    this.readStreamActive = true

    const streamIds = []
    const streamOffsets = []
    for (const id in this.subscriptions) {
      streamIds.push(id)
      streamOffsets.push(this.subscriptions[id][1])
    }
    if (streamIds.length < 1) return
    const messages = await this.handles.read.xread(
      'BLOCK',
      this.options.blockingInterval,
      'STREAMS',
      ...streamIds,
      ...streamOffsets
    )
    this.readStreamActive = false
    if (typeof this.readId !== 'number') return
    if (messages) {
      for (let i = 0; i < messages.length; i++) {
        const newEventId = messages[i][0]
        if (this.subscriptions[newEventId]) {
          const eventMessagesRaw = messages[i][1]
          const eventMessages = eventMessagesRaw.map(r => {
            r[1][1] = this.options.unserialize(r[1][1])
            return r
          })
          this.subscriptions[newEventId].offset = eventMessages[eventMessages.length - 1][0]
          this.events.emit(newEventId, eventMessages)
        }
      }
    }
    await this.readStream()
  }

  return this
}

module.exports = RedisStreamsAggregator
