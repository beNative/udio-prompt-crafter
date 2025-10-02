const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { executeAppBuilderAsJson } = require('app-builder-lib/out/util/appBuilder');
const { generateFallbackPngs } = require('./utils/iconRasterizer');

const electronBinary = require('electron');

const distDir = 'dist';
const assetsDir = 'assets';
const iconBaseName = 'app-icon';

const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Fallback Creative Audio Icon</title>
  <desc id="desc">Abstract gradient badge used when a custom icon is not supplied.</desc>
  <defs>
    <linearGradient id="fallback-bg" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1F1C2C" />
      <stop offset="50%" stop-color="#3A1C71" />
      <stop offset="100%" stop-color="#D76D77" />
    </linearGradient>
    <linearGradient id="fallback-wave" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FCE38A" />
      <stop offset="50%" stop-color="#F38181" />
      <stop offset="100%" stop-color="#EAFFD0" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#fallback-bg)" />
  <g transform="translate(96 156)">
    <path d="M0 180c28-48 56-72 84-72s56 24 84 24 56-24 84-72l0 144c-28 48-56 72-84 72s-56-24-84-24-56 24-84 72z" fill="#120C1C" opacity="0.35" />
    <path d="M16 168c28-44 56-66 84-66s56 22 84 22 56-22 84-66l0 124c-28 44-56 66-84 66s-56-22-84-22-56 22-84 66z" fill="url(#fallback-wave)" />
  </g>
  <g transform="translate(152 180)" fill="#FFFFFF" opacity="0.9">
    <rect x="0" y="0" width="28" height="152" rx="14" />
    <rect x="56" y="32" width="28" height="152" rx="14" />
    <rect x="112" y="16" width="28" height="152" rx="14" />
    <rect x="168" y="48" width="28" height="152" rx="14" />
  </g>
  <circle cx="256" cy="164" r="30" fill="#FFFFFF" opacity="0.85" />
  <circle cx="256" cy="164" r="18" fill="#FFD166" />
</svg>`;

function validateSvg(content) {
  if (typeof content !== 'string') {
    return false;
  }
  const trimmed = content.trim();
  return trimmed.startsWith('<svg') && trimmed.endsWith('</svg>');
}

async function generateRasterIcons(svgPath) {
  const tempSvgPath = path.resolve(distDir, `${iconBaseName}.svg`);
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  fs.writeFileSync(tempSvgPath, svgContent, 'utf8');

  const rasterDir = path.resolve(distDir, 'icons', 'png');
  fs.mkdirSync(rasterDir, { recursive: true });

  try {
    await new Promise((resolve, reject) => {
      const child = spawn(electronBinary, [path.join(__dirname, 'scripts', 'icon-generator.js'), tempSvgPath, rasterDir], {
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
        stdio: 'inherit',
      });
      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Icon rasterisation failed with exit code ${code}`));
        }
      });
    });
    return rasterDir;
  } catch (error) {
    console.warn('⚠️  SVG rasterisation via Electron failed, generating fallback PNGs procedurally.', error.message);
    generateFallbackPngs(rasterDir);
    return rasterDir;
  }
}

async function convertWithAppBuilder(format, inputPath, outputDir) {
  const normalizedInput = path.resolve(inputPath);
  const normalizedOutput = path.resolve(outputDir);
  const args = ['icon', '--format', format, '--out', normalizedOutput];
  const stats = fs.statSync(normalizedInput);
  if (stats.isDirectory()) {
    const files = fs.readdirSync(normalizedInput)
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(file => path.join(normalizedInput, file))
      .sort((a, b) => {
        const sizeA = parseInt(path.basename(a).split('-')[1], 10) || 0;
        const sizeB = parseInt(path.basename(b).split('-')[1], 10) || 0;
        return sizeA - sizeB;
      });
    const minSize = format === 'ico' ? 256 : format === 'icns' ? 512 : 16;
    const filtered = files.filter(file => {
      const size = parseInt(path.basename(file).split('-')[1], 10) || 0;
      return size >= minSize;
    });
    if (filtered.length === 0) {
      throw new Error(`No PNG files found in ${normalizedInput} to convert to ${format}.`);
    }
    for (const file of filtered) {
      args.push('--input', file);
    }
  } else {
    args.push('--input', normalizedInput);
  }

  const result = await executeAppBuilderAsJson(args);

  if (result.error) {
    throw new Error(result.error);
  }

  return result.icons || [];
}

async function prepareIcons() {
  const iconOutputDir = path.resolve(distDir, 'icons');
  fs.mkdirSync(iconOutputDir, { recursive: true });

  let svgSourcePath = null;
  if (fs.existsSync(assetsDir)) {
    const svgFiles = fs.readdirSync(assetsDir).filter(file => file.toLowerCase().endsWith('.svg'));
    const preferred = svgFiles.find(file => file.toLowerCase() === `${iconBaseName}.svg`);
    const chosen = preferred || svgFiles[0];
    if (chosen) {
      const candidatePath = path.join(assetsDir, chosen);
      const content = fs.readFileSync(candidatePath, 'utf8');
      if (validateSvg(content)) {
        svgSourcePath = candidatePath;
      } else {
        console.warn(`⚠️  Invalid SVG markup detected in ${candidatePath}. Using fallback icon.`);
      }
    }
  }

  if (!svgSourcePath) {
    svgSourcePath = path.resolve(distDir, `${iconBaseName}-fallback.svg`);
    fs.writeFileSync(svgSourcePath, fallbackSvg, 'utf8');
  }

  const rasterDir = await generateRasterIcons(svgSourcePath);

  const icoDir = path.join(iconOutputDir, 'ico');
  const icnsDir = path.join(iconOutputDir, 'icns');
  fs.mkdirSync(icoDir, { recursive: true });
  fs.mkdirSync(icnsDir, { recursive: true });

  await convertWithAppBuilder('ico', rasterDir, icoDir);
  await convertWithAppBuilder('icns', rasterDir, icnsDir);

  const generatedIco = path.join(icoDir, 'icon.ico');
  const desiredIco = path.join(icoDir, `${iconBaseName}.ico`);
  if (fs.existsSync(generatedIco)) {
    fs.renameSync(generatedIco, desiredIco);
  }

  const generatedIcns = path.join(icnsDir, 'icon.icns');
  const desiredIcns = path.join(icnsDir, `${iconBaseName}.icns`);
  if (fs.existsSync(generatedIcns)) {
    fs.renameSync(generatedIcns, desiredIcns);
  }

  const png512 = path.join(iconOutputDir, 'icon.png');
  const sourcePng = path.join(rasterDir, 'icon-512.png');
  if (fs.existsSync(sourcePng)) {
    fs.copyFileSync(sourcePng, png512);
  }

  return {
    svg: svgSourcePath,
    pngDir: rasterDir,
    ico: fs.existsSync(desiredIco) ? desiredIco : generatedIco,
    icns: fs.existsSync(desiredIcns) ? desiredIcns : generatedIcns,
    png: png512,
  };
}

async function build() {
    // Clean dist directory
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(path.join(distDir, 'electron'), { recursive: true });

    // Copy public assets
    fs.copyFileSync(path.join('public', 'taxonomy.json'), path.join(distDir, 'taxonomy.json'));
    
    // Copy documentation
    fs.mkdirSync(path.join(distDir, 'docs'), { recursive: true });
    fs.readdirSync('docs').forEach(file => {
        if (file.endsWith('.md')) {
            fs.copyFileSync(path.join('docs', file), path.join(distDir, 'docs', file));
        }
    });

    // Copy index.html
    fs.copyFileSync('index.html', path.join(distDir, 'index.html'));

    const iconPaths = await prepareIcons();

    // Build React App
    await esbuild.build({
        entryPoints: ['index.tsx'],
        bundle: true,
        outfile: path.join(distDir, 'bundle.js'),
        platform: 'browser',
        loader: { '.tsx': 'tsx', '.ts': 'ts' },
        jsx: 'automatic',
        target: ['chrome100', 'firefox100', 'safari15'],
        define: { 'process.env.NODE_ENV': '"production"' },
        minify: true,
        sourcemap: true,
    });

    // Build Electron Main Process
    await esbuild.build({
        entryPoints: ['electron/main.ts'],
        bundle: true,
        outfile: path.join(distDir, 'electron', 'main.js'),
        platform: 'node',
        target: 'node18',
        external: ['electron'],
    });

    // Build Electron Preload Script
    await esbuild.build({
        entryPoints: ['electron/preload.ts'],
        bundle: true,
        outfile: path.join(distDir, 'electron', 'preload.js'),
        platform: 'node',
        target: 'node18',
        external: ['electron'],
    });

    console.log('⚡ Build complete! ⚡');
    console.log('🖼️  Icon assets prepared at:', iconPaths);
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
