#!/usr/bin/env node
/**
 * make-owner-archive.mjs — **사장님이 따로 보관하실 「중요문서」 한 묶음.** (2026-08-26 · 5번)
 *
 * ## 사장님 지시 (2026-08-26)
 *
 * > 「모든 유닛의 백업파일을 원드라이브에 저해라. **내가 별도로 중요문서에 보관할 파일도
 * >  따로 만들어라.** 점성학을 4번이 마무리 하면 그 때 하라. 그리고 **pg승인이 떨어지면
 * >  또 그 때** 백업파일을 만들어라. 앞선 방식 그대로 하기 위해 히스토리를 찾아봐라」
 *
 * ## 「앞선 방식」은 찾았다 — 이 자는 그것과 «다른» 것이다
 *
 * ```
 * 전체 백업   scripts/서버이사-싸기.ps1        기계가 다시 서게 하는 짐 (설정·열쇠·대화록)
 *             → C:\Users\USER\OneDrive\_서버이사\
 * 중요문서    이 자 (make-owner-archive.mjs)   «사장님이 사람으로서 읽고 보관하실 것»
 *             → C:\Users\User\OneDrive\중요문서\
 * ```
 * ⛔ 둘을 섞지 않는다. 앞의 것은 폴더가 1.4GB 이고 사람이 읽을 것이 아니다.
 *   뒤의 것은 **몇 장짜리**여야 하고, 열면 바로 읽혀야 한다.
 *
 * ## ⛔ 이 자가 절대 담지 않는 것
 *
 * **비밀번호·비밀키·`.env` 의 값.** 계정은 «있다는 사실»과 «아이디»까지만 적는다.
 * 원드라이브는 동기화되고 공유될 수 있다. 사장님이 보관하실 것이라도 마찬가지다.
 * ⭐ 대신 「어디에 있는지」를 적는다 — 그것이 사장님께 필요한 것이다.
 *
 * 쓰는 법
 *   node scripts/make-owner-archive.mjs            (실제로 만든다)
 *   node scripts/make-owner-archive.mjs --시험     (어디에 무엇을 넣을지만 찍는다)
 *   node scripts/make-owner-archive.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const 뿌리 = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const 원드라이브 = 'C:/Users/User/OneDrive';
const 낼방뿌리 = path.join(원드라이브, '중요문서');

/** 파일 이름에 «날짜와 시간»을 반드시 넣는다 — 같은 날 여러 번 만들면 어느 것이 최신인지
 *  사장님이 구분하실 수 없다(2026-08-2x 에 사장님이 직접 짚어 주신 것). */
export function 묶음이름(때, 까닭) {
  const p = (n) => String(n).padStart(2, '0');
  const d = `${때.getFullYear()}${p(때.getMonth() + 1)}${p(때.getDate())}`;
  const t = `${p(때.getHours())}${p(때.getMinutes())}`;
  const 꼬리 = String(까닭 ?? '').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');
  return `중요문서_${d}-${t}${꼬리 ? `_${꼬리}` : ''}`;
}

/** ⛔ 비밀이 섞였나 본다. 하나라도 걸리면 «그 파일을 안 넣는다» */
export function 비밀이섞였나(글) {
  const s = String(글 ?? '');
  const 걸림 = [];
  /* 열쇠처럼 생긴 것들 — 값이 보이면 걸린다.
     🔴 [2026-08-26] 처음 쓴 정규식 둘이 «새고 있었다». 자가시험이 잡았다 —
       ⛔ `\b(sk|live|test)_[A-Za-z0-9]{16,}` 은 `live_sk_ABC…` 를 못 잡는다.
         `live_` 다음이 `sk_` 인데 밑줄이 `[A-Za-z0-9]` 에 안 맞아 열여섯 자를 못 채운다.
         → 밑줄을 허용한다.
       ⛔ `\b비밀번호` 는 «한글 앞에서 \b 가 안 먹는다». 앞이 글자든 줄머리든 경계가 안 잡힌다.
         → 한글 말은 \b 없이 따로 본다.
     ⭐ 검사가 없었으면 두 구멍으로 열쇠가 원드라이브까지 나갔을 것이다. */
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(s)) 걸림.push('개인키');
  if (/\b(sk|live|test)_[A-Za-z0-9_]{16,}/.test(s)) 걸림.push('PG 비밀키처럼 생긴 것');
  if (/\bAKIA[0-9A-Z]{16}\b/.test(s)) 걸림.push('AWS 액세스키');
  if (/\b(password|passwd|pwd|secret|api[_-]?key)\s*[:=]\s*\S+/i.test(s)) 걸림.push('비밀번호');
  if (/(비밀번호|암호|비번)\s*[:=]\s*\S+/.test(s)) 걸림.push('비밀번호(한글)');
  if (/\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/.test(s)) 걸림.push('JWT 처럼 생긴 것');
  return 걸림;
}

/** 사람이 읽을 크기인가. ⛔ 중요문서에 큰 자료를 넣지 않는다 — 열리지 않는다 */
export const 최대바이트 = 2 * 1024 * 1024;

/**
 * 담을 것 — 「사장님이 사람으로서 읽으실 것」만.
 * ⛔ 코드·설정·자료는 안 넣는다. 그건 전체 백업(서버이사-싸기.ps1)이 한다.
 */
export const 담을것 = [
  { 방: '01_회사', 길: 'docs/모토와-철학.md', 이름: '모토와-철학.md' },
  { 방: '01_회사', 길: 'docs/카피-쓰는법.md', 이름: '카피-쓰는법.md' },
  /* ⛔ 토스 회신문 원문(`klifemap/docs/토스-빌링-추가신청-회신문.md`)은 «안 넣는다».
     2026-08-26 에 이 자가 그것을 「비밀번호(한글)」로 잡았다. 값은 없고
     「비밀번호 : 앞서 회신드린 것과 동일합니다」라는 «말»뿐인데, 자는 값과 말을 못 가른다.
     ⭐ 그래서 셋 중 하나를 골라야 했다 —
       ① 자에 예외를 둔다        ⛔ 예외는 새는 문이다. 다음에 진짜 값이 그 꼴로 들어온다
       ② 원문을 고친다           ⛔ 그것은 사장님이 «보내신 그대로»의 기록이다. 못 고친다
       ③ 원문 대신 «요약»을 넣는다  ✅ 이것을 골랐다 — 아래 첫 장에 경과를 적는다
     ⚠ 그러니 이 묶음에 토스 «원문»은 없다. 원문은 저장소와 「법인 경영」 폴더에 있다. */
  { 방: '03_요금', 길: '../klifemap/billing/pricing.json', 이름: 'klifemap-요금표.json' },
];

/* ── 자가시험 ─────────────────────────────────────────────
   ⛔ 말로 적은 규칙은 잊힌다. 비밀을 안 넣는다는 규칙은 «특히» 검사로 굳혀야 한다. */
if (process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 검 = (이름, 값) => { if (값) 통 += 1; else { 실 += 1; console.log(`   🔴 ${이름}`); } };

  const 때 = new Date(2026, 7, 26, 21, 5);
  검('이름에 날짜와 «시간»이 다 들어간다', 묶음이름(때) === '중요문서_20260826-2105');
  검('까닭이 있으면 뒤에 붙는다', 묶음이름(때, 'PG승인') === '중요문서_20260826-2105_PG승인');
  검('파일 이름에 못 쓰는 글자를 뺀다', !/[\\/:*?"<>|]/.test(묶음이름(때, 'a/b:c')));
  검('까닭의 빈칸은 붙임표로', 묶음이름(때, '점성학 오픈') === '중요문서_20260826-2105_점성학-오픈');

  /* 🔴 이 셋이 이 자의 목숨이다. 하나라도 새면 원드라이브로 열쇠가 나간다 */
  검('⭐ 개인키를 잡는다', 비밀이섞였나('-----BEGIN RSA PRIVATE KEY-----\nabc').length > 0);
  검('⭐ PG 비밀키처럼 생긴 것을 잡는다', 비밀이섞였나('key=live_sk_ABCDEFGHIJKLMNOPQRST').length > 0);
  검('⭐ 비밀번호 줄을 잡는다', 비밀이섞였나('password: hunter2').length > 0);
  검('⭐ 한글 「비밀번호:」도 잡는다', 비밀이섞였나('비밀번호: abcd').length > 0);
  검('AWS 키를 잡는다', 비밀이섞였나('AKIAIOSFODNN7EXAMPLE').length > 0);
  검('JWT 처럼 생긴 것을 잡는다',
    비밀이섞였나('eyJhbGciOiJIUzI1NiJ9XXXXXXXX.abcdefghijklmnop.qrstuvwxyz123456').length > 0);
  /* ⚠ 멀쩡한 글을 막으면 자가 안 쓰이게 된다. 그것도 검사한다 */
  검('보통 글은 안 걸린다', 비밀이섞였나('토스 상담원이 33만원 전액 환불이라고 확인했다').length === 0);
  검('아이디만 있는 줄은 안 걸린다', 비밀이섞였나('아이디 : admin@klifedesign.net').length === 0);
  검('빈 것에 안 깨진다', 비밀이섞였나(null).length === 0 && 비밀이섞였나('').length === 0);

  console.log(실 === 0 ? `✅ make-owner-archive 자가시험 통과 (${통})` : `⛔ ${실}개 실패`);
  process.exit(실 === 0 ? 0 : 1);
}

/* ── 실제로 만든다 ─────────────────────────────────────── */
const 시험만 = process.argv.includes('--시험');
const 까닭 = process.argv.find((a) => a.startsWith('--까닭='))?.split('=')[1] ?? '';
const 이름 = 묶음이름(new Date(), 까닭);
const 낼방 = path.join(낼방뿌리, 이름);

console.log(`■ 중요문서 묶음 — ${이름}`);
console.log(`   낼 곳 : ${낼방}`);
if (시험만) console.log('   ⚠ --시험 이라 «실제로 만들지는 않는다»');
console.log();

const 넣은것 = []; const 못넣은것 = [];
for (const 것 of 담을것) {
  const 원본 = path.resolve(뿌리, 것.길);
  if (!fs.existsSync(원본)) { 못넣은것.push({ ...것, 까닭: '파일이 없다' }); continue; }
  const 크기 = fs.statSync(원본).size;
  if (크기 > 최대바이트) { 못넣은것.push({ ...것, 까닭: `너무 크다 (${(크기 / 1024 / 1024).toFixed(1)}MB)` }); continue; }
  const 글 = fs.readFileSync(원본, 'utf8');
  const 걸림 = 비밀이섞였나(글);
  /* 🔴 하나라도 걸리면 «안 넣는다». 지우고 넣지 않는다 — 지우다 흘리는 것이 더 위험하다 */
  if (걸림.length) { 못넣은것.push({ ...것, 까닭: `⛔ 비밀이 섞였다 — ${걸림.join(', ')}` }); continue; }
  if (!시험만) {
    fs.mkdirSync(path.join(낼방, 것.방), { recursive: true });
    fs.writeFileSync(path.join(낼방, 것.방, 것.이름), 글);
  }
  넣은것.push({ ...것, 크기 });
}

for (const r of 넣은것) console.log(`   ✅ ${r.방}/${r.이름}  (${(r.크기 / 1024).toFixed(0)}KB)`);
for (const r of 못넣은것) console.log(`   ⛔ ${r.방}/${r.이름}  — ${r.까닭}`);

/* ── 사장님이 «먼저 여실» 한 장 ────────────────────────── */
const 잰것 = (() => {
  const 읽 = (p) => { try { return JSON.parse(fs.readFileSync(path.join(뿌리, p), 'utf8')); } catch { return null; } };
  const 해 = 읽('src/data/kcw-birth-year-pages.json');
  const 사람 = 읽('src/data/wikitip-people.json');
  const 고향 = 읽('src/data/wikitip-hometowns.json');
  return {
    사람지면: 사람?.people?.length ?? '못 쟀다',
    해지면: 해?.yearsWithPage ?? '못 쟀다',
    도시지면: 고향?.cities?.length ?? '못 쟀다',
  };
})();

const 첫장 = `# 중요문서 — ${이름}

> 이 묶음은 **사장님이 사람으로서 읽고 보관하실 것**만 담았습니다.
> 기계를 다시 세우는 짐은 여기가 아니라 \`C:\\Users\\USER\\OneDrive\\_서버이사\\\` 에 있습니다.

만든 때 : ${new Date().toLocaleString('ko-KR')}
만든 까닭 : ${까닭 || '(따로 적지 않음)'}

## ⛔ 여기에 «없는» 것 — 일부러 뺐습니다

**비밀번호·비밀키·\`.env\` 값은 한 줄도 없습니다.** 원드라이브는 동기화되고 공유될 수
있습니다. 사장님이 보관하실 것이라도 같습니다.
${못넣은것.length ? `\n이번에 못 넣은 것 ${못넣은것.length}개 —\n${못넣은것.map((r) => `- \`${r.방}/${r.이름}\` — ${r.까닭}`).join('\n')}\n` : ''}
## 담긴 것

${넣은것.map((r) => `- \`${r.방}/${r.이름}\``).join('\n') || '- (없음)'}

## 지금 우리가 어디 있나 (이 묶음을 만든 때 기준)

| | |
|---|---|
| K Culture Wire 사람 지면 | ${잰것.사람지면}장 |
| 태어난 해 지면 | ${잰것.해지면}장 |
| 출신 도시 지면 | ${잰것.도시지면}장 |

⚠ **방문자 수는 여기 안 적습니다.** 날마다 바뀌므로 이 문서가 곧 낡습니다.
그때그때 재십시오 — \`node scripts/ga4-report.mjs --하루 --날수=14\`

## 다시 만드는 법

\`\`\`
node scripts/make-owner-archive.mjs --까닭=PG승인
node scripts/make-owner-archive.mjs --까닭=점성학오픈
node scripts/make-owner-archive.mjs --시험        어디에 무엇이 갈지만 봅니다
\`\`\`

전체 백업(기계용)은 이것입니다 —
\`\`\`
powershell -File scripts\\서버이사-싸기.ps1              굳은 짐만
powershell -File scripts\\서버이사-싸기.ps1 -대화록      대화록까지 (창 닫기 직전에만)
\`\`\`
`;

if (!시험만) {
  fs.mkdirSync(낼방, { recursive: true });
  fs.writeFileSync(path.join(낼방, '00_먼저읽기.md'), 첫장);
}

console.log();
console.log(`넣은 것 ${넣은것.length}개 · 못 넣은 것 ${못넣은것.length}개`);
console.log(시험만 ? '⚠ --시험 이라 아무것도 안 만들었다' : `✅ 만들었다 — ${낼방}`);
