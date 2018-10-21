// @flow

/* flow-include
declare var describe: Function;
declare var it: Function;
*/

const chai = require('chai')
const expect = chai.expect

const RedisStreamsAggregator = require('../../index.js')

let instance
describe('RedisStreamsAggregator', () => {
  describe(`new RedisStreamsAggregator()`, () => {
    it('Creates without connecting', () => {
      instance = new RedisStreamsAggregator({
        hosts: [process.env.REDIS_URIS || 'redis:6379'],
        autoConnect: false
      })
      expect(instance.subscriptions, '.subscriptions').to.exist
    })
  })
  describe(`.connect()`, () => {
    it('Connects to redis', async () => {
      await instance.connect()
      expect(instance.handles.read).to.exist
      expect(instance.handles.write).to.exist
    })
  })
  const testSubFunction = messages => {}
  describe(`.subscribe()`, () => {
    it('Allows a subsciptions to redis streams', async () => {
      instance.subscribe('testId', '0', testSubFunction)
      expect(Object.keys(instance.subscriptions)).to.have.lengthOf(1)
      expect(instance.subscriptions['testId']).to.deep.equal({
        subscribers: 1,
        offset: '0'
      })
    })
  })
  describe(`.unsubscribe()`, () => {
    it('Removes subsciptions from redis streams', () => {
      instance.unsubscribe('testId', testSubFunction)
      expect(Object.keys(instance.subscriptions)).to.have.lengthOf(0)
      expect(instance.subscriptions['testId']).to.not.exist
    })
  })
  describe(`.add()`, () => {
    function isMessagesWellFormed (messages) {
      expect(Array.isArray(messages), 'Array.isArray(messages)').to.equal(true)
      expect(Array.isArray(messages[0]), 'Array.isArray(messages[0])').to.equal(true)
      expect(Array.isArray(messages[0][1]), 'Array.isArray(messages[0][1])').to.equal(true)
    }

    it('Adds events and gets them via subscriptions', done => {
      const testObj = { foo: 'bar' }
      const testSubFunction2 = messages => {
        isMessagesWellFormed(messages)
        expect(messages[0][0]).to.be.a('string')

        expect(messages[0][1][0], 'messages[0][1][0]').to.equal('ADD_TEST')
        expect(messages[0][1][1], 'messages[0][1][1]').to.deep.equal(testObj)

        instance.unsubscribe('testId2', testSubFunction)
        done()
      }
      instance.subscribe('testId2', '0', testSubFunction2).add('testId2', 'ADD_TEST', testObj)
    })

    it('Can subscribe to many streams', async () => {
      let messages3
      let messages4
      const testFunc3 = msgs => {
        messages3 = msgs
        if (messages3 && messages4) doTest()
      }
      const testFunc4 = msgs => {
        messages4 = msgs
        if (messages3 && messages4) doTest()
      }
      const doTest = async () => {
        isMessagesWellFormed(messages3)
        expect(messages4).to.equal(undefined)

        await instance.add('testId4', 'testId4DATA', { blgeh: 'bar' })
        isMessagesWellFormed(messages4)

        instance.unsubscribe('testId3', testSubFunction)
        instance.unsubscribe('testId4', testSubFunction)
      }
      await instance
        .subscribe('testId3', '0', testFunc3)
        .subscribe('testId4', '0', testFunc4)
        .add('testId3', 'testId3DATA', { blgeh: 'bar' })
    })
  })
  describe(`.disconnect()`, async () => {
    it('disconnects from redis', async () => {
      await instance.disconnect()
      expect(instance.readId).to.equal(false)
    }).timeout(60000)
  })
})
