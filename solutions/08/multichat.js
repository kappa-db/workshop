var discovery = require('discovery-swarm')
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
  swarm.on('connection', function (connection, info) {
    console.log('(New peer connected!)')
    pump(connection, multi.replicate(info.initiator, { live: true }), connection)
  })
}
