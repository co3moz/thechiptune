Array.prototype.asyncForEach = function (cb, done) {
  var total = this.length;
  var result = [];

  if(total == 0) {
    return done(result);
  }

  this.forEach(function (element, i) {
    setTimeout(function () {
      cb(element, function (item) {
        result[i] = item;

        if (--total == 0) {
          done(result);
        }
      });
    });
  });
};