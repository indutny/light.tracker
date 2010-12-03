/**
* Error middleware
*/
module.exports = function(req, res, next) {
  res.writeError = function(error) {
    res.writeHead(200);
    error = typeof error == 'object' ?
                JSON.stringify(error) :
                (error || '').toString();
    res.end('d14:failure reason' + error.length + ':' + error + 'e');
  };
  next();
};
