var hypercore = require('hypercore')
var feed = hypercore('./single-chat-feed', {
  valueEncoding: 'json'
})

process.stdin.on('data', function (data) {
  feed.append({
    type: 'chat-message',
    nickname: 'cat-lover',
    text: data.toString().trim(),
    timestamp: new Date().toISOString()
  })
})

feed.createReadStream({ live: true })
  .on('data', function (data) {
    console.log(`<${data.timestamp}> ${data.nickname}: ${data.text}`)
  })
