var express = require('express');
var config = require('config');
var ezLogger = require('ezlogger')();
var compression = require('compression');
var fs = require("fs");

// handle for me :)
ezLogger.handleUncaughtExceptions();

var straightLine = new Array(50).join('-');
console.log(straightLine);

var app = express();
console.log('Express initialized');

app.use('/resource/get/', express.static(__dirname + '/../resources'));
app.use(express.static(__dirname + '/public'));
console.log('Static field forwarded');

app.use(compression({
  filter: function (req, res) {
    if (req.headers['x-no-compression']) {
      return false
    }

    return compression.filter(req, res)
  }
}));

require('./util/init')(app);

app.get(/^\/resource\/?(\/.+)?$/, function(req, res, next) {
  var directory = "resources" + (req.params[0] ? req.params[0] : "");
  fs.readdir(directory, function(err, files) {
    if(err) {
      return next(err);
    }

    files.asyncForEach(function(file, done) {
      fs.stat(directory + "/" + file, function(err, info) {
        done({resource: file, isDirectory: info.isDirectory(), size: info.size});
      });
    }, function(result) {
      res.json(result);
    });
  });
});

app.get(/\/(.*)/, function (req, res) {
  res.sendFile('index.html', {root: './src/views'});
});

app.use(function(err, req, res) {
  res.status(417);
  res.json({error: err.code, detail: err.message});
});

var server = app.listen(config.get('port'));
console.log('Application started to listen at {family} {address}:{port}', server.address());
