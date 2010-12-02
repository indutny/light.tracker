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

  db.Peer
      .find({peer_id: peer.peer_id, info_hash: peer.info_hash})
      .one(function(err, instance) {
        if (err) return callback(err);
        
        if (!instance) {
          // Create
          instance = new (db.Peer)(peer);
        } else {
          // Update
          instance.updated_at = peer.updated_at;
        }
        instance.save(function(err) {
          if (err) return callback(err);
          
          that.list(peer, callback);
          
        });
      });
};

/**
* Get peer list by info_hash (without current peer)
*/
Storage.prototype.list = function(peer, callback) {
  var options = this._options,
      db = this._db;
  
  db.Cache.access(peer.info_hash, peer._numwant, function(err, peers) {
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

