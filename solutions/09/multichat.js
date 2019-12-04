var hyperswarm = require('hyperswarm')
var hypercore = require('hypercore')
var multifeed = require('multifeed')
var pump = require('pump')

if (process.argv.length !== 3) {
  console.log('USAGE: "node multifeed.js 1" or "node multifeed.js 2"')
  process.exit(1)
  return
}
var num = process.argv[2]

var multi = multifeed('./multichat_' + num, {
  valueEncoding: 'json'
})

multi.writer('local', function (err, feed) {
  startSwarm()
  printChatLog()

  process.stdin.on('data', function (data) {
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString(),
      timestamp: new Date().toISOString()
    })
  })
})

function startSwarm () {
  var key = 'multichat'
  var swarm = hyperswarm()
  swarm.join(key, {
    lookup: true, // find & connect to peers
    announce: true // optional- announce self as a connection target
  })
  swarm.on('connection', function (connection, info) {
    console.log('(New peer connected!)')
    pump(connection, multi.replicate(info.client, { live: true }), connection)
  })
}

function printChatLog () {
  multi.ready(function () {
    var feeds = multi.feeds()
    feeds.forEach(logFeed)
    multi.on('feed', logFeed)
  })
}

function logFeed (feed) {
  console.log('watching', feed.key.toString('hex'), feed.length)
  feed.createReadStream({live: true})
    .on('data', function (data) {
      console.log(data.timestamp + '> ' + data.text.trim())
    })
}
