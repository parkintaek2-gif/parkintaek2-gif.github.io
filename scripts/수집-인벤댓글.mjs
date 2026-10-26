#!/usr/bin/env node
/**
 * 수집-인벤댓글.mjs — **리뷰에 전재할 이용자 반응을 인벤 기사에서 수집한다.**
 *
 * ── 🔴🔴 사장님 지시 (2026-10-26, 원문) ───────────────────────────────
 * 「리뷰라고 꼭 비평일 필요는 없다. **오히려 네티즌들의 댓글을 리뷰로 사용하도록 해라.**」
 *
 * ── ⛔ 이 도구가 존재하는 이유 ────────────────────────────────────────
 * 반응을 **손으로 옮겨 적으면 반드시 창작이 섞인다.** 기억으로 요약하거나, 비슷한 말을
 * 다듬어 적게 된다. 그 순간 그 지면의 나머지 전부가 불신 대상이 된다.
 * ⇒ 원문·작성시각·주소를 **기계가 그대로 가져온다.** 선별만 사람이 한다.
 *
 * ⛔ 계정명은 수집하지 않는다. 전재 대상은 문장이지 개인이 아니다.
 * ⛔ 수집한 것을 전부 싣지 않는다 — 욕설·비방·인신공격은 사람이 걸러 낸다.
 *    (기계가 거르면 무엇이 걸러졌는지 아무도 모른다.)
 * ⚠ 인벤 댓글 끝점은 POST 와 쿠키를 요구한다. GET 으로 부르면 「정상적인 접근이 아닙니다」가 온다.
 *
 * [실행] node scripts/수집-인벤댓글.mjs 322553 322554 322557
 *        node scripts/수집-인벤댓글.mjs --자가시험
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * 인벤이 돌려주는 댓글 본문을 사람이 읽는 문장으로 되돌린다.
 * ⚠ `&amp;nbsp;` 처럼 **두 번 인코딩**돼 온다. 한 번만 풀면 「젠지가&nbsp;젠지한」이 남는다.
 */
export function 본문정리(원문) {
  let s = String(원문 ?? '');
  for (let i = 0; i < 2; i += 1) {
    s = s.replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  }
  return s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').trim();
}

/** 기사 1건의 댓글을 가져온다. ⛔ 계정명은 담지 않는다 */
export async function 기사댓글(기사번호, { site = 'lol' } = {}) {
  const 기사주소 = `https://www.inven.co.kr/webzine/news/?news=${기사번호}&site=${site}`;
  /* 쿠키를 먼저 받는다 — 없으면 끝점이 거부한다 */
  const 첫응답 = await fetch(기사주소, { headers: { 'User-Agent': UA } });
  const 쿠키 = (첫응답.headers.getSetCookie?.() ?? [])
    .map((c) => c.split(';')[0]).join('; ');
  const 제목 = (await 첫응답.text()).match(/<title>([^<]*)<\/title>/)?.[1] ?? '';

  const 응답 = await fetch('https://www.inven.co.kr/common/board/comment.json.php', {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Referer: 기사주소,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(쿠키 ? { Cookie: 쿠키 } : {}),
    },
    body: `comeidx=webzine&articlecode=${기사번호}&sortorder=date`,
  });
  const 결과 = await 응답.json();
  if (!결과 || !Array.isArray(결과.commentlist)) return { 기사주소, 제목, 댓글: [] };

  const 댓글 = [];
  for (const 묶음 of 결과.commentlist) {
    for (const c of (묶음.list ?? [])) {
      const 내용 = 본문정리(c.o_comment);
      if (!내용) continue;
      댓글.push({ 내용, 일시: c.o_date, 주소: 기사주소 });
    }
  }
  return { 기사주소, 제목: 제목.replace(/&#039;/g, "'").replace(/&quot;/g, '"'), 댓글 };
}

/**
 * 게시판 글 1건의 댓글을 가져온다. (`https://www.inven.co.kr/board/lol/4625/4269971`)
 * ⚠ 기사와 끝점은 같고 `comeidx` 만 게시판 번호로 바뀐다. 그 번호는 글 지면이 들고 있다.
 */
export async function 게시판댓글(게시판, 글번호, { site = 'lol' } = {}) {
  const 글주소 = `https://www.inven.co.kr/board/${site}/${게시판}/${글번호}`;
  const 첫응답 = await fetch(글주소, { headers: { 'User-Agent': UA } });
  const 쿠키 = (첫응답.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');
  const 글 = await 첫응답.text();
  const 제목 = (글.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').replace(/&#039;/g, "'");
  /* 지면이 스스로 적어 둔 값을 읽는다 — 손으로 짐작하지 않는다 */
  const comeidx = 글.match(/comeidx\s*:\s*'([^']+)'/)?.[1] ?? String(게시판);
  const articlecode = 글.match(/articlecode\s*:\s*(\d+)/)?.[1] ?? String(글번호);

  const 응답 = await fetch('https://www.inven.co.kr/common/board/comment.json.php', {
    method: 'POST',
    headers: {
      'User-Agent': UA,
      Referer: 글주소,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(쿠키 ? { Cookie: 쿠키 } : {}),
    },
    body: `comeidx=${encodeURIComponent(comeidx)}&articlecode=${articlecode}&sortorder=date`,
  });
  const 결과 = await 응답.json().catch(() => null);
  const 댓글 = [];
  for (const 묶음 of (결과?.commentlist ?? [])) {
    for (const c of (묶음.list ?? [])) {
      const 내용 = 본문정리(c.o_comment);
      if (내용) 댓글.push({ 내용, 일시: c.o_date, 주소: 글주소 });
    }
  }
  return { 글주소, 제목, 댓글 };
}

/* ───────────────────────────── 자가시험 ───────────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 총건수 = 0; let 실패건수 = 0;
  const 검증 = (항목, 성립) => {
    총건수 += 1;
    if (성립) console.log(`  ✅ ${항목}`);
    else { 실패건수 += 1; console.log(`  ❌ ${항목}`); }
  };
  /* 🔴 실제로 온 값이다 — 두 번 인코딩된 공백 */
  검증('두 번 인코딩된 공백을 되돌린다',
    본문정리('그냥&amp;nbsp;젠지가&amp;nbsp;젠지한거였고') === '그냥 젠지가 젠지한거였고');
  검증('태그를 걷어 낸다', 본문정리('<b>잘</b>했다') === '잘했다');
  검증('줄바꿈을 살린다', 본문정리('한줄<br>두줄') === '한줄\n두줄');
  검증('빈 값은 빈 글자로', 본문정리(undefined) === '');
  console.log(`\n  ${총건수 - 실패건수}/${총건수} 통과`);
  process.exit(실패건수 ? 1 : 0);
}

if (!process.argv.includes('--자가시험') && process.argv.length > 2) {
  /* `4625/4269971` 처럼 빗금이 있으면 게시판 글, 숫자만이면 기사다 */
  for (const 인자 of process.argv.slice(2)) {
    /* eslint-disable no-await-in-loop */
    if (/^\d+\/\d+$/.test(인자)) {
      const [게시판, 글번호] = 인자.split('/');
      const r = await 게시판댓글(게시판, 글번호);
      console.log(`\n===== ${인자} | ${r.제목}`);
      console.log(`      ${r.글주소}`);
      for (const c of r.댓글) console.log(`  [${c.일시}] ${c.내용}`);
      if (!r.댓글.length) console.log('  (댓글 없음)');
    } else if (/^\d+$/.test(인자)) {
      const r = await 기사댓글(인자);
      console.log(`\n===== ${인자} | ${r.제목}`);
      console.log(`      ${r.기사주소}`);
      for (const c of r.댓글) console.log(`  [${c.일시}] ${c.내용}`);
      if (!r.댓글.length) console.log('  (댓글 없음)');
    }
  }
}
