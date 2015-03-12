var Transform = require("stream").Transform;
var util = require("util");
var transforms = require("./transforms");
var whilst = require("./utils").whilst;
var Store = require("./store");
var JSON_HEAD = "[";
var JSON_TAIL = "]";
var JSON_SEP = ",";

/**
 * PCMTransform constructor.
 *
 * @param {Object} options
 * @option {Number} inputChannels
 * @option {Number} inputBitDepth
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
  this._transformFn = typeof options.transform === "function" ? options.transform :
                      transforms[options.transform] || transforms.minMax;

  // Indicating whether this stream has not written anything yet
  this._fresh = true;

  // Store this helper so we can compare max byte size per value
  // later
  this._bytesPerValue = this.batchSize * this.inputChannels * (this.inputBitDepth / 8);

  // Bind context to save on anonymous functions later
  this._hasFullSample = this._hasFullSample.bind(this);
  this._process = this._process.bind(this);
  this._push = this._push.bind(this);

  this.store = new Store();

  Transform.call(this);
}
util.inherits(PCMTransform, Transform);

module.exports = PCMTransform;

/**
 * Transformation method. Each chunk should be added to the internal buffer store
 * and sent off to be transformed if over the batchSize limit.
 *
 * @param {Buffer} chunk
 * @param {String} encoding
 * @param {Function} callback
 */

PCMTransform.prototype._transform = function (chunk, encoding, callback) {
  this.store.push(chunk);

  if (this._hasFullSample()) {
    this._processStore(callback);
  } else {
    callback();
  }
};

/**
 * Called when no more chunks to read. Flushes out the buffer store,
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
    if (stream.json) {
      stream.push(JSON_TAIL);
    }
    callback();
  }
};

/**
 * Pushes a full sample (or less) to the `_transformFn` function and writes
 * it to the stream. Aborts if no bytes in the store.
 *
 * @param {Function} callback
 */

PCMTransform.prototype._process = function (callback) {
  var stream = this;

  if (!this.store.length()) {
    return callback();
  }

  this._transformFn(this.store.shift(this._bytesPerValue), this, function (err, data) {
    if (err) {
      stream.emit("error", err);
      return;
    }
    stream._push(data);
    callback();
  });
};

/**
 * Write data to the stream, formatting it appropriately.
 *
 * @param {Buffer}
 */

PCMTransform.prototype._push = function (data) {
  if (!data) {
    return;
  }
  if (this.json) {
    // If this is the first chunk, push the opening "[" first
    if (this._fresh === true) {
      this.push(JSON_HEAD);
      // Cast to string and push
      this.push(data + "");
    }
    // If not the first push, append the JSON separator "," and the data value
    // stringified
    else {
      this.push(JSON_SEP + data);
    }
  }
  else {
    this.push(data);
  }
  this._fresh = false;
};

/**
 * Write to stream as many samples larger than bytesPerValue as possible from
 * the store.
 *
 * @param {Function} callback
 */

PCMTransform.prototype._processStore = function (callback) {
  whilst(this._hasFullSample, this._process, callback);
};

/**
 * Checks the store to see if there's enough bytes to
 * write a sample.
 *
 * @return {Boolean}
 */

PCMTransform.prototype._hasFullSample = function () {
  return this.store.length() >= this._bytesPerValue;
};
