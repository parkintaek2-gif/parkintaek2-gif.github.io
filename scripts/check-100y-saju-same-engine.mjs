/**
 * check-100y-saju-same-engine.mjs — /saju 화면의 셈이 엔진과 «같은 기준»인가
 *
 * 🔴 왜 만드나 — 8/20 에 /saju 지면에 «태어난 날의 일주를 세어 보는 칸»을 달았다.
 *   그 셈은 브라우저 안에 따로 적혀 있다(밖으로 아무것도 안 보내려고).
 *   ⇒ **같은 셈이 두 곳에 있다.** 한쪽만 고치면 표와 화면이 조용히 갈린다.
 *   조용히 갈리는 것이 제일 무섭다 — 아무 오류도 안 뜬다.
 *
 * 그래서 이 자가 세 가지를 본다 —
 *   ① 기준점이 같은가 (1900-01-01 = 10번)
 *   ② 천간·지지·오행·음양 열이 글자까지 같은가
 *   ③ ⛔ 밖으로 보내는 것이 한 줄도 없는가 (fetch·XMLHttpRequest·sendBeacon)
 *
 * 쓰는 법  node scripts/check-100y-saju-same-engine.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 천간, 천간한자, 지지, 지지한자, 오행, 음양, 일주 } from './lib/일주.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const 지면길 = path.join(ROOT, 'src/pages/100y/saju/index.astro');
/* ⛔ 2026-08-21 사장님 지시로 /saju 를 내렸다. 지면이 없으면 볼 것이 없다 —
   「어긋났다」가 아니라 **「볼 것이 없다」**로 끝낸다. 자가 없는 것을 빨강으로 만들지 않는다.
   이 자와 scripts/lib/일주.mjs 는 1번·4번에게 넘기는 꾸러미다(docs/스타사주-넘김.md). */
if (!fs.existsSync(지면길)) {
  console.log('⬜ /saju 지면이 없다 — 내렸다(8/21 사장님 지시). 볼 것이 없다');
  process.exit(0);
}
const 글 = fs.readFileSync(지면길, 'utf8');

let 빨강 = 0;
const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) 빨강++; };

console.log('/saju 화면의 셈이 엔진과 같은가\n');

/* ① 기준점 */
본다('① 기준날이 1900-01-01 로 같다', 글.includes('Date.UTC(1900, 0, 1)'));
본다('① 기준번호가 10(갑술)로 같다', /기준번호\s*=\s*10/.test(글));

/* ② 열이 글자까지 같은가 — 배열을 글로 만들어 그대로 찾는다 */
const 열들 = [['천간', 천간], ['천간한자', 천간한자], ['지지', 지지], ['지지한자', 지지한자],
  ['오행', 오행], ['음양', 음양]];
for (const [이름, 열] of 열들) {
  const 찾을것 = 열.map((s) => `'${s}'`).join(', ');
  본다(`② ${이름} 열이 엔진과 같다`, 글.includes(찾을것));
}

/* ③ ⛔ 밖으로 나가는 것이 없는가 — 화면 안에서 끝난다고 손님께 적어 두었다 */
const 스크립트 = (글.match(/<script[\s\S]*?<\/script>/g) || []).join('\n');
const 밖으로 = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'new Image('];
const 걸린 = 밖으로.filter((w) => 스크립트.includes(w));
본다(`③ ⛔ 넣은 날짜가 밖으로 안 나간다${걸린.length ? ` — ${걸린.join(' · ')}` : ''}`, 걸린.length === 0);

/* ④ 지면이 «풀이»로 넘어가지 않았는가 — 셈까지가 우리 자리다
   🔴 처음 판은 **소스 글자**를 셌다. 그래서 «안 하는 것»을 적어 둔 주석의
      「운세·궁합」이 걸렸다. 셈은 맞고 뜻이 틀렸다 — 주석은 화면에 안 나간다.
   ⇒ 빌드된 지면을 연다. 없으면 「없다」가 아니라 **「못 쟀다」**로 적는다. */
const 풀이말 = ['운세', '궁합', '재물운', '길하', '흉하', '대운', '올해는', '조심하'];
const 빌드된 = path.join(ROOT, 'dist/100y/saju.html');
if (!fs.existsSync(빌드된)) {
  console.log('⬜ ④ 못 쟀다 — dist/100y/saju.html 이 없다. build-once 를 먼저 돌린다');
} else {
  const 민글 = fs.readFileSync(빌드된, 'utf8')
    .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ');
  const 걸린풀이 = 풀이말.filter((w) => 민글.includes(w));
  본다(`④ ⛔ 지면이 풀이로 넘어가지 않는다${걸린풀이.length ? ` — ${걸린풀이.join(' · ')}` : ''}`, 걸린풀이.length === 0);
}

/* ⑤ 엔진 쪽이 여전히 널리 적힌 두 날을 맞히는가 — 기준점이 흔들리면 여기서 먼저 터진다 */
본다('⑤ 엔진: 2000-01-01 이 무오다', 일주('2000-01-01').일주한자 === '戊午');
본다('⑤ 엔진: 1949-10-01 이 갑자다', 일주('1949-10-01').일주한자 === '甲子');

console.log(빨강 ? `\n🔴 어긋난 곳 ${빨강}칸 — 두 셈이 갈렸다` : '\n✅ 두 곳의 셈이 같다');
process.exitCode = 빨강 ? 1 : 0;
