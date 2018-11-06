var discovery = require('discovery-swarm')
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

var swarm = discovery()

feed.ready(function () {
  // we use the discovery as the topic
  swarm.join(feed.discoveryKey)
  swarm.on('connection', function (connection) {
    console.log('(New peer connected!)')
    
    // We use the pump module instead of stream.pipe(otherStream)
    // as it does stream error handling, so we do not have to do that
    // manually.
    
    // See below for more detail on how this work.
    pump(connection, feed.replicate({ live: true }), connection)
  })
})

