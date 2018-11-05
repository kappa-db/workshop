var chalk = require('chalk')
var kappa = require('kappa-core')
var memdb = require('memdb')
var neatlog = require('neat-log')
var neatinput = require('neat-log/input')
var blit = require('txt-blit')
var kv = require('kappa-view-kv')
var list = require('kappa-view-list')
var ram = require('random-access-memory')

var core = kappa(ram, {valueEncoding:'json'})
core.use('pos', kv(memdb(), function map (msg, next) {
  if (msg.value.type !== 'move-player') return next()

  var op = {
    key: msg.key,
    id: msg.key + '@' + msg.seq,
    links: msg.value.links
  }
  next(null, [op])
}))
core.use('chat', list(memdb(), function map (msg, next) {
  if (msg.value.type !== 'chat-message') return next()

  next(null, [msg.value.timestamp])
}))

core.feed('local', function (err, feed) {
  feed.append({
    type: 'move-player',
    x: 15,
    y: 6,
    links: []
  })
})

var app = neatlog(view, {
  fullscreen: true,
  style: function (start, cursor, end) {
    if (!cursor) cursor = ' '
    return start + chalk.underline(cursor) + end
  }
})
app.use(mainloop)

app.input.on('right', moveLocalPlayer.bind(null, 1, 0))
app.input.on('left', moveLocalPlayer.bind(null, -1, 0))
app.input.on('up', moveLocalPlayer.bind(null, 0, -1))
app.input.on('down', moveLocalPlayer.bind(null, 0, 1))

app.input.on('keypress', function (ch, key) {
  if (!key || !key.name) return
  if (key.name === 'home') this.neat.input.cursor = 0
  else if (key.name === 'end') this.neat.input.cursor = this.neat.input.rawLine().length
  app.render()
})

app.input.on('enter', function (line) {
  core.feed('local', function (err, feed) {
    feed.append({
      type: 'chat-message',
      text: line,
      timestamp: new Date().toISOString()
    })
  })
})

function moveLocalPlayer (xoffset, yoffset) {
  core.feed('local', function (err, feed) {
    core.api.pos.get(feed.key.toString('hex'), function (err, values) {
      var x = (values[0].value.x || 0) + xoffset
      var y = (values[0].value.y || 0) + yoffset
      var links = values.map(v => v.key + '@' + v.seq)
      feed.append({
        type: 'move-player',
        x: x,
        y: y,
        links: links
      })
    })
  })
}

function view (state) {
  var screen = []

  // draw chat window
  var chatWindowHeight = 10
  var chatWindow = drawChatWindowOutline(process.stdout.columns, chatWindowHeight)
  blit(screen, chatWindow, 0, process.stdout.rows - chatWindowHeight - 1)

  // draw chat input
  blit(screen, drawPrompt(), 1, process.stdout.rows - 1)

  // draw chat messages
  blit(screen, drawChatMessages(state, process.stdout.columns - 4, chatWindowHeight - 2), 2, process.stdout.rows - chatWindowHeight)

  // draw game area
  var world = drawWorld(state, process.stdout.columns, process.stdout.rows - chatWindowHeight - 2)
  blit(screen, world, 0, 0)

  return screen.join('\n')
}

function drawWorld (state, w, h) {
  var out = []
  Object.keys(state.characters || {}).forEach(function (key) {
    var player = state.characters[key]
    blit(out, ['@'], player.x, player.y)
  })
  return out
}

function drawChatWindowOutline (w, h) {
  var topbottom = new Array(w).fill('-').join('')

  var middle = new Array(w).fill(' ')
  middle[0] = middle[w-1] = '|'
  middle = middle.join('')

  var out = new Array(h).fill(middle)
  out[0] = out[h-1] = topbottom

  // color the window outline blue
  out = out.map(function (line) {
    return chalk.blue(line)
  })

  return out
}

function drawChatMessages (state, w, h) {
  return state.messages.map(function (msg) {
    return msg.key.substring(0,8) + '> ' + msg.value.text.substring(0, w)
  })
}

function drawPrompt () {
  return [
    `> ${app.input.line()}`
  ]
}

function mainloop (state, bus) {
  state.characters = {}
  state.messages = []

  core.api.pos.onUpdate(function (key, msg) {
    state.characters[key] = { x: msg.value.x, y: msg.value.y }
    bus.emit('render')
  })

  core.api.chat.tail(10, function (msgs) {
    state.messages = msgs
    bus.emit('render')
  })

  setInterval(function () {
    state.characters = {}
    core.api.pos.createReadStream()
      .on('data', function (entry) {
        state.characters[entry.key] = { x: entry.value.value.x, y: entry.value.value.y }
      })
      .on('end', draw)

    function draw () {
      bus.emit('render')
    }
  }, 1000)
}

