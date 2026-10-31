import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// Function to generate a simple uncompressed PNG with pure Node.js
function createSolidPNG(width, height, isMaskable = false) {
  // Color palette
  // Background: #002147 (0, 33, 71)
  // Foreground / Ring: #FF7F32 (255, 127, 50)
  // Text / Star: white (255, 255, 255)
  const bgR = 0, bgG = 33, bgB = 71;
  const fgR = 255, fgG = 127, fgB = 50;

  const rawBytes = [];
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * (isMaskable ? 0.35 : 0.42);
  const innerRadius = width * (isMaskable ? 0.28 : 0.34);

  for (let y = 0; y < height; y++) {
    rawBytes.push(0); // filter byte 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Outer ring
      if (dist <= radius && dist >= innerRadius) {
        rawBytes.push(fgR, fgG, fgB, 255);
      } else if (dist < innerRadius && dist >= innerRadius * 0.75) {
        // Inner contrast
        rawBytes.push(255, 255, 255, 255);
      } else if (dist < innerRadius * 0.75) {
        // Center core
        rawBytes.push(fgR, fgG, fgB, 255);
      } else {
        // Background
        rawBytes.push(bgR, bgG, bgB, 255);
      }
    }
  }

  const rawBuffer = Buffer.from(rawBytes);
  const compressed = zlib.deflateSync(rawBuffer);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crcTarget = buffer.slice(4, 8 + length);
  const crc = crc32(crcTarget);
  buffer.writeUInt32BE(crc, 8 + length);
  return buffer;
}

// CRC32 table & computation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), createSolidPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'icon-192-maskable.png'), createSolidPNG(192, 192, true));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), createSolidPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'icon-512-maskable.png'), createSolidPNG(512, 512, true));
console.log('Successfully generated PWA icon assets in /public');
