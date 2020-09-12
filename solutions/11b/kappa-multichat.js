// In one terminal, open:
// node ./solutions/11b/kappa-multichat.js 1

// In a second terminal, open:
// node ./solutions/11b/kappa-multichat.js 2

var hyperswarm = require("hyperswarm");
var crypto = require("crypto");
var kappa = require("kappa-core");
var ram = require("random-access-memory");
var memdb = require("memdb");
var list = require("kappa-view-list");
var pump = require("pump");

var timestampView = list(memdb(), function (msg, next) {
  if (msg.value.timestamp && typeof msg.value.timestamp === "string") {
    // sort on the 'timestamp' field
    next(null, [msg.value.timestamp]);
  } else {
    next();
  }
});

if (process.argv.length !== 3) {
  console.log(
    'USAGE: "node kappa-multichat.js 1" or "node kappa-multichat.js 2"'
  );
  process.exit(1);
  return;
}

var suffix = process.argv[2];

var core = kappa("./kappa-multichat-" + suffix, { valueEncoding: "json" });
core.use("chats", timestampView);

core.ready("chats", () => {
  watchTail();
  core.writer("local", function (err, feed) {
    if (err) console.error(err);

    // swarm logic
    const topicHex = crypto.createHash("sha256").update("our-topic").digest();
    startSwarm(topicHex);

    // Input, output
    doWrite(
      feed,
      `Chat loaded by ${feed.key
        .toString("hex")
        .substring(0, 5)}...${feed.key
        .toString("hex")
        .substr(60)} on ${new Date().toLocaleString()}`
    );
    watchStdin(feed);
  });
});

function watchTail() {
  core.api.chats.tail(10, function (msgs) {
    console.log("--------------");
    msgs.forEach(function (msg, i) {
      console.log(`${i + 1} - ${msg.value.timestamp}: ${msg.value.text}`);
    });
  });
}

function watchStdin(feed) {
  process.stdin.on("data", function (data) {
    doWrite(feed, data);
  });
}
function doWrite(feed, data) {
  feed.append({
    type: "chat-message",
    nickname: "cat-lover",
    text: data.toString().trim(),
    timestamp: new Date().toISOString(),
  });
}

function startSwarm(topic) {
  var swarm = hyperswarm();
  console.log(`topic: ${topic.toString("hex")}`);

  swarm.join(topic, {
    lookup: true, // find & connect to peers
    announce: true, // optional- announce self as a connection target
  });
  swarm.on("connection", function (connection, info) {
    console.log("New peer connected!");
    pump(connection, core.replicate(info.client, { live: true }), connection);
  });
}
