const Hyperswarm = require('hyperswarm')
const hypercore = require('hypercore')
const pump = require('pump')

const feed = hypercore('./single-chat-feed', {
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

const swarm = new Hyperswarm()

feed.ready(function () {
  console.log(feed.key.toString('hex'))

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
