/**
 * check-kcw-video-sitemap.mjs — **영상이 사이트맵에서 조용히 빠지는 것을 막는다.** (막는 검사)
 *
 * ── 🔴 왜 (2026-08-24 밤) ─────────────────────────────────────
 * 사장님 「방문자 늘리는 데 올인하라」로 세다가 잡았다 —
 * ```
 *   public/wikitip/video 의 영상        21편
 *   sitemap.xml 의 <video:video>          9편   ← 12편이 빠져 있었다
 * ```
 * 까닭은 단순하다. `sitemap.xml.ts` 안의 `videoSets` 가 **손으로 적은 목록**이라
 * 영상을 새로 만들어도 그 목록이 안 따라왔다. 아무도 안 알려 주니 몇 달이 지나도 모른다.
 *
 * ⛔ 그리고 이것은 「지면이 없다」가 아니라 **「있는데 안 보인다」**라 더 나쁘다 —
 *   만드는 값은 다 치르고 노출은 0이다.
 *
 * ⭐ 그래서 규칙을 문장이 아니라 **검사**로 둔다. 목록이 짧으면 여기서 막는다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * ① 영상 파일 수 == 사이트맵의 <video:video> 수 인가
 * ② 영상마다 썸네일이 «실제로 있는» 파일인가 (없는 주소를 사이트맵에 적으면 구글이 버린다)
 * ③ 영상마다 길이가 «잰» 값인가 (wikitip-video.json 에 있나)
 *
 * ⚠ dist 가 없으면 「못 쟀다」로 끝낸다 — 「통과」로 적지 않는다.
 *   저장소를 여섯이 나눠 써서 남이 빌드 중이면 dist 가 잠시 사라진다.
 *
 *   node scripts/check-kcw-video-sitemap.mjs
 *   node scripts/check-kcw-video-sitemap.mjs --자가시험
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 사이트맵 글에서 영상 주소를 뽑는다. ⛔ 세는 것이 아니라 «무엇이» 있는지 본다 */
export function 사이트맵영상(글) {
  const s = String(글 ?? '');
  return [...s.matchAll(/<video:content_loc>([^<]+)<\/video:content_loc>/g)]
    .map((m) => m[1].split('/').pop().replace(/\.mp4$/, ''));
}

/** 사이트맵 글에서 썸네일 주소를 뽑는다 */
export function 사이트맵썸네일(글) {
  const s = String(글 ?? '');
  return [...s.matchAll(/<video:thumbnail_loc>([^<]+)<\/video:thumbnail_loc>/g)].map((m) => m[1]);
}

/**
 * 무엇이 빠졌나. ⛔ 「몇 개」가 아니라 «어느 것»을 돌려준다 — 수만 알면 못 고친다.
 * ⚠ 반대쪽(사이트맵에는 있는데 파일이 없는 것)도 같이 본다. 죽은 주소를 구글에 주면 손해다.
 */
export function 견주기(파일벌들, 사이트맵벌들) {
  const a = new Set(파일벌들 ?? []);
  const b = new Set(사이트맵벌들 ?? []);
  return {
    사이트맵에없다: [...a].filter((x) => !b.has(x)).sort(),
    파일이없다: [...b].filter((x) => !a.has(x)).sort(),
  };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 샘플 = '<url><loc>x</loc><video:video>'
    + '<video:thumbnail_loc>https://x/video/thumb/a.jpg</video:thumbnail_loc>'
    + '<video:content_loc>https://x/video/a.mp4</video:content_loc></video:video>'
    + '<video:video><video:thumbnail_loc>https://x/video/thumb/b.jpg</video:thumbnail_loc>'
    + '<video:content_loc>https://x/video/b.mp4</video:content_loc></video:video></url>';
  검('영상 벌 이름을 뽑는다', 사이트맵영상(샘플).join(',') === 'a,b');
  /* ⭐ 한 지면에 두 편이 있는 자리가 실제로 있다(/places) — 그것을 놓치면 안 된다 */
  검('⭐ 한 지면의 두 편을 다 뽑는다', 사이트맵영상(샘플).length === 2);
  검('썸네일도 뽑는다', 사이트맵썸네일(샘플).length === 2);
  검('빈 것을 넣어도 안 터진다', 사이트맵영상(null).length === 0 && 사이트맵썸네일(null).length === 0);

  const r = 견주기(['a', 'b', 'c'], ['a']);
  검('빠진 것을 «이름»으로 알려 준다', r.사이트맵에없다.join(',') === 'b,c');
  검('반대쪽도 본다', 견주기(['a'], ['a', 'z']).파일이없다.join(',') === 'z');
  검('다 맞으면 둘 다 빈다',
    견주기(['a', 'b'], ['b', 'a']).사이트맵에없다.length === 0
    && 견주기(['a', 'b'], ['b', 'a']).파일이없다.length === 0);
  /* 🔴 이 검사가 만들어진 까닭 그대로 — 9편일 때 12편이 빠졌다고 «이름»까지 나와야 한다 */
  검('⭐ 목록이 짧으면 잡는다',
    견주기(['a', 'b', 'c', 'd'], ['a']).사이트맵에없다.length === 3);
  검('빈 것을 넣어도 안 터진다', 견주기(null, null).사이트맵에없다.length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ check-kcw-video-sitemap 자가시험 통과 (9)');
  process.exit(0);
}

const 영상방 = path.join(뿌리, 'public/wikitip/video');
const 맵길 = path.join(뿌리, 'dist/wikitip/sitemap.xml');
const 잰것길 = path.join(뿌리, 'src/data/wikitip-video.json');

console.log('영상이 사이트맵에서 빠지지 않았나 — 지어진 결과물(dist)을 본다\n');

if (!existsSync(맵길)) {
  console.log('⬜ **못 쟀다** — dist/wikitip/sitemap.xml 이 없다. 먼저 npm run build 를 돌린다.');
  console.log('   ⚠ 저장소를 여섯이 나눠 쓰므로 남이 빌드 중이면 dist 가 잠시 사라진다.');
  console.log('   ⛔ 「통과」로 적지 않는다. 못 잰 것은 못 잼이다.');
  process.exit(0);
}
if (!existsSync(영상방)) { console.log('⬜ **못 쟀다** — 영상 방이 없다'); process.exit(0); }

const 파일벌 = readdirSync(영상방).filter((f) => f.toLowerCase().endsWith('.mp4'))
  .map((f) => f.slice(0, -4)).sort();
const 맵글 = readFileSync(맵길, 'utf8');
const 맵벌 = 사이트맵영상(맵글);
const { 사이트맵에없다, 파일이없다 } = 견주기(파일벌, 맵벌);

console.log(`영상 파일 ${파일벌.length}편 · 사이트맵 ${맵벌.length}편`);

const 흠 = [];
if (사이트맵에없다.length) {
  흠.push(`사이트맵에 없는 영상 ${사이트맵에없다.length}편 — ${사이트맵에없다.join(', ')}`);
  console.log(`\n🔴 **사이트맵에 없다** ${사이트맵에없다.length}편`);
  console.log(`   ${사이트맵에없다.join(', ')}`);
  console.log('   ⇒ src/pages/wikitip/sitemap.xml.ts 의 `videoSets` 에 넣는다.');
  console.log('   ⛔ 만드는 값은 다 치르고 노출은 0이다. 「있는데 안 보인다」가 가장 아까운 흠이다.');
}
if (파일이없다.length) {
  흠.push(`파일이 없는데 사이트맵에 있는 것 ${파일이없다.length}편 — ${파일이없다.join(', ')}`);
  console.log(`\n🔴 **파일이 없는데 사이트맵에 있다** ${파일이없다.length}편`);
  console.log(`   ${파일이없다.join(', ')} — 죽은 주소를 구글에 주면 그 사이트맵 전체가 의심받는다`);
}

/* 썸네일이 실제로 있는 파일인가 */
const 없는그림 = [];
for (const u of 사이트맵썸네일(맵글)) {
  const 상대 = u.replace(/^https?:\/\/[^/]+/, '');
  const 후보 = [path.join(뿌리, 'public/wikitip', 상대), path.join(뿌리, 'dist/wikitip', 상대)];
  if (!후보.some((p) => existsSync(p))) 없는그림.push(상대);
}
if (없는그림.length) {
  흠.push(`파일이 없는 썸네일 ${없는그림.length}장`);
  console.log(`\n🔴 **없는 썸네일을 가리킨다** ${없는그림.length}장`);
  for (const g of 없는그림.slice(0, 5)) console.log(`   ${g}`);
  console.log('   ⛔ 구글은 썸네일을 못 받으면 그 영상 항목을 버린다.');
}

/* 길이가 «잰» 값인가 */
if (existsSync(잰것길)) {
  const 잰것 = JSON.parse(readFileSync(잰것길, 'utf8'));
  const 잰벌 = new Set((잰것.videos ?? []).map((v) => v.set));
  const 안잰것 = 파일벌.filter((x) => !잰벌.has(x));
  if (안잰것.length) {
    console.log(`\n⚠ 길이를 «안 잰» 영상 ${안잰것.length}편 — ${안잰것.join(', ')}`);
    console.log('   node scripts/build-kcw-video-schema.mjs 로 재고 썸네일을 뽑는다.');
    console.log('   ⛔ 막지는 않는다 — 사이트맵에는 14초로 나가고 있고, 그것이 틀렸다는 증거는 없다.');
  }
} else {
  console.log('\n⚠ wikitip-video.json 이 없다 — 길이를 잰 적이 없다는 뜻이다(막지는 않는다).');
}

if (흠.length) {
  console.error(`\n⛔ **막는다.** ${흠.length}건\n` + 흠.map((s) => `   · ${s}`).join('\n'));
  process.exit(1);
}
console.log(`\n✅ 영상 ${파일벌.length}편이 모두 사이트맵에 있고 썸네일도 다 있다`);
