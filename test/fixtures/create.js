var fs = require("fs");

// Create two oscillating side waves for each channel out of phase
// 10000 samples, 16bit int, stereo
var samples = 10000;
var MAX_UINT16 = Math.pow(2, 15) - 1;
var hz = 10;
var TAU = Math.PI * 2;
var tick = hz / samples;

var buffer = new Buffer(samples * 2 * 2); // each sample is 2 bytes, 2 channels
for (var i = 0; i < samples; i++) {
  var L = Math.sin(tick * i * TAU) * MAX_UINT16;
  var R = Math.sin(Math.PI + (tick * i * TAU)) * MAX_UINT16;
  buffer.writeInt16LE(Math.floor(L), i * 4);
  buffer.writeInt16LE(Math.floor(R), (i * 4) + 2);
}
fs.writeFileSync(__dirname + "/stereo_oop_10k_sine.pcm", buffer);
