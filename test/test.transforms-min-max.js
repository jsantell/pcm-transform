var path = require("path");
var fs = require("fs");
var PCMTransform = require("../");
var expect = require("chai").expect;
var utils = require("./utils");
var equals = require("array-equal");
var WAVReader = require("wav").Reader;
var UP_SLOPE = Array.prototype.slice.call(utils.BUFFERS.SAW_UP);
var DOWN_SLOPE = Array.prototype.slice.call(utils.BUFFERS.SAW_DOWN);

UP_SLOPE.splice(20);
DOWN_SLOPE.splice(20);

describe("transforms - min-max", function () {
  it("returns a min/max duple from every batch (batchSize: 1) (out of phase waves in L/R)", function (done) {
    var data = [];
    var buffer = utils.stereoMix(utils.BUFFERS.SAW_UP, utils.BUFFERS.SAW_DOWN);
    utils.createReadStream(buffer)
      .pipe(PCMTransform({ batchSize: 1, transform: "min-max" }))
      .on("data", function (d) { data.push(d); })
      .on("finish", end);

    function end () {
      expect(data.length).to.be.equal(200);
      var merged = Buffer.concat(data, 800);
      for (var i = 0; i < merged.length; i += 4) {
        var min = merged.readInt16LE(i);
        var max = merged.readInt16LE(i + 2);
        expect(min).to.be.equal(DOWN_SLOPE[(i?i/4:0)%20]);
        expect(max).to.be.equal(UP_SLOPE[(i?i/4:0)%20]);
      }
      done();
    }
  });

  it("returns a min/max duple from every batch (batchSize: 10) (out of phase waves in L/R)", function (done) {
    var data = [];
    var buffer = utils.stereoMix(utils.BUFFERS.SAW_UP, utils.BUFFERS.SAW_DOWN);
    utils.createReadStream(buffer)
      .pipe(PCMTransform({ batchSize: 5, transform: "min-max" }))
      .on("data", function (d) { data.push(d); })
      .on("finish", end);

    var slopes = [
      [-13107, 13106],
      [-29491, 29490],
      [-32767, 32767],
      [-16384, 16383]
    ];
    function end () {
      expect(data.length).to.be.equal(40);
      var merged = Buffer.concat(data, 160);
      for (var i = 0; i < merged.length; i += 4) {
        var min = merged.readInt16LE(i);
        var max = merged.readInt16LE(i + 2);
        expect(min).to.be.equal(slopes[(i?i/4:0)%4][0]);
        expect(max).to.be.equal(slopes[(i?i/4:0)%4][1]);
      }
      done();
    }
  });

  it("handles 16bit to 8bit output", function (done) {
    var data = [];
    var buffer = utils.stereoMix(utils.BUFFERS.SAW_UP, utils.BUFFERS.SAW_DOWN);
    utils.createReadStream(buffer)
      .pipe(PCMTransform({ batchSize: 5, transform: "min-max", outputBitDepth: 8 }))
      .on("data", function (d) { data.push(d); })
      .on("finish", end);

    var slopes = [
      [-13107 >> 8, 13106 >> 8],
      [-29491 >> 8, 29490 >> 8],
      [-32767 >> 8, 32767 >> 8],
      [-16384 >> 8, 16383 >> 8]
    ];
    function end () {
      expect(data.length).to.be.equal(40);
      var merged = Buffer.concat(data, 80);
      for (var i = 0; i < merged.length; i += 2) {
        var min = merged.readInt8(i);
        var max = merged.readInt8(i + 1);
        expect(min).to.be.equal(slopes[(i?i/2:0)%4][0]);
        expect(max).to.be.equal(slopes[(i?i/2:0)%4][1]);
      }
      done();
    }
  });

  it("handles 16bit to 8bit output (json)", function (done) {
    var data = "";
    var buffer = utils.stereoMix(utils.BUFFERS.SAW_UP, utils.BUFFERS.SAW_DOWN);
    utils.createReadStream(buffer)
      .pipe(PCMTransform({ batchSize: 5, transform: "min-max", outputBitDepth: 8, json: true }))
      .on("data", function (d) { data += d })
      .on("finish", end);

    var slopes = [
      [-13107 >> 8, 13106 >> 8],
      [-29491 >> 8, 29490 >> 8],
      [-32767 >> 8, 32767 >> 8],
      [-16384 >> 8, 16383 >> 8]
    ];
    function end () {
      var json = JSON.parse(data);
      expect(json.data.length).to.be.equal(80);
      for (var i = 0; i < json.data.length; i += 2) {
        var min = json.data[i];
        var max = json.data[i + 1];
        expect(min).to.be.equal(slopes[(i/2)%4][0]);
        expect(max).to.be.equal(slopes[(i/2)%4][1]);
      }
      done();
    }
  });

  /* mostly a sanity check */
  it("converts PCM from a wav file into expected output", function (done) {
    var data = "";
    fs.createReadStream(path.join(__dirname, "fixtures", "stereo_sine.wav"))
      .pipe(WAVReader())
      .pipe(PCMTransform({ batchSize: 100, transform: "min-max", outputBitDepth: 8, json: true }))
      .on("data", function (d) { data += d })
      .on("finish", end);

    function end () {
      var json = JSON.parse(data);
      expect(json.data.length).to.be.equal(4410);
      // This is a stereo file where the ampltiude fades from 0 to 1.
      // ensure our min/max values represent that
      for (var i = 2; i < json.data.length; i+=2) {
        expect(json.data[i] <= json.data[i-2]).to.be.ok;
        expect(json.data[i+1] >= json.data[i-1]).to.be.ok;
      }
      expect(json.data[0]).to.be.equal(-1);
      expect(json.data[1]).to.be.equal(0);
      expect(json.data[json.data.length-2]).to.be.equal(-128);
      expect(json.data[json.data.length-1]).to.be.equal(127);
      done();
    }
  });
});
