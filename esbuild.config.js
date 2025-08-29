const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const distDir = 'dist';

async function build() {
    // Clean dist directory
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true, force: true });
    }
    fs.mkdirSync(distDir, { recursive: true });
    fs.mkdirSync(path.join(distDir, 'electron'), { recursive: true });

    // Copy public assets
    fs.copyFileSync(path.join('public', 'taxonomy.json'), path.join(distDir, 'taxonomy.json'));

    // Modify and copy index.html
    let indexHtml = fs.readFileSync('index.html', 'utf-8');
    indexHtml = indexHtml.replace('/index.tsx', './bundle.js');
    indexHtml = indexHtml.replace('<link rel="icon" type="image/svg+xml" href="/vite.svg" />', '');
    fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

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
}

build().catch((err) => {
    console.error(err);
    process.exit(1);
});
