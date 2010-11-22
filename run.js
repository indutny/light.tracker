/**
* Pseudo-cli
*/
var tracker = require('./lib/tracker');

tracker({
  server: {
    port: 80,
    host: 'localhost'
  },
  db: {
    port: 5984,
    host: 'localhost',
    database: 'tracker',
    auth: {
      user: 'tracker',
      pass: 'tracker'
    },
    setup: true
  }
});
