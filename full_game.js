var chalk = require('chalk')
var kappa = require('kappa-core')
var memdb = require('memdb')
var neatlog = require('neat-log')
var neatinput = require('neat-log/input')
var blit = require('txt-blit')
var kv = require('kappa-view-kv')
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

core.feed('local', function (err, feed) {
  feed.append({
    type: 'move-player',
    x: 15,
    y: 6,
    links: []
  })
})

var app = neatlog(view)
app.use(mainloop)

function view (state) {
  var screen = []

  // draw chat window
  var chatWindowHeight = 10
  var chatWindow = drawChatWindowOutline(process.stdout.columns, chatWindowHeight)
  blit(screen, chatWindow, 0, process.stdout.rows - chatWindowHeight - 1)

  // draw game area
  var world = drawWorld(state, process.stdout.columns, process.stdout.rows - chatWindowHeight - 1)
  blit(screen, world, 0, 0)

  return screen.join('\n')
}

function drawWorld (state, w, h) {
  var out = []
  Object.keys(state.characters).forEach(function (key) {
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

function mainloop (state, bus) {
  setInterval(function () {
    state.characters = {}
    core.api.pos.createReadStream()
      .on('data', function (entry) {
        state.characters[entry.key] = { x: entry.value.x, y: entry.value.y }
      })
      .on('end', draw)

    function draw () {
      bus.emit('render')
    }
  }, 1000)
}

