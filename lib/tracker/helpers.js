/**
* helper functions
*/

var Buffer = require('buffer').Buffer;

/**
* Merge contents of 'a' and 'b' objects
* And return new object, containing merged values
*/
exports.merge = function(a, b) {
  var c = {};
  if (a) for (var i in a) if (a.hasOwnProperty(i)) c[i] = a[i];
  if (b) for (var i in b) if (b.hasOwnProperty(i)) c[i] = b[i];
  
  return c;
};

/**
* Like Array.forEach, but for async modes
*/ 
exports.forEachAsync = function(arr, iterator, finish) {
  var len = arr.length;
    
  function next(i) {
    if (i >= len) return finish();
    
    iterator(function() {
      next(i + 1);
    }, arr[i], i, arr);
  }
  next(0);
};

/**
* Runs through array and executing iterator for every array's element
* once all iterators have called next() (which is a first argument)
* finish will be called
*
* If one of them will call next(err);
* Finish will be called with err as first argument
*/
exports.asyncEnsure = function(arr, iterator, finish) {
  var len = arr.length,
      called = 0,
      finished = false;
  
  arr.forEach(function(elem, i) {
    var once = false;
    
    iterator(callback, elem, i, arr);    
    
    function callback(err) {
      if (once || finished) return;
      once = true;
      
      if (err) {
        finished = true;
        finish(err);
      }
      
      if (++called >= len) {
        finish();
      };
    }
  });
};


/**
* Compact peer address to binary format
*/
exports.compactAddr = function(peer) {
  var ip = peer.ip.split('.'),
      port = String.fromCharCode(peer.port >> 8, peer.port % 256);
  return String.fromCharCode.apply(String, ip) + port;
};

/**
* Decode binary hash into a hex
*/
exports.decodeInfoHash = function(binary) {  
  var buffer = new Buffer(binary, 'binary'),
      output = [];
      
  for (var i = 0, len = buffer.length; i < len; i++) {
    var code = buffer[i];
    output.push((code < 16 ? '0' : '') + code.toString(16));
  }
  
  return output.join('');
};
