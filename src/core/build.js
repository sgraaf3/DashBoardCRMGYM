const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');

// --- Configuration ---
const buildConfig = {
    distDir: 'dist',
    jsEntry: 'src/app/app.js',
    jsOutfile: 'app.bundle.js',
    cssEntry: 'src/assets/css/main.css',
    cssOutfile: 'main.bundle.css',
    htmlTemplate: 'index.html',
    assetsToCopy: [
        { from: 'src/assets/en.json', to: 'en.json' },
        // Add other static assets here, e.g.
        // { from: 'src/assets/images', to: 'images' }
    ],
    esbuildOptions: {
        bundle: true,
        minify: true,
        sourcemap: true,
    }
};

async function build() {
    try {
        const { distDir, jsEntry, jsOutfile, cssEntry, cssOutfile, htmlTemplate, assetsToCopy, esbuildOptions } = buildConfig;

        // 1. Clean the dist directory
        console.log(`Cleaning ${distDir} directory...`);
        await fs.emptyDir(distDir);

        // 2. Bundle JavaScript and CSS in parallel
        console.log('Bundling assets...');
        const jsBuildPromise = esbuild.build({
            ...esbuildOptions,
            entryPoints: [jsEntry],
            outfile: path.join(distDir, jsOutfile),
            format: 'esm',
        });

        const cssBuildPromise = esbuild.build({
            ...esbuildOptions,
            entryPoints: [cssEntry],
            outfile: path.join(distDir, cssOutfile),
        });

        await Promise.all([jsBuildPromise, cssBuildPromise]);

        // 3. Copy and modify index.html
        console.log(`Processing ${htmlTemplate}...`);
        let indexHtml = await fs.readFile(htmlTemplate, 'utf-8');
        
        // More robust replacement of asset paths
        indexHtml = indexHtml.replace(`href="${cssEntry}"`, `href="${cssOutfile}"`);
        indexHtml = indexHtml.replace(`src="${jsEntry}"`, `src="${jsOutfile}"`);
        
        await fs.writeFile(path.join(distDir, htmlTemplate), indexHtml);

        // 4. Copy other necessary assets
        if (assetsToCopy.length > 0) {
            console.log('Copying assets...');
            const copyPromises = assetsToCopy.map(asset =>
                fs.copy(asset.from, path.join(distDir, asset.to))
            );
            await Promise.all(copyPromises);
        }

        console.log('\nBuild successful! Production files are in the "dist" directory.');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();