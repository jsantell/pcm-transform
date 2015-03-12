/**
 * Calculate the min and max value of a range of samples.
 */
module.exports = function (buffer, stream, callback) {
  var MAX = Math.pow(2, stream.inputBitDepth - 1) - 1;
  var MIN = -Math.pow(2, stream.inputBitDepth - 1);
  var val = 0;
  var min = MAX;
  var max = MIN;
  var byteSize = stream.inputBitDepth / 8;
  var write = byteSize === 3 ? "writeInt32LE" : byteSize === 2 ? "writeInt16LE" : "writeIntLE";
  var read = byteSize === 3 ? "readInt32LE" : byteSize === 2 ? "readInt16LE" : "readIntLE";

  // Iterate over all samples, doesn't matter which channel it is
  for (var i = 0; i < buffer.length;) {
    val = buffer[read](i);

    if (val > max) max = val;
    if (val < min) min = val;

    // Advance pointer 2 bytes
    i += byteSize;
  }

  var output = new Buffer(byteSize * 2);
  output[write](min, 0);
  output[write](max, byteSize);

  callback(null, output);
};
