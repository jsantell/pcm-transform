var streamBuffers = require("stream-buffers");
var a2b = require("array-to-buffer");

exports.createReadStream = function (buffer, options) {
  buffer = Buffer.isBuffer(buffer) ? buffer : new Buffer(buffer);
  var stream = new streamBuffers.ReadableStreamBuffer(options);
  stream.put(buffer);
  stream.destroySoon();
  return stream;
};

exports.stereoMix = function (buffer1, buffer2, bitDepth) {
  if (Array.isArray(buffer1)) {
    buffer1 = a2b(buffer1, { endianness: "little", bits: 16, type: "int", signed: true });
  }
  if (Array.isArray(buffer2)) {
    buffer2 = a2b(buffer2, { endianness: "little", bits: 16, type: "int", signed: true });
  }
  var stereo = new Buffer(buffer1.length + buffer2.length);

  // Assume equal length
  for (var i = 0; i < stereo.length / 4; i++) {
    stereo.writeInt16LE(buffer1.readInt16LE(i), i * 4);
    stereo.writeInt16LE(buffer2.readInt16LE(i), (i * 4) + 2);
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
