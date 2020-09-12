// node ./solutions/11/kappa-chat.js
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

var suffix = process.argv[2];

var core = kappa('./multichat-kappa-'+ suffix, { valueEncoding: 'json' })
core.use('chats', timestampView)

core.ready('chats', showTail)

function showTail() {
  core.api.chats.tail(10, function (msgs) {
    console.log('--------------')
    msgs.forEach(function (msg, i) {
      console.log(`${i + 1} - ${msg.value.timestamp}: ${msg.value.text}`)
    })
  });
  doWrite('Remember that `tail` will fire its callback only when the bottom of the list updates, like this msg')
}

process.stdin.on('data', function (data) {
  doWrite(data)
})

function doWrite(data){
  core.writer('local', function (err, feed) {
    if(err) console.error(err)
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString().trim(),
      timestamp: new Date().toISOString()
    })
  })
}