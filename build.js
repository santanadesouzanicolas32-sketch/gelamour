const esbuild = require('esbuild');
const watch = process.argv.includes('--watch');
const production = process.env.NODE_ENV === 'production';

/** @type {import('esbuild').BuildOptions} */
const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'js/app.js',
  target: ['es2017', 'chrome80', 'firefox80', 'safari13'],
  format: 'iife',
  minify: production,
  sourcemap: !production ? 'inline' : false,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  logLevel: 'info',
  metafile: true,
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(config);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    const result = await esbuild.build(config);
    if (result.metafile) {
      const text = await esbuild.analyzeMetafile(result.metafile, { verbose: false });
      console.log(text);
    }
  }
}

main().catch(() => process.exit(1));
