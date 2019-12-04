const hyperswarm = require('hyperswarm')

const swarm = hyperswarm()

var topic = Buffer.from('a49766a23610999dc5dfe05bc37cd98a9911d4b46bd25fc2cd037b9669a1e214', 'hex')

swarm.join(topic, {
  lookup: true, // find & connect to peers
  announce: true // optional- announce self as a connection target
})

swarm.on('connection', (socket, details) => {
  console.log('new connection!', details)

  // you can now use the socket as a stream, eg:
  // process.stdin.pipe(socket).pipe(process.stdout)
})
