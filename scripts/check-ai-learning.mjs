#!/usr/bin/env node
/**
 * check-ai-learning.mjs — **자체 AI 둘이 «계속 배우고 있나»를 잰다.** (5번, 2026-09-24)
 *
 * ── 🔴🔴 왜 있나 ──────────────────────────────────────────────────────
 * 사장님 (2026-09-24):
 *   「**자체ai(케이라이프맵, 에스마켓츠) 학습 계속 시켜라.**
 *     케이라이프맵은 내가 지시, 수정한 내용도 학습시켜. 사람들이 뭘 궁금해 하는 지,
 *     우리 엔진의 원천인 학술서 및 고전도 학습시켜서 상담시에도 학술적 이해를 토대로
 *     쉽게 답하게 해라. 투자ai는 지금 구축 중인 마켓 데이터를 읽을 수 있고, 그걸로
 *     어떤 종목인 지 판단할 수 있게도 해라. 애널 리포트, 공시, 뉴스 등도 당연히
 *     학습해야 한다:::**매우 중요한 업무이다.**」
 *   「**ai는 업무 시간에는 백에서 계속 학습하고 있어야 한다**」
 *
 * ⭐ 「계속」이 핵심이다. 한 번 붙여 놓고 끝나는 일이 아니다.
 *   실제로 **투자 AI 는 2026-09-15 에 멈춘 채 9일이 지나 있었다** — 담당이던 6번 자리가
 *   없어졌는데 아무도 이어받지 않았고, 멈춘 것을 재는 자가 없어 아무도 몰랐다.
 *   ⇒ 그래서 이 자를 만든다. **사람이 기억해서 확인하지 않는다.**
 *
 * ── 무엇을 재나 ───────────────────────────────────────────────────────
 * 두 AI 를 각각 네 칸으로 잰다. 「있나/없나」가 아니라 «수»로 잰다.
 *   ① 재료가 있나        배울 것이 저장소에 있나
 *   ② 그것을 읽나        AI 가 실제로 그 재료를 참조하나
 *   ③ 새로 쌓이나        오늘도 늘고 있나 (멈추면 여기서 걸린다)
 *   ④ 손님에게 닿나      배운 것이 손님 화면·판단에 나타나나
 *
 * 쓰는 법
 *   node scripts/check-ai-learning.mjs            지금 상태를 잰다
 *   node scripts/check-ai-learning.mjs --자세히    칸마다 까닭을 적는다
 *   node scripts/check-ai-learning.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');
export const 케맵 = path.resolve(뿌리, '..', 'klifemap');

/** 오늘(KST). ⛔ toISOString 을 쓰지 않는다 */
export function 오늘날짜(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 날짜 문자열 사이의 일수 */
export function 며칠차이(앞, 뒤) {
  const 쪼개 = (s) => {
    const m = String(s ?? '').match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const a = 쪼개(앞); const b = 쪼개(뒤);
  if (!a || !b) return null;
  return Math.round((b - a) / 86400000);
}

/** 파일이 있으면 줄 수를, 없으면 null */
export function 줄수(길) {
  try {
    const s = fs.readFileSync(길, 'utf8').trim();
    return s ? s.split('\n').length : 0;
  } catch { return null; }
}

/** 한 칸의 판정 — 수와 함께 「왜」를 남긴다 */
export function 칸(이름, 값, 기준, 까닭) {
  const 됐나 = typeof 기준 === 'function' ? 기준(값) : (값 >= 기준);
  return { 이름, 값, 됐나, 까닭 };
}

/* ═══════════════════ 투자 AI ═══════════════════ */
export function 투자AI를잰다(오늘 = 오늘날짜()) {
  const 방 = path.join(뿌리, 'src', 'data', 'invest-ai');
  let 신호파일 = [];
  try {
    신호파일 = fs.readdirSync(방).filter((n) => /^signals-\d{8}\.jsonl$/.test(n)).sort();
  } catch { /* 방이 없으면 빈 것 */ }

  const 신호수 = 신호파일.reduce((a, n) => a + (줄수(path.join(방, n)) ?? 0), 0);
  const 마지막 = 신호파일.length ? 신호파일[신호파일.length - 1].replace(/^signals-|\.jsonl$/g, '') : null;
  const 며칠됐나 = 마지막 ? 며칠차이(마지막, 오늘) : null;

  /* 마켓 데이터를 읽는 자가 있나 — 「읽는다」는 코드가 실제로 그 파일을 부르는 것이다 */
  const 읽는자 = path.join(뿌리, 'scripts', 'invest-ai', 'read-market-data.mjs');
  const 마켓읽나 = fs.existsSync(읽는자);

  /* 배울 재료 — 우리가 이미 모아 둔 마켓 데이터 */
  const 재료 = ['korea-financials-tape.json', 'korea-disclosures-feed.json',
    'korea-consensus-tape.json', 'korea-valuation-tape.json']
    .filter((n) => fs.existsSync(path.join(뿌리, 'src', 'data', n)));

  return {
    이름: '투자 AI (SeoulMarkets)',
    칸들: [
      칸('① 재료가 있나 — 마켓 데이터', 재료.length, 3,
        `${재료.length}/4 벌 — ${재료.join(' · ') || '없다'}`),
      칸('② 그것을 읽나 — 마켓 데이터 판독기', 마켓읽나 ? 1 : 0, 1,
        마켓읽나 ? 'scripts/invest-ai/read-market-data.mjs 가 있다'
          : '⛔ 없다 — 재무·공시·컨센서스를 한 줄도 안 읽는다'),
      칸('③ 새로 쌓이나 — 마지막 신호', 며칠됐나 === null ? 999 : 며칠됐나, (v) => v <= 1,
        마지막 ? `마지막 ${마지막} (${며칠됐나}일 전)` : '⛔ 신호가 하나도 없다'),
      칸('④ 얼마나 배웠나 — 신호 총수', 신호수, 200, `신호 ${신호수}건 — 200건은 넘어야 판단에 쓸 만하다`),
    ],
  };
}

/* ═══════════════════ KLifeMap AI ═══════════════════ */

/**
 * 🔴 [2026-09-24] 학습 자료는 **저장소가 아니라 OneDrive** 에 있다(사장님 수집물).
 * ⛔ 처음에 이 자를 만들 때 「DB 에 질문 표가 있나」로 쟀다가 **0** 이 나왔는데,
 *   실제로는 `자체AI 학습자료\외국어질문\` 에 26,324줄이 이미 쌓여 있었다.
 *   **엉뚱한 자리를 재면 있는 것도 없다고 나온다.** 자리를 먼저 맞춘다.
 */
export function 학습자료방() {
  const 자리 = [
    'C:/Users/User/OneDrive/KLifeMap 문서/자체AI 학습자료',
    'C:/Users/User/OneDrive/Desktop/KLifeMap 문서/자체AI 학습자료',
    'C:/Users/USER/Desktop/KLifeMap 문서/자체AI 학습자료',
  ];
  return 자리.find((d) => { try { return fs.existsSync(d); } catch { return false; } }) || null;
}

/** 한 폴더 안 파일들의 줄 수 합 */
export function 폴더줄수(방) {
  try {
    return fs.readdirSync(방)
      .filter((n) => /\.(jsonl|json|txt|md)$/i.test(n))
      .reduce((a, n) => a + (줄수(path.join(방, n)) ?? 0), 0);
  } catch { return 0; }
}

/**
 * 🔴 상담이 «실제로» 만드는 시스템 프롬프트를 받아 온다.
 *   klifemap 저장소 안에서 돌린다 — 그쪽 node_modules 와 data/ 를 그대로 쓰게 하기 위해서다.
 *   못 만들면 null 을 돌려준다(그 자체가 빨간불이다 — 조용히 0 으로 만들지 않는다).
 */
export function 상담프롬프트를_실제로_만들어본다() {
  const 한줄 = 'const C=require("./ai/chatCoachEngine.js");'
    + 'const B=require("./ai/bossRules.js");'
    + 'const K=require("./ai/classics.js");'
    + 'const 고전=K.고전지시(K.대목찾기("용신이 뭔가요"));'
    + 'process.stdout.write(C._forMeasure.buildSystemPrompt("없음","","","ko",고전,B.지시글("상담",{lang:"ko"})));';
  try {
    return execFileSync(process.execPath, ['-e', 한줄], {
      cwd: 케맵, encoding: 'utf8', timeout: 20000, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    return null;
  }
}

export function 케맵AI를잰다() {
  const 학습방 = 학습자료방();
  /* ① 고전 말뭉치 — 저장소가 아니라 OneDrive 에 있다(사장님 수집물) */
  const 말뭉치자리 = [
    'C:/Users/User/OneDrive/Desktop/KLifeMap 문서',
    'C:/Users/User/OneDrive/KLifeMap 문서',
    'C:/Users/USER/Desktop/KLifeMap 문서',
  ];
  const 말뭉치 = 말뭉치자리.find((d) => { try { return fs.existsSync(d); } catch { return false; } }) || null;

  /* ②③ 🔴 파일이 «있나»가 아니라 **프롬프트에 실제로 실리나**를 잰다.
     ⚠ 2026-09-24 에 이 자가 `ai/ownerRules.js` 라는 «파일 이름»을 찾고 있었다.
       파일 이름을 맞춰 두면 초록불이 켜지는데, 그 파일이 프롬프트에 안 실려도 모른다.
       같은 병을 감명서에서 겪었다 — sajuFullReport 가 items 를 안 넘겨 상신이 계속 비었고
       내 시험은 items 를 넘겨서 불러 초록불이었다. **실제로 부르는 꼴로 잰다.** */
  const 프롬프트 = 상담프롬프트를_실제로_만들어본다();
  const 고전참조 = 프롬프트 && 프롬프트.includes('[고전 원문') ? 1 : 0;
  const 지시학습 = 프롬프트 && 프롬프트.includes('[사장님이 정하신 것') ? 1 : 0;

  /* ④ 손님 질문 — 🔴 사장님 (2026-09-24): 「**손님 질문은 커뮤니티에서 찾아와야지.
     네이버는 지식인, 네이트나 이런 국내 사이트만 보지말고 각 언어권의 커뮤니티를 봐야지.**」
     ⚠ 이미 쌓인 26,324줄은 **google 자동완성**이다 — 검색어이지 «사람이 던진 질문»이 아니다.
       그래서 자동완성은 세지 않고, «커뮤니티에서 가져온 것»만 센다. */
  const 질문방 = 학습방 ? path.join(학습방, '외국어질문') : null;
  const 점성질문방 = 학습방 ? path.join(학습방, '외국어질문-점성학') : null;
  let 커뮤니티질문 = 0;
  for (const 방 of [질문방, 점성질문방]) {
    if (!방) continue;
    try {
      for (const n of fs.readdirSync(방)) {
        if (/자동완성|_버린것_|_미분류_/.test(n)) continue;      /* 검색어·버린 것은 안 센다 */
        if (!/커뮤니티|reddit|지식인|知恵袋|知乎|community/i.test(n)) continue;
        커뮤니티질문 += 줄수(path.join(방, n)) ?? 0;
      }
    } catch { /* 없으면 0 */ }
  }
  const 자동완성 = (질문방 ? 폴더줄수(질문방) : 0) + (점성질문방 ? 폴더줄수(점성질문방) : 0);

  /* ⑤ 점성학 고전도 배우나 — 사장님: 「상담ai는 명리학과 점성학 다 학습해야 해」 */
  const 점성고전 = 학습방 && fs.existsSync(path.join(학습방, '고전-점성학'))
    ? (fs.readdirSync(path.join(학습방, '고전-점성학')).filter((n) => /\.(txt|md)$/i.test(n)).length) : 0;

  return {
    이름: 'KLifeMap AI',
    칸들: [
      칸('① 재료가 있나 — 고전 말뭉치', 말뭉치 ? 1 : 0, 1,
        말뭉치 ? `있다 — ${말뭉치}` : '⛔ 못 찾았다'),
      칸('② 그것을 읽나 — 상담이 고전을 참조', 고전참조, 1,
        고전참조 ? '상담 프롬프트에 「고전 원문」 칸이 실린다'
          : (프롬프트 === null
            ? '⛔ 상담 프롬프트를 만들어 보지도 못했다'
            : '⛔ 상담 프롬프트에 고전이 한 줄도 없다')),
      칸('③ 사장님 지시·수정을 배우나', 지시학습, 1,
        지시학습 ? '상담 프롬프트에 「사장님이 정하신 것」 칸이 실린다'
          : (프롬프트 === null
            ? '⛔ 상담 프롬프트를 만들어 보지도 못했다 — 상담이 지금 깨져 있다'
            : '⛔ 사장님 지시가 프롬프트에 한 줄도 안 실린다')),
      칸('④ 커뮤니티에서 온 질문', 커뮤니티질문, 500,
        커뮤니티질문 ? `${커뮤니티질문}줄`
          : `⛔ 0 — 쌓인 ${자동완성}줄은 google 자동완성이다(검색어이지 질문이 아니다). `
            + '사장님: 「각 언어권의 커뮤니티를 봐야지」'),
      칸('⑤ 점성학 고전도 배우나', 점성고전, 3,
        점성고전 ? `원전 ${점성고전}벌 — 다만 ②가 0 이면 읽히지 않는다`
          : '⛔ 없다 — 사장님: 「상담ai는 명리학과 점성학 다 학습해야 해」'),
    ],
  };
}

/* ═══════════════════ 화면 ═══════════════════ */
function 그린다(잰것, 자세히) {
  console.log(`\n■ ${잰것.이름}`);
  let 된것 = 0;
  for (const c of 잰것.칸들) {
    console.log(`   ${c.됐나 ? '✅' : '🔴'} ${c.이름.padEnd(34)} ${String(c.값).padStart(5)}`);
    if (자세히 || !c.됐나) console.log(`      ${c.까닭}`);
    if (c.됐나) 된것 += 1;
  }
  console.log(`   ⇒ ${된것}/${잰것.칸들.length}`);
  return { 된것, 전체: 잰것.칸들.length };
}

const 직접돌리나 = (() => {
  try {
    const 나 = decodeURIComponent(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1');
    const 부른것 = String(process.argv[1] || '').replace(/\\/g, '/');
    return Boolean(부른것) && 나.replace(/\\/g, '/').endsWith(부른것.split('/').pop());
  } catch { return false; }
})();

if (직접돌리나 && process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);
  본다('오늘 날짜가 KST 꼴이다', /^\d{4}-\d{2}-\d{2}$/.test(오늘날짜(new Date(2026, 8, 24))));
  /* ⚠ 주석에 적어 둔 «금지 표기»까지 세면 제 설명에 제가 걸린다 — 오늘 이 자가 그랬다.
     주석을 걷고 «코드»만 본다. */
  본다('⛔ toISOString 을 «코드»에서 안 쓴다 (주석의 금지 표기는 세지 않는다)',
    !fs.readFileSync(fileURLToPath(import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
      /* ⚠ 찾는 글자를 쪼개 쓴다 — 이어서 적으면 «이 검사 줄 자신»이 걸린다(실제로 걸렸다) */
      .includes(`toISO${'String()'}`));
  본다('며칠차이 — 같은 날은 0', 며칠차이('2026-09-24', '2026-09-24') === 0);
  본다('며칠차이 — 8자리 꼴도 읽는다', 며칠차이('20260915', '2026-09-24') === 9);
  본다('⛔ 빈 것에 안 터진다', 며칠차이(null, '2026-09-24') === null);
  본다('없는 파일은 null 이다 — 0 으로 세지 않는다', 줄수('C:/없는파일-xyz.jsonl') === null);
  본다('칸 판정 — 기준을 넘으면 참', 칸('보기', 5, 3).됐나 === true);
  본다('칸 판정 — 함수 기준도 쓴다', 칸('보기', 1, (v) => v <= 1).됐나 === true);
  본다('투자 AI 를 잰다', 투자AI를잰다().칸들.length === 4);
  본다('케맵 AI 를 잰다', 케맵AI를잰다().칸들.length === 5);
  본다('🔴 칸마다 «왜»가 적힌다', [...투자AI를잰다().칸들, ...케맵AI를잰다().칸들]
    .every((c) => c.까닭 && c.까닭.length > 3));
  const 떨 = 잰다.filter(([, v]) => !v);
  for (const [이, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이}`);
  console.log(떨.length ? `\n🔴 ${떨.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(떨.length ? 1 : 0);
}

if (직접돌리나) {
  const 자세히 = process.argv.includes('--자세히');
  console.log('■ 자체 AI 둘이 «계속 배우고 있나» — 사장님 2026-09-24');
  console.log('  「ai는 업무 시간에는 백에서 계속 학습하고 있어야 한다」');
  const a = 그린다(투자AI를잰다(), 자세히);
  const b = 그린다(케맵AI를잰다(), 자세히);
  const 된것 = a.된것 + b.된것;
  const 전체 = a.전체 + b.전체;
  console.log(`\n${된것 === 전체 ? '✅' : '🔴'} 모두 ${된것}/${전체}`);
  if (된것 !== 전체) {
    console.log('   ⬜ 빨간 칸이 오늘 할 일이다. 「나중에」가 없다 — 사장님이 「매우 중요한 업무」라 하셨다');
  }
  process.exit(된것 === 전체 ? 0 : 1);
}
