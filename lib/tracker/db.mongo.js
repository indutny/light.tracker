/**
* Init db
*/
var mongoose = require('mongoose').Mongoose;

module.exports = function(options, callback) {      
  var db = mongoose.connect(options.mongo_url);
  
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
      cleanup: function cleanup(since) {
        this.remove({updated_at: {$lt: since}}, function() {});
      },
      access: function access(info_hash, numwant, callback) {
        this.find({info_hash: info_hash}).one(function(cache) {
          if (!cache) {
            db.Peer
                .find({info_hash: info_hash})
                .sort([['updated_at', -1]])
                .limit(numwant)
                .all(function(docs) {
                  if (!docs) return callback(Error('Cache.access error'));
                  
                  var peers = docs.map(peer_id).join('');

                  callback(null, peers);
                  
                  new (db.Cache)({
                    info_hash: info_hash,
                    peers: escape(peers),
                    updated_at: +new Date
                  }).save();
                });
          } else {
            callback(null, unescape(cache.peers));
          }
        });
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
