var fs = require("fs");
var PCMTransform = require("../");
var expect = require("chai").expect;
var utils = require("./utils");
var equals = require("array-equal");

describe("json rendering", function () {
  it("emits data for json form as an array", function (done) {
    var data = "";
    var buffer = utils.stereoMix(utils.BUFFERS.SAW_UP, utils.BUFFERS.SAW_DOWN);
    utils.createReadStream(buffer)
      .pipe(PCMTransform({ batchSize: 5, transform: "min-max", json: true }))
      .on("data", function (d) {
        data += d;
      })
      .on("end", end);

    var slopes = [
      [-13107, 13106],
      [-29491, 29490],
      [-32767, 32767],
      [-16384, 16383]
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

  it("streams custom `head` and `tail` values when streaming json", function (done) {
    var data = "";
    var head = "{\"somuchdata\":[";
    var tail = "], \"evenmore\": 100}";
    var buffer = utils.stereoMix(utils.BUFFERS.SAW_UP, utils.BUFFERS.SAW_DOWN);
    utils.createReadStream(buffer)
      .pipe(PCMTransform({ batchSize: 5, transform: "min-max", json: true, head: head, tail: tail }))
      .on("data", function (d) {
        data += d;
      })
      .on("end", end);

    var slopes = [
      [-13107, 13106],
      [-29491, 29490],
      [-32767, 32767],
      [-16384, 16383]
    ];
    function end () {
      var json = JSON.parse(data);
      expect(json.somuchdata.length).to.be.equal(80);
      expect(json.evenmore).to.be.equal(100);
      for (var i = 0; i < json.somuchdata.length; i += 2) {
        var min = json.somuchdata[i];
        var max = json.somuchdata[i + 1];
        expect(min).to.be.equal(slopes[(i/2)%4][0]);
        expect(max).to.be.equal(slopes[(i/2)%4][1]);
      }
      done();
    }
  });
});
