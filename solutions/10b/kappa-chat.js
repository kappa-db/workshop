// node ./solutions/10b/kappa-chat.js
var kappa = require("kappa-core");
var ram = require("random-access-memory");
var memdb = require("memdb");
var list = require("kappa-view-list");

var timestampView = list(memdb(), function (msg, next) {
  if (msg.value.timestamp && typeof msg.value.timestamp === "string") {
    // sort on the 'timestamp' field
    next(null, [msg.value.timestamp]);
  } else {
    next();
  }
});

var core = kappa("./multichat_1", { valueEncoding: "json" });
core.use("chats", timestampView);

core.api.chats.read().on("data", (values) => {
  console.log('values', values)
});

core.writer("local", function (err, feed) {
  feed.append(
    { 
      type: "chat-message", 
      timestamp: new Date().toISOString() ,
      nickname: 'cat-lover',
      text: `some defalt test text ${feed.key.toString('hex')}`,
    });
});
