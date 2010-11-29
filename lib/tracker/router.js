/**
* Create http server with routes
*/
var connect = require('connect'),
    bencode = require('./bencode'),
    error = require('./error'),
    querydecoder = require('./querydecoder'),
    Storage = require('./storage'),
    helpers = require('./helpers');

module.exports = function(db, options, callback) {
  var server = connect.createServer(
    bencode,
    error,
    querydecoder,
    connect.router(router)    
  );  
  server.listen(options.server.port, options.server.host);
  
  var storage = new Storage(db, options);
  
  function router(app) {
    app.get('/ann', function(req, res) {
      var info_hash = req.query.info_hash,
          event = req.query.event,
          peer_id = req.query.peer_id,
          port = parseInt(req.query.port) || 0,
          left = parseInt(req.query.left) || 1,
          ip = req.socket.remoteAddress;          
      
      validateAnnounce(info_hash, port, ip, peer_id, function(err) {      
        if (err) return res.writeError(err);
        
        var peer = {
          info_hash: helpers.decodeInfoHash(info_hash),
          peer_id: helpers.decodeInfoHash(peer_id),
          port: port,
          left: left,          
          ip: ip
        };
        
        storage.route(event, peer, function(err, data) {
          if (err) return res.writeError(err);
          res.bencode(data);
        });
      });
    });
  };
  
  function cleanup() {
    storage.cleanup();
    setTimeout(cleanup, options.announce_interval * 2000);
  };
  cleanup();
  
  callback();
};

/**
* Validates input data of announce
*/
function validateAnnounce(info_hash, port, ip, peer_id, callback) {
  if (!info_hash || info_hash.length != 20) {
    return callback('Wrong info_hash!');
  }
  if (!peer_id || peer_id.length != 20) {
    return callback('Wrong peer_id!');
  }
  if (!port || port < 0 || port > 65535 ) {
    return callback('Incorrect port!');
  }
  if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    return callback('Incorrect IP address');
  }
  callback();
}
