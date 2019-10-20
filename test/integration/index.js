// @flow

/* flow-include
declare var describe: Function;
declare var it: Function;
*/

const chai = require('chai')
const expect = chai.expect

const RedisStreamsAggregator = require('../../index.js')
const redisUri = (process.env.REDIS_URI || 'redis:6379').split(':')
const blockingInterval = 100

let instance
describe('RedisStreamsAggregator', function () {
  function isMessagesWellFormed (messages) {
    expect(Array.isArray(messages), 'Array.isArray(messages)').to.equal(true)
    expect(Array.isArray(messages[0]), 'Array.isArray(messages[0])').to.equal(true)
    expect(messages[0][1]).to.be.a('object')
  }

  describe('new RedisStreamsAggregator()', function () {
    it('Creates and connects', function (done) {
      this.timeout(15000)
      instance = new RedisStreamsAggregator({
        host: redisUri[0],
        port: parseInt(redisUri[1], 10),
        blockingInterval
      })
      instance.events.on('ready', async () => {
        expect(instance.subscriptions, '.subscriptions').to.exist
        expect(instance.handles.read).to.exist
        expect(instance.handles.write).to.exist
        await instance.handles.write.del('testId', 'testId2', 'testId3', 'testId4')
        done()
      })
    })
  })
  const testSubFunction = messages => { }
  describe('.subscribe()', function () {
    it('Allows a subsciptions to redis streams', async function () {
      await instance.subscribe('testId', '$', testSubFunction)
      expect(Object.keys(instance.subscriptions)).to.have.lengthOf(1)
      expect(instance.subscriptions.testId).to.deep.equal([1, '$'])
    })

    it('continues reading after a BLOCK timeout with no messages', function (done) {
      const testObj = { whatwhat: 'keepReading' }
      async function keepReadingMsg (messages) {
        isMessagesWellFormed(messages)
        expect(messages[0][1], 'messages[0][1][1]').to.deep.equal(testObj)
        await instance.unblock()
        instance.unsubscribe('keepReading', keepReadingMsg)
        done()
      }
      instance.subscribe('keepReading', '$', keepReadingMsg).then(() => {
        setTimeout(() => {
          instance.add('keepReading', testObj)
        }, Math.floor(blockingInterval * 1.5))
      })
    }).timeout(blockingInterval * 2)
  })
  describe('.unsubscribe()', function () {
    it('Removes subsciptions from redis streams', async function () {
      await instance.unsubscribe('testId', testSubFunction)
      expect(Object.keys(instance.subscriptions)).to.have.lengthOf(0)
      expect(instance.subscriptions.testId).to.not.exist
    })
  })
  describe('.add()', function (done) {
    it('Adds events and gets them via subscriptions', function (done) {
      let doneTwice = 0
      function finish () {
        if (++doneTwice === 2) done()
      }
      const testObj = { foo: 'bar' }
      let callOnce = false
      const testSubFunction2 = async messages => {
        isMessagesWellFormed(messages)
        expect(messages[0][0]).to.be.a('string')
        expect(messages[0][1], 'messages[0][1][1]').to.deep.equal(testObj)
        expect(instance.subscriptions.testId2[1]).to.not.equal('0')
        instance.unsubscribe('testId2', testSubFunction2)
        if (callOnce) return
        callOnce = true
        finish()
      }
      instance.subscribe('testId2', '0', testSubFunction2).then(() => {
        instance.add('testId2', testObj).then(newOffset => {
          expect(newOffset, 'newOffset').to.be.a('string') // 1540154781259-0
          finish()
        })
      })
    })

    it('Can subscribe to many streams', function (done) {
      let messages3
      let messages4
      function testFunc3 (msgs) {
        messages3 = msgs
        if (messages3 && messages4) doTest()
      }
      function testFunc4 (msgs) {
        messages4 = msgs
        if (messages3 && messages4) doTest()
      }
      const doTest = async () => {
        isMessagesWellFormed(messages3)
        isMessagesWellFormed(messages4)
        let twoResponses = 0
        await instance.subscribe('testId4', '$', msgs => {
          if (++twoResponses === 2) done()
        })

        instance.unsubscribe('testId3', testFunc3)
        instance.unsubscribe('testId4', testFunc4)
        await instance.add('testId4', { final: 'foobar' })
      }

      Promise.all([instance.subscribe('testId3', '$', testFunc3), instance.subscribe('testId4', '$', testFunc4)]).then(
        numSubscriptions => {
          Promise.all([instance.add('testId3', { testId3: 1 }), instance.add('testId4', { testId4: 50 })]).then(
            messages => { }
          )
        }
      )
    }).timeout(5000)
  })

  describe('.disconnect()', function () {
    it('disconnects from redis', async function () {
      await instance.disconnect()
      expect(instance.readId).to.equal(false)
    }).timeout(blockingInterval / 2)
    // Note that this timeout needs to be _less_ than the blocking interval
    // This is because its important we do not wait for a blocking call to recover before
    // disconnect. (disconnect should unblock, and this tests that)
  })
})
