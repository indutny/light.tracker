/**
* Init db
*/
var cradle = require('../../support/cradle/lib/cradle');

module.exports = function(options, callback) {
  cradle.setup({
    host: options.host,
    port: options.port,
    options: options.options
  });
  var connection = new (cradle.Connection)({auth: options.auth}),
      db = connection.database(options.database);
      
  options.setup ? setup(db, callback) : callback(null, db);
};

function setup(db, callback) {
  var views = {
    by_update_time: {
      map: function(doc) {
        if (doc.type == 'peer') {
          emit(doc.updated_at, {_id: doc._id, _rev: doc._rev});
        }
      }
    },
    by_hash: {
      map: function(doc) {
        if (doc.type == 'peer') {
          var ip = doc.ip.split('.'),
              port = String.fromCharCode(doc.port >> 8, doc.port % 256);
              
          emit(doc.info_hash, String.fromCharCode.apply('', ip) + port);
        }
      },
      reduce: function(keys, values, rereduce) {
        return values.join('');
      }
    },
    seeders_by_hash: {
      map: function(doc) {
        if (doc.type == 'peer' && doc.left) {
          emit(doc.info_hash, 1);
        }
      },
      reduce: function(keys, values) {
        return sum(values);
      }
    },
    leechers_by_hash: {
      map: function(doc) {
        if (doc.type == 'peer' && !doc.left) {
          emit(doc.info_hash, 1);
        }
      },
      reduce: function(keys, values) {
        return sum(values);
      }
    }
  };
  
  db.save('_design/tracker', views, function(err) {
    if (err) return callback(err);
    callback(null, db);
  });
}
