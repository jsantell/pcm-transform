var fs = require("fs");
var lame = require("lame");
var PCMTransform = require("pcm-transform");

fs.createReadStream("mysong.mp3")
  .pipe(new lame.Decoder)
  .pipe(PCMTransform({ batchSize: 20000 })
  .pipe(fs.createWriteStream("waveform.data");
