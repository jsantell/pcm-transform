var streamBuffers = require("stream-buffers");

exports.createReadStream = function (buffer, options) {
  buffer = Buffer.isBuffer(buffer) ? buffer : new Buffer(buffer);
  var stream = new streamBuffers.ReadableStreamBuffer(options);
  stream.put(buffer);
  stream.destroySoon();
  return stream;
};

exports.stereoMix = function (array1, array2, bitDepth) {
  var stereo = new Buffer((array1.length + array2.length)*2);

  // Assume equal length
  for (var i = 0; i < stereo.length; i+=4) {
    stereo.writeInt16LE(array1[i ? i/4 : 0], i);
    stereo.writeInt16LE(array2[i ? i/4 : 0], i + 2);
  }
  return stereo;
};

exports.BUFFERS = (function (buffers) {
  // This is a sawtooth wave that has 5 cycles, of 40 samples each, 16bit values.
  // / \    /
  //     \ /
  buffers.SAW_UP = (function () {
    var range = 10;
    var cycle = [];
    for (var i = 0; i < 40; i++) {
      if (i < 10) cycle.push(i);
      else if (i < 31) cycle.push(20 - i);
      else if (i < 40) cycle.push(-40 + i);
    }
    // Normalize to signed 16bit int
    cycle = cycle.map(function (n) { return Math.floor(n * (Math.pow(2, 15) - 1) / range); });
    // Dupe 5 times
    return [0,0,0,0,0].reduce(function (acc) { return acc.concat(cycle); }, []);
  })();
  
  // This is a sawtooth wave that has 5 cycles, of 40 samples each, 16bit values.
  // Like SAW_UP, except starts t=PI in.
  //    / \
  // \ /   
  buffers.SAW_DOWN = (function () {
    var cycle = Array.prototype.slice.call(buffers.SAW_UP);
    return cycle.splice(20).concat(cycle);
  })();

  return buffers;
})({});
