// ساخت آیکون‌های ساده و بدون وابستگی برای اپ Tauri
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    pixels.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;
  const left = size * 0.3;
  const rightF = size * 0.43;
  const topF = size * 0.24;
  const bottomF = size * 0.78;
  const topBarRight = size * 0.72;
  const middleBarRight = size * 0.63;
  const topBarBottom = size * 0.36;
  const middleBarTop = size * 0.44;
  const middleBarBottom = size * 0.56;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = (y * size + x) * 4;

      // گوشه‌های گرد
      let inside = true;
      if (x < radius && y < radius) {
        inside = (radius - x) ** 2 + (radius - y) ** 2 <= radius ** 2;
      } else if (x > size - radius && y < radius) {
        inside = (x - (size - radius)) ** 2 + (radius - y) ** 2 <= radius ** 2;
      } else if (x < radius && y > size - radius) {
        inside = (radius - x) ** 2 + (y - (size - radius)) ** 2 <= radius ** 2;
      } else if (x > size - radius && y > size - radius) {
        inside =
          (x - (size - radius)) ** 2 + (y - (size - radius)) ** 2 <= radius ** 2;
      }

      if (!inside) {
        pixels[px] = 0;
        pixels[px + 1] = 0;
        pixels[px + 2] = 0;
        pixels[px + 3] = 0;
        continue;
      }

      const t = (x + y) / (2 * size);
      pixels[px] = Math.round(79 + (147 - 79) * t);
      pixels[px + 1] = Math.round(70 + (51 - 70) * t);
      pixels[px + 2] = Math.round(229 + (234 - 229) * t);
      pixels[px + 3] = 255;

      const isF =
        (x >= left && x < rightF && y >= topF && y < bottomF) ||
        (x >= left && x < topBarRight && y >= topF && y < topBarBottom) ||
        (x >= left && x < middleBarRight && y >= middleBarTop && y < middleBarBottom);

      if (isF) {
        pixels[px] = 255;
        pixels[px + 1] = 255;
        pixels[px + 2] = 255;
      }
    }
  }

  return pixels;
}

function makeIco(pngBuffer) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = 0; // 256
  entry[1] = 0; // 256
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, pngBuffer]);
}

const iconsDir = path.join(__dirname, "..", "src-tauri", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [32, 128, 256]) {
  fs.writeFileSync(
    path.join(iconsDir, `${size}x${size}.png`),
    encodePng(size, renderIcon(size)),
  );
}

fs.copyFileSync(
  path.join(iconsDir, "256x256.png"),
  path.join(iconsDir, "128x128@2x.png"),
);

const icon256 = encodePng(256, renderIcon(256));
fs.writeFileSync(path.join(iconsDir, "icon.ico"), makeIco(icon256));

console.log("Icons generated in src-tauri/icons");
