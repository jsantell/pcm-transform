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
* `json` - Whether or not to write downstream a buffer than is JSON.parse'able. (default: `false`). See Rendering JSON section later.
* `inputChannels` - Number of channels on the input PCM stream. (default: `2`)
* `inputBitDepth` - Number of bits per sample (per channel). (default: `16`)
* `outputBitDepth` - Number of bits per value for output. Used to convert buffers from transform functions into JSON. (default: `inputBitDepth`)
* `transform` - Either a string name of a default transform (`min-max`), or a supplied transform function. The function takes as arguments `buffer`, `stream`, and `callback`. Any error or data passed into the callback gets emitted, or written downstream, accordingly. See [Custom Transforms](https://github.com/jsantell/pcm-transform#custom-transforms) for more info.
* `head` - A buffer or string that gets written downstream when the streaming starts.
* `tail` - A buffer or string that gets written downstream when the streaming completes.

## Transforms

### min-max

Takes the batch of samples and returns the min and max value amongst all samples (regardless of channel) per batch. Results in a buffer of data with sequences of min/max pairs in the form of:

MIN_1 MAX_1 MIN_2 MAX_2 .... MIN_N MAX_N

This is similar to [audiowaveform](https://github.com/bbcrd/audiowaveform/blob/master/doc/DataFormat.md) format.

## Custom Transforms

To use a custom transform instead of a built-in one, pass a function instead of the string name to the `transform` option. This function takes a buffer of samples, the stream instance, and a callback that accepts `err, buffer` signature.

Example of a transform that reduces the stream into max value of each batch of samples. Also look at the built-in transforms like [min-max](https://github.com/jsantell/pcm-transform/blob/master/lib/transforms/min-max.js) to see how they work.

```js

function reduceMax (buffer, stream, callback) {
  var max = Number.MIN_VALUE;
  var value;

  for (var i = 0; i < buffer.length; i++) {
    value = buffer.readIntLE(i, stream.inputBitDepth / 8);

    if (value > max) {
      max = value;
    }
    i += (stream.inputBitDepth / 8);
  }

  // Bitshift the final value from input bit depth to output bit depth
  val = val >> (stream.inputBitDepth - stream.outputBitDepth);

  var output = new Buffer(stream.outputBitDepth / 8);
  output.writeIntLE(val, 0, stream.outputBitDepth);
  
  callback(null, output);
}

```

## JSON Rendering

Specifying `json: true` in the constructor will result in a buffer stream that can be `JSON.parse`d. The array of values is stored in the `data` property. Example of default JSON buffer:

```
{
  "data": [0, 100, 200, ..., 400]
}
```

The property name and other fields can be customized by providing a `head` or `tail` configuration to overwrite the defaults for JSON.

## Testing

```
npm test
```

## License

MIT License, Copyright (c) 2015 Jordan Santell
