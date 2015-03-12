# pcm-transform

[![Build Status](http://img.shields.io/travis/jsantell/pcm-transform.svg?style=flat-square)](https://travis-ci.org/jsantell/pcm-transform)
[![Build Status](http://img.shields.io/npm/v/pcm-transform.svg?style=flat-square)](https://www.npmjs.org/package/pcm-transform)

A transform stream that reads PCM data and transforms with built-in or custom functions.

Batches up samples from a PCM stream to a configurable amount (`batchSize`) and passes them into a configurable transform function so that they can be processed by proximity, like for making waveform data for visualizations.

## Install

```
npm install pcm-transform
```

## Usage

```javascript
var fs = require("fs");
var lame = require("lame");
var PCMTransform = require("pcm-transform");

fs.createReadStream("TesseracT - Concealing Fate, Part One: Acceptance.mp3")
  .pipe(new lame.Decoder)
  .pipe(PCMTransform({ batchSize: 20000 })
  .pipe(fs.createWriteStream("waveform.data");

```

## API

### `PCMTransform()`

Constructor for a [transform stream](https://nodejs.org/api/stream.html#stream_class_stream_transform). Takes the following config options:

* `batchSize` - Number of samples to batch together to be transformed. If using 16 bit samples in stereo (2 channels), each sample would be 4 bytes. (required)
* `inputChannels` - Number of channels on the input PCM stream. (default: `2`)
* `inputBitDepth` - Number of bits per sample (per channel). (default: `16`)
* `transform` - Either a string name of a default transform (`min-max`), or a supplied transform function. The function takes as arguments `buffer`, `stream`, and `callback`. Any error or data passed into the callback gets emitted, or written downstream, accordingly. See [#custom%20transforms](Custom Transforms) for more info.

## Transforms

* `min-max`: Takes the batch of samples and returns the min and max value amongst all samples (regardless of channel).

## Custom Transforms

TODO

## Testing

```
npm test
```

## License

MIT License, Copyright (c) 2015 Jordan Santell
