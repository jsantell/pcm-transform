/**
 * Calculate the min and max value of a range of samples.
 */
module.exports = function (buffer, stream, callback) {
  var MAX = Math.pow(2, stream.inputBitDepth - 1) - 1;
  var MIN = -Math.pow(2, stream.inputBitDepth - 1);
  var val = 0;
  var min = MAX;
  var max = MIN;

  // Iterate over all samples, doesn't matter which channel it is
  for (var i = 0; i < buffer.length;) {
    val = buffer.readIntLE(i, stream.inputBitDepth);

    if (val > max) max = val;
    else if (val < min) min = val;

    // Advance pointer 2 bytes
    i += 2;
  }

  var byteSize = stream.inputBitDepth / 8;
  var output = new Buffer(byteSize * 2);
  output.writeIntLE(min, 0, stream.inputBitDepth);
  output.writeIntLE(min, byteSize, stream.inputBitDepth);

  callback(null, output);
};
