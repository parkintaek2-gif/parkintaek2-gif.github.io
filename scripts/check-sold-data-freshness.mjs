#!/usr/bin/env node
/**
 * check-sold-data-freshness.mjs — ASCII-named door to the real checker.
 *
 * run-collect-research.cmd (and any other .cmd task) must stay ASCII-only —
 * a Korean byte in a cmd.exe argument has already silently eaten an entire
 * scheduled task once (see scripts/run-ai-learning.cmd header). The real
 * checker's name describes what it does in Korean on purpose
 * (scripts/잰다-파는-자료가-묵었나.mjs) and that name stays — this file just
 * gives .cmd scripts an ASCII path to call instead of typing the Korean
 * name on the command line.
 *
 * ⛔ Not a plain `import()` — the target file decides whether it was run
 *   directly by comparing its own filename against process.argv[1]
 *   (so `node x.mjs` runs it, but `import('./x.mjs')` from elsewhere does
 *   not — same pattern this repo uses everywhere to let files be both
 *   importable and runnable). A dynamic import here would leave argv[1]
 *   pointing at THIS file, the guard would read "imported, not invoked",
 *   and the check would silently no-op — the exact failure this file
 *   exists to prevent, just moved one layer down.
 * ⇒ Spawn a real child process instead, with the Korean path passed as an
 *   argv array element (not text on a command line) so it never goes
 *   through cmd.exe's codepage-sensitive parsing.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 진짜 = path.join(여기, '잰다-파는-자료가-묵었나.mjs');

const r = spawnSync(process.execPath, [진짜, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status ?? 1);
