var fs = require("fs");
var stream = require("stream");
var PCMTransform = require("../");
var expect = require("chai").expect;
var utils = require("./utils");

describe("core", function () {
  it("uses defaults", function () {
    var stream = new PCMTransform({ batchSize: 100 });
    expect(stream.json).to.be.equal(false);
    expect(stream.inputChannels).to.be.equal(2);
    expect(stream.inputBitDepth).to.be.equal(16);
    expect(stream._transformFn).to.be.equal(require("../lib/transforms/min-max"));
  });

  it("validates configuration", function () {
    expect(function () {
      new PCMTransform();
    }).to.throw(/batchSize/, "throws without `batchSize`");

    expect(function () {
      new PCMTransform({ batchSize: "hello" });
    }).to.throw(/batchSize/, "throws when `batchSize` is not a number");

    expect(function () {
      new PCMTransform({ batchSize: -1 });
    }).to.throw(/batchSize/, "throws when `batchSize` is negative");

    expect(function () {
      new PCMTransform({ batchSize: 0 });
    }).to.throw(/batchSize/, "throws when `batchSize` is 0");
  });

  it("is a transform stream", function () {
    expect(new PCMTransform({ batchSize: 100 })).to.be.an.instanceof(stream.Transform);
  });

  it("works with or without new constructor", function () {
    expect(new PCMTransform({ batchSize: 100 })).to.be.an.instanceof(stream.Transform);
    expect(PCMTransform({ batchSize: 100 })).to.be.an.instanceof(stream.Transform);
  });

  it("doesn't throw max call stack exceeded RangeError when using small batchSize on large chunks", function (done) {
    var buffer = new Buffer(Math.pow(2, 16));
    utils.createReadStream(buffer, { chunkSize: Math.pow(2, 16) })
      .pipe(PCMTransform({ batchSize: 1 }))
      .on("finish", done);
  });
});

