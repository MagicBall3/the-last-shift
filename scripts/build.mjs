import { spawnSync } from 'node:child_process';
import { copyFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const prefix = process.env.PREFIX || '/data/user/0/com.androidharness.app/files/linux';

const esbuildSrc = join(root, 'node_modules', '@esbuild', 'android-arm64', 'bin', 'esbuild');
const esbuildDst = join(prefix, 'esbuild-bin');
copyFileSync(esbuildSrc, esbuildDst);
spawnSync('chmod', ['+x', esbuildDst], { stdio: 'ignore' });

const native = join(prefix, 'rollup.android-arm64.node');
copyFileSync(
  join(root, 'node_modules', '@rollup', 'rollup-android-arm64', 'rollup.android-arm64.node'),
  native,
);

const loaderFile = join(here, '.native-loader.cjs');
writeFileSync(
  loaderFile,
  `const Module = require('node:module');
const native = ${JSON.stringify(native)};
const orig = Module._extensions['.node'];
Module._extensions['.node'] = function (m, f) {
  if (f.endsWith('.node') && f.includes('rollup')) return orig.call(this, m, native);
  return orig.call(this, m, f);
};
`,
);

const res = spawnSync(
  join(prefix, 'bin', 'node'),
  ['--require', loaderFile, join(root, 'node_modules', 'vite', 'bin', 'vite.js'), ...process.argv.slice(2)],
  {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ESBUILD_BINARY_PATH: esbuildDst },
  },
);
process.exit(res.status ?? 1);
