/**
 * 연합뉴스-사진-찾는다.mjs — 중부매일 기사에 붙일 연합뉴스 사진을 «우리가» 찾는다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-10-05 14:1x · 5번] **다섯 번 내리 버려진 진짜 까닭.**
 *
 * 사장님 2026-10-02: 「연합뉴스에 관련 사진이 없는 건 아예 쓰지 말라고 해라」
 * 그래서 데스크가 「사진 못 찾음」이면 막는다. 막는 것은 옳다.
 *
 * ⛔ 그런데 **기사를 쓰는 회차는 연합뉴스를 뒤질 수가 없다.** 못 재는 것을 지키라고
 *   시켜 놓고, 못 지켰다고 버리고 있었다. 10-04 11시부터 10-05 11시까지 다섯 건이
 *   그렇게 사라졌고 사장님은 그 다섯을 못 받으셨다.
 *
 * ⚠ 제가 앞서 「안 치른 경기라서 사진이 없었다」고 짚었는데 **그것은 다섯 중 둘뿐**이다.
 *   나머지 셋은 이미 끝난 경기였는데도 「사진 못 찾음」으로 막혔다. 까닭을 반만 본 것이다.
 *
 * ⭐ 그래서 **자리를 바꾼다** — 사진을 찾는 일을 쓰는 쪽이 아니라 «거두는 쪽»이 한다.
 *   우리는 연합뉴스를 받아 볼 수 있다. 찾으면 붙이고, 없으면 그때 막는다.
 *   그러면 「사진이 없는 건 안 쓴다」는 지시도 지키고, 있는 기사는 안 버린다.
 *
 * ⛔ 사진 «파일»을 내려받지 않는다 — 주소와 제목만 넘긴다. 저작권은 연합뉴스 것이고,
 *   중부매일이 자기 계약으로 그 사진을 쓴다. 우리는 「어느 사진인지」만 알려 준다.
 *
 * 자가시험:  node scripts/연합뉴스-사진-찾는다.mjs --자가시험
 * 손으로:    node scripts/연합뉴스-사진-찾는다.mjs "KIA 한화 역전"
 */
import process from 'node:process';

/** 훑을 연합뉴스 종목 목록 — 중부매일 스포츠가 다루는 것들 */
export const 목록길 = [
  'https://www.yna.co.kr/sports/baseball',
  'https://www.yna.co.kr/sports/football',
  'https://www.yna.co.kr/sports/golf',
  'https://www.yna.co.kr/sports/all',
];

/**
 * 🔴🔴 [2026-10-06 15:1x · 5번] **첫 쪽만 보다가 어제 경기를 놓쳤다.**
 *
 * 오늘 14시 기사 「박정현 한 방에 깨어난 한화 타선…키움에 13-6 역전승」이
 * **데스킹은 통과했는데** 사진을 못 찾아 막혔다(훑은 꼭지 87).
 * 사흘에 넷째다 — 10-04 두 건 · 10-05 한 건 · 오늘 한 건, 전부 같은 까닭이다.
 *
 * 재 보니 목록 지면이 **쪽 넘김이 된다** — /sports/baseball/2 · /3 … 쪽마다 35꼭지.
 * 첫 쪽만 보면 하루치도 안 된다. 어제 경기 사진은 벌써 밀려 내려가 있다.
 * ⇒ 쪽 셋까지 본다. 87 → 250꼭지 안팎.
 *
 * ⛔ 연합뉴스 «검색 API»(ars.yna.co.kr)를 파고들지 않는다 — 열어 놓은 목록 지면을
 *   읽는 것과 내부 창구를 두드리는 것은 다르다. 오늘 내내 따진 잣대를 우리에게도 댄다.
 * ⚠ 쪽을 더 늘리면 연합뉴스에 품이 더 간다. 셋에서 멈추고, 그래도 못 찾으면 못 찾았다고 적는다.
 */
export const 볼쪽수 = 3;

/** 목록 주소에 쪽 번호를 붙인다. 1쪽은 번호 없이 간다(그 꼴이 정본이다) */
export function 쪽붙이기(길, 쪽) {
  const s = String(길 ?? '').replace(/\/+$/, '');
  if (!s) return '';
  return 쪽 <= 1 ? s : `${s}/${쪽}`;
}

/** 볼 주소를 다 편다 — 목록 × 쪽 */
export function 볼주소들(길들 = 목록길, 쪽수 = 볼쪽수) {
  const 것 = [];
  for (const u of 길들 ?? []) {
    for (let p = 1; p <= Math.max(1, 쪽수); p += 1) 것.push(쪽붙이기(u, p));
  }
  return 것;
}

/**
 * 목록 지면 하나에서 «사진이 붙은» 기사만 뽑는다.
 *
 * ⚠ 틀 자리표(`{{IMAGE}}`)가 섞여 있다 — 그것은 사진이 아니다. 걸러야 한다.
 *   실제로 첫 `<img>` 가 그것이어서 처음에 가짜를 집을 뻔했다.
 */
export function 목록뽑기(글) {
  const s = String(글 ?? '');
  const 것들 = [];
  /* 한 꼭지 = `<a … class="img"> … <img src> … <a … class="tit-news">제목</a>` */
  const 꼴 = /<a href="(https:\/\/www\.yna\.co\.kr\/view\/[^"?]+)[^"]*" class="img">([\s\S]{0,900}?)<a href="\1[^"]*" class="tit-news">([\s\S]{0,300}?)<\/a>/g;
  let m;
  while ((m = 꼴.exec(s))) {
    const 사진 = (m[2].match(/<img[^>]*\ssrc="(https:\/\/img\d*\.yna\.co\.kr\/[^"]+)"/) || [])[1];
    if (!사진) continue;                       /* ⛔ 자리표만 있는 꼭지는 버린다 */
    const 제목 = 실체풀기(m[3].replace(/<[^>]+>/g, '')).trim();
    if (!제목) continue;
    것들.push({ 주소: m[1], 사진, 제목 });
  }
  return 것들;
}

/** 글에서 맞대어 볼 «낱말»을 뽑는다 — 숫자·조사·한 글자는 뺀다 */
export function 낱말뽑기(글) {
  return [...new Set(
    String(글 ?? '')
      .replace(/[^\p{Script=Hangul}A-Za-z0-9 ]/gu, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !/^\d+$/.test(w)),
  )];
}

/**
 * 두 제목이 얼마나 겹치나 — 겹친 낱말 수를 센다.
 * ⛔ 비율로 재지 않는다. 긴 제목이 손해를 보면 안 된다.
 *
 * 🔴 **낱말이 똑같아야 한다고 보면 한국어에서는 거의 안 겹친다** — 조사와 어미가 붙는다.
 *   「뒤집기」와 「뒤집기로」가 다른 말로 세어졌고, 그래서 멀쩡한 사진을 못 찾을 뻔했다.
 *   ⇒ 한쪽이 다른 쪽으로 «시작하면» 같은 말로 센다. 둘 다 두 글자 이상일 때만.
 */
export function 같은말인가(a, b) {
  if (a.length < 2 || b.length < 2) return false;
  return a === b || a.startsWith(b) || b.startsWith(a);
}

export function 겹친수(찾는말, 제목) {
  const a = 낱말뽑기(찾는말);
  const b = 낱말뽑기(제목);
  return a.filter((w) => b.some((x) => 같은말인가(w, x))).length;
}

/** 못 박은 선 — 이보다 적게 겹치면 「그 경기 사진」이라고 할 수 없다 */
export const 겹쳐야하는수 = 2;

/**
 * 🔴🔴 **낱말 수만으로는 안 됐다.** 처음 재 봤을 때
 *   「KT, 매직넘버 4 안고 롯데전…배제성 **선발 출격**」이
 *   「[아시안게임] 남자축구 … 이영준·엄지성 등 **선발 출격**」과 두 낱말 겹쳐 맞았다.
 *   야구 기사에 축구 사진을 붙일 뻔했다 — **틀린 사진은 없는 사진보다 나쁘다.**
 *
 * ⇒ 「선발」·「출격」 같은 흔한 말로는 안 되고, **팀·구단 이름이 맞아야** 한다.
 * ⚠ 이 목록을 늘릴 때는 «그 종목을 중부매일이 다루나»를 먼저 본다.
 */
export const 팀이름 = [
  'KIA', 'LG', '두산', '삼성', '롯데', '한화', '키움', 'SSG', 'NC', 'KT',
  '울산', '전북', '포항', '수원', '인천', '대전', '강원', '제주', '광주', '서울',
  '토트넘', '맨유', '맨시티', '리버풀', '아스널', '첼시', '바이에른', '레알', '바르셀로나',
  '한국', '일본', '중국', '대표팀', '청주', '충북', '충남', '세종',
];

/** 겹친 낱말 가운데 «팀 이름»이 하나라도 있나 */
export function 팀이맞나(겹친말들) {
  return 겹친말들.some((w) => 팀이름.some((t) => 같은말인가(w.toUpperCase(), t.toUpperCase())));
}

/** 연합뉴스 제목에 든 글자 실체(`&apos;` 따위)를 푼다 */
export function 실체풀기(글) {
  return String(글 ?? '')
    .replace(/&apos;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');   /* ⛔ 맨 뒤에 둔다 — 먼저 풀면 `&amp;apos;` 가 깨진다 */
}

/**
 * 기사 제목(또는 본문 첫 줄)으로 연합뉴스 사진을 찾는다.
 * @returns {Promise<{찾았나:boolean, 사진?:string, 주소?:string, 제목?:string, 겹침?:number, 본것:number}>}
 */
export async function 사진찾기(찾는말, 옵션 = {}) {
  const 길들 = 옵션.목록길 || 목록길;
  const 받기 = 옵션.받기 || (async (u) => {
    const r = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; KLifeMapBot/1.0)' } });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.text();
  });

  const 모은것 = [];
  for (const u of 볼주소들(길들, 옵션.쪽수 ?? 볼쪽수)) {
    try { 모은것.push(...목록뽑기(await 받기(u))); }
    catch (e) { /* 한 목록이 안 열려도 나머지로 찾는다 — 여기서 멈추면 다 못 찾는다 */ }
  }
  /* 같은 기사가 여러 목록에 나온다 — 주소로 묶는다 */
  const 묶은것 = [...new Map(모은것.map((x) => [x.주소, x])).values()];

  const 찾는낱말 = 낱말뽑기(찾는말);
  let 제일 = null;
  for (const 것 of 묶은것) {
    const 제목낱말 = 낱말뽑기(것.제목);
    const 겹친말들 = 찾는낱말.filter((w) => 제목낱말.some((x) => 같은말인가(w, x)));
    if (겹친말들.length < 겹쳐야하는수) continue;
    /* 🔴 «팀 이름»이 맞아야 그 경기 사진이다 — 「선발 출격」 둘로 야구에 축구 사진을 붙일 뻔했다 */
    if (!팀이맞나(겹친말들)) continue;
    if (!제일 || 겹친말들.length > 제일.겹침) 제일 = { ...것, 겹침: 겹친말들.length };
  }
  return 제일
    ? { 찾았나: true, ...제일, 본것: 묶은것.length }
    : { 찾았나: false, 본것: 묶은것.length };
}

/* ─────────────────────────── 자가시험 ─────────────────────────── */
function 자가시험() {
  let 흠 = 0;
  const 본다 = (이름, 맞나) => { console.log(`  ${맞나 ? '✅' : '🔴'} ${이름}`); if (!맞나) 흠 += 1; };

  const 보기목록 = [
    '<a href="https://www.yna.co.kr/view/AKR111?section=sports/baseball" class="img">',
    '<img src="{{IMAGE}}" alt="">',
    '</a><div class="news-con">',
    '<a href="https://www.yna.co.kr/view/AKR111?section=sports/baseball" class="tit-news">자리표만 있는 꼭지</a>',
    '<a href="https://www.yna.co.kr/view/AKR222?section=sports/baseball" class="img">',
    '<img src="https://img4.yna.co.kr/photo/a.jpg" alt="">',
    '</a><div class="news-con">',
    '<a href="https://www.yna.co.kr/view/AKR222?section=sports/baseball" class="tit-news">KIA, 9회 3점 뒤집기로 3위</a>',
  ].join('\n');

  const 뽑은것 = 목록뽑기(보기목록);
  본다('🔴 자리표(`{{IMAGE}}`)만 있는 꼭지는 버린다', 뽑은것.length === 1);
  본다('사진 주소를 제대로 집는다', 뽑은것[0]?.사진 === 'https://img4.yna.co.kr/photo/a.jpg');
  본다('제목에서 표를 걷는다', 뽑은것[0]?.제목 === 'KIA, 9회 3점 뒤집기로 3위');

  본다('겹친 낱말을 센다', 겹친수('KIA, 9회 3점 뒤집기로 3위…한화는 덜미', 'KIA, 9회 3점 뒤집기로 3위') >= 4);
  본다('⛔ 엉뚱한 경기와는 안 겹친다', 겹친수('손흥민 토트넘 결승골', 'KIA, 9회 3점 뒤집기로 3위') < 겹쳐야하는수);
  본다('한 글자·숫자만인 것은 낱말로 안 센다', !낱말뽑기('KIA 3 9 가').includes('가') && !낱말뽑기('KIA 3').includes('3'));
  /* 🔴 조사·어미가 붙어도 같은 말로 센다 — 이것이 없어서 멀쩡한 사진을 놓칠 뻔했다 */
  본다('🔴 어미가 붙어도 같은 말로 센다', 같은말인가('뒤집기', '뒤집기로') && 같은말인가('한화', '한화는'));
  본다('⛔ 한 글자로는 안 맞춘다', !같은말인가('가', '가나다'));
  /* 🔴🔴 이것이 없어서 야구 기사에 축구 사진을 붙일 뻔했다 */
  본다('🔴 팀 이름이 겹쳐야 같은 경기로 본다', 팀이맞나(['KIA', '뒤집기']) && 팀이맞나(['롯데전']));
  본다('⛔ 흔한 말만 겹친 것은 같은 경기가 아니다', !팀이맞나(['선발', '출격']));
  본다('글자 실체를 푼다', 실체풀기('&apos;9회 3득점&apos;') === "'9회 3득점'");
  본다('⛔ `&amp;` 를 먼저 풀지 않는다', 실체풀기('&amp;apos;') === '&apos;');

  /* 받기를 가짜로 꽂아 끝까지 돌려 본다 — 그물에 안 나가고도 길을 잰다 */
  (async () => {
    const r = await 사진찾기('KIA 9회 뒤집기', { 목록길: ['가짜'], 받기: async () => 보기목록 });
    본다('🔴 끝까지 돌아 사진을 찾아낸다', r.찾았나 && r.사진 === 'https://img4.yna.co.kr/photo/a.jpg');

    const r2 = await 사진찾기('손흥민 결승골', { 목록길: ['가짜'], 받기: async () => 보기목록 });
    본다('⛔ 없는 것을 찾았다고 하지 않는다', r2.찾았나 === false && r2.본것 === 1);

    const r3 = await 사진찾기('KIA 뒤집기', {
      목록길: ['하나', '둘'],
      받기: async (u) => { if (u === '하나') throw new Error('안 열린다'); return 보기목록; },
    });
    본다('🔴 한 목록이 안 열려도 나머지로 찾는다', r3.찾았나 === true);

    console.log(흠 ? `\n🔴 흠 ${흠}` : '\n✅ 자가시험 전부 통과');
    process.exit(흠 ? 1 : 0);
  })();
}

if (process.argv[2] === '--자가시험') { 자가시험(); }
else if (process.argv[2]) {
  const r = await 사진찾기(process.argv.slice(2).join(' '));
  if (r.찾았나) {
    console.log(`✅ 찾았다 (겹친 낱말 ${r.겹침} · 훑은 꼭지 ${r.본것})`);
    console.log(`   제목 ${r.제목}`);
    console.log(`   사진 ${r.사진}`);
    console.log(`   기사 ${r.주소}`);
  } else {
    console.log(`⬜ 못 찾았다 — 훑은 꼭지 ${r.본것}`);
  }
}
