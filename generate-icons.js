'use strict';
const zlib = require('zlib');
const fs = require('fs');

// CRC32
const crcTable = (function() {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const cv = Buffer.alloc(4); cv.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, cv]);
}

function makePNG(size, drawFn) {
  const pixels = new Uint8Array(size * size * 3);
  function px(x, y, r, g, b) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 3;
    pixels[i] = r; pixels[i+1] = g; pixels[i+2] = b;
  }
  drawFn(px, size);

  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0;
    for (let x = 0; x < size; x++) {
      const s = (y * size + x) * 3, d = y * (1 + size * 3) + 1 + x * 3;
      raw[d] = pixels[s]; raw[d+1] = pixels[s+1]; raw[d+2] = pixels[s+2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit depth, RGB
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// 5×7 bitmap font (7 rows, 5 bits each, bit 4 = leftmost)
const F = {
  A: [0b01110,0b10001,0b10001,0b11111,0b10001,0b10001,0b10001],
  S: [0b01111,0b10000,0b10000,0b01110,0b00001,0b00001,0b11110],
  C: [0b01110,0b10001,0b10000,0b10000,0b10000,0b10001,0b01110],
  E: [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b11111],
  N: [0b10001,0b11001,0b10101,0b10011,0b10001,0b10001,0b10001],
  I: [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b11111],
  O: [0b01110,0b10001,0b10001,0b10001,0b10001,0b10001,0b01110],
  P: [0b11110,0b10001,0b10001,0b11110,0b10000,0b10000,0b10000],
  R: [0b11110,0b10001,0b10001,0b11110,0b10100,0b10010,0b10001],
  T: [0b11111,0b00100,0b00100,0b00100,0b00100,0b00100,0b00100],
  L: [0b10000,0b10000,0b10000,0b10000,0b10000,0b10000,0b11111],
  G: [0b01110,0b10001,0b10000,0b10111,0b10001,0b10001,0b01110],
  a: [0b00000,0b01110,0b00001,0b01111,0b10001,0b10011,0b01101],
  s: [0b00000,0b01111,0b10000,0b01110,0b00001,0b10001,0b01110],
  c: [0b00000,0b01110,0b10001,0b10000,0b10000,0b10001,0b01110],
  e: [0b00000,0b01110,0b10001,0b11111,0b10000,0b10001,0b01110],
  n: [0b00000,0b11110,0b10001,0b10001,0b10001,0b10001,0b10001],
  i: [0b00100,0b00000,0b01100,0b00100,0b00100,0b00100,0b01110],
  o: [0b00000,0b01110,0b10001,0b10001,0b10001,0b10001,0b01110],
};

function drawChar(px, ch, ox, oy, sc, r, g, b) {
  const rows = F[ch]; if (!rows) return;
  for (let row = 0; row < 7; row++)
    for (let col = 0; col < 5; col++)
      if (rows[row] & (0b10000 >> col))
        for (let sy = 0; sy < sc; sy++)
          for (let sx = 0; sx < sc; sx++)
            px(ox + col * sc + sx, oy + row * sc + sy, r, g, b);
}

function drawStr(px, str, ox, oy, sc, r, g, b) {
  let cx = ox;
  for (const ch of str) { drawChar(px, ch, cx, oy, sc, r, g, b); cx += (5 + 1) * sc; }
}

function strW(str, sc) { return str.length * (5 + 1) * sc - sc; }

function drawIcon(px, size) {
  const BG = [28, 28, 30];
  const AM = [212, 168, 83];
  const AM2 = [148, 118, 58]; // dimmer amber for PROTOCOL

  // Background
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      px(x, y, ...BG);

  // Chevron ^: peak at top, arms going down-left and down-right
  const cx = size / 2, cy = size * 0.28;
  const arm = size * 0.22;
  const thick = Math.max(2, Math.round(size * 0.038));

  for (let t = 0; t <= 1000; t++) {
    const f = t / 1000;
    const lx = cx - arm * f, ly = cy + arm * f;
    const rx = cx + arm * f, ry = cy + arm * f;
    for (let dx = -thick; dx <= thick; dx++)
      for (let dy = -thick; dy <= thick; dy++)
        if (dx * dx + dy * dy <= thick * thick) {
          px(Math.round(lx + dx), Math.round(ly + dy), ...AM);
          px(Math.round(rx + dx), Math.round(ry + dy), ...AM);
        }
  }

  // "Ascension"
  const sc1 = Math.max(2, Math.round(size / 90));
  const word1 = ['A','s','c','e','n','s','i','o','n'];
  const w1 = strW(word1, sc1);
  let tx1 = Math.round((size - w1) / 2);
  const ty1 = Math.round(size * 0.60);
  for (const ch of word1) { drawChar(px, ch, tx1, ty1, sc1, ...AM); tx1 += (5+1)*sc1; }

  // "PROTOCOL"
  const sc2 = Math.max(1, Math.round(size / 140));
  const word2 = 'PROTOCOL';
  const w2 = strW(word2, sc2);
  let tx2 = Math.round((size - w2) / 2);
  const ty2 = Math.round(size * 0.78);
  for (const ch of word2) { drawChar(px, ch, tx2, ty2, sc2, ...AM2); tx2 += (5+1)*sc2; }
}

[512, 192].forEach(function(size) {
  const buf = makePNG(size, drawIcon);
  const name = `icon-${size}.png`;
  fs.writeFileSync(name, buf);
  console.log(`Generated ${name} (${buf.length} bytes)`);
});
