#!/usr/bin/env node
/**
 * check-country-sources-disclosed.mjs — **새 나라 지면을 내놓고 출처를 안 적었나.**
 * (5번, 2026-09-23)
 *
 * ── 🔴 왜 ────────────────────────────────────────────────────────────
 * 오늘 일본 상장사 지면 3,707장을 내고 라이브를 «눈으로» 보다가 알았다 —
 * 지면 각주에는 EDINET 을 적어 두었는데, 사이트 꼬리말의 「DATA SOURCES」와
 * About 의 「Where the data comes from」은 **한국 두 곳만** 말하고 있었다.
 * 같은 날 About 에는 «한국 재무제표(DART)»조차 빠져 있는 것도 드러났다 —
 * 회사 지면 2,515장이 거기서 나오는데 목록에 없었다.
 *
 * ⭐ 회사 강령 그대로다 — **「틀린 숫자 하나가 옳은 스물셋을 같이 의심받게 한다.」**
 *   손님이 보는 두 자리가 서로 다른 말을 하면, 맞는 쪽까지 같이 의심받는다.
 *   그리고 EDINET 의 PDL1.0 은 **출처 표시가 «의무»**다 — 안 적으면 약속을 어긴 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────────────
 * ⛔ 「지면 각주에 적었으니 됐다」로 세지 않는다. 사이트 고지 두 자리가 따로 있다.
 * ⛔ 못 읽은 파일을 「통과」로 세지 않는다 — 못 읽었으면 그렇게 적는다.
 * ⚠ 나라를 하나 열 때마다 아래 «나라표»에 한 줄을 더한다. 그 줄이 곧 규칙이다.
 *
 * 쓰는 법
 *   node scripts/check-country-sources-disclosed.mjs --자가시험
 *   node scripts/check-country-sources-disclosed.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(fileURLToPath(import.meta.url), '..', '..');

/**
 * 나라표 — 「지면 폴더가 있으면 고지에 이 말이 있어야 한다」.
 * ⚠ 새 나라를 열면 여기에 한 줄을 더한다. 안 더하면 이 자는 그 나라를 «안 본다».
 */
export const 나라표 = [
  { 나라: 'Japan', 지면폴더: 'src/pages/japan', 있어야할말: ['EDINET'], 손님이부르는이름: ['Japan', 'Tokyo'] },
  { 나라: 'Taiwan', 지면폴더: 'src/pages/taiwan', 있어야할말: ['twse'], 손님이부르는이름: ['Taiwan', 'Taipei'] },
];

/**
 * 🔴 **연 나라가 「In build」 칸에 남아 있나** (2026-09-23 · 사장님 지적)
 *
 * 사장님: 「smarkets 사이트에서 **바로바로 반영해**. 타이베이 차이나를 live 에 추가해야지.」
 * 대만 지면 1,057장을 내고도 첫 화면은 여전히 「In build — … Taiwan and Tokyo」라고
 * 적고 있었다. 일본도 3,672장을 낸 뒤 아흐레째 그 칸에 남아 있었다.
 *
 * ⭐ 손님이 첫 화면에서 「아직 안 됐구나」를 읽고 나가면, 안쪽에 1,000장을 깔아 둔 것이
 *   아무 소용이 없다. **파는 말과 가진 것이 어긋나는 것**이고, 그것이 제일 비싼 결함이다.
 *
 * ⛔ 그래서 사람이 기억해서 고치게 두지 않는다 — 지면 폴더가 있으면 그 나라 이름이
 *   「In build」 줄에 «있어서는 안 된다». 있으면 배포가 막힌다.
 * ⚠ 반대(라이브인데 Live 줄에 없다)는 여기서 안 본다 — 줄의 글꼴이 지면마다 달라
 *   잘못 잡으면 헛경보가 된다. **못 재는 것은 안 재는 것이 낫다.**
 */
export const 파는말파일 = [
  'src/pages/index.astro',
  'src/pages/data/index.astro',
  'src/pages/pricing.astro',
  'src/consts.ts',
];

/**
 * 「짓는 중」이라고 말하는 대목만 잘라 낸다. 없으면 빈 벌.
 *
 * 🔴 처음에 「점·꺾쇠·줄바꿈 아닌 것」까지만 집는 정규식으로 썼다가 «헛초록»을 냈다. 실제 지면은
 *   (⛔ 그 정규식을 여기 그대로 적지 않는다 — 별표와 빗금이 붙어 이 주석을 조기 종료시킨다)
 *   `<b>In build</b> — China…` 꼴이라 `<` 에서 끊겨 나라 이름을 하나도 못 봤다.
 *   ⇒ **태그를 먼저 걷어내고** 본다. 검사가 조용한 것과 결함이 없는 것은 다르다.
 *
 * 그리고 말투가 둘이다 — 둘 다 봐야 한다.
 *   ① 「In build — China, Hong Kong…」        나라가 «뒤»에 온다  (첫 화면·요금)
 *   ② 「…with China, Hong Kong… in build.」   나라가 «앞»에 온다  (consts 의 description)
 */
export function 짓는중줄들(글) {
  if (typeof 글 !== 'string') return [];
  const 민글 = 글.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
  const 벌 = [];
  /* ① 뒤에 오는 꼴 */
  for (const m of 민글.matchAll(/[Ii]n build\s*[—\-–:]?\s*([^.\n]*)/g)) {
    if (m[1] && m[1].trim()) 벌.push(m[1]);
  }
  /* ② 앞에 오는 꼴 — 「with … in build」 */
  for (const m of 민글.matchAll(/\bwith\s+([^.\n]*?)\s+in build\b/g)) {
    if (m[1] && m[1].trim()) 벌.push(m[1]);
  }
  return 벌;
}

/** 연 나라가 그 줄에 남아 있나 → 걸린 이름들 */
export function 짓는중에남았나(글, 이름들) {
  const 줄 = 짓는중줄들(글);
  if (!줄.length) return [];
  const 한덩이 = 줄.join(' ');
  return (이름들 ?? []).filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(한덩이));
}

/** 고지에 반드시 있어야 하는 것 — 나라 지면과 무관하게 늘 본다 */
export const 늘있어야할말 = [
  { 무엇: '한국 재무제표(DART)', 말: ['DART'], 어디: 'about' },
];

export const 고지파일 = {
  footer: 'src/components/Footer.astro',
  about: 'src/pages/about.astro',
};

/** 글에 그 말들이 다 들어 있나. ⛔ 글을 못 읽었으면 null — 「있다」로 치지 않는다 */
export function 다들었나(글, 말들) {
  if (글 == null) return null;
  const s = String(글);
  return (말들 ?? []).every((m) => s.includes(m));
}

/** 지면 폴더에 실제로 지면이 있나 (빈 폴더는 연 것이 아니다) */
export function 지면있나(뿌리길, 폴더) {
  try {
    const p = path.join(뿌리길, 폴더);
    if (!fs.statSync(p).isDirectory()) return false;
    const 훑기 = (d) => fs.readdirSync(d, { withFileTypes: true })
      .some((e) => (e.isDirectory() ? 훑기(path.join(d, e.name)) : /\.(astro|ts|md)$/.test(e.name)));
    return 훑기(p);
  } catch { return false; }
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('말이 다 들었으면 참', 다들었나('a EDINET b', ['EDINET']) === true);
  본다('하나라도 빠지면 거짓', 다들었나('a EDINET b', ['EDINET', 'DART']) === false);
  본다('🔴 ⛔ 못 읽었으면 null — 「있다」로 치지 않는다', 다들었나(null, ['x']) === null);
  본다('빈 말 벌은 참', 다들었나('a', []) === true && 다들었나('a', null) === true);

  본다('지면이 있는 폴더를 알아본다', 지면있나(뿌리, 'src/pages/japan') === true);
  본다('⛔ 없는 폴더는 거짓', 지면있나(뿌리, 'src/pages/없는나라') === false);
  본다('⛔ 파일을 폴더로 읽지 않는다', 지면있나(뿌리, 'src/pages/about.astro') === false);

  본다('나라표가 비어 있지 않다', 나라표.length >= 1);
  본다('나라표의 줄마다 폴더와 말이 있다',
    나라표.every((x) => x.지면폴더 && Array.isArray(x.있어야할말) && x.있어야할말.length));
  본다('고지 파일 둘을 본다', Object.keys(고지파일).length === 2);

  /* 🔴 오늘 실제로 났던 결함 — 일본 지면이 있는데 꼬리말에 EDINET 이 없던 자리 */
  본다('🔴 지면은 있는데 고지에 말이 없으면 잡는다',
    지면있나(뿌리, 'src/pages/japan') === true && 다들었나('한국 두 곳뿐', ['EDINET']) === false);

  /* 🔴 [2026-09-23 사장님] 「바로바로 반영해. 타이베이 차이나를 live 에 추가해야지」 */
  /* 🔴 이 두 줄이 처음 판에서 떨어졌다 — 정규식이 `</b>` 에서 끊겨 «헛초록»이었다 */
  본다('🔴 태그가 끼어 있어도 본다 (지면의 진짜 꼴)',
    짓는중에남았나('<b>Live</b> — Korea. <b>In build</b> — India, Taiwan and Tokyo.{\' \'}', ['Taiwan']).length === 1);
  본다('🔴 나라가 «앞»에 오는 꼴도 본다 (consts 의 description)',
    짓는중에남았나('Korea live, with China, India, Taiwan and Tokyo in build. Equities…', ['Taiwan']).length === 1);
  본다('여러 대목이면 다 집는다',
    짓는중줄들('In build — A.\nIn build — B.').length === 2);
  본다('⛔ 그 대목이 없으면 빈 벌', 짓는중줄들('Live — Korea only.').length === 0);
  본다('⛔ 빈 것에 안 터진다', 짓는중줄들(null).length === 0 && 짓는중에남았나(null, ['x']).length === 0);
  본다('🔴 연 나라가 In build 에 남아 있으면 잡는다',
    짓는중에남았나('In build — India, Taiwan and Tokyo', ['Taiwan', 'Taipei']).length === 1);
  본다('🔴 고쳤으면 조용하다',
    짓는중에남았나('In build — China A-shares, Hong Kong, India and Saudi Arabia', ['Taiwan', 'Taipei']).length === 0);
  본다('⛔ Live 줄에 있는 이름을 잘못 잡지 않는다',
    짓는중에남았나('<b>Live</b> — Taiwan (TWSE). <b>In build</b> — India.', ['Taiwan']).length === 0);
  본다('파는 말 파일 넷을 본다', 파는말파일.length === 4);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 잰다 ──────────────────────────────────────────── */
{
  const 읽기 = (p) => { try { return fs.readFileSync(path.join(뿌리, p), 'utf8'); } catch { return null; } };
  const 글 = { footer: 읽기(고지파일.footer), about: 읽기(고지파일.about) };

  console.log('■ 새 나라 지면을 내놓고 출처를 안 적었나');
  let 흠 = 0;
  let 못잼 = 0;

  for (const [이름, p] of Object.entries(고지파일)) {
    if (글[이름] == null) { console.log(`   ⬜ ${p} 를 못 읽었다 — 「통과」로 세지 않는다`); 못잼 += 1; }
  }

  for (const 줄 of 나라표) {
    if (!지면있나(뿌리, 줄.지면폴더)) {
      console.log(`   ⬜ ${줄.나라} — 지면이 아직 없다 (${줄.지면폴더})`);
      continue;
    }
    for (const [이름, p] of Object.entries(고지파일)) {
      const 있나 = 다들었나(글[이름], 줄.있어야할말);
      if (있나 === null) continue;                       /* 위에서 이미 셌다 */
      if (있나) { console.log(`   ✅ ${줄.나라} — ${p} 에 ${줄.있어야할말.join('·')} 적혀 있다`); continue; }
      console.log(`   🔴 ${줄.나라} — 지면은 ${줄.지면폴더} 에 있는데 ${p} 에 ${줄.있어야할말.join('·')} 가 없다`);
      흠 += 1;
    }
  }

  for (const 줄 of 늘있어야할말) {
    const p = 고지파일[줄.어디];
    const 있나 = 다들었나(글[줄.어디], 줄.말);
    if (있나 === null) continue;
    if (있나) { console.log(`   ✅ ${줄.무엇} — ${p} 에 적혀 있다`); continue; }
    console.log(`   🔴 ${줄.무엇} — ${p} 에 ${줄.말.join('·')} 가 없다`);
    흠 += 1;
  }

  /* 🔴 연 나라가 아직 「In build」 칸에 남아 있나 (사장님 2026-09-23) */
  console.log('\n■ 연 나라가 아직 「In build」 칸에 남아 있나');
  let 낡음 = 0;
  for (const 줄 of 나라표) {
    if (!지면있나(뿌리, 줄.지면폴더)) continue;
    for (const p of 파는말파일) {
      const 글 = 읽기(p);
      if (글 == null) { console.log(`   ⬜ ${p} 를 못 읽었다 — 「통과」로 세지 않는다`); 못잼 += 1; continue; }
      const 걸림 = 짓는중에남았나(글, 줄.손님이부르는이름 ?? [줄.나라]);
      if (!걸림.length) continue;
      console.log(`   🔴 ${줄.나라} — 지면이 ${줄.지면폴더} 에 있는데 ${p} 의 「In build」에 ${걸림.join('·')} 가 남아 있다`);
      낡음 += 1;
    }
  }
  if (!낡음) console.log('   ✅ 연 나라가 「In build」에 남아 있는 곳 0개');
  흠 += 낡음;

  if (흠) {
    if (낡음) {
      console.log('\n⛔ 파는 말과 가진 것이 어긋난다. 손님이 첫 화면에서 「아직 안 됐구나」를 읽고 나간다.');
      console.log('   ✅ 고치는 법 — 그 나라를 「In build」에서 빼고 「Live」 줄에 넣는다.');
      console.log('      나라 지면을 내는 커밋에서 «같이» 고친다. 사장님 말씀이다 — 「바로바로 반영해」');
    }
    console.log('\n⛔ 손님이 보는 두 자리가 서로 다른 말을 하고 있다.');
    console.log('   ✅ 고치는 법 — src/components/Footer.astro 의 DATA SOURCES 목록과');
    console.log('      src/pages/about.astro 의 「Where the data comes from」에 그 출처를 «같은 커밋에서» 넣는다.');
    console.log('   ⚠ 출처 표시는 예의가 아니라 라이선스의 «의무»다 (EDINET PDL1.0 · DART 공공누리 1유형).');
    process.exit(1);
  }
  if (못잼) { console.log('\n⬜ 못 읽은 파일이 있다 — 「초록」으로 읽지 않는다.'); process.exit(1); }
  console.log('\n✅ 낸 나라의 출처가 고지 두 자리에 다 적혀 있다');
}
