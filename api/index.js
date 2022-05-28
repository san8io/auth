require("dotenv").config({ silent: true });
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const request = require("request");

const app = express();

function error(status, msg) {
  var err = new Error(msg);
  err.status = status;
  return err;
}

app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("combined"));

app.use(function (req, res, next) {
  var key = req.get("X-Parse-REST-API-Key");

  // key isn't present
  if (!key) return next(error(400, "ERROR"));

  // key is invalid
  if (apiKeys.indexOf(key) === -1) return next(error(401, "ERROR"));

  next();
});

var apiKeys = [process.env.API_KEY];

app.get("/JWT", function (req, res, next) {
  var options = {
    method: "POST",
    url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    headers: { "content-type": "application/json" },
    body: `{"client_id":"${process.env.AUTH0_CLIENT_ID}","client_secret":"${process.env.AUTH0_CLIENT_SECRET}","audience":"${process.env.API_IDENTIFIER}","grant_type":"client_credentials"}`,
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    const { access_token } = JSON.parse(body);
    res.send(access_token);
  });
});

var jwtUsed = [];

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 1,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  getToken: function fromCustomHeader(req) {
    var jwtHeader = req.get("X-JWT-KWY");
    if (jwtHeader) return jwtHeader;
    return null;
  },
  // Validate the audience and the issuer.
  audience: process.env.API_IDENTIFIER,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

app.use(checkJwt);
app.use(function (req, res, next) {
  var token = req.get("X-JWT-KWY");

  // jwt token already used
  if (jwtUsed.indexOf(token) !== -1) {
    return next(error(401, "ERROR"));
  } else {
    jwtUsed.push(token);
  }

  next();
});

app.post("/DevOps", function (req, res, next) {
  var to = req.body.to;
  res.status(200);
  res.send({ message: `Hello ${to} your message will be send` });
});

app.all("/DevOps", function (req, res) {
  res.status(405);
  res.send("ERROR");
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  console.log(err.message);
  res.send("ERROR");
});

app.use(function (req, res) {
  res.status(404);
  res.send("ERROR");
});

app.listen(process.env.PORT, () => {
  console.log(`Server Listening on port ${process.env.PORT}`);
});
