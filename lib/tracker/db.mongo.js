/**
* Init db
*/
var mongoose = require('../../support/mongoose'),
    document = mongoose.define;

module.exports = function(options, callback) {      
  var db = mongoose.connect(options.mongo_url);
  
  document('Peer')
    .oid('_id')
    .string('peer_id')
    .string('info_hash')
    .string('short_addr')
    .string('ip')
    .number('port')
    .number('left')
    .number('updated_at')
    .addIndex({peer_id: 1, info_hash: 1}, {unique: true, dropDubs: true})
    .addIndex({info_hash: 1})
    .addIndex({updated_at: -1})
    .static('cleanup', function cleanup(since) {
      this.remove({updated_at: {$lt: since}}, function() {});
    });
  db.Peer = mongoose.Peer;
  
  document('Cache')
    .oid('_id')
    .string('info_hash')
    .string('peers')
    .number('updated_at')
    .addIndex({info_hash: 1}, {unique: true, dropDubs: true})
    .addIndex({updated_at_at: -1})
    .static('cleanup', function cleanup(since) {
      this.remove({updated_at: {$lt: since}}, function() {});
    })
    .static('access', function access(info_hash, numwant, callback) {
      this.find({info_hash: info_hash}).one(function(err, cache) {
        if (err) return callback(err);
        
        if (!cache) {
          db.Peer
              .find({info_hash: info_hash})
              .sort([['updated_at', -1]])
              .limit(numwant)
              .all(function(err, docs) {
                if (err) return callback(err);
                
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
    });
  db.Cache = mongoose.Cache;
  
  callback(null, db);
};


/**
* Generate peer_id
*/
function peer_id(peer) {
  var ip = peer.ip.split('.'),
      port = String.fromCharCode(peer.port >> 8, peer.port % 256);

  return String.fromCharCode.apply('', ip) + port;
};
