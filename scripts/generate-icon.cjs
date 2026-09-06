// Render the simple geometric Still mark as a PNG without external image assets.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type), size = Buffer.alloc(4), crc = Buffer.alloc(4);
  size.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, crc]);
}
function render(size, filename, monochrome = false) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = (x + 0.5) / size, py = (y + 0.5) / size;
    const distance = Math.hypot(px - 0.5, py - 0.5);
    const ring = Math.min(Math.abs(distance - 0.24) - 0.012, Math.abs(distance - 0.17) - 0.008);
    const dot = Math.hypot(px - 0.73, py - 0.32) - 0.028;
    const coverage = Math.max(0, Math.min(1, 0.5 - Math.min(ring, dot) * size));
    const bg = monochrome ? [0, 0, 0] : [246, 244, 237];
    const ink = dot < ring ? [165, 138, 88] : [55, 98, 78];
    const offset = y * (size * 4 + 1) + 1 + x * 4;
    for (let k = 0; k < 3; k++) raw[offset + k] = monochrome ? 0 : Math.round(bg[k] * (1 - coverage) + ink[k] * coverage);
    raw[offset + 3] = monochrome ? Math.round(255 * coverage) : 255;
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  fs.writeFileSync(path.join(__dirname, '../assets', filename), Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
render(1024, 'icon.png'); render(64, 'favicon.png'); render(1024, 'android-icon-monochrome.png', true);
