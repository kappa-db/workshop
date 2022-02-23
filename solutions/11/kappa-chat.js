const kappa = require('kappa-core')
const ram = require('random-access-memory')
const memdb = require('memdb')
const list = require('kappa-view-list')

const timestampView = list(memdb(), function (msg, next) {
  if (msg.value.timestamp && typeof msg.value.timestamp === 'string') {
    // sort on the 'timestamp' field
    next(null, [msg.value.timestamp])
  } else {
    next()
  }
})

const core = kappa('./multichat', { valueEncoding: 'json' })
core.use('chats', timestampView)

core.ready(function () {
  core.api.chats.tail(10, function (msgs) {
    console.log('--------------')
    msgs.forEach(function (msg, i) {
      console.log(`${i + 1} - ${msg.value.timestamp}: ${msg.value.text}`)
    })
  })
})

process.stdin.on('data', function (data) {
  core.writer('local', function (err, feed) {
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString().trim(),
      timestamp: new Date().toISOString()
    })
  })
})
