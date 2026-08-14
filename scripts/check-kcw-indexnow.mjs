/**
 * **아직 검색엔진에 안 알린 지면을 센다.** (K Culture Wire 만)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 🔴 IndexNow 는 만들어 놓고 **손으로 부를 때만** 돈다. 그래서 안 부르면 0건이 된다.
 *   기록도 안 남아 **무엇을 알렸는지 아무도 모른다.** 오늘 여섯을 알리고 나서야 알았다.
 *   ⛔ 이것도 「만든 값이 0」이다 — 도구는 멀쩡한데 아무 일도 안 일어난다.
 *
 * ⭐ 그래서 **알린 것을 적어 두고**, 사이트맵과 견줘 안 알린 것을 센다.
 *   사장님 「알아서 해결해」(8/14) — SNS 계정은 내가 못 만든다. 그러나 계정 없이 되는
 *   외부유입은 내 손 안이다. 검색엔진에 알리는 것이 그 첫째다.
 *
 * ⛔ 이 자는 **알리지 않는다.** 세기만 한다. 알리는 것은 ping-indexnow.mjs 몫이다.
 *   재는 자와 하는 자를 갈라 둔다 — 한 자가 둘 다 하면 자기를 통과시킨다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-indexnow.mjs            안 알린 것을 센다
 *   node scripts/check-kcw-indexnow.mjs --적는다 /a /b   방금 알린 것을 적는다
 *   node scripts/check-kcw-indexnow.mjs --selftest
 *
 * ⚠ **PowerShell 에서 부른다.** Git Bash 는 `/read-vs-visited` 를 윈도 경로로 바꿔
 *   `c:/Program Files/Git/read-vs-visited` 로 넘긴다(MSYS 경로 변환). 8/15 에 그걸로 한 번 섰다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기록길 = path.join(뿌리, 'archive/indexnow-kcw.json');
export const ORIGIN = 'https://www.kculturewire.com';

/**
 * 🔴 2026-08-15 — 기록에 날짜가 **하루 앞서** 적혔다. `toISOString()` 은 UTC 라
 *   한국 새벽 3시가 UTC 로는 전날 저녁이다. 우리는 한국에서 일하고 한국 시각으로 적는다.
 * ⚠ 이 흠은 조용하다 — 하루 어긋난 기록을 나중에 아무도 못 알아본다.
 */
export function 오늘KST() {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 기록을 읽는다. 없으면 빈 것 — ⛔ 없다고 던지지 않는다. 첫날이 있다 */
export function 기록읽기(길 = 기록길) {
  if (!fs.existsSync(길)) return { pinged: {} };
  try { return JSON.parse(fs.readFileSync(길, 'utf8')); } catch { return { pinged: {} }; }
}

/** 방금 알린 것을 적는다. 같은 지면을 다시 알리면 **날짜만 새로 쓴다** */
export function 적기(길들, 날, 기록 = { pinged: {} }) {
  const 새 = { pinged: { ...기록.pinged } };
  for (const p of 길들) 새.pinged[p] = 날;
  return 새;
}

/**
 * 사이트맵에 있는데 **한 번도 안 알린** 지면.
 * ⚠ 「오래 전에 알렸다」와 「한 번도 안 알렸다」는 다르다. 여기서는 뒤엣것만 센다 —
 *   앞엣것까지 세면 매일 786장이 빨강이 되어 아무도 안 본다.
 */
export function 안알린것(사이트맵길들, 기록) {
  return 사이트맵길들.filter((p) => !기록.pinged[p]);
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('기록이 없으면 빈 것을 준다', 기록읽기('없는파일').pinged && Object.keys(기록읽기('없는파일').pinged).length === 0);
  참('적으면 들어간다', 적기(['/a'], '2026-08-14').pinged['/a'] === '2026-08-14');
  참('다시 적으면 날짜가 바뀐다',
    적기(['/a'], '2026-08-15', { pinged: { '/a': '2026-08-14' } }).pinged['/a'] === '2026-08-15');
  참('앞서 적은 것을 안 지운다',
    적기(['/b'], '2026-08-15', { pinged: { '/a': '2026-08-14' } }).pinged['/a'] === '2026-08-14');
  참('안 알린 것만 센다', JSON.stringify(안알린것(['/a', '/b'], { pinged: { '/a': 'x' } })) === '["/b"]');
  참('다 알렸으면 빈 목록', 안알린것(['/a'], { pinged: { '/a': 'x' } }).length === 0);
  /**
   * 🔴 이 자가 **알리는 일까지 하면** 자기를 통과시킨다. 그 길이 없어야 한다.
   * ⚠ 두 번 틀렸다. 처음엔 파일 안에 주소 **글자**가 있나로 봤는데 주석에 적기만 해도 걸렸고,
   *   다음엔 호출 꼴을 찾았는데 **그 정규식 자체**가 파일 안에 있어 자기에게 걸렸다.
   *   ⛔ 자기 몸을 글자로 뒤지면 늘 이렇게 된다.
   *   ⭐ 재야 할 것은 「밖으로 나가는 문을 **들여왔나**」다. 그 문은 `import` 줄에만 있다.
   */
  const 들여온것 = [...fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
    .matchAll(/^import\s[^\n]*?from\s+'([^']+)'/gm)].map((m) => m[1]);
  참('⛔ 밖으로 나가는 문을 안 들여온다', 들여온것.every((m) => ['node:fs', 'node:path', 'node:url'].includes(m)));
  /* 🔴 8/15 — UTC 로 적어 기록이 하루 앞섰다. 우리는 한국에서 일한다 */
  참('날짜를 한국 시각으로 적는다', /^\d{4}-\d{2}-\d{2}$/.test(오늘KST()));
  참('UTC 와 다를 수 있다 — 새벽에 하루 앞서지 않는다',
    오늘KST() >= new Date().toISOString().slice(0, 10));
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

/**
 * 🔴 2026-08-15 — **임포트만 해도 본문이 돌았다.** 다른 자에서 이 자의 `오늘KST` 를
 *   가져다 쓰려 했더니 지면 790장을 세는 출력이 딸려 나왔다.
 *   ⛔ 어제 영상 자에서 똑같은 것을 고쳐 놓고 여기엔 안 달았다.
 *   ⚠ 부수효과가 있는 자는 **불렸을 때만** 돈다.
 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (!내가실행됐다) { /* 남이 가져다 쓰는 중이다. 아무것도 하지 않는다 */ } else {

const 적을자리 = process.argv.indexOf('--적는다');
if (적을자리 >= 0) {
  const 길들 = process.argv.slice(적을자리 + 1).filter((a) => a.startsWith('/'));
  if (!길들.length) { console.error('⛔ 적을 지면 주소를 주십시오'); process.exit(1); }
  const 날 = 오늘KST();
  fs.mkdirSync(path.dirname(기록길), { recursive: true });
  fs.writeFileSync(기록길, `${JSON.stringify(적기(길들, 날, 기록읽기()), null, 2)}\n`);
  console.log(`✅ ${길들.length}장을 알린 것으로 적었다 (${날})`);
  process.exit(0);
}

/* 지어진 사이트맵에서 **내 지면만** 고른다 */
const 사이트맵 = path.join(뿌리, 'dist/wikitip/sitemap.xml');
if (!fs.existsSync(사이트맵)) { console.log('⚠ dist/wikitip/sitemap.xml 이 없다. 먼저 짓는다'); process.exit(0); }
const 길들 = [...fs.readFileSync(사이트맵, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1]).filter((u) => u.startsWith(ORIGIN))
  .map((u) => u.slice(ORIGIN.length) || '/');

const 기록 = 기록읽기();
const 안알린 = 안알린것(길들, 기록);
console.log(`K Culture Wire — 지면 ${길들.length}장 · 알린 것 ${Object.keys(기록.pinged).length}장`);
if (!안알린.length) { console.log('✅ 한 번도 안 알린 지면 0장'); process.exit(0); }
console.log(`⚠ 한 번도 안 알린 지면 **${안알린.length}장**`);
for (const p of 안알린.slice(0, 12)) console.log(`   · ${p}`);
if (안알린.length > 12) console.log(`   … 그리고 ${안알린.length - 12}장 더`);
console.log('\n알리려면 — node scripts/ping-indexnow.mjs --host www.kculturewire.com <주소들>');
console.log('알린 뒤  — node scripts/check-kcw-indexnow.mjs --적는다 <주소들>');
/* ⛔ 실패로 끝내지 않는다. 790장을 하루에 다 알릴 수는 없고, 알림에는 하루 한도가 있다 */

} /* 내가실행됐다 */
