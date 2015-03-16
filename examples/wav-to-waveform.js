var fs = require("fs");
var path = require("path");
var WAVReader = require("wav").Reader;
var PCMTransform = require("pcm-transform");

fs.createReadStream(path.join(__dirname, "..", "test", "fixtures", "stereo_sine.wav"))
  .pipe(WAVReader())
  .pipe(PCMTransform({ batchSize: 100, transform: "min-max", outputBitDepth: 8, json: true }))
  .pipe(fs.createWriteStream(path.join(__dirname, "sine.json")))
  .on("finish", function () {
    console.log("done!");
  });
