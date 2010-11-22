/**
* Peer storage (aka API)
*/
var util = require('util'),
    helpers = require('./helpers');

var Storage = module.exports = function(db, options) {
  process.EventEmitter.call(this);
  this._db = db;
  this._options = options;
};
util.inherits(Storage, process.EventEmitter);

/**
* Route incoming events, supported events:
* "stopped" - will remove peer from database
*/
Storage.prototype.route = function(event, peer, callback) {
  callback = callback || function() {};
  if (event == 'stopped') return this.stop(peer, callback);
  
  this.put(event, peer, callback);
};

/**
* Remove peer from database
*/
Storage.prototype.stop = function(peer, callback) {
  var db = this._db,
      _id = peer_id(peer);
  
  db.get(_id, function(err, doc) {
    if (err) return callback(err);
    db.remove(_id, doc._rev, function(err, res) {
      if (err || !res.ok) return callback(err || res);
      
      callback();
    });
  });
};

/**
* Put peer into database
*/
Storage.prototype.put = function(event, peer, callback) {
  var db = this._db,
      _id = peer_id(peer),
      that = this,
      peerDoc = {
        type: 'peer',
        left: peer.left,
        info_hash: peer.info_hash,
        ip: peer.ip,
        port: peer.port,
        updated_at: +new Date
      };
  
  db.save(_id, peerDoc, finish);
  
  function finish(err, res) {
    if (err || !res.ok) return callback(err || res);
    
    that.list(peer, callback);
  };
};

/**
* Get peer list by info_hash (without current peer)
*/
Storage.prototype.list = function(peer, callback) {
  var options = this._options,
      db = this._db;
  
  db.view('tracker/by_hash', {key: peer.info_hash}, function(err, rows) {
    if (err) return callback(err);
    
    var peers = rows.map(function(peer) {
                  return helpers.compactAddr(peer);
                }).join('');         
    
    var result = {
      interval: options.announce_interval,
      'min interval': options.announce_min_interval,
      peers: peers
    };
    callback(null, result);
  });
};

Storage.prototype.cleanup = function() {
  var db = this._db;
  
  db.compact();
  db.view('tracker/by_update_time',
      {endKey: +new Date - this._options.cleanup_interval},
      function(err, rows) {
        if (err) return;
        
      });
};

/**
* Generate peer_id
*/
function peer_id(peer) {
  return peer.info_hash + ':' + peer.ip + ':' + peer.port;
};
