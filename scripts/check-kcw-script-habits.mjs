/**
 * **내 자들이 같은 버릇으로 틀리는지 훑는다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 8/14~15 이틀 사이에 같은 모양의 흠을 **여섯 번** 냈다. 매번 손으로 찾았다.
 * ⛔ 손으로 훑으면 다음에 또 놓친다. 그리고 흠은 늘 **조용하다** —
 *   오류도 안 나고 파일도 멀쩡한데 나가는 것이 틀린다.
 *
 * ── 잡는 버릇 넷 ──────────────────────────────────────────────
 * ① UTC 날짜        `new Date().toISOString()` — 새벽에 지으면 하루 앞선다.
 *                   그 값이 사이트맵 lastmod 로 나간다. `_kst.mjs` 를 쓴다.
 * ② 임포트 부수효과  가드 없이 파일을 쓰거나 찍는 자 — 남이 함수 하나 가져다 쓰면 딸려 돈다.
 * ③ 굳은 수         자가시험에 `=== 5` 처럼 개수를 박아 둔 것 — 늘어나면 **옳은 변화를 막는다.**
 * ④ 못 잼을 0 으로   `?? 0` 로 빈 값을 메우는 자리 — 8/13 에 손흥민을 바닥에 깔았다.
 *
 * ⛔ 이 자는 **고치지 않는다.** 세어서 보여 줄 뿐이다. 재는 자와 하는 자를 가른다.
 * ⛔ 남의 자(100y · seoulmarkets)는 안 본다. 내 것만 본다.
 * ⚠ 빨강으로 세우지 않는다 — 옛 자에는 이미 굳은 것이 있다. **새로 생기는 것**을 보라고 센다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-script-habits.mjs
 *   node scripts/check-kcw-script-habits.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 자방 = path.join(뿌리, 'scripts');

/**
 * ⛔ 내 자만. 이름으로 가른다 — 남의 것을 세면 남에게 일을 시키는 셈이다.
 *
 * ⚠ **KST 셈을 다루는 자 둘은 뺀다.** `_kst.mjs` 와 이 자는 견주려고 `new Date().toISOString()`
 *   이라는 **글자를 갖고 있을 뿐**이지 그것으로 날짜를 적지 않는다.
 *   ⛔ 어제 배운 그대로다 — **자기 몸을 글자로 뒤지면 자기에게 걸린다.**
 */
export const 뺄자 = ['_kst.mjs', 'check-kcw-script-habits.mjs'];

export function 내자인가(이름) {
  if (뺄자.includes(이름)) return false;
  return /^(build-wikitip-|collect-sea-|build-kcw-|check-kcw-|make-cardnews-kcw|make-voice-kcw|mix-voice-kcw|make-video-kcw-|collect-kosis-(visitors|air))/.test(이름);
}

/** ① UTC 로 날짜를 적나 */
export function UTC날짜쓰나(글) {
  return /new Date\(\)\.toISOString\(\)/.test(글);
}

/** ② 부수효과가 있는데 가드가 없나 */
export function 가드없나(글) {
  const 부수 = /\bfs\.(writeFileSync|appendFileSync|mkdirSync)\s*\(/.test(글);
  if (!부수) return false;
  return !/내가실행됐다|import\.meta\.url === path\.resolve/.test(글);
}

/**
 * ③ 자가시험에 **자라는 것의 개수**가 굳어 있나.
 *
 * 🔴 처음엔 `.length === N` 을 다 잡았더니 37개가 나왔는데 **거의 다 거짓 양성**이었다.
 *   `구간들(['w1','w2']).length === 1` 은 논리 검사다 — 자라는 것이 아니다.
 *   `탈.length === 0` 도 「흠이 없나」지 개수 굳히기가 아니다.
 *   ⛔ 거짓이 많은 검사는 아무도 안 본다. 그러면 없는 것만 못하다.
 *
 * ⭐ 좁힌다 — **함수 호출 결과가 아닌 이름**의 길이를 **0 아닌 상수**와 견주는 것만.
 *   `벌들.length === 5` ← 잡는다(벌이 늘면 막힌다)
 *   `f(x).length === 1` ← 안 잡는다(그때그때 셈이다)
 *   `탈.length === 0`   ← 안 잡는다(비었나를 묻는다)
 */
export function 굳은수있나(글) {
  for (const 줄 of 글.split('\n')) {
    const m = 줄.match(/(?:^|[^)\w.])([A-Za-z가-힣_$][\w가-힣_$]*)\.length\s*(?:===\s*|,\s*)([1-9]\d*)\b/);
    if (m) return true;
  }
  return false;
}

/** ④ 빈 값을 0 으로 메우나. ⚠ `?? 0` 이 늘 나쁜 건 아니다 — 세는 자리인지 사람이 본다 */
export function 영으로메우나(글) {
  return /\?\?\s*0\b/.test(글);
}

export const 버릇들 = [
  { key: 'utc', 이름: 'UTC 날짜', 잰다: UTC날짜쓰나, 왜: '새벽에 지으면 하루 앞선다 — _kst.mjs 를 쓴다' },
  { key: 'guard', 이름: '임포트 부수효과', 잰다: 가드없나, 왜: '남이 함수를 가져다 쓰면 파일 쓰기가 딸려 돈다' },
  { key: 'frozen', 이름: '굳은 개수', 잰다: 굳은수있나, 왜: '늘어나면 옳은 변화를 막는 자물쇠가 된다' },
  { key: 'zero', 이름: '빈 값을 0 으로', 잰다: 영으로메우나, 왜: '못 잰 것이 0 이 되면 바닥에 깔린다' },
];

export function 훑기(파일들, 읽기) {
  const 표 = Object.fromEntries(버릇들.map((h) => [h.key, []]));
  for (const f of 파일들) {
    const 글 = 읽기(f);
    for (const h of 버릇들) if (h.잰다(글)) 표[h.key].push(f);
  }
  return 표;
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);
  참('내 자를 알아본다', 내자인가('build-wikitip-spread.mjs') && 내자인가('check-kcw-indexnow.mjs'));
  참('⛔ 남의 자는 안 본다', !내자인가('build-100y-map.mjs') && !내자인가('collect-kosis-seoulmarkets.mjs'));
  /* 🔴 자기 몸을 글자로 뒤지면 자기에게 걸린다 — KST 를 다루는 둘은 뺀다 */
  참('⛔ KST 를 다루는 자는 자기에게 안 걸린다',
    !내자인가('_kst.mjs') && !내자인가('check-kcw-script-habits.mjs'));
  참('UTC 날짜를 잡는다', UTC날짜쓰나('generated: new Date().toISOString(),'));
  참('KST 를 쓰면 안 잡는다', !UTC날짜쓰나('generated: 오늘(),'));
  참('가드 없는 쓰기를 잡는다', 가드없나('fs.writeFileSync(p, s);'));
  참('가드가 있으면 안 잡는다', 가드없나('const 내가실행됐다 = 1;\nfs.writeFileSync(p, s);') === false);
  참('안 쓰는 자는 안 잡는다', 가드없나('console.log(1)') === false);
  참('굳은 개수를 잡는다', 굳은수있나('재본다("벌이 다섯", 벌들.length, 5)'));
  참('길이 비교가 아니면 안 잡는다', !굳은수있나('재본다("값이 다섯", 벌.값, 5)'));
  /* 🔴 처음엔 37개가 나왔는데 거의 다 거짓이었다. 거짓이 많으면 아무도 안 본다 */
  참('⛔ 함수 호출 결과는 안 잡는다', !굳은수있나('재본다("한 구간", 구간들(["w1"]).length, 1)'));
  참('⛔ 「비었나」는 안 잡는다', !굳은수있나('return { ok: 탈.length === 0 };'));
  참('=== 꼴도 잡는다', 굳은수있나('참("띠가 다섯", 띠.length === 5)'));
  참('0 메움을 잡는다', 영으로메우나('const v = x ?? 0;'));
  참('다른 기본값은 안 잡는다', !영으로메우나('const v = x ?? null;'));
  const 표 = 훑기(['a.mjs', 'b.mjs'], (f) => (f === 'a.mjs' ? 'new Date().toISOString()' : 'x ?? 0'));
  참('훑으면 버릇별로 모인다', 표.utc.length === 1 && 표.zero.length === 1);
  참('안 걸린 버릇은 빈 목록', 표.guard.length === 0);
  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가실행됐다) {
  const 파일들 = fs.readdirSync(자방).filter((f) => f.endsWith('.mjs') && 내자인가(f));
  const 표 = 훑기(파일들, (f) => fs.readFileSync(path.join(자방, f), 'utf8'));

  console.log(`내 자 ${파일들.length}개를 훑는다 — 같은 버릇으로 틀리는 자리\n`);
  for (const h of 버릇들) {
    const 걸린것 = 표[h.key];
    console.log(`${걸린것.length ? '⚠' : '✅'} ${h.이름.padEnd(16)} ${String(걸린것.length).padStart(3)}개  ${h.왜}`);
    for (const f of 걸린것.slice(0, 5)) console.log(`      · ${f}`);
    if (걸린것.length > 5) console.log(`      … 그리고 ${걸린것.length - 5}개 더`);
  }
  /**
   * ⛔ **실패로 끝내지 않는다.** 옛 자에는 이미 굳은 것이 있고, 다 고치는 것이
   *   늘 옳은 일도 아니다(`?? 0` 은 자리에 따라 맞다). 이 자는 **눈**이지 문지기가 아니다.
   */
  console.log('\n⚠ 이 자는 세기만 한다. 고칠지는 사람이 자리마다 본다.');
}
