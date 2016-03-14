module.exports =  function(app) {
  return {
    requestLogger: require("./requestLogger")(app),
    arrayAsyncForEach: require("./arrayAsyncForEach")
  }
};