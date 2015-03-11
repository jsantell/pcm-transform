var canvases = document.getElementsByTagName("canvas");

Array.forEach(canvases, (canvas) => {
  var filename = canvas.getAttribute("data-file");
  if (~filename.indexOf(".pcm")) {
    fetch(filename, function (xhr) {
      drawFromPCM(xhr.target.response, canvas);
    });
  }
});

function drawFromPCM (buffer, canvas) {
  var data = new DataView(buffer);
  var h = canvas.height;
  var w = canvas.width;
  var ctx = canvas.getContext("2d");
  var val, x, y;
  var offset = Math.pow(2, 15) - 1;
  
  ctx.clearRect(0, 0, w, h);
  // Draw first channel first.
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.strokeStyle = "#ff0000";
  for (var i = 0; i < data.byteLength;) {
    val = data.getInt16(i, true);
    x = i / data.byteLength * w;
    y = h / Math.pow(2,16) * (val + offset);
    ctx.lineTo(x, y);

    // We're reading 2 and skipping 2 per loop
    i += 4;
  }
  ctx.stroke();
  ctx.closePath();

  // Draw second channel
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.strokeStyle = "#0000ff";
  for (var i = 0; i < data.byteLength;) {
    val = data.getInt16(i + 2, true); // Read the second set of 2 bytes of this 4 byte chunk
    x = i / data.byteLength * w;
    y = h / Math.pow(2,16) * (val + offset);
    ctx.lineTo(x, y);

    // We're reading 2 and skipping 2 per loop
    i += 4;
  }
  ctx.stroke();
  ctx.closePath();
}

function fetch (url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = callback;
  xhr.send();
  return xhr;
}
