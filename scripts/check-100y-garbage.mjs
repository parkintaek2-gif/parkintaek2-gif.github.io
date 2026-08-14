#!/usr/bin/env node
/**
 * 🔴 **손님에게 나가면 안 되는 글자가 지면에 남았나.**
 *
 *   node scripts/check-100y-garbage.mjs --자가시험
 *   node scripts/check-100y-garbage.mjs              dist/100y 를 전부 훑는다
 *   node scripts/check-100y-garbage.mjs --라이브      라이브에서 몇 장을 뽑아 잰다
 *
 * ## 🔴 왜 만드나 — 사장님 지시(2026-08-14)
 *
 *   사장님이 폰으로 KLifeMap 리포트를 넘겨 보시다 **흠 아홉 개**를 손수 찾으셨다.
 *   그중 하나는 손님에게 나가는 PDF 에 **「리포트 생성 중 오류가 발생했습니다」** 가 그대로 찍힌 것이었다.
 *   검사기는 통과시켰다 — 「그 절이 있나」를 셌고, 있었기 때문이다.
 *   ⭐ **셈은 맞고 뜻이 틀렸다.**
 *
 *   > 「사이트는 내가 진짜 안 봐도 되게 **완벽하게 무오류**가 될 때까지 검수 및 감수하도록」
 *
 *   무오류의 뜻 = **사장님이 손수 찾으신 흠이 0개.** 「검수 완료」는 무오류가 아니다.
 *
 * ## 무엇을 잡나
 *
 *   지면 **본문**에 아래가 있으면 무조건 빨간불이다.
 *   ⛔ `<head>` · `<script>` · `<style>` · 주석은 안 본다. 거기 `null` 이 있는 건 정상이다
 *   ⛔ 우리가 일부러 쓴 말(「오류가 없습니다」 같은 다짐)은 **까닭을 적어** 봐준다.
 *      까닭 없는 봐주기는 두지 않는다 — 그게 검사기가 거짓말하는 길이다
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 본문만 } from './lib/재기-공통.mjs';

export const 뿌리 = fileURLToPath(new URL('..', import.meta.url));

/** 본문에 있으면 안 되는 것. ⚠ 늘릴 때 자가시험도 같이 늘린다 */
export const 쓰레기말 = [
  '오류', '실패', '생성 중', '불러오는 중', '로딩 중',
  'undefined', 'NaN', '{{', '[object', 'TODO', 'FIXME',
  '�',            // 깨진 글자
];

/**
 * 🔴 `null` 은 따로 본다. 「null」이 영어 낱말 안에 묻히면(nullable) 헛경보다.
 *    낱말로 홀로 선 것만 잡는다.
 */
export const 홀로선말 = ['null'];

/**
 * ⚠ **일부러 쓴 말 · 이름인 말.** 까닭을 적는다. 까닭 없이 여기 넣지 않는다.
 *   지우면 검사가 다시 빨개진다 — 그게 맞다.
 *
 * 🔴 **두 가지 봐주기를 가른다. 이걸 안 가르면 자가 거짓말한다.**
 * ```
 * 곧바로  그 말 **바로 뒤**를 본다.  「오류고등학교」·「오류동」은 이름이다
 *         ⭐ 좁게 본다. 같은 줄 딴 데 있는 진짜 오류를 함께 삼키지 않는다
 * 줄      그 말이 있는 **줄**을 본다.  「성공과 실패로 나누지 않습니다」는 우리 강령이다
 *         ⚠ 넓게 보므로 **다짐·강령에만** 쓴다
 * ```
 * 🔴 2026-08-14 — 처음엔 다 「줄」로 봤다. 그랬더니 구로구 지면 다섯 장이
 *    **「오류고등학교」·「오류동」** 때문에 빨개졌다. 자가 또 거짓말한 것이다(열한 번째).
 */
export const 봐줄말 = [
  { 말: '오류', 곧바로: /^오류(고등학교|중학교|초등학교|학교|동|1동|2동|역|천)/, 까닭: '🔴 진짜 이름이다 — 서울 구로구 **오류동**과 **오류고등학교**' },
  { 말: '오류', 줄: /표준오차|오차범위|측정 오차/, 까닭: '통계 용어 「오차」다. 「오류」와 다르다' },
  { 말: '오류', 줄: /오류가 없|오류를 찾|오류가 있으면|틀린 곳을 알려/, 까닭: '우리가 손님에게 하는 다짐·안내다' },
  { 말: '실패', 줄: /실패라고 말하지|실패가 아닙니다|성공과 실패로/, 까닭: '⭐ 강령이다 — 「우리는 성공과 실패로 나누지 않습니다」' },
];

/**
 * 이 자리의 이 말을 봐줄까.
 * @param 몸  본문
 * @param 자리 그 말이 시작하는 곳
 */
export function 봐줄까(말, 몸, 자리) {
  const 곧바로 = String(몸).slice(자리, 자리 + 말.length + 10);
  const 줄 = 그줄(몸, 자리);
  return 봐줄말.some((v) =>
    v.말 === 말 && ((v.곧바로 && v.곧바로.test(곧바로)) || (v.줄 && v.줄.test(줄))));
}

/** 그 말이 들어 있는 줄을 뽑는다(앞뒤 40자). 사람이 읽고 판단할 수 있게 */
export function 그줄(글, 자리, 폭 = 40) {
  const 앞 = Math.max(0, 자리 - 폭), 뒤 = Math.min(글.length, 자리 + 폭);
  return (앞 > 0 ? '…' : '') + 글.slice(앞, 뒤).replace(/\s+/g, ' ').trim() + (뒤 < 글.length ? '…' : '');
}

/** 한 지면을 잰다 → [{말, 줄}] */
export function 잰다(html) {
  const 몸 = 본문만(html);
  const 걸린것 = [];
  for (const 말 of 쓰레기말) {
    let i = 몸.indexOf(말);
    while (i >= 0) {
      if (!봐줄까(말, 몸, i)) { 걸린것.push({ 말, 줄: 그줄(몸, i) }); break; }   // 한 지면에 같은 말은 한 번만
      i = 몸.indexOf(말, i + 말.length);
    }
  }
  for (const 말 of 홀로선말) {
    const m = new RegExp('(^|[^A-Za-z0-9_])' + 말 + '($|[^A-Za-z0-9_])').exec(몸);
    if (m) 걸린것.push({ 말, 줄: 그줄(몸, m.index) });
  }
  return 걸린것;
}

/** dist 아래 html 을 다 모은다 */
export function 지면들(터) {
  const 답 = [];
  const 걷기 = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) 걷기(p);
      else if (e.name.endsWith('.html')) 답.push(p);
    }
  };
  if (fs.existsSync(터)) 걷기(터);
  return 답;
}

// ── 자가시험 ────────────────────────────────────────────────────────────────
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 본다 = (이름, 참인가) => { if (참인가) 통과++; else { 실패++; console.error('  ✗ ' + 이름); } };
  const 몸 = (s) => `<html><head><title>t</title></head><body><p>${s}</p></body></html>`;

  본다('① 「생성 중 오류」를 잡는다', 잰다(몸('리포트 생성 중 오류가 발생했습니다')).length > 0);
  본다('② 「불러오는 중」을 잡는다', 잰다(몸('불러오는 중입니다')).some((c) => c.말 === '불러오는 중'));
  본다('③ undefined 를 잡는다', 잰다(몸('졸업자 undefined명')).some((c) => c.말 === 'undefined'));
  본다('④ NaN 을 잡는다', 잰다(몸('진학률 NaN%')).some((c) => c.말 === 'NaN'));
  본다('⑤ 안 채운 틀({{)을 잡는다', 잰다(몸('{{학교이름}}')).some((c) => c.말 === '{{'));
  본다('⑥ [object 를 잡는다', 잰다(몸('[object Object]')).some((c) => c.말 === '[object'));
  본다('⑦ 깨진 글자를 잡는다', 잰다(몸('��')).length > 0);
  본다('⑧ TODO 를 잡는다', 잰다(몸('TODO 여기 채우기')).some((c) => c.말 === 'TODO'));

  /* 🔴 이 자가 «거짓말하지 않는가» — 여기가 핵심이다 */
  본다('⑨ 🔴 script 안의 null 은 안 잡는다', 잰다('<body><script>var a=null</script><p>안녕</p></body>').length === 0);
  본다('⑩ 🔴 head 안의 오류는 안 잡는다', 잰다('<html><head><meta name="d" content="오류"></head><body><p>안녕</p></body></html>').length === 0);
  본다('⑪ 🔴 style 안의 것은 안 잡는다', 잰다('<body><style>.a{content:"undefined"}</style><p>안녕</p></body>').length === 0);
  본다('⑫ 🔴 주석 안의 것은 안 잡는다', 잰다('<body><!-- TODO 나중에 --><p>안녕</p></body>').length === 0);
  본다('⑬ 🔴 nullable 은 안 잡는다(낱말 안에 묻힌 null)', 잰다(몸('nullable 한 값')).length === 0);
  본다('⑭ 🔴 홀로 선 null 은 잡는다', 잰다(몸('값: null 입니다')).some((c) => c.말 === 'null'));
  본다('⑮ 🔴 「표준오차」는 봐준다', 잰다(몸('표준오차는 0.3%p 입니다')).length === 0);
  본다('⑯ 🔴 우리 다짐 「오류가 없습니다」는 봐준다', 잰다(몸('이 지면에 오류가 없습니다')).length === 0);
  본다('⑰ 🔴 강령 「성공과 실패로 나누지 않습니다」는 봐준다',
       잰다(몸('우리는 성공과 실패로 나누지 않습니다')).length === 0);
  본다('⑱ 🔴 그래도 진짜 오류는 잡는다(봐주기가 다 삼키지 않는다)',
       잰다(몸('표준오차는 0.3%p 입니다. 리포트 생성 중 오류가 발생했습니다')).length > 0);
  본다('⑲ 깨끗한 지면은 0개', 잰다(몸('경신고등학교는 진학률 61.3% 입니다')).length === 0);
  /* 🔴 자가 열한 번째로 거짓말한 자리 — 진짜 이름을 오류로 읽었다 */
  본다('㉑ 🔴 「오류고등학교」는 이름이다', 잰다(몸('오류고등학교 일반고 127명')).length === 0);
  본다('㉒ 🔴 「오류동」은 동네 이름이다', 잰다(몸('서울특별시 구로구 서해안로21길 5-12 (오류동)')).length === 0);
  본다('㉓ 🔴 그래도 같은 줄의 진짜 오류는 잡는다 — 이름 봐주기가 다 삼키지 않는다',
       잰다(몸('오류고등학교 일반고. 리포트 생성 중 오류가 발생했습니다')).length > 0);
  본다('㉔ 🔴 「오류」 홀로는 잡는다', 잰다(몸('오류 가 발생했습니다')).length > 0);
  본다('⑳ 걸린 줄을 사람이 읽게 준다', (잰다(몸('졸업자 undefined명'))[0]?.줄 || '').includes('졸업자'));

  console.log(실패 === 0 ? `✅ 자가시험 ${통과}개 통과` : `❌ ${실패}개 실패 (통과 ${통과})`);
  process.exit(실패 === 0 ? 0 : 1);
}

if (내가실행됐다 && !process.argv.includes('--라이브')) {
  const 터 = path.join(뿌리, 'dist/100y');
  const 것들 = 지면들(터);
  if (!것들.length) { console.error('⛔ dist/100y 가 없다. 먼저 빌드한다'); process.exit(1); }

  const 걸린지면 = [];
  for (const p of 것들) {
    const 걸린것 = 잰다(fs.readFileSync(p, 'utf8'));
    if (걸린것.length) 걸린지면.push({ 길: path.relative(터, p), 걸린것 });
  }

  console.log(`# 쓰레기 글자 검사 — 지면 ${것들.length.toLocaleString()}장`);
  console.log('');
  if (!걸린지면.length) {
    console.log('✅ 본문에 남은 것 **0장**');
    console.log('');
    console.log('⚠ 이 자는 **글자**만 본다. 뜻이 틀린 문장·어긋난 숫자는 못 잡는다.');
    console.log('  사장님이 찾으신 아홉 중 이 자로 잡히는 것은 하나다. 나머지는 사람이 넘겨 봐야 한다.');
    process.exit(0);
  }
  /* 말별로 몇 장인지 먼저 — 한 흠이 수천 장에 퍼진 것인지 알아야 한다 */
  const 말별 = new Map();
  for (const g of 걸린지면) for (const c of g.걸린것) 말별.set(c.말, (말별.get(c.말) || 0) + 1);
  console.log(`🔴 **${걸린지면.length}장**에 남아 있다`);
  for (const [말, 수] of [...말별].sort((a, b) => b[1] - a[1]))
    console.log(`   「${말}」 ${수}장`);
  console.log('');
  for (const g of 걸린지면.slice(0, 25))
    for (const c of g.걸린것) console.log(`  🔴 ${g.길}\n       「${c.말}」  ${c.줄}`);
  if (걸린지면.length > 25) console.log(`  … 그 밖 ${걸린지면.length - 25}장`);
  process.exit(1);
}

if (내가실행됐다 && process.argv.includes('--라이브')) {
  const 터 = 'https://100yearmap.com';
  const 볼것 = [
    '/', '/price', '/about', '/age', '/age/32', '/after', '/work', '/school',
    '/major', '/college-major', '/university', '/region', '/video', '/data',
    '/school/7010057', '/report/7010057', '/report/area/경상남도-함안군',
    '/report/area/서울특별시-노원구', '/major/조리과', '/life/50대',
  ];
  let 흠 = 0;
  for (const 길 of 볼것) {
    const 답 = await fetch(터 + encodeURI(길), { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const 글 = 답.status === 200 ? await 답.text() : '';
    const 걸린것 = 답.status === 200 ? 잰다(글) : [{ 말: '상태 ' + 답.status, 줄: '' }];
    if (걸린것.length) { 흠++; for (const c of 걸린것) console.log(`  🔴 ${길}  「${c.말}」  ${c.줄}`); }
    else console.log(`  ✅ ${길}`);
  }
  console.log(흠 === 0 ? `\n✅ 라이브 ${볼것.length}장 — 본문에 남은 것 0` : `\n🔴 ${흠}장에 남아 있다`);
  process.exit(흠 === 0 ? 0 : 1);
}
