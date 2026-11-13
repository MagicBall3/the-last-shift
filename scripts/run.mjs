/**
 * Сборка и запуск проверочных скриптов проекта в условиях AndroidHarness.
 *
 * tsx/esbuild в workspace на shared storage не работают (noexec для бинарников),
 * поэтому скрипты компилируются tsc в CommonJS (scripts/build) и запускаются node.
 *
 *   node scripts/run.mjs check-stairs      # собрать и запустить одну проверку
 *   node scripts/run.mjs --build           # только собрать
 *   node scripts/run.mjs --all             # собрать и прогнать все проверки
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const buildDir = join(root, 'scripts', 'build', 'scripts');

const SCRIPTS = [
  'check-layout',
  'check-walk',
  'check-levels',
  'check-collision',
  'check-stairs',
  'sim-stairs',
  'smoke-world',
  'probe-stair-access',
  'probe-all-stairs',
];

/**
 * Node в этом окружении запускается через линкер Android, поэтому process.execPath
 * указывает на linker64, а не на node. Для дочерних процессов берём сам node
 * из PATH (переменную NODE_BIN можно переопределить).
 */
const NODE = process.env.NODE_BIN || 'node';

/**
 * Скрипты используют process/console без @types/node, поэтому tsc сообщает
 * TS2591 и возвращает код 1 — при этом JS всё равно записывается (noEmitOnError
 * выключен). Ошибки печатаются, а успех определяется по наличию файлов вывода.
 */
function build() {
  const res = spawnSync(
    NODE,
    [join(root, 'node_modules', 'typescript', 'lib', 'tsc.js'), '-p', join(here, 'tsconfig.build.json')],
    { cwd: root, stdio: 'inherit' },
  );
  const missing = SCRIPTS.filter((name) => !existsSync(join(buildDir, `${name}.js`)));
  if (missing.length) {
    throw new Error(`tsc не собрал: ${missing.join(', ')} (код ${res.status})`);
  }
}

/** package.json собирается в CommonJS: корневой package.json проекта — type: module. */
function writeBuildPackage() {
  const dir = join(root, 'scripts', 'build');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'package.json');
  const body = `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`;
  if (!existsSync(file) || readFileSync(file, 'utf8') !== body) writeFileSync(file, body);
}

function run(name) {
  const entry = join(buildDir, `${name}.js`);
  if (!existsSync(entry)) throw new Error(`нет сборки ${name}.js — сначала соберите`);
  const res = spawnSync(NODE, [entry], { stdio: 'inherit', cwd: root });
  return res.status ?? 1;
}

const args = process.argv.slice(2);
const buildOnly = args.includes('--build');
const all = args.includes('--all');

if (!buildOnly || !existsSync(buildDir)) build();
writeBuildPackage();

if (buildOnly) process.exit(0);
if (all) {
  let failed = 0;
  for (const name of SCRIPTS) {
    console.log(`\n=== ${name} ===`);
    if (run(name) !== 0) failed += 1;
  }
  console.log(failed === 0 ? '\nВсе проверки прошли.' : `\nПровалилось проверок: ${failed}`);
  process.exit(failed === 0 ? 0 : 1);
}

const name = args.find((a) => !a.startsWith('-'));
if (!name) {
  console.error(`usage: node scripts/run.mjs <${SCRIPTS.join('|')}> | --all | --build`);
  process.exit(2);
}
if (!SCRIPTS.includes(name)) {
  console.error(`неизвестный скрипт: ${name}; доступны: ${SCRIPTS.join(', ')}`);
  process.exit(2);
}
process.exit(run(name));
