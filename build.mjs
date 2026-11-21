import { build } from 'esbuild';
import fs from 'node:fs/promises';

await fs.rm('dist', { recursive: true, force: true });
await fs.mkdir('dist', { recursive: true });

const moduleOptions = { bundle: true, format: 'esm', minify: true, target: 'es2022', legalComments: 'linked' };
await Promise.all([
  build({ ...moduleOptions, entryPoints: ['src/logic.js'], outfile: 'dist/logic.js' }),
  build({
    ...moduleOptions,
    entryPoints: ['src/atlas.js', 'src/newton-worker.js'],
    outdir: 'dist',
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]',
    external: ['./logic.js'],
  }),
  fs.copyFile('src/index.html', 'dist/index.html'),
  fs.copyFile('src/atlas.css', 'dist/atlas.css'),
  fs.cp('assets', 'dist/assets', { recursive: true }),
  fs.copyFile('CREDITS.md', 'dist/CREDITS.md'),
  fs.copyFile('node_modules/three/LICENSE', 'dist/THREE-LICENSE.txt'),
  fs.writeFile('dist/.nojekyll', ''),
]);

await fs.rm('docs', { recursive: true, force: true });
await fs.cp('dist', 'docs', { recursive: true });
console.log('Built the Logic atlas and embeddable engine.');
