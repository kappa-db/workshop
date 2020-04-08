var hypercore = require('hypercore')
var feed = hypercore('./single-chat-feed', {
  valueEncoding: 'json'
})

feed.append({
  type: 'chat-message',
  nickname: 'cat-lover',
  text: 'hello world',
  timestamp: '2018-11-05T14:26:000Z' // new Date().toISOString()
}, function (err, seq) {
  if (err) throw err
  console.log('Data was appended as entry #' + seq)
})

feed.get(0, function (err, msg) {
  console.log('msg', msg)
})
