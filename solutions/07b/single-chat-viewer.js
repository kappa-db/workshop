var discovery = require('discovery-swarm')
var hypercore = require('hypercore')
var pump = require('pump')

// var feed = hypercore('./single-chat-feed-clone', '{paste the public key from the prev exercise}', {
var feed = hypercore('./single-chat-feed-clone', 'e2b996baf713b5fa86f0cf5aafa950df5b9b4ece96a3937607af682a513b5275', {
  valueEncoding: 'json'
})

feed.createReadStream({ live: true})
  .on('data', function (data) {
    console.log(data)
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

