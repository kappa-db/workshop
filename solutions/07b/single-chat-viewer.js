const Hyperswarm = require('hyperswarm')
const hypercore = require('hypercore')
const pump = require('pump')

const feed = hypercore('./single-chat-feed-clone', 'dd5bd9ef129b88cd5305804be1f87cbbbdbf01fdbd4c235683a8d34723db2b89', {
  valueEncoding: 'json'
})

feed.createReadStream({ live: true })
  .on('data', function (data) {
    console.log(`<${data.timestamp}> ${data.nickname}: ${data.text}`)
  })

const swarm = new Hyperswarm()

feed.ready(function () {
  // we use the discovery as the topic
  swarm.join(feed.discoveryKey)
  swarm.on('connection', function (connection, info) {
    console.log('(New peer connected!)')

    // We use the pump module instead of stream.pipe(otherStream)
    // as it does stream error handling, so we do not have to do that
    // manually.

    // See below for more detail on how this work.
    pump(connection, feed.replicate(info.client, { live: true }), connection)
  })
})
