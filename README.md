
<div align="center">
  <br />
  <h2>Redis Streams Aggregator</h2>

  A connection collapser and toolkit built around Redis5's XADD and XREAD commands, powered by ioredis
  <br /><br />
  <a href="https://npm.runkit.com/redis-streams-aggregator"><img src="https://img.shields.io/npm/v/redis-streams-aggregator.svg?style=for-the-badge" /></a>&nbsp;<a href="https://circleci.com/gh/erulabs/redis-streams-aggregator"><img src="https://img.shields.io/circleci/project/github/erulabs/redis-streams-aggregator.svg?style=for-the-badge" /></a>&nbsp;<img src="https://img.shields.io/npm/l/redis-streams-aggregator.svg?style=for-the-badge" />&nbsp;<a href="https://givethanks.app/donate/npm/redis-streams-aggregator"><img src="https://img.shields.io/badge/donate-givethanks-gold.svg?style=for-the-badge" /></a>
  <br /><br />
</div>

## What? Why?
Redis 5 adds [Streams](https://redis.io/topics/streams-intro), a powerful new data structure which simplifies the construction of real-time applications. The new [XREAD](https://redis.io/commands/xread) command blocks a redis connection while awaiting new data, allows reading from multiple streams, and can be canceled with the new [CLIENT UNBLOCK](https://redis.io/commands/client-unblock) command. This package wraps XREAD and XADD such that new subscriptions automatically UNBLOCK the existing stream, add their new subscription (and handle offset tracking), and restart the stream. The end effect is that you'll need only two Redis connections open - one for reading and one for writing (including the UNBLOCKing).

With `redis-streams-aggregator`, you can just call `.subscribe()` and `.add()` and leave the stream management to us!

## Install
```bash
yarn add redis-streams-aggregator
```

## Use
```javascript
const RedisStreamsAgg = require('redis-streams-aggregator')
const streams = new RedisStreams() // options like: { host: ..., port: ... } etc

// Sign up for XREAD, get all messages to 'testId' in real-time
streams.subscribe('testId', messages => {
  console.log('I got messages!', { messages })
})

// Write data to a stream (very thin wrapper around XADD)
streams.add('testId', { value: 'foobar' })
```

## API Documentation

## Messages

Messages events provide arrays of "Message" objects, which have the following properties:

```js
const Message = {
  offset: string,
  key: value,
  key2: value2...
}
```

For example, consider the following:

```js
// Server
streams.add('testChannel', { foo: 'bar' })

streams.subscribe('testChannel', '*', messages => {
  // messages === [
  //  [ "1518951480106-0", { foo: 'bar' } ]
  // ]
})
```

## Server

### RedisStreamsAggregator(options)

Where "options" is an object with the following properties:

| Option        | Required |     Default        | Description                               |
| :------------ | :------: | :--------------:   | ----------------------------------------- |
| `host`        |    no    | `localhost`        | Redis host uri                            |
| `port`        |    no    | `6379`             | Redis port                                |
| `serialize`   |    no    | `JSON.stringify`   | A function for encoding published objects |
| `unserialize` |    no    | `JSON.parse`       | A function for decoding published objects |


```js
const server = new RedisStreamsAggregator({
  host: '192.168.0.1',
  port: 6379
})
```

### Server Events

- **ready** - Connected to Redis
- **connect** - A new socket has connected
- **error** - An error has been encountered (connection to Redis failed, etc)
