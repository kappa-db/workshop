var kappa = require('kappa-core')
var ram = require('random-access-memory')
var memdb = require('memdb')
var list = require('kappa-view-list')

var timestampView = list(memdb(), function (msg, next) {
    if (msg.value.timestamp && typeof msg.value.timestamp === 'string') {
        // sort on the 'timestamp' field
        next(null, [msg.value.timestamp])
    } else {
        next()
    }
})

var core = kappa('./multichat', {valueEncoding: 'json'})
core.use('chats', timestampView)

core.api.chats.read()
  .on('data', console.log)

