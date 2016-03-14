var config = require("config");
module.exports = function (app) {
  if (config.get("logger.requestLogger") == "true") {
    app.use(function (request, response, next) {
      console.log("[{method}] {headers.host}{url} from {ip}", request);
      next();
    });
  }
};