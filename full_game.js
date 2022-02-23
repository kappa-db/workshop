const chalk = require('chalk')
const kappa = require('kappa-core')
const memdb = require('memdb')
const neatlog = require('neat-log')
const neatinput = require('neat-log/input')
const blit = require('txt-blit')
const kv = require('kappa-view-kv')
const list = require('kappa-view-list')
const ram = require('random-access-memory')
const Hyperswarm = require('hyperswarm')
const pump = require('pump')
const crypto = require('crypto')

// Creating topic
const topicHex = crypto.createHash('sha256')
		       .update('kappa-workshop-fullgame')
		       .digest()

const positionView = kv(memdb(), function (msg, next) {
  if (msg.value.type !== 'move-player') return next()

  const op = {
    key: msg.key,
    id: msg.key + '@' + msg.seq,
    links: msg.value.links
  }
  next(null, [op])
})

const chatView = list(memdb(), function (msg, next) {
  if (msg.value.type !== 'chat-message') return next()

  next(null, [msg.value.timestamp])
})

const core = kappa(ram, {valueEncoding:'json'})
core.use('pos', positionView)
core.use('chat', chatView)

// search the local network + internet for peers
core.ready(function () {
  const swarm = new Hyperswarm()
  swarm.join(topicHex)
  swarm.on('connection', function (connection, info) {
    pump(connection, core.replicate(info.client, { live: true }), connection)
  })
})

// start the local player at 15,6, if their feed is empty
core.writer('local', function (err, feed) {
  if (feed.length > 0) return
  feed.append({
    type: 'move-player',
    x: 15,
    y: 6,
    links: []
  })
})

const app = neatlog(view, {
  fullscreen: true,
  style: function (start, cursor, end) {
    if (!cursor) cursor = ' '
    return start + chalk.underline(cursor) + end
  }
})
app.use(mainloop)

// player movement keys
app.input.on('right', moveLocalPlayer.bind(null, 1, 0))
app.input.on('left', moveLocalPlayer.bind(null, -1, 0))
app.input.on('up', moveLocalPlayer.bind(null, 0, -1))
app.input.on('down', moveLocalPlayer.bind(null, 0, 1))

// composing chat messages
app.input.on('keypress', function (ch, key) {
  if (!key || !key.name) return
  if (key.name === 'home') this.neat.input.cursor = 0
  else if (key.name === 'end') this.neat.input.cursor = this.neat.input.rawLine().length
  app.render()
})

// submitting a chat message
app.input.on('enter', function (line) {
  core.writer('local', function (err, feed) {
    feed.append({
      type: 'chat-message',
      text: line,
      timestamp: new Date().toISOString()
    })
  })
})

// move the local player
function moveLocalPlayer (xoffset, yoffset) {
  core.writer('local', function (err, feed) {
    core.api.pos.get(feed.key.toString('hex'), function (err, values) {
      const x = (values[0].value.x || 0) + xoffset
      const y = (values[0].value.y || 0) + yoffset
      const links = values.map(v => v.key + '@' + v.seq)
      feed.append({
        type: 'move-player',
        x: x,
        y: y,
        links: links
      })
    })
  })
}

// redraw the game synchronously
function view (state) {
  const screen = []

  // draw chat window
  const chatWindowHeight = 10
  const chatWindow = drawChatWindowOutline(process.stdout.columns, chatWindowHeight)
  blit(screen, chatWindow, 0, process.stdout.rows - chatWindowHeight - 1)

  // draw chat input
  blit(screen, drawPrompt(), 1, process.stdout.rows - 1)

  // draw chat messages
  blit(screen, drawChatMessages(state, process.stdout.columns - 4, chatWindowHeight - 2), 2, process.stdout.rows - chatWindowHeight)

  // draw game area
  const world = drawWorld(state, process.stdout.columns, process.stdout.rows - chatWindowHeight - 2)
  blit(screen, world, 0, 0)

  return screen.join('\n')
}

// draw all of the players
function drawWorld (state, w, h) {
  const out = []
  Object.keys(state.characters || {}).forEach(function (key) {
    const player = state.characters[key]
    const playerString = chalk.greenBright('@')
    blit(out, [playerString], player.x, player.y)
  })
  return out
}

// draw the outline of the chat window
function drawChatWindowOutline (w, h) {
  const topbottom = new Array(w).fill('-').join('')

  let middle = new Array(w).fill(' ')
  middle[0] = middle[w-1] = '|'
  middle = middle.join('')

  let out = new Array(h).fill(middle)
  out[0] = out[h-1] = topbottom

  // color the window outline blue
  out = out.map(function (line) {
    return chalk.blue(line)
  })

  return out
}

// draw all of the chat messages
function drawChatMessages (state, w, h) {
  return state.messages.map(function (msg) {
    return msg.key.substring(0,8) + '> ' + msg.value.text.substring(0, w)
  })
}

// draw the current chat message being composed
function drawPrompt () {
  return [
    `> ${app.input.line()}`
  ]
}

// keep the ui state up-to-date by listening to the 'pos' and 'chat' views
function mainloop (state, bus) {
  state.characters = {}
  state.messages = []

  core.api.pos.onUpdate(function (key, msg) {
    state.characters[key] = { x: msg.value.x, y: msg.value.y }
    bus.emit('render')
  })

  core.api.chat.tail(8, function (msgs) {
    state.messages = msgs
    bus.emit('render')
  })
}

