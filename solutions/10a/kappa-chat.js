var kappa = require('kappa-core')

var core = kappa('./multichat', {valueEncoding: 'json'})
core.writer('local', function (err, feed) {
  // `feed` is just a hypercore instance, just like the first few exercises.
  console.log(feed.key.toString('hex'))
})

