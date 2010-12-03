/**
* Pseudo-cli
*/
var tracker = require('./lib/tracker');

tracker({
  "server": {
    "port": 8081
  },
  "db": {
    "port": 5984,
    "host": "indutny.couchone.com",
    "database": "tracker",
    "auth": {
      "user": "admin",
      "pass": "admin"
    },
    "setup": true,
    "engine": "mongo",
    "mongo_url": "mongodb://test:test@flame.mongohq.com:27068/tracker"
  }
});
