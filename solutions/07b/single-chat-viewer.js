var hyperswarm = require('hyperswarm')
var hypercore = require('hypercore')
var pump = require('pump')

// var feed = hypercore('./single-chat-feed-clone', '{paste the public key from the prev exercise}', {
var feed = hypercore('./single-chat-feed-clone', '279aeeceeb0572a15ab03056b7de9bb7dbbb19bdb39ad29cd8a7802fcd2e5c53', {
  valueEncoding: 'json'
})

feed.createReadStream({ live: true})
  .on('data', function (data) {
    console.log(data)
  })

var swarm = hyperswarm()

feed.ready(function () {
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
    pump(connection, feed.replicate(info.initiator, { live: true }), connection)
  })
})

