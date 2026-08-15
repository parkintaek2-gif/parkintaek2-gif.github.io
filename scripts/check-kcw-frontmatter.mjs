/**
 * **기사 앞말이 스키마 한도를 넘는지 미리 잰다.**
 *
 * 🔴 2026-08-15 — 89편 `dek` 이 274자였다(한도 240). 빌드가 죽었고, 그 죽음이
 *   **배포까지 조용히 흘러갔다** — deploy 는 「빌드가 안 됐다」 한 줄만 찍고 옛 dist 로 나갔다.
 *   그 뒤 나는 라이브에서 404 를 보며 원인을 딴 데서 찾았다.
 *   ⛔ 내가 빌드 출력에서 **`Complete!` 만 grep** 해서 실패를 못 봤다.
 *     성공만 찾는 눈은 실패를 못 본다.
 *   ⭐ 이 자는 **빌드보다 먼저, 1초 안에** 그것을 잡는다.
 *
 * ⚠ 한도는 `src/content.config.ts` 에서 읽는다. 손으로 적으면 스키마가 바뀔 때 어긋난다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-frontmatter.mjs
 *   node scripts/check-kcw-frontmatter.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방 = path.join(뿌리, 'content/kculturewire');

/** 스키마에서 `이름: z.string().max(N)` 을 읽는다. ⛔ 한도를 손으로 안 적는다 */
export function 한도읽기(스키마글) {
  const 표 = {};
  for (const m of 스키마글.matchAll(/(\w+):\s*z\.string\(\)\.max\((\d+)\)/g)) 표[m[1]] = Number(m[2]);
  return 표;
}

/** 앞말에서 한 줄 값을 뽑는다. ⚠ 따옴표 안의 값만 본다 */
export function 앞말값(글, 이름) {
  const m = 글.match(new RegExp(`^${이름}:\\s*"(.*)"\\s*$`, 'm'));
  return m ? m[1] : null;
}

/** 넘친 것만 돌려준다 */
export function 넘친것(글, 표) {
  const 탈 = [];
  for (const [이름, 한도] of Object.entries(표)) {
    const v = 앞말값(글, 이름);
    if (v !== null && v.length > 한도) 탈.push({ 이름, 길이: v.length, 한도 });
  }
  return 탈;
}

/**
 * 🔴 **`--selftest` 만 보고 돌면 안 된다.** 이 자가 import 되면 부르는 쪽의 argv 를
 *   제 것으로 알고 제 자가시험을 돌린 뒤 `process.exit` 한다 — **남의 시험이 통째로
 *   안 돈다.** 8/15 에 세 빌더가 하루 종일 그랬고, 화면엔 초록이 떴다.
 */
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  && process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  const 표 = 한도읽기('title: z.string().max(120),\n dek: z.string().max(240),');
  참('스키마에서 한도를 읽는다', 표.title === 120 && 표.dek === 240);
  참('앞말 값을 뽑는다', 앞말값('dek: "abc"', 'dek') === 'abc');
  참('없는 것은 null', 앞말값('title: "x"', 'dek') === null);
  참('넘치면 잡는다', 넘친것(`dek: "${'a'.repeat(241)}"`, { dek: 240 }).length === 1);
  참('딱 맞으면 통과', 넘친것(`dek: "${'a'.repeat(240)}"`, { dek: 240 }).length === 0);
  참('길이와 한도를 같이 준다', 넘친것(`dek: "${'a'.repeat(300)}"`, { dek: 240 })[0].길이 === 300);
  참('여러 칸을 본다', 넘친것(`title: "${'a'.repeat(200)}"\ndek: "${'b'.repeat(300)}"`,
    { title: 120, dek: 240 }).length === 2);
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 스키마 = fs.readFileSync(path.join(뿌리, 'src/content.config.ts'), 'utf8');
/* kcwArticles 부분만 잘라 읽는다 — 다른 컬렉션의 한도를 섞지 않는다 */
const 조각 = 스키마.slice(스키마.indexOf('const kcwArticles'));
const 표 = 한도읽기(조각);
if (!Object.keys(표).length) { console.error('🔴 스키마에서 한도를 못 읽었다'); process.exit(1); }

const 파일들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md'));
const 빨강 = [];
for (const f of 파일들) {
  const 탈 = 넘친것(fs.readFileSync(path.join(기사방, f), 'utf8'), 표);
  for (const t of 탈) 빨강.push({ f, ...t });
}

console.log(`기사 ${파일들.length}편 · 재는 칸 ${Object.entries(표).map(([k, v]) => `${k}≤${v}`).join(' · ')}`);
if (!빨강.length) { console.log('✅ 넘친 것 0건'); process.exit(0); }
console.log(`🔴 넘친 것 ${빨강.length}건 — **빌드가 여기서 죽는다**`);
for (const r of 빨강) console.log(`   ${r.f}  ${r.이름} ${r.길이}자 (한도 ${r.한도})`);
process.exit(1);
