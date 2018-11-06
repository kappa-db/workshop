var discovery = require('discovery-swarm')
var hypercore = require('hypercore')
var multifeed = require('multifeed')
var pump = require('pump')

var multi = multifeed(hypercore, './multichat', {
  valueEncoding: 'json'
})

multi.writer('local', function (err, feed) {
  feed.append({ 
    type: 'chat-message',
    nickname: 'cat-lover',
    text: 'hello world', 
    timestamp: '2018-11-05T14:26:000Z' // new Date().toISOString()
  }, function (err, seq) {
    if (err) throw err
    console.log('Data was appended as entry #' + seq)
  })

  process.stdin.on('data', function (data) {
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString(),
      timestamp: new Date().toISOString()
    })
  })
})
