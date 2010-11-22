/**
* Error middleware
*/
module.exports = function(req, res, next) {
  res.writeError = function(error) {
    res.writeHead(500);
    console.log(error);
    res.end((error || '').toString());
  };
  next();
};
