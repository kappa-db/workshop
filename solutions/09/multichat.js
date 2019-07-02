var discovery = require('discovery-swarm')
var hypercore = require('hypercore')
var multifeed = require('multifeed')
var pump = require('pump')

var multi = multifeed(hypercore, './multichat', {
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
  var swarm = discovery()
  swarm.join(key)
  swarm.on('connection', function (connection) {
    console.log('(New peer connected!)')
    pump(connection, multi.replicate({ live: true }), connection)
  })
}

function printChatLog () {
  multi.ready(function () {
    var feeds = multi.feeds()
    feeds.forEach(function (feed) {
      feed.createReadStream({live: true})
        .on('data', function (data) {
          console.log(data.timestamp + '> ' + data.text.trim())
        })
    })
  })
}
