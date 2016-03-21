if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.findIndex called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return i;
      }
    }
    return -1;
  };
}

Number.prototype.toMinutes = function () {
  var minutes = this / 60 >> 0;
  var seconds = this % 60 >> 0;
  return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
};

Number.prototype.sizeConvert = function () {
  if (this < 1024) {
    return this + "b";
  }

  if (this < 1024 * 1024) {
    return (this / 1024).toFixed(2) + "kb";
  }

  if (this < 1024 * 1024 * 1024) {
    return (this / 1024 / 1024).toFixed(2) + "mb";
  }

  return (this / 1024 / 1024 / 1024).toFixed(2) + "gb";
};