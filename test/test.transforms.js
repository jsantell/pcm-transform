var PCMTransform = require("../");
var expect = require("chai").expect;
var utils = require("./utils");
var equals = require("array-equal");

function drain () {}

function testProcessing (bufferSize, batchSize, bitDepth, channels, callback) {
  var buffer = new Buffer(bufferSize);
  buffer.fill(127);
  var rstream = utils.createReadStream(buffer, { chunkSize: 5 });
  var called = 0;
  var sizes = [];
  var xstream = PCMTransform({
    batchSize: batchSize,
    inputBitDepth: bitDepth,
    inputChannels: channels,
    transform: transform
  });

  rstream.pipe(xstream)
    .on("data", function (data) {
      expect(data.length).to.be.equal(bitDepth/8);
      expect(data[0]).to.be.equal(1);
    })
    .on("end", function () { callback(null, { called: called, sizes: sizes }); });

  function transform (b, stream, callback) {
    called++;
    sizes.push(b.length);
    callback();
  }
}

describe("transforms", function () {
  describe("process chunks according to bit depth, channels and batchSize", function () {
    var specs = [
      // sets of buffer sizes, samples per value, bitDepth, channels and expected sizes
      // of processed buffers

      // 2 channel, 8 bit
      [200, 10, 8, 2, [20, 20, 20, 20, 20, 20, 20, 20, 20, 20]],
      // 2 channel, 16 bit
      [200, 10, 16, 2, [40, 40, 40, 40, 40]],

       // 1 channel, 8 bit
      [200, 50, 8, 1, [50, 50, 50, 50]],
       // 1 channel, 16 bit
      [200, 50, 16, 1, [100, 100]]
    ];

    for (var i = 0; i < specs.length; i++) {
      (function () {
      var s = specs[i];
      it("processes chunks of " + s[2] + " bits and " + s[3] + " channels correctly", function (done) {
        var expected = s[4];
        s[4] = function (err, results) {
          expect(equals(results.sizes, expected)).to.be.ok;
          done();
        };
        testProcessing.apply(null, s);
      });
      })();
    }
  });

  it("only one chunk, less than batchSize", function (done) {
    var buffer = new Buffer(50);
    var dataPumped = false;
    utils.createReadStream(buffer, { chunkSize: 100 })
      .pipe(PCMTransform({ batchSize: 200, transform: sink }))
      .on("data", function (b) {
        expect(b.length).to.be.equal(50);
        dataPumped = true;
      })
      .on("end", function () {
        expect(dataPumped).to.be.true;
        done();
      });

    function sink (buffer, stream, cb) {
      expect(buffer.length).to.be.equal(50);
      cb(null, buffer);
    }
  });

  it("processes partial set of samples < batchSize at end of stream", function (done) {
    var count = 0;
    var buffer = new Buffer(450);
    var dataPumped = false;
    utils.createReadStream(buffer, { chunkSize: 25 })
      .pipe(PCMTransform({ batchSize: 100, transform: sink }))
      .on("end", done)
      .resume();

    function sink (buffer, stream, cb) {
      count++;
      if (count === 1) {
        expect(buffer.length).to.be.equal(400);
      } else if (count === 2) {
        expect(buffer.length).to.be.equal(50);
      } else { throw new Error(); }
      cb(null, buffer);
    }
  });

  it("processes when chunks contain enough samples for 2+ values", function (done) {
    var count = 0;
    var buffer = new Buffer(4000);
    var dataPumped = false;
    utils.createReadStream(buffer, { chunkSize: 4000 })
      .pipe(PCMTransform({ batchSize: 200, transform: sink }))
      .on("end", done)
      .resume();

    function sink (buffer, stream, cb) {
      count++;
      if (count < 6) {
        expect(buffer.length).to.be.equal(800);
      } else { throw new Error(); }
      cb(null, buffer);
    }
  });
});
