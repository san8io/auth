const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

app.use(cors());
app.use(bodyParser.json());

app.use(function (req, res, next) {
  var key = req.get("api-key");

  // key isn't present
  if (!key) return next(error(400, "api key required"));

  // key is invalid
  if (apiKeys.indexOf(key) === -1) return next(error(401, "invalid api key"));

  // all good, store req.key for route access
  req.key = key;
  next();
});

var apiKeys = ["foo", "bar", "baz"];

app.get("/api", function (req, res, next) {
  res.status(200);
  res.send({ message: "OK" });
});

app.post("/api", function (req, res, next) {
  var name = req.body.name;
  res.status(200);
  res.send({ name: name });
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.send({ error: err.message });
});

app.use(function (req, res) {
  res.status(404);
  res.send({ error: "Sorry, can't find that" });
});

if (!module.parent) {
  app.listen(3000);
  console.log("Express started on port 3000");
}
