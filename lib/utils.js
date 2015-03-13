/**
 * `whilst` function from `async` module.
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
function whilst (test, iterator, callback) {
  if (!test()) {
    callback();
    return;
  }
  iterator(function (err) {
    if (err) {
      return callback(err);
    }
    whilst(test, iterator, callback);
  });
}
exports.whilst = whilst;

function bitshift (val, from, to) {
  return val >> (from - to);
}
exports.bitshift = bitshift;
