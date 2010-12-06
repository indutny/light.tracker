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
  var db = this._db;
  
  db.Peer.remove({peer_id: peer.peer_id, info_hash: peer.info_hash}, callback);
};

/**
* Put peer into database
*/
Storage.prototype.put = function(event, peer, callback) {
  var db = this._db,
      that = this;
      
  peer.updated_at = +new Date;
  
  this.list(peer, callback);
  
  process.nextTick(function() {
    db.Peer
        .find({peer_id: peer.peer_id, info_hash: peer.info_hash})
        .one(function(instance) {        
          if (!instance) {
            // Create
            var sanitized = helpers.sanitize(peer);
            sanitized.updated_at = peer.updated_at;            
            
            instance = new (db.Peer)(sanitized);
            
            var ip = peer.ip.split('.'),
                port = String.fromCharCode(peer.port >> 8, peer.port % 256);
                
            instance.short_addr = String.fromCharCode.apply('', ip) + port;
          } else {
            // Update
            instance.updated_at = peer.updated_at;
          }
          instance.save();
        });
  });
};

/**
* Get peer list by info_hash (without current peer)
*/
Storage.prototype.list = function(peer, callback) {
  var options = this._options,
      db = this._db,
      cache_time = this._options.announce_interval * 500;
  
  db.Cache.access(peer.info_hash, cache_time, function(err, peers) {
    if (err) return callback(err);
    
    var result = {
      interval: options.announce_interval,
      'min interval': options.announce_min_interval,
      peers: peers
    };
    callback(null, result);
  });
};

/**
* Remove old revisions of documents
* Remove stale documents
*/
Storage.prototype.cleanup = function() {
  var db = this._db;
  
  db.Peer.cleanup(+new Date - this._options.announce_interval * 2000);
  db.Cache.cleanup(+new Date - this._options.announce_interval * 500);
};

