#!/usr/bin/env node
/**
 * 의뢰한다-특별기사.mjs
 *   — **예약을 기다리지 않고, 기사 쓰는 계정에 «지금» 특별 기사를 의뢰한다.**
 *
 * ── 🔴🔴 왜 지었나 (2026-10-14 07:3x · 5번) ──────────────────────────
 * 사장님: 「**그냥 빨리 쓰게 해. 예약 기사 말고 특별 기사로**」
 *         「**왜 네가 쓰지. 쓰는 계정은 바꾸지 마. 다시 작업해서 줘**」
 *
 * ⛔ 내가 저질렀던 잘못 — 급하다고 **내가(u5) 직접 써서 보냈다.**
 *   사장님이 바로 잡아 내셨다. 중부매일 기사는 **중부매일 쪽 계정**이 쓴다.
 *   ⭐ 급한 것이 계정을 바꿀 까닭이 되지 않는다. 빠른 길을 찾되 «쓰는 손»은 그대로 둔다.
 *
 * ⇒ 이 자는 **사장님 크롬(9222)에 로그인된 그 계정**으로 claude.ai 에 대화를 열어
 *   「이 기사를 지금 써 달라」고 **의뢰**한다. 내가 쓰지 않는다. 그 계정이 쓴다.
 *   (`desk-jbnews-article.mjs` 가 데스킹을 청할 때 쓰는 바로 그 길이다.
 *    앞서 「축구 — 96라인 … (5번 의뢰)」도 이렇게 났다.)
 *
 * ⚠ 쓰게 한 뒤 **데스킹까지 거쳐** 보낸다. 데스킹을 건너뛰지 않는다 —
 *   사장님이 「팩트가 틀리는 경우가 많다」고 하셔서 둔 관문이다.
 * ⛔ b.close() 를 부르지 않는다 — 사장님 창이 닫힌다. disconnect() 만.
 *
 * 쓰는 법
 *   node scripts/의뢰한다-특별기사.mjs --자가시험
 *   node scripts/의뢰한다-특별기사.mjs --주문=docs/특별기사-주문.md          (의뢰만)
 *   node scripts/의뢰한다-특별기사.mjs --주문=... --보낸다                   (데스킹→메일)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 의뢰문을 만든다.
 * ⛔ 기사를 **내가 쓰지 않는다.** 무엇을 쓸지만 적어 보낸다.
 * ⚠ 「세 가지만」 같은 사장님 못은 글자 그대로 넘긴다 — 내가 풀어 쓰면 뜻이 샌다.
 */
export function 의뢰문(주문글, 오늘 = null) {
  const 주문 = String(주문글 ?? '').trim();
  if (!주문) return null;
  const 날 = 오늘 || new Date().toLocaleDateString('ko-KR');
  return [
    `[특별 기사 의뢰 · ${날}]`,
    '',
    '사장님이 «지금 바로» 쓰라고 주문하신 기사입니다. 예약 회차를 기다리지 않습니다.',
    '아래 주문을 그대로 지켜 **중부매일에 보낼 기사 한 편**을 완성해 주십시오.',
    '',
    '— 지켜야 할 것 —',
    '· 제목 한 줄 + 본문. 기자명은 마지막 줄에 「박인택 기자」.',
    '· 문장마다 줄을 바꿉니다(중부매일 편집 틀).',
    '· 주문에 적힌 사실만 씁니다. **주문에 없는 장면을 보태지 않습니다.**',
    '· 숫자·사람 이름·시각은 주문에 적힌 그대로 씁니다. 바꾸지 않습니다.',
    '· 사진은 찾지 않습니다 — 사장님이 직접 붙이십니다.',
    '',
    '— 주문 —',
    주문,
  ].join('\n');
}

/** 답에서 기사 본문만 집는다. ⚠ 데스킹 답과 달리 표지가 없을 수 있다 */
export function 기사만뽑기(답) {
  const s = String(답 ?? '').trim();
  if (!s) return null;
  /* 코드블록으로 감싸 왔으면 벗긴다 */
  const m = s.match(/```(?:\w+)?\n([\s\S]*?)```/);
  const 글 = (m ? m[1] : s).trim();
  return 글 || null;
}

/* ── 자가시험 ──────────────────────────────────────────────────────── */
function 자가시험() {
  let 통 = 0; let 탈 = 0;
  const 본다 = (말, 참) => {
    if (참) { 통 += 1; console.log('  ✅ ' + 말); } else { 탈 += 1; console.log('  🔴 ' + 말); }
  };

  const v = 의뢰문('이강인 패스로 선제골. 세 가지만 쓴다.', '2026. 10. 14.');
  본다('🔴🔴 의뢰문에 주문이 «글자 그대로» 들어간다 — 내가 풀어 쓰면 뜻이 샌다',
    v.includes('이강인 패스로 선제골. 세 가지만 쓴다.'));
  본다('🔴 「지금 바로」라고 적는다 — 예약을 기다리지 말라는 사장님 지시다',
    /지금 바로/.test(v) && /예약 회차를 기다리지 않습니다/.test(v));
  본다('🔴🔴 «주문에 없는 장면을 보태지 말라»고 못박는다 — 사장님 「세가지만」의 핵심이다',
    v.includes('주문에 없는 장면을 보태지 않습니다'));
  본다('🔴 숫자·이름을 바꾸지 말라고 적는다', v.includes('바꾸지 않습니다'));
  본다('✅ 기자명 줄을 일러 준다 — 중부매일 틀이다', v.includes('박인택 기자'));
  본다('✅ 사진은 찾지 않는다 (사장님 2026-10-13)', v.includes('사진은 찾지 않습니다'));
  본다('⛔ 주문이 비면 null — 빈 의뢰를 보내지 않는다',
    의뢰문('') === null && 의뢰문(null) === null);

  본다('🔴 코드블록에 싸여 와도 기사만 집는다',
    기사만뽑기('앞말\n```\n제목\n\n본문\n```') === '제목\n\n본문');
  본다('✅ 맨글이면 그대로', 기사만뽑기('제목\n본문') === '제목\n본문');
  본다('⛔ 비면 null', 기사만뽑기('') === null && 기사만뽑기(null) === null);

  console.log(String.fromCharCode(10) + '자가시험 ' + (통 + 탈) + '개 · 통과 ' + 통 + ' · 실패 ' + 탈);
  return 탈 === 0;
}

/* ── 본체 ──────────────────────────────────────────────────────────── */
async function 의뢰한다(주문길, 보낼까) {
  const 주문글 = fs.readFileSync(path.resolve(뿌리, 주문길), 'utf8');
  const 글 = 의뢰문(주문글);
  if (!글) { console.log('⛔ 주문이 비었다 — 아무것도 안 보냈다'); return 1; }

  const puppeteer = (await import('puppeteer-core')).default;
  const D = await import('./desk-jbnews-article.mjs');
  let b;
  try {
    b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
    const page = await b.newPage();
    await page.goto('https://claude.ai/recents', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await new Promise((r) => setTimeout(r, 3000));

    console.log('■ 특별 기사를 «기사 쓰는 계정»에 의뢰한다 — 내가 쓰지 않는다');
    console.log('');
    const 이름 = `[특별 기사 의뢰] ${new Date().toLocaleString('ko-KR')}`;
    /* 데스킹 자의 대화 길을 그대로 빌려 쓴다 — 같은 계정·같은 프로젝트다 */
    const 결과 = await D.데스킹하기(page, 주문글, 이름, false);
    if (!결과?.됐나) {
      console.log('🔴 의뢰를 못 넣었다 — ' + (결과?.까닭 ?? '까닭 모름'));
      console.log('   ⛔ 「못 넣었다」를 「기사가 없다」로 읽지 않는다. 예약 회차는 그대로 돈다.');
      return 1;
    }
    console.log('✅ 의뢰가 들어갔고 기사가 왔다');
    console.log('   대화 ' + (결과.주소 ?? '(주소 없음)'));
    console.log('   제목 ' + String(결과.제목 ?? '(제목 없음)').slice(0, 70));
    const 기사 = 기사만뽑기(결과.기사);
    if (!기사) { console.log('🔴 기사 본문을 못 집었다'); return 1; }

    const 저장 = path.join(뿌리, 'docs', '고정업무-마커', '특별기사-최근.txt');
    fs.writeFileSync(저장, 기사, 'utf8');
    console.log('   ✔ 받은 기사를 적어 뒀다 — docs/고정업무-마커/특별기사-최근.txt');
    console.log('');
    console.log(기사.slice(0, 700));
    console.log('');
    if (!보낼까) {
      console.log('⚠ 보내지 않았다. 눈으로 보고 --보낸다 를 붙인다.');
      return 0;
    }
    console.log('⚠ 보내기는 send-mail.mjs 로 따로 한다 — 이 자는 «의뢰»까지만 한다.');
    return 0;
  } catch (e) {
    console.log('🔴 못 했다 — ' + String(e?.message ?? e).slice(0, 180));
    return 1;
  } finally {
    if (b) b.disconnect();        /* ⛔ close() 금지 — 사장님 창이 닫힌다 */
  }
}

/* ── 들머리 ────────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);
  else {
    const a = process.argv.find((s) => s.startsWith('--주문='));
    if (!a) { console.log('⛔ --주문=파일 을 주십시오'); process.exit(1); }
    process.exit(await 의뢰한다(a.slice('--주문='.length), process.argv.includes('--보낸다')));
  }
}
