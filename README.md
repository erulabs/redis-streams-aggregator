
<div align="center">
  <br />
  <h2>Redis Streams Aggregator</h2>

  A connection collapser and toolkit build around Redis5's XADD and XREAD commands, powered by ioredis
  <br /><br />
  <a href="https://npm.runkit.com/redis-streams-aggregator"><img src="https://img.shields.io/npm/v/redis-streams-aggregator.svg?style=for-the-badge" /></a>
  <a href="https://circleci.com/gh/erulabs/redis-streams-aggregator"><img src="https://img.shields.io/circleci/project/github/erulabs/redis-streams-aggregator.svg?style=for-the-badge" /></a>
  <img src="https://img.shields.io/npm/dt/redis-streams-aggregator.svg?style=for-the-badge" />
  <br /><br />
  <img src="https://img.shields.io/github/release-date/erulabs/redis-streams-aggregator.svg?style=for-the-badge" />
  <img src="https://img.shields.io/npm/l/redis-streams-aggregator.svg?style=for-the-badge" />
  <br /><br />
</div>

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
socket.add('testChannel', 'TEST_MESSAGE', { foo: 'bar' })

socket.subscribe('testChannel', '*', messages => {
  // messages === [
  //  {
  //    offset: "1518951480106-0",
  //    TEST_MESSAGE: { foo: 'bar' } }
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
const server = new RedisStreamsAggregator({ host: '192.168.0.1', port: 6379 })
```

If the "options" argument is a string, or an array of strings, it is assumed to be the `targets` option.

### Server Events

- **ready** - Connected to Redis
- **connect** - A new socket has connected
- **error** - An error has been encountered (connection to Redis failed, etc)
