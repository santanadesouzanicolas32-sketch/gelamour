const esbuild = require('esbuild');
const watch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outfile: 'js/app.js',
  target: ['es2017', 'chrome80', 'firefox80', 'safari13'],
  format: 'iife',
  minify: false,
  sourcemap: false,
  logLevel: 'info',
};

if (watch) {
  esbuild.context(config).then(ctx => ctx.watch());
} else {
  esbuild.build(config).catch(() => process.exit(1));
}
