const Hyperswarm = require('hyperswarm')
const swarm = new Hyperswarm()
const topic = Buffer.from('a49766a23610999dc5dfe05bc37cd98a9911d4b46bd25fc2cd037b9669a1e214', 'hex')

swarm.join(topic)

swarm.on('connection', (socket, info) => {
  console.log('new connection!', info)

  // you can now use the socket as a stream, eg:
  // process.stdin.pipe(socket).pipe(process.stdout)
})
