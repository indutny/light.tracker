/**
* Init db
*/
var mongoose = require('mongoose').Mongoose,
    LRU = require("lru-cache");

module.exports = function(options, callback) {      
  var db = mongoose.connect(options.mongo_url),
      cache = LRU(100);
  
  mongoose.model('Peer', {
    properties: ['peer_id', 'info_hash', 'short_addr', 'ip', 'port', 'left',
                 'updated_at'],
    cast: {
      'port': Number,
      'left': Number,
      'updated_at': Number
    },
    indexes: [
      [{peer_id: 1, info_hash: 1}, {unique: true}],
      {info_hash: 1},
      {updated_at: -1}
    ],
    static: {
      cleanup: function cleanup(since) {
        this.remove({updated_at: {$lt: since}}, function() {});
      }
    }
  });
  db.Peer = db.model('Peer');
  
  mongoose.model('Cache', {
    properties: ['info_hash', 'peers', 'updated_at'],
    cast: {
      updated_at: Number
    },
    indexes: [
      [{info_hash: 1}, {unique: true}],
      {updated_at: -1}
    ],
    static: {
      cleanup: function(since) {
        this.remove({updated_at: {$lt: since}}, function() {});
      },
      access: function(info_hash, cache_time, callback) {
        var cached = cache.get(info_hash);
        
        if (cached && (cached.updated_at < (+new Date - cache_time))) {
          cache.del(info_hash);
          cached = null;
        }
        
        if (!cached) {
          this.find({info_hash: info_hash}).one(function(cached) {
            if (!cached) {
              db.Peer
                  .find({info_hash: info_hash})
                  .sort([['updated_at', -1]])
                  .limit(100)
                  .all(function(docs) {
                    if (!docs) return callback(Error('Cache.access error'));
                    
                    var peers = docs.map(peer_id).join('');

                    callback(null, peers);
                    
                    cached = new (db.Cache)({
                      info_hash: info_hash,
                      peers: escape(peers),
                      updated_at: +new Date
                    }).save();

                    cached.peers = peers;
                    cache.set(info_hash, cached);
                  });
            } else {
              callback(null, cached.peers = unescape(cached.peers));
              cache.set(info_hash, cached);
            }
          });
        } else {
          callback(null, cached.peers);
        }
      }
    }
  });
  db.Cache = db.model('Cache');
  db.on('open', function() {
    callback(null, db);
  });  
};


/**
* Generate peer_id
*/
function peer_id(peer) {
  var ip = peer.ip.split('.'),
      port = String.fromCharCode(peer.port >> 8, peer.port % 256);

  return String.fromCharCode.apply('', ip) + port;
};
