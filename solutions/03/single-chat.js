var hypercore = require('hypercore')
var feed = hypercore('./single-chat-feed', {
  valueEncoding: 'json'
})

feed.get(0, function (err, msg) {
  console.log('msg', msg)
})
