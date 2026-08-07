#!/usr/bin/env node
/**
 * check-live-matches-source.mjs — **원본에서 문장을 떼어** 라이브에 그 문장이 있는지 본다.
 *
 * 왜 만들었나 (2026-08-07 22:3x · 2번)
 * ─────────────────────────────────────────────────────────────────────────
 * 오늘 하루 내가 여섯 번 틀린 자를 썼다. **여섯 번 다 같은 짓**이다 —
 * 대상을 안 열어 보고 「이렇게 적혀 있겠지」로 정규식을 지었다.
 *
 *   ① 「200 이 뜨나」로 사이트를 쟀다        → 보안 경고를 여드레 못 봤다
 *   ② 한국어로 영문 사이트를 찾았다
 *   ③ 「could not verify」 → 그 지면은 「could verify」였다
 *   ④ 그 문장으로 성격이 다른 지면을 쟀다
 *   ⑤ `/articles/` → 실제는 `/article/` 이라 셋 다 404 로 볼 뻔했다
 *   ⑥ 「국민연금 고지액」으로 찾았다 → 영문 기사라 "national-pension bill" 이었다
 *
 * ⛔ 그래서 이 자는 **찾을 말을 내가 정하지 않는다.**
 *    원본 파일에서 **가장 튀는 문장**을 떼어다 그것이 라이브에 있는지만 본다.
 *    원본이 뭐라고 적었든 그대로 따라간다. 내 짐작이 끼어들 자리가 없다.
 *
 * 쓰는 법
 *   node scripts/check-live-matches-source.mjs <원본파일> <라이브주소>
 *   node scripts/check-live-matches-source.mjs --selftest
 */

import fs from 'node:fs';
import https from 'node:https';

/** 앞머리(frontmatter)를 떼고 본문만 남긴다 */
export function 본문만(글) {
  const s = String(글 ?? '');
  const m = s.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return m ? s.slice(m[0].length) : s;
}

/** 표시용 기호를 걷어 낸다. 라이브는 HTML 이라 `**`·`_`·`[]()` 가 그대로 안 나온다 */
export function 민글(줄) {
  return String(줄 ?? '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')   // 링크·그림
    .replace(/[*_`~#>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * **가장 튀는 문장**을 고른다 — 길고, 흔한 말이 아닌 것.
 * ⚠ 짧은 문장은 우연히 다른 지면에도 있다. 그러면 「있다」가 거짓이 된다.
 */
export function 튀는문장(본문, 최소 = 40) {
  const 후보 = 본문
    .split('\n')
    .map(민글)
    .filter((l) => l.length >= 최소 && !/^[|\-=:]+$/.test(l))
    .flatMap((l) => l.split(/(?<=[.!?。])\s+/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 최소);
  if (!후보.length) return null;
  return 후보.sort((a, b) => b.length - a.length)[0].slice(0, 160);
}

/** HTML 에서 태그를 걷고 띄어쓰기를 고른다. 그래야 원본 문장과 견줄 수 있다 */
export function 글만(html) {
  return String(html ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 따옴표·대시가 지면에서 다른 글자로 바뀌는 일이 잦다. 그것만 고르고 견준다 */
export function 고르게(s) {
  return String(s ?? '')
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

export function 있나(라이브글, 문장) {
  if (!문장) return false;
  return 고르게(라이브글).includes(고르게(문장));
}

function 받기(u) {
  return new Promise((r) => {
    https.get(u, { timeout: 25000 }, (res) => {
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => r({ 코드: res.statusCode, 글: b }));
    }).on('error', (e) => r({ 코드: '오류:' + (e.code || e.message), 글: '' }));
  });
}

function 셀프테스트() {
  const 검사 = [];
  const 확인 = (이름, 실제, 기대) => 검사.push({ 이름, 통과: JSON.stringify(실제) === JSON.stringify(기대), 실제 });

  확인('앞머리를 뗀다', 본문만('---\ntitle: x\n---\n본문이다'), '본문이다');
  확인('앞머리가 없으면 그대로', 본문만('본문이다'), '본문이다');
  확인('굵은 표시를 걷는다', 민글('**아주** 중요'), '아주 중요');
  확인('링크는 글자만 남긴다', 민글('[백년지도](https://a.com) 를 보라'), '백년지도 를 보라');
  확인('태그를 걷는다', 글만('<p>가 <b>나</b></p>'), '가 나');
  확인('script 를 걷는다', 글만('<script>var a=1</script><p>가</p>'), '가');
  확인('굽은 따옴표를 곧게', 고르게('don’t'), "don't");
  확인('긴 대시를 짧게', 고르게('a—b'), 'a-b');
  확인('대소문자를 같게 본다', 있나('Hello There Friend Of Mine Today', 'hello there friend of mine today'), true);

  /* ⚠ 40자 자를 세운 것은 영문 기준이다. 한글은 같은 뜻을 훨씬 적은 글자로 담아
   *   짧아 보인다. 처음 시험 문장이 37자라 null 이 나왔고, 자가 아니라 시험이 틀렸다. */
  const 긴문장 = '이 문장은 충분히 길어서 튀는 문장으로 뽑혀야 마땅한, 그런 넉넉한 길이의 문장이다.';
  확인('⭐ 긴 문장을 고른다', 튀는문장('짧다.\n' + 긴문장), 긴문장);
  확인('⭐ 짧은 것뿐이면 null — 억지로 고르지 않는다', 튀는문장('짧다.\n또 짧다.'), null);
  확인('null 문장은 없다로 본다', 있나('아무 글', null), false);
  확인('⭐ 라이브에 없으면 거짓', 있나('전혀 다른 글이다', '이 문장은 충분히 길어서 튀는 문장으로 뽑혀야 마땅한'), false);
  확인('표시 기호가 달라도 찾는다', 있나('아주 중요하다', 민글('**아주** 중요하다')), true);

  for (const c of 검사) console.log(`${c.통과 ? '✅' : '⛔'} ${c.이름}${c.통과 ? '' : `\n     받은 것 ${JSON.stringify(c.실제)}`}`);
  const 실패 = 검사.filter((c) => !c.통과).length;
  console.log(`\n검사 ${검사.length}개 · 실패 ${실패}개`);
  process.exit(실패 ? 1 : 0);
}

async function 본일() {
  const [원본, 주소] = process.argv.slice(2);
  if (!원본 || !주소) {
    console.log('쓰는 법: node scripts/check-live-matches-source.mjs <원본파일> <라이브주소>');
    process.exit(1);
  }
  if (!fs.existsSync(원본)) { console.log(`⛔ 원본이 없다: ${원본}`); process.exit(1); }

  const 문장 = 튀는문장(본문만(fs.readFileSync(원본, 'utf8')));
  if (!문장) { console.log('⛔ 원본에서 견줄 만큼 긴 문장을 못 찾았다. 눈으로 본다.'); process.exit(1); }

  const r = await 받기(주소);
  console.log(`주소  ${주소}  →  ${r.코드}`);
  console.log(`원본에서 뗀 문장  「${문장.slice(0, 90)}${문장.length > 90 ? '…' : ''}」`);

  if (r.코드 !== 200) { console.log('⛔ 200 이 아니다.'); process.exit(1); }

  const 붙나 = 있나(글만(r.글), 문장);
  console.log(붙나 ? '✅ 원본 그대로 나가 있다' : '⛔ 이 문장이 라이브에 없다 — 아직 안 나갔거나 다른 판이다');
  process.exit(붙나 ? 0 : 1);
}

if (process.argv.includes('--selftest')) 셀프테스트();
else await 본일();
