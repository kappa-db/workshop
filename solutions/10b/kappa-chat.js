const kappa = require('kappa-core')
const ram = require('random-access-memory')
const memdb = require('memdb')
const list = require('kappa-view-list')

var timestampView = list(memdb(), function (msg, next) {
  if (msg.value.timestamp && typeof msg.value.timestamp === 'string') {
    // sort on the 'timestamp' field
    next(null, [msg.value.timestamp])
  } else {
    next()
  }
})

const core = kappa('./multichat', { valueEncoding: 'json' })
core.use('chats', timestampView)

core.api.chats.read()
  .on('data', console.log)
