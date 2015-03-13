var Transform = require("stream").Transform;
var util = require("util");
var transforms = require("./transforms");
var utils = require("./utils");
var Queue = require("buffer-queue");
var JSON_HEAD = "{\"data\":[";
var JSON_TAIL = "]}";
var JSON_SEP = ",";

/**
 * PCMTransform constructor.
 *
 * @param {Object} options
 * @option {Number} inputChannels
 * @option {Number} inputBitDepth
 * @option {Number} outputBitDepth
 * @option {Number} batchSize [required]
 * @option {Boolean} json
 *         Whether or not to export in JSON form.
 * @option {String|Function} transform
 *         Either a string of a transformation type ("minMax") or a function
 *         that is called when there are enough samples to produce a value.
 *         Receives the current set of samples as a buffer, the PCMTransform instance,
 *         and callback (taking err and data to write as arguments).
 */

function PCMTransform (options) {
  if (!(this instanceof PCMTransform)) {
    return new PCMTransform(options);
  }

  options = options || {};

  if (typeof options.batchSize !== "number" || options.batchSize <= 0) {
    throw new Error("batchSize must be a number greater than 0.");
  }

  this.batchSize = options.batchSize;
  this.json = options.json || false;
  this.inputChannels = options.inputChannels || 2;
  this.inputBitDepth = options.inputBitDepth || 16;
  this.outputBitDepth = options.outputBitDepth || this.inputBitDepth;
  this._transformFn = typeof options.transform === "function" ? options.transform :
                      transforms[options.transform] || transforms.minMax;

  this.head = options.head;
  this.tail = options.tail;

  // Indicating whether this stream has not written anything yet
  this._fresh = true;

  // Store this helper so we can compare max byte size per value
  // later
  this._bytesPerValue = this.batchSize * this.inputChannels * (this.inputBitDepth / 8);

  // Bind context to save on anonymous functions later
  this._hasFullSample = this._hasFullSample.bind(this);
  this._process = this._process.bind(this);
  this._push = this._push.bind(this);

  this.queue = new Queue();

  Transform.call(this);
}
util.inherits(PCMTransform, Transform);

module.exports = PCMTransform;

/**
 * Transformation method. Each chunk should be added to the internal buffer queue
 * and sent off to be transformed if over the batchSize limit.
 *
 * @param {Buffer} chunk
 * @param {String} encoding
 * @param {Function} callback
 */

PCMTransform.prototype._transform = function (chunk, encoding, callback) {
  this.queue.push(chunk);

  if (this._hasFullSample()) {
    this._processStore(callback);
  } else {
    callback();
  }
};

/**
 * Called when no more chunks to read. Flushes out the buffer queue,
 * writing it all to stream, and writing any tail data necessary.
 *
 * @param {Function} callback
 */

PCMTransform.prototype._flush = function (callback) {
  var stream = this;
  stream._processStore(function (err) {
    if (err) {
      stream.emit("error", err);
      return;
    }
    // Run one more process to ensure there isn't samples < batchSize
    stream._process(finalize);
  });

  function finalize () {
    if (stream.tail) {
      stream.push(stream.tail);
    } else if (stream.json) {
      stream.push(JSON_TAIL);
    }
    callback();
  }
};

/**
 * Pushes a full sample (or less) to the `_transformFn` function and writes
 * it to the stream. Aborts if no bytes in the queue.
 *
 * @param {Function} callback
 */

PCMTransform.prototype._process = function (callback) {
  var stream = this;

  if (!this.queue.length()) {
    return callback();
  }

  // Use setImmediate here so we don't overflow the call stack
  // when we have large upstream chunks and low batchSize processing
  setImmediate(function () {
    stream._transformFn(stream.queue.shift(stream._bytesPerValue), stream, function (err, data) {
      if (err) {
        stream.emit("error", err);
        return;
      }
      stream._push(data);
      callback();
    });
  });
};

/**
 * Write data to the stream, formatting it appropriately.
 *
 * TODO should probably export `json` data as buffers here too if it's faster,
 * as the decoding happens in the consumer.
 *
 * @param {Buffer}
 */

PCMTransform.prototype._push = function (data) {
  if (!data) {
    return;
  }
  if (this._fresh === true) {
    // If `head` defined, push that downstream first. If no `head`
    // defined, and using JSON output, push the default JSON head.
    if (this.head) {
      this.push(this.head);
    } else if (this.json) {
      this.push(JSON_HEAD);
    }
  }
  if (this.json) {
    this.push((this._fresh ? "" : JSON_SEP) + this._bufferToCSV(data));
  } else {
    this.push(data);
  }
  this._fresh = false;
};

/**
 * Used to write buffers from transform functions into a CSV string
 * so that it can be read downstream and parsed as JSON. This is affected
 * by the `outputBitRate`, so we know how many elements to parse.
 *
 * Example:
 * Buffer containing 16 bit ints, 4 bytes total
 * <Buffer 05 00 14 00>
 * Converts to:
 * "5, 20"
 *
 * @param {Buffer} buffer
 * @param {String}
 */

PCMTransform.prototype._bufferToCSV = function (buffer) {
  var bitDepth = this.outputBitDepth;
  var bytes = bitDepth / 8;
  var read = "readInt" + bitDepth + "LE";
  var result = "";

  for (var i = 0; i < buffer.length;) {
    if (i > 0) {
      result += JSON_SEP;
    }

    result += buffer[read](i);
    i += bytes;
  }

  return result;
};

/**
 * Write to stream as many samples larger than bytesPerValue as possible from
 * the queue.
 *
 * @param {Function} callback
 */

PCMTransform.prototype._processStore = function (callback) {
  utils.whilst(this._hasFullSample, this._process, callback);
};

/**
 * Checks the queue to see if there's enough bytes to
 * write a sample.
 *
 * @return {Boolean}
 */

PCMTransform.prototype._hasFullSample = function () {
  return this.queue.length() >= this._bytesPerValue;
};
