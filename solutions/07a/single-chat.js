var hypercore = require("hypercore");
var hyperswarm = require("hyperswarm");
var swarm = hyperswarm();
var pump = require("pump");

var feed = hypercore("./single-chat-feed", {
  valueEncoding: "json",
});

feed.append(
  {
    type: "chat-message",
    nickname: "cat-lover",
    text: "hello world",
    timestamp: "2018-11-05T14:26:000Z", // new Date().toISOString()
  },
  function (err, seq) {
    if (err) throw err;
    console.log("Data was appended as entry #" + seq);
  }
);

// feed.get(0, function (err, msg) {
//   console.log('msg', msg)
// })

process.stdin.on("data", function (data) {
  feed.append({
    type: "chat-message",
    nickname: "cat-lover",
    text: data.toString().trim(),
    timestamp: new Date().toISOString(),
  });
});

feed.createReadStream({ live: true }).on("data", function (data) {
  console.log(`<${data.timestamp}> ${data.nickname}: ${data.text}`);
});

feed.ready(function () {
  console.log("public key:", feed.key.toString("hex"));
  console.log("discovery key:", feed.discoveryKey.toString("hex"));
  console.log("secret key:", feed.secretKey.toString("hex"));

  // we use the discovery as the topic
  swarm.join(feed.discoveryKey, { lookup: true, announce: true });
  swarm.on("connection", function (socket, details) {
    console.log("(New peer connected!)");

    // We use the pump module instead of stream.pipe(otherStream)
    // as it does stream error handling, so we do not have to do that
    // manually.

    // See below for more detail on how this work.
    pump(socket, feed.replicate(details.client, { live: true }), socket);
  });
});
