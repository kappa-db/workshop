var hypercore = require('hypercore')
var feed = hypercore('./single-chat-feed', {
  valueEncoding: 'json'
})

feed.append({
  type: 'chat-message',
  nickname: 'cat-lover',
  text: 'hello world',
  timestamp: '2018-11-05T14:26:000Z' // new Date().toISOString()
}, function(err, seq) {
  if (err) throw err
  console.log('Data was appended as entry #' + seq)
})

// feed.get(0, function (err, msg) {
//   console.log('msg', msg)
// })

process.stdin.on('data', function(data) {
  feed.append({
    type: 'chat-message',
    nickname: 'cat-lover',
    text: data.toString().trim(),
    timestamp: new Date().toISOString()
  })
})

feed.createReadStream({ live: true })
  .on('data', function(data) {
    console.log(`<${data.timestamp}> ${data.nickname}: ${data.text}`)
  })
