var hyperswarm = require("hyperswarm");
var multifeed = require("multifeed");
var crypto = require("crypto");
var pump = require("pump");

if (process.argv.length !== 3) {
  console.log('USAGE: "node multifeed.js 1" or "node multifeed.js 2"');
  process.exit(1);
  return;
}

var suffix = process.argv[2];

var multi = multifeed("./multichat-" + suffix, {
  valueEncoding: "json",
});

multi.writer("local", function (err, feed) {
  if (err) console.error(err);

  const topicHex = crypto.createHash("sha256").update("our-topic").digest();

  startSwarm(topicHex);

  process.stdin.on("data", function (data) {
    feed.append(
      {
        type: "chat-message",
        nickname: "cat-lover",
        text: data.toString(),
        timestamp: new Date().toISOString(),
      },
      function (err, seq) {
        if (err) throw err;
        console.log("Data was appended as entry #" + seq);
      }
    );
  });
});

function startSwarm(topic) {
  var swarm = hyperswarm();
  console.log(`topic: ${topic.toString("hex")}`);

  swarm.join(topic, {
    lookup: true, // find & connect to peers
    announce: true, // optional- announce self as a connection target
  });
  swarm.on("connection", function (connection, info) {
    console.log("New peer connected!");
    pump(connection, multi.replicate(info.client, { live: true }), connection);
  });
}
