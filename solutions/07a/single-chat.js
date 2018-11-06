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

// feed.get(0, function (err, msg) {
//   console.log('msg', msg)
// })

process.stdin.on('data', function (data) {
  feed.append({
    type: 'chat-message',
    nickname: 'cat-lover',
    text: data.toString(),
    timestamp: new Date().toISOString()
  })
})

feed.createReadStream({live:true})
  .on('data', function (data) {
    console.log(data.timestamp + '> ' + data.text.trim())
  })

feed.ready(function () {
  console.log('public key:', feed.key.toString('hex'))
  console.log('discovery key:', feed.discoveryKey.toString('hex'))
  console.log('secret key:', feed.secretKey.toString('hex'))
})

