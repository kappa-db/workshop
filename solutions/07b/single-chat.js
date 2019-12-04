var hyperswarm = require('hyperswarm')
var hypercore = require('hypercore')
var pump = require('pump')

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

var swarm = hyperswarm()

feed.ready(function () {
  console.log(feed.key.toString('hex'))

  // we use the discovery as the topic
  swarm.join(feed.discoveryKey, {
    lookup: true, // find & connect to peers
    announce: true // optional- announce self as a connection target
  })
  swarm.on('connection', function (connection, info) {
    console.log('(New peer connected!)')

    // We use the pump module instead of stream.pipe(otherStream)
    // as it does stream error handling, so we do not have to do that
    // manually.

    // See below for more detail on how this work.
    console.log('info', info)
    pump(connection, feed.replicate(info.client, { live: true }), connection)
  })
})

