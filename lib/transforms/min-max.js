/**
 * Calculate the min and max value of a range of samples.
 */
module.exports = function (buffer, stream, callback) {
  var MAX = Math.pow(2, stream.inputBitDepth - 1) - 1;
  var MIN = -Math.pow(2, stream.inputBitDepth - 1);
  var io = createIO(buffer, stream);
  var read = io.read;
  var write = io.read;
  var val = 0;
  var min = MAX;
  var max = MIN;

  // Iterate over all samples, doesn't matter which channel it is
  for (var i = 0; i < buffer.length; i++) {
    val = read(i);

    if (val > max) max = val;
    else if (val < min) min = val;
  }

  callback(null, [min, max]);
};

function createIO (buffer, stream) {
  var bitDepth = stream.inputBitDepth;
  return {
    read: buffer["readInt" + bitDepth + "LE"].bind(buffer),
    write: buffer["writeInt" + bitDepth + "LE"].bind(buffer)
  };
}
