var pcmtrans = require("../");

describe(function () {

  it("uses defaults", function () {
    fs.createReadStream(__dirname + "/fixtures/stereo_oop_10k_sine.pcm")
      .pipe(new pcmtrans())
      .pipe(fs.createWriteStream(__dirname + "/fixtures/stereo_oop_10k_sine.dat"));
  });
});

