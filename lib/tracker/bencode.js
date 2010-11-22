/**
* Bencode middleware and encoder
*/

var bencode = module.exports = function(req, res, next) {
  // Add bencode method
  res.bencode = function(data) {
    res.writeHead(200);
    
    res.end(encode(data), 'binary');
  };
  next();
}

var encode = exports.encode = function(obj, recursion) {
  var _type = typeof obj; // simple caching;
  
  recursion++;
  
  if (recursion > 100) {
    return '0:';
  }
  
  if (_type === 'string') {
    return obj.length + ':' + obj;
  } else if (_type === 'number') {
    return 'i' + obj + 'e';
  } else if (Array.isArray(obj)) {
    var output = ['l'];
    for (var i = 0, len = obj.length; i < len; i++) {
      output[i] = encode(obj[i], recursion);
    }
    output.push('e');
    return output.join('');
  } else if (obj) {
    var output = ['d'];
    for (var i in obj) {
      if (!obj.hasOwnProperty(i)) continue;
      output.push(encode(i.toString()) + encode(obj[i]));
    }
    output.push('e');
    return output.join('');
  }
  
  return '0:';
}
