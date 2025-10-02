const fs = require('fs');
const path = require('path');
const { nativeImage } = require('electron');

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

const [, , svgPath, outputDir, sizesArg] = process.argv;

if (!svgPath || !outputDir) {
  exitWithError('Usage: icon-generator <svgPath> <outputDir> [sizes]');
}

if (!fs.existsSync(svgPath)) {
  exitWithError(`Icon generator could not find SVG file at ${svgPath}`);
}

const svgContent = fs.readFileSync(svgPath);
const image = nativeImage.createFromBuffer(svgContent);

if (image.isEmpty()) {
  exitWithError('Failed to create image from SVG content.');
}

const sizes = sizesArg ? sizesArg.split(',').map(v => parseInt(v, 10)).filter(Boolean) : [16, 24, 32, 48, 64, 128, 256, 512, 1024];

fs.mkdirSync(outputDir, { recursive: true });

for (const size of sizes) {
  const resized = image.resize({ width: size, height: size, quality: 'best' });
  const buffer = resized.toPNG();
  fs.writeFileSync(path.join(outputDir, `icon-${size}.png`), buffer);
}
