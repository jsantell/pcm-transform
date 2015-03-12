var fs = require("fs");
var stream = require("stream");
var PCMTransform = require("../");
var expect = require("chai").expect;
var utils = require("./utils");

describe("core", function () {
  it("uses defaults", function () {
    var stream = new PCMTransform({ samplesPerValue: 100 });
    expect(stream.json).to.be.equal(false);
    expect(stream.inputChannels).to.be.equal(2);
    expect(stream.inputBitDepth).to.be.equal(16);
    expect(stream._transformFn).to.be.equal(require("../lib/transforms/min-max"));
  });

  it("validates configuration", function () {
    expect(function () {
      new PCMTransform();
    }).to.throw(/samplesPerValue/, "throws without `samplesPerValue`");

    expect(function () {
      new PCMTransform({ samplesPerValue: "hello" });
    }).to.throw(/samplesPerValue/, "throws when `samplesPerValue` is not a number");

    expect(function () {
      new PCMTransform({ samplesPerValue: -1 });
    }).to.throw(/samplesPerValue/, "throws when `samplesPerValue` is negative");

    expect(function () {
      new PCMTransform({ samplesPerValue: 0 });
    }).to.throw(/samplesPerValue/, "throws when `samplesPerValue` is 0");
  });

  it("is a transform stream", function () {
    expect(new PCMTransform({ samplesPerValue: 100 })).to.be.an.instanceof(stream.Transform);
  });

  it("works with or without new constructor", function () {
    expect(new PCMTransform({ samplesPerValue: 100 })).to.be.an.instanceof(stream.Transform);
    expect(PCMTransform({ samplesPerValue: 100 })).to.be.an.instanceof(stream.Transform);
  });
});

