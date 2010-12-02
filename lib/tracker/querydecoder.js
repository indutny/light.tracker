/**
* Middleware for decoding get query
*/
var qs = require('querystring');

module.exports = function(req, res, next) {
  req.query = {};
  if (match = req.url.match(/\?(.+)$/)) {    
    match[1].replace(/([^=]*)=([^&]*)&?/g, function(a, key, value) {
      req.query[key] = unescape(value);
    });

  }
  next();
}
