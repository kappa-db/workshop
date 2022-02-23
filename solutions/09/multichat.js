const Hyperswarm = require('hyperswarm')
const hypercore = require('hypercore')
const multifeed = require('multifeed')
const crypto = require('crypto')
const pump = require('pump')

if (process.argv.length !== 3) {
  console.log('USAGE: "node multifeed.js 1" or "node multifeed.js 2"')
  process.exit(1)
  return
}
const num = process.argv[2]

// Creating topic
const topicHex = crypto.createHash('sha256')
  .update('foobar-123')
  .digest()

const multi = multifeed('./multichat_' + num, {
  valueEncoding: 'json'
})

multi.writer('local', function(err, feed) {
  startSwarm(topicHex)
  printChatLog()

  process.stdin.on('data', function(data) {
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString().trim(),
      timestamp: new Date().toISOString()
    })
  })
})

function startSwarm(topic) {
  const swarm = new Hyperswarm()
  swarm.join(topic)
  swarm.on('connection', function(connection, info) {
    console.log('(New peer connected!)')
    pump(connection, multi.replicate(info.client, { live: true }), connection)
  })
}

function printChatLog() {
  multi.ready(function() {
    const feeds = multi.feeds()
    feeds.forEach(logFeed)
    multi.on('feed', logFeed)
  })
}

function logFeed(feed) {
  console.log('watching', feed.key.toString('hex'), feed.length)
  feed.createReadStream({ live: true })
    .on('data', function(data) {
      console.log(`<${data.timestamp}> ${data.nickname}: ${data.text}`)
    })
}
