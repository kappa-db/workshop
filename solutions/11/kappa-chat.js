var kappa = require('kappa-core')
var ram = require('random-access-memory')
var memdb = require('memdb')
var list = require('kappa-view-list')

var timestampView = list(memdb(), function (msg, next) {
    if (msg.value.timestamp && typeof msg.value.timestamp === 'string') {
        // sort on the 'timestamp' field
        next(null, [msg.value.timestamp])
    } else {
        next()
    }
})

var core = kappa('./multichat', {valueEncoding: 'json'})
core.use('chats', timestampView)

core.ready(function () {
  core.api.chats.tail(10, function (msgs) {
    console.log('--------------')
    msgs.forEach(function (msg) {
      console.log(msg.value.timestamp + '> ' + msg.value.text.trim())
    })
  })
})

process.stdin.on('data', function (data) {
  core.writer('local', function (err, feed) {
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString(),
      timestamp: new Date().toISOString()
    })
  })
})

