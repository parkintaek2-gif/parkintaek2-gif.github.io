#!/usr/bin/env node
/**
 * 수집-디시댓글.mjs — **리뷰에 전재할 이용자 반응을 디시인사이드에서 수집한다.**
 *
 * ── 🔴🔴 사장님 지시 (2026-10-26, 원문) ───────────────────────────────
 * 「리뷰라고 꼭 비평일 필요는 없다. **오히려 네티즌들의 댓글을 리뷰로 사용하도록 해라.**」
 * 「**넷플릭스 랭킹 등을 보고 소재를 정해**」
 *
 * ── 왜 인벤 말고 여기도 필요한가 ──────────────────────────────────────
 * `수집-인벤댓글.mjs` 는 e스포츠·게임에는 맞지만 드라마·쇼·K-POP 에는 사람이 없다.
 * ⛔ 한 곳에만 기대면 그 한 곳이 조용한 날 리뷰가 통째로 빈다.
 *
 * ── ⛔ 이 도구가 지키는 것 ────────────────────────────────────────────
 * ⛔ **창작하지 않는다.** 원문·작성시각·주소를 기계가 그대로 가져온다. 선별만 사람이 한다.
 * ⛔ 계정명·아이피를 담지 않는다. 전재 대상은 문장이지 개인이 아니다.
 * ⛔ 욕설·비방·인신공격은 **사람이** 걸러 낸다. 기계가 거르면 무엇이 걸러졌는지 아무도 모른다.
 * ⚠ 댓글 끝점은 글 지면이 발급한 `e_s_n_o` 토큰과 쿠키를 요구한다. 둘 중 하나만 빠져도
 *   빈 응답이 온다 — 「댓글이 없다」와 구분되지 않으므로 둘을 반드시 함께 보낸다.
 *
 * [실행] node scripts/수집-디시댓글.mjs <갤러리id>/<글번호> …
 *        node scripts/수집-디시댓글.mjs --검색 "나를 충전해줘"
 *        node scripts/수집-디시댓글.mjs --자가시험
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** 디시가 돌려주는 본문을 사람이 읽는 문장으로 되돌린다 */
export function 본문정리(원문) {
  let s = String(원문 ?? '');
  for (let i = 0; i < 2; i += 1) {
    s = s.replace(/<br\s*\/?>/gi, '\n')
      .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#39;/g, "'");
  }
  return s.replace(/<[^>]+>/g, '').replace(/[ \t]+/g, ' ').trim();
}

/** 디시 글 하나의 주소 — 일반 갤러리와 마이너 갤러리의 길이 다르다 */
export function 글주소(갤러리, 글번호, 마이너) {
  const 밑 = 마이너 ? '/mgallery/board/view/' : '/board/view/';
  return `https://gall.dcinside.com${밑}?id=${encodeURIComponent(갤러리)}&no=${글번호}`;
}

/**
 * 글 1건의 댓글을 가져온다.
 * ⚠ 마이너 갤러리인지 아닌지를 모르면 **둘 다 눌러 본다** — 틀린 길은 글이 없다고 나온다.
 */
export async function 글댓글(갤러리, 글번호) {
  for (const 마이너 of [false, true]) {
    /* eslint-disable no-await-in-loop */
    const 주소 = 글주소(갤러리, 글번호, 마이너);
    const 첫응답 = await fetch(주소, { headers: { 'User-Agent': UA } });
    if (!첫응답.ok) continue;
    const 글 = await 첫응답.text();
    const 토큰 = 글.match(/name="e_s_n_o" value="([^"]+)"/)?.[1];
    if (!토큰) continue;
    const 제목 = (글.match(/<title>([^<]*)<\/title>/)?.[1] ?? '').trim();
    const 쿠키 = (첫응답.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ');

    const 응답 = await fetch('https://gall.dcinside.com/board/comment/', {
      method: 'POST',
      headers: {
        'User-Agent': UA,
        Referer: 주소,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(쿠키 ? { Cookie: 쿠키 } : {}),
      },
      body: `id=${encodeURIComponent(갤러리)}&no=${글번호}&cmt_id=${encodeURIComponent(갤러리)}`
        + `&cmt_no=${글번호}&focus_cno=&focus_pno=&e_s_n_o=${토큰}&comment_page=1&sort=`,
    });
    const 결과 = await 응답.json().catch(() => null);
    const 댓글 = [];
    for (const c of (결과?.comments ?? [])) {
      /* ⛔ 삭제·블라인드된 것은 담지 않는다. 그것은 「있었다」가 아니다.
         🔴 `is_delete` 는 **글자** `"0"` 으로 온다 — 그냥 참거짓으로 보면 «멀쩡한 댓글이
            전부 삭제된 것»으로 읽혀 한 건도 안 담긴다. 실제로 그렇게 비어 나왔다.
            `total_cnt` 는 1인데 담긴 것이 0이면 이 자리를 의심한다. */
      if (!c || c.del_yn === 'Y' || String(c.is_delete) === '1' || !c.memo) continue;
      /* 🔴🔴 **댓글 목록에 광고가 섞여 온다.** 실제로 「백종원, 방송 중단했는데 미국서
         '대박'… 1/20 이전 다음」이 댓글인 척 끼어 있었다. 그것을 그대로 리뷰에 실으면
         **아무도 하지 않은 말을 손님이 네티즌 반응으로 읽는다.** 그보다 나쁜 것이 없다.
         ⇒ 광고 줄에는 **작성시각이 없다.** 시각 없는 것은 댓글이 아니다. */
      if (!String(c.reg_date ?? '').trim()) continue;
      const 내용 = 본문정리(c.memo);
      if (!내용 || 내용 === '- dc official App') continue;
      댓글.push({ 내용, 일시: c.reg_date, 주소 });
    }
    return { 주소, 제목, 댓글, 전체수: 결과?.total_cnt ?? 0 };
  }
  return { 주소: 글주소(갤러리, 글번호, false), 제목: '(못 열었다)', 댓글: [], 전체수: 0 };
}

/** 디시 전체 검색 — 어느 갤러리에 그 말이 올라왔는지 찾는다 */
export async function 글찾기(말) {
  const r = await fetch(`https://search.dcinside.com/post/q/${encodeURIComponent(말)}`, {
    headers: { 'User-Agent': UA },
  });
  const h = await r.text();
  const 찾은것 = [];
  const 규칙 = /<a href="(https:\/\/gall\.dcinside\.com\/[^"]+)"[^>]*class="tit_txt[^"]*"[^>]*>([\s\S]{0,140}?)<\/a>/g;
  for (const m of h.matchAll(규칙)) {
    const 제목 = m[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const 갤러리 = m[1].match(/[?&]id=([^&]+)/)?.[1];
    const 글번호 = m[1].match(/[?&]no=(\d+)/)?.[1];
    if (제목 && 갤러리 && 글번호) 찾은것.push({ 제목: 본문정리(제목), 갤러리, 글번호, 주소: m[1] });
  }
  return 찾은것;
}

/* ───────────────────────────── 자가시험 ───────────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 총건수 = 0; let 실패건수 = 0;
  const 검증 = (항목, 성립) => {
    총건수 += 1;
    if (성립) console.log(`  ✅ ${항목}`);
    else { 실패건수 += 1; console.log(`  ❌ ${항목}`); }
  };
  검증('태그를 걷어 낸다', 본문정리('<b>재밌</b>다') === '재밌다');
  검증('줄바꿈을 살린다', 본문정리('한줄<br>두줄') === '한줄\n두줄');
  검증('두 번 인코딩된 따옴표를 되돌린다', 본문정리('&amp;#039;좋다&amp;#039;') === "'좋다'");
  검증('일반 갤러리 주소', 글주소('drama_new3', 1, false)
    === 'https://gall.dcinside.com/board/view/?id=drama_new3&no=1');
  검증('마이너 갤러리 주소', 글주소('netflix', 2, true)
    === 'https://gall.dcinside.com/mgallery/board/view/?id=netflix&no=2');
  검증('빈 값은 빈 글자로', 본문정리(null) === '');
  /* 🔴 실제로 당한 자리 — 글자 "0" 을 참으로 읽어 멀쩡한 댓글을 전부 버렸다 */
  검증('🔴 is_delete 가 글자 "0" 이면 살아 있는 댓글이다', (() => {
    const c = { is_delete: '0', del_yn: 'N', memo: '재밌다' };
    return !(c.del_yn === 'Y' || String(c.is_delete) === '1' || !c.memo);
  })());
  검증('⛔ 삭제된 댓글은 거른다', (() => {
    const c = { is_delete: '1', del_yn: 'Y', memo: '' };
    return (c.del_yn === 'Y' || String(c.is_delete) === '1' || !c.memo);
  })());
  /* 🔴 실제로 섞여 온 광고 줄 — 작성시각이 없다 */
  검증('🔴 시각 없는 줄(광고)은 댓글이 아니다',
    !String(({ reg_date: '', memo: '백종원, 방송 중단했는데…' }).reg_date ?? '').trim());
  검증('시각이 있으면 댓글이다',
    !!String(({ reg_date: '10.26 13:45:57' }).reg_date ?? '').trim());
  console.log(`\n  ${총건수 - 실패건수}/${총건수} 통과`);
  process.exit(실패건수 ? 1 : 0);
}

const 인자 = process.argv.slice(2);
if (!인자.includes('--자가시험') && 인자.length) {
  const 검색자리 = 인자.indexOf('--검색');
  if (검색자리 >= 0) {
    const 말 = 인자[검색자리 + 1];
    const 찾은것 = await 글찾기(말);
    console.log(`「${말}」 — ${찾은것.length}건`);
    for (const x of 찾은것) console.log(`  ${x.갤러리}/${x.글번호}  ${x.제목}`);
  } else {
    for (const a of 인자) {
      if (!/^[^/]+\/\d+$/.test(a)) continue;
      const [갤러리, 글번호] = a.split('/');
      /* eslint-disable no-await-in-loop */
      const r = await 글댓글(갤러리, 글번호);
      console.log(`\n===== ${a} | ${r.제목}`);
      console.log(`      ${r.주소}  (댓글 ${r.전체수}개)`);
      for (const c of r.댓글) console.log(`  [${c.일시}] ${c.내용}`);
      if (!r.댓글.length) console.log('  (댓글 없음)');
    }
  }
}
