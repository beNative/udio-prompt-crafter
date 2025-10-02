const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const bgStops = [
  { t: 0, color: [0x1B, 0x1F, 0x3B] },
  { t: 0.5, color: [0x2E, 0x2F, 0x66] },
  { t: 1, color: [0x3A, 0x88, 0xF4] },
];

const waveStops = [
  { t: 0, color: [0xFF, 0x9A, 0x9E] },
  { t: 0.5, color: [0xFA, 0xD0, 0xC4] },
  { t: 1, color: [0xF6, 0xD3, 0x65] },
];

const glowColor = [0x8F, 0xE7, 0xFF];
const shadowColor = [0x0B, 0x10, 0x29];
const barColor = [0xFF, 0xFF, 0xFF];
const accentOuter = [0xFD, 0xF2, 0xFF];
const accentInner = [0xFF, 0x7A, 0x7A];

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const chunk = Buffer.alloc(8 + data.length + 4);
  chunk.writeUInt32BE(data.length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  chunk.writeUInt32BE(crc, 8 + data.length);
  return chunk;
}

function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression method
  ihdr[11] = 0; // filter method
  ihdr[12] = 0; // interlace method

  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    const lineStart = y * (stride + 1);
    scanlines[lineStart] = 0; // filter type 0
    rgbaBuffer.copy(scanlines, lineStart + 1, y * stride, y * stride + stride);
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });
  const chunks = [
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ];

  return Buffer.concat([signature, ...chunks]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleGradient(stops, t) {
  if (t <= stops[0].t) return stops[0].color;
  if (t >= stops[stops.length - 1].t) return stops[stops.length - 1].color;
  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i];
    const next = stops[i + 1];
    if (t >= current.t && t <= next.t) {
      const localT = (t - current.t) / (next.t - current.t);
      return [
        Math.round(lerp(current.color[0], next.color[0], localT)),
        Math.round(lerp(current.color[1], next.color[1], localT)),
        Math.round(lerp(current.color[2], next.color[2], localT)),
      ];
    }
  }
  return stops[stops.length - 1].color;
}

function blend(base, overlay, alpha) {
  const inv = 1 - alpha;
  return [
    Math.round(base[0] * inv + overlay[0] * alpha),
    Math.round(base[1] * inv + overlay[1] * alpha),
    Math.round(base[2] * inv + overlay[2] * alpha),
  ];
}

function insideRoundedRect(x, y, size, radius) {
  const maxIndex = size - 1;
  const r = radius;
  if (x >= r && x <= maxIndex - r) return true;
  if (y >= r && y <= maxIndex - r) return true;
  let dx = 0;
  let dy = 0;
  if (x < r && y < r) {
    dx = r - x;
    dy = r - y;
  } else if (x > maxIndex - r && y < r) {
    dx = x - (maxIndex - r);
    dy = r - y;
  } else if (x < r && y > maxIndex - r) {
    dx = r - x;
    dy = y - (maxIndex - r);
  } else if (x > maxIndex - r && y > maxIndex - r) {
    dx = x - (maxIndex - r);
    dy = y - (maxIndex - r);
  } else {
    return true;
  }
  return dx * dx + dy * dy <= r * r;
}

function generatePixel(size, x, y) {
  if (!insideRoundedRect(x, y, size, Math.round(size * 0.22))) {
    return [0, 0, 0, 0];
  }
  const xf = x / (size - 1);
  const yf = y / (size - 1);
  const diag = (xf + (1 - yf)) / 2;
  let color = sampleGradient(bgStops, diag);

  // radial glow
  const glowCenterX = 0.5;
  const glowCenterY = 0.43;
  const dx = xf - glowCenterX;
  const dy = yf - glowCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const glowStrength = Math.max(0, 1 - Math.pow(distance / 0.7, 2));
  if (glowStrength > 0) {
    color = blend(color, glowColor, 0.35 * glowStrength);
  }

  // wave body
  const topWave = 0.40 + 0.08 * Math.cos((xf - 0.3) * Math.PI);
  const bottomWave = 0.78 - 0.1 * Math.cos((xf - 0.3) * Math.PI);
  if (yf >= topWave && yf <= bottomWave) {
    const waveT = Math.min(1, Math.max(0, (yf - topWave) / (bottomWave - topWave)));
    const gradientT = Math.min(1, Math.max(0, (xf - 0.1) / 0.8));
    const waveColor = sampleGradient(waveStops, gradientT);
    const depthShade = blend(waveColor, shadowColor, 0.35 * waveT);
    color = blend(color, depthShade, 0.75);
  } else if (yf > bottomWave) {
    color = blend(color, shadowColor, 0.25);
  }

  // waveform bars
  const barDefinitions = [
    { x: 0.26, top: 0.30, bottom: 0.76 },
    { x: 0.40, top: 0.34, bottom: 0.82 },
    { x: 0.54, top: 0.32, bottom: 0.80 },
    { x: 0.68, top: 0.36, bottom: 0.84 },
  ];
  const barWidth = 0.06;
  for (const bar of barDefinitions) {
    const distanceX = Math.abs(xf - bar.x);
    if (distanceX <= barWidth / 2 && yf >= bar.top && yf <= bar.bottom) {
      const fade = 1 - (distanceX / (barWidth / 2));
      const heightFactor = 1 - Math.min(1, (yf - bar.top) / (bar.bottom - bar.top));
      const highlight = blend(barColor, glowColor, 0.1 * heightFactor);
      color = blend(color, highlight, 0.65 * fade);
    }
  }

  // bottom arc highlight
  if (yf > 0.70 && yf < 0.86) {
    const arcT = Math.sin(((yf - 0.70) / 0.16) * Math.PI);
    if (arcT > 0) {
      color = blend(color, glowColor, 0.12 * arcT);
    }
  }

  // accent circles
  const circleDx = xf - 0.5;
  const circleDy = yf - 0.32;
  const circleDistance = Math.sqrt(circleDx * circleDx + circleDy * circleDy);
  if (circleDistance < 0.06) {
    color = blend(color, accentInner, 0.9);
  } else if (circleDistance < 0.11) {
    const ringT = 1 - (circleDistance - 0.06) / (0.11 - 0.06);
    color = blend(color, accentOuter, 0.5 * ringT);
  }

  return [color[0], color[1], color[2], 255];
}

function renderIcon(size) {
  const buffer = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = generatePixel(size, x, y);
      const index = (y * size + x) * 4;
      buffer[index] = r;
      buffer[index + 1] = g;
      buffer[index + 2] = b;
      buffer[index + 3] = a;
    }
  }
  return buffer;
}

function generateFallbackPngs(outputDir, sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024]) {
  fs.mkdirSync(outputDir, { recursive: true });
  for (const size of sizes) {
    const pixels = renderIcon(size);
    const png = createPng(size, size, pixels);
    fs.writeFileSync(path.join(outputDir, `icon-${size}.png`), png);
  }
}

module.exports = {
  generateFallbackPngs,
};
