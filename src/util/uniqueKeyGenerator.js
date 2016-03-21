var keys = "0123456789qwertyuopasdfghjklizxcvbnm".split("");

Number.prototype.random = function () {
  return this * Math.random() >>> 0;
};

String.prototype.random = function() {
 return keys[keys.length.random()] + keys[keys.length.random()] + keys[keys.length.random()] + keys[keys.length.random()] + keys[keys.length.random()];
}