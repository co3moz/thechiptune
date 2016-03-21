var express = require('express');
var config = require('config');
var ezLogger = require('ezlogger')();
var compression = require('compression');
var lokijs = require('lokijs');
var bodyParser = require('body-parser');
var fs = require('fs');

// handle for me :)
ezLogger.handleUncaughtExceptions();

var pmx = require('pmx').init({
  http: true,
  http_latency: 200,
  http_code: 500,
  alert_enabled: true,
  ignore_routes: [/socket\.io/, /notFound/],
  errors: true,
  custom_probes: true,
  network: true,
  ports: true
});

var straightLine = new Array(50).join('-');
console.log(straightLine);

var app = express();
console.log('Express initialized');


var db = new lokijs('db.json');

app.use(compression({
  filter: function (req, res) {
    if (req.headers['x-no-compression']) {
      return false
    }

    return compression.filter(req, res)
  }
}));

app.use('/resource/get/', express.static(__dirname + '/../resources'));
app.use(express.static(__dirname + '/public'));
console.log('Static field forwarded');

require('./util/init')(app);

app.get(/^\/resource\/?(\/.+)?$/, function (req, res, next) {
  var directory = "resources" + (req.params[0] ? req.params[0] : "");

  fs.readdir(directory, function (err, files) {
    if (err) {
      return next(err);
    }

    files.asyncForEach(function (file, done) {
      fs.stat(directory + "/" + file, function (err, info) {
        done({resource: file, isDirectory: info.isDirectory(), size: info.size});
      });
    }, function (result) {
      res.json(result);
    });
  });
});

var favorites = db.addCollection('favorites', {indices: ['unique', 'data']});
app.post('/favorites', bodyParser.json(), function (req, res) {
  if (req.body.length) {

    var key;
    do {
      key = "".random();
    } while (favorites.find({unique: key}).length != 0);

    favorites.insert({unique: key, data: req.body});
    console.log("a new record created {0}", key);

    db.saveDatabase();
    res.send(key);
  } else {
    res.status(400);
    res.send("invalid data :(");
  }

});

app.get('/favorites/:code', function (req, res) {
  var favorite = favorites.find({unique: req.params.code});
  if (favorite.length == 0) {
    res.status(417);
    res.send("not found");
  } else {
    res.send(favorite[0].data);
  }
});

app.get(/\/(.*)/, function (req, res) {
  res.sendFile('index.html', {root: './src/views'});
});

app.use(function (err, req, res) {
  res.status(417);
  res.json({error: err.code, detail: err.message});
});

var server = app.listen(config.get('port'));
console.log('Application started to listen at {family} {address}:{port}', server.address());
