/**
 * Store constructor.
 */
function Store () {
  this._buffers = [];
  this._buffersLength = 0;
}
module.exports = Store;

/**
 * Removes the first `n` bytes out of the store
 * and returns them. If `n` is greater than the current
 * buffer size, return as much as possible.
 *
 * @param {Number} bytes
 * @return {Buffer}
 */

Store.prototype.shift = function (bytes) {
  // If trying to shift more space than the internal buffer has, cap it
  // at the current size of the store.
  bytes = bytes > this._buffersLength ? this._buffersLength : bytes;

  var data = Buffer.concat(this._buffers, this._buffersLength);
  var front = data.slice(0, bytes);
  this.empty();
  this.push(data.slice(bytes));
  return front;
};

/**
 * Merges the buffer into the buffer store.
 *
 * @param {Buffer} buffer
 */

Store.prototype.push = function (buffer) {
  this._buffers.push(buffer);
  this._buffersLength += buffer.length;
};

/**
 * Clears out the internal buffer store.
 */
Store.prototype.empty = function () {
  this._buffers.length = 0;
  this._buffersLength = 0;
};

/**
 * Returns the size of all the stored buffers.
 */
Store.prototype.length = function () {
  return this._buffersLength;
};
