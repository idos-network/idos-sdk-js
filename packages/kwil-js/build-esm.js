const esbuild = require('esbuild');
const { esbuildPluginFilePathExtensions } = require('esbuild-plugin-file-path-extensions');
const fs = require('fs');

async function buildESM() {
  try {
    // Clean and create dist-esm directory
    if (fs.existsSync('./dist-esm')) {
      fs.rmSync('./dist-esm', { recursive: true, force: true });
    }
    fs.mkdirSync('./dist-esm', { recursive: true });

    // Get all TypeScript files
    const glob = require('glob');
    const entryPoints = glob.sync('./src/**/*.ts');

    // Build ESM with file path extensions
    await esbuild.build({
      entryPoints,
      bundle: false, // Don't bundle - keep separate files
      outdir: './dist-esm',
      format: 'esm',
      target: 'es2021',
      platform: 'neutral',
      sourcemap: false,
      outExtension: { '.js': '.mjs' },
      plugins: [esbuildPluginFilePathExtensions({
        esmExtension: '.mjs',
        filter: /\.ts$/
      })],
    });

    // Create package.json for ESM
    fs.writeFileSync('./dist-esm/package.json', '{"type":"module"}\n');

    // Post-process to fix import extensions
    const fixImportExtensions = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          fixImportExtensions(filePath);
        } else if (file.endsWith('.mjs')) {
          let content = fs.readFileSync(filePath, 'utf8');

          // Fix relative imports that don't have .mjs extension
          content = content.replace(
            /from\s+["'](\.[^"']+)["']/g,
            (match, importPath) => {
              if (!importPath.endsWith('.mjs') && !importPath.endsWith('.js')) {
                return match.replace(importPath, importPath + '.mjs');
              }
              return match;
            }
          );

          // Fix import statements too
          content = content.replace(
            /import\s+[^"']*from\s+["'](\.[^"']+)["']/g,
            (match, importPath) => {
              if (!importPath.endsWith('.mjs') && !importPath.endsWith('.js')) {
                return match.replace(importPath, importPath + '.mjs');
              }
              return match;
            }
          );

          fs.writeFileSync(filePath, content);
        }
      }
    };

    fixImportExtensions('./dist-esm');

    console.log('✅ ESM build completed with file extensions');
  } catch (error) {
    console.error('❌ ESM build failed:', error);
    process.exit(1);
  }
}

buildESM();