/**
* Middleware for decoding get query
*/
var qs = require('querystring');

module.exports = function(req, res, next) {
  
  if (match = req.url.match(/\?(.+)$/)) {

    req.query = qs.parse(match[1]);

  } else {
    req.query =  {};
  }
  next();
}
