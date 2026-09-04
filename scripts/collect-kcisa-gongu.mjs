/**
 * 공유마당(한국저작권위원회) — 만료저작물·사진을 오픈API 로 받아 아카이브한다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 왜 이것이 중요한가
 *   우리 CLAUDE.md 가 못박아 둔 것 — 「소속사 사진처럼 **언론 관행에 기대는 이미지 사용을
 *   하지 않는다**」. 이미지가 없어 못 만들던 지면이 여럿이었다.
 *   **저작권이 만료된 자료는 그 제약 밖이다.** 네 사이트가 다 쓴다.
 *
 * ⚠ 🔴 정직하게 적어 둘 것 — **이 API 에는 «라이선스 칸이 없다»**
 *   내가 브라우저로 잰 「공공누리 제1유형 610,526장」은 «누리집 화면의 필터»로 센 수다.
 *   이 API 가 돌려주는 항목에는 그 유형이 안 실린다.
 *   ⛔ 그러니 «사진» 331,259건을 「상업적으로 써도 된다」고 읽지 않는다.
 *   ✅ «만료저작물» 738,714건은 자료 이름 자체가 「저작권 만료」다 — 그쪽이 안전하다.
 *   ⬜ 사진 쪽의 항목별 유형은 **아직 못 쟀다.** 쓰기 전에 항목 주소(URL)를 열어 확인한다.
 *
 * ⚠ 그리고 IMAGE_OBJECT 가 «비어 있는 항목»이 있다. 첫 항목이 그랬다(FORMAT=Text).
 *   그림이 있는 것과 없는 것을 갈라 세지 않으면 「61만 장」이 허수가 된다.
 */
import fs from 'node:fs';
import path from 'node:path';

export const 갈래들 = [
  { 딱지: 'expired', 이름: '공유마당 만료저작물', 자료번호: 627, 키이름: 'KCISA_GONGU_EXPIRED_KEY', 주소: 'https://api.kcisa.kr/openapi/API_CIA_091/request' },
  { 딱지: 'photo', 이름: '공유마당 사진', 자료번호: 628, 키이름: 'KCISA_GONGU_PHOTO_KEY', 주소: 'https://api.kcisa.kr/openapi/API_CIA_092/request' },
];

/** ⛔ 1 은 504 를 부른다. 이 값 아래로 내리지 않는다 */
export const 한쪽에 = 100;

export function 키읽기(이름, 뿌리 = process.cwd()) {
  const p = path.join(뿌리, '.env');
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, 'utf8').match(new RegExp('^' + 이름 + '=(.+)$', 'm'));
  return m ? m[1].trim() : null;
}

const 벗기기 = (s) => String(s || '').replace(/<!\[CDATA\[|\]\]>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();

/** 한 응답에서 항목들을 뽑는다. ⚠ 칸 이름이 «대문자»다 (TITLE·URL·IMAGE_OBJECT …) */
export function 항목뽑기(xml) {
  const 것들 = [];
  for (const m of String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const 몸 = m[1];
    const 값 = (이름) => {
      const x = 몸.match(new RegExp('<' + 이름 + '>([\\s\\S]*?)</' + 이름 + '>'));
      return x ? (벗기기(x[1]) || null) : null;
    };
    const 제목 = 값('TITLE');
    if (!제목) continue;
    것들.push({
      제목,
      주소: 값('URL'),
      설명: 값('DESCRIPTION'),
      갈래: 값('FORMAT'),
      언어: 값('LANGUAGE'),
      식별자: 값('UCI'),
      만든때: 값('CREATED_DATE'),
      낸때: 값('ISSUED_DATE'),
      그림: 값('IMAGE_OBJECT'),
      영상: 값('VIDEO_OBJECT'),
      제공기관: 값('CNTC_INSTT_NM'),
    });
  }
  return 것들;
}

export function 총건수(xml) {
  const m = String(xml).match(/<totalCount>\s*([0-9]+)\s*</);
  return m ? Number(m[1]) : null;
}
export function 결과코드(xml) {
  const m = String(xml).match(/<resultCode>\s*([^<]*?)\s*</);
  return m ? m[1] : null;
}

/** ⭐ 「그림이 있는 것」과 「이름만 있는 것」을 갈라 센다 — 안 그러면 수가 허수가 된다 */
export function 그림있나(x) {
  return !!(x && typeof x.그림 === 'string' && x.그림.trim().length > 4);
}

export function 오늘딱지(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export async function 받기(키, 주소, 쪽, 개수 = 한쪽에, 다시 = 5) {
  for (let i = 0; i < 다시; i += 1) {
    try {
      const r = await fetch(`${주소}?serviceKey=${encodeURIComponent(키)}&numOfRows=${개수}&pageNo=${쪽}`,
        { signal: AbortSignal.timeout(90000) });
      /* 🔴 504 는 «인증을 통과한 뒤» 뒤가 늦은 것이다 — 다시 청한다. 401 만 멈춘다 */
      if (r.status === 504) { await new Promise((f) => setTimeout(f, 3000 * (i + 1))); continue; }
      const t = await r.text();
      if (r.status === 401) return { 오류: '이 자료의 키가 아니다 (401)' };
      if (!r.ok) { await new Promise((f) => setTimeout(f, 2000 * (i + 1))); continue; }
      return { 글: t };
    } catch { await new Promise((f) => setTimeout(f, 2500 * (i + 1))); }
  }
  return { 오류: '여러 번 청해도 못 받았다' };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
export function 재기() {
  const 참 = []; const 거 = [];
  const 봄 = (이름, 값) => (값 ? 참 : 거).push(이름);

  const xml = '<response><header><resultCode>0000</resultCode></header><body><totalCount>738714</totalCount>'
    + '<items><item><TITLE>&#39;관&#39;자가 새겨진 주칠 대접</TITLE>'
    + '<URL>https://gongu.copyright.or.kr/x?a=1&amp;b=2</URL><DESCRIPTION>\n</DESCRIPTION>'
    + '<FORMAT>Text</FORMAT><LANGUAGE>kor</LANGUAGE><UCI>G706+KCCG01</UCI>'
    + '<ISSUED_DATE>통일신라</ISSUED_DATE><IMAGE_OBJECT>\n</IMAGE_OBJECT>'
    + '<CREATED_DATE>통일신라</CREATED_DATE><CNTC_INSTT_NM>한국저작권위원회</CNTC_INSTT_NM></item></items></body></response>';
  const it = 항목뽑기(xml);
  봄('한 항목을 뽑는다', it.length === 1);
  봄('대문자 칸 이름을 읽는다', !!it[0] && it[0].제공기관 === '한국저작권위원회');
  봄('주소의 &amp; 를 되돌린다', !!it[0] && it[0].주소 === 'https://gongu.copyright.or.kr/x?a=1&b=2');
  봄('🔴 빈 칸은 null 로 둔다 (빈 문자열로 두지 않는다)', !!it[0] && it[0].설명 === null && it[0].그림 === null);
  봄('⭐ 그림이 없는 항목을 «없다»고 센다', 그림있나(it[0]) === false);
  봄('그림이 있으면 있다고 센다', 그림있나({ 그림: 'https://example.com/a.jpg' }) === true);
  봄('그림 칸이 빈칸뿐이면 없다고 센다', 그림있나({ 그림: '   ' }) === false);
  봄('총건수를 읽는다', 총건수(xml) === 738714);
  봄('결과코드를 읽는다', 결과코드(xml) === '0000');
  봄('빈 응답에서 항목을 지어내지 않는다', 항목뽑기('').length === 0);
  봄('제목 없는 항목은 담지 않는다', 항목뽑기('<item><URL>x</URL></item>').length === 0);
  봄('⛔ 한쪽에 를 1 로 두지 않는다 (504 를 부른다)', 한쪽에 >= 5);
  봄('새벽 2시에도 날짜가 안 어긋난다', 오늘딱지(new Date(2026, 0, 1, 2, 30)) === '2026-01-01');
  봄('두 갈래가 «다른 키 이름»을 쓴다', 갈래들[0].키이름 !== 갈래들[1].키이름);
  return { 참: 참.length, 거: 거.length, 틀린것: 거 };
}

const 나인가 = import.meta.url.endsWith(encodeURI(path.basename(String(process.argv[1] || 'x'))));
if (나인가) {
  const r = 재기();
  if (process.argv.includes('--재기')) {
    console.log(`자가시험 ${r.참}/${r.참 + r.거}`);
    if (r.거) { console.log('🔴 틀린 것:'); r.틀린것.forEach((x) => console.log('   · ' + x)); process.exit(1); }
    process.exit(0);
  }
  if (r.거) { console.log(`🔴 자가시험 ${r.거}가지 깨졌다 — 멈춘다`); r.틀린것.forEach((x) => console.log('   · ' + x)); process.exit(1); }
  console.log(`자가시험 ${r.참}/${r.참}\n`);

  const 고른것 = (process.argv.find((a) => a.startsWith('--갈래=')) || '').split('=')[1];
  const 최대쪽 = Number((process.argv.find((a) => a.startsWith('--pages=')) || '').split('=')[1] || 0);
  const 방 = path.join(process.cwd(), 'archive', 'raw', 'kcisa-gongu', 오늘딱지());
  fs.mkdirSync(방, { recursive: true });

  for (const g of 갈래들) {
    if (고른것 && g.딱지 !== 고른것) continue;
    const 키 = 키읽기(g.키이름);
    if (!키) { console.log(`  ⬜ ${g.이름} — .env 에 ${g.키이름} 이 없다`); continue; }
    const 첫 = await 받기(키, g.주소, 1);
    if (첫.오류) { console.log(`  🔴 ${g.이름} — ${첫.오류}`); continue; }
    const 총 = 총건수(첫.글);
    if (결과코드(첫.글) !== '0000') { console.log(`  🔴 ${g.이름} — 결과코드가 0000 이 아니다`); continue; }
    const 끝쪽 = 최대쪽 || Math.ceil((총 || 0) / 한쪽에);
    console.log(`  ${g.이름} — 총 ${총?.toLocaleString()}건 · ${끝쪽}쪽을 받는다`);

    const 본것 = new Map();
    let 못받은쪽 = 0;
    for (let p = 1; p <= 끝쪽; p += 1) {
      const res = p === 1 ? 첫 : await 받기(키, g.주소, p);
      if (res.오류) { 못받은쪽 += 1; continue; }
      for (const x of 항목뽑기(res.글)) {
        const 열쇠 = x.식별자 || `${x.제목}|${x.주소}`;
        if (!본것.has(열쇠)) 본것.set(열쇠, x);
      }
      if (p % 100 === 0) process.stdout.write(`    …${p}/${끝쪽}쪽 · ${본것.size}건\n`);
    }
    const 것들 = [...본것.values()];
    const 그림수 = 것들.filter(그림있나).length;
    fs.writeFileSync(path.join(방, `${g.딱지}.json`), JSON.stringify({
      자료: g.이름, 자료번호: g.자료번호, 주소: g.주소,
      총건수: 총, 받은건수: 것들.length, 못받은쪽,
      그림있는것: 그림수, 이름만있는것: 것들.length - 그림수,
      라이선스: '⬜ 이 API 는 라이선스 칸을 주지 않는다 — 항목 주소를 열어 확인해야 한다',
      잰때: new Date().toLocaleString('ko-KR'), 항목: 것들,
    }, null, 1), 'utf8');
    console.log(`    받은 ${것들.length.toLocaleString()}건 · 그림 있는 것 ${그림수.toLocaleString()} · 이름만 ${(것들.length - 그림수).toLocaleString()} · 못 받은 쪽 ${못받은쪽}`);
  }
  console.log(`\n저장 ${방}`);
  console.log('⚠ 라이선스는 이 API 가 안 준다. 「만료저작물」은 이름 자체가 근거이지만,');
  console.log('  「사진」쪽 항목별 유형은 **아직 못 쟀다** — 쓰기 전에 항목 주소를 연다.');
}
