/**
 * 도메인 등록 확인서를 A4 PDF 로 찍는다.
 *
 * 왜 우리가 만드는가
 *   공개 WHOIS 에는 등록인이 **비공개**로 가려져 있어 「누구 소유인지」가 안 보인다.
 *   그런데 세종시가 인터넷신문 등록에서 보려는 것이 바로 그 자리다.
 *   그래서 **계정에 로그인해 실제로 읽은 값**을 그대로 문서로 만든다.
 *
 * ⚠ 이것은 **등록기관이 발급한 letterhead 확인서가 아니다.** 계정 화면 기준 사본이다.
 *   관공서가 원본을 요구하면 support@spaceship.com 에 요청해야 한다 —
 *   그 문안은 `문서\경영 관련\도메인확인서-요청메일.md` 에 있다.
 *   ⛔ 이 사실을 문서에 적는다. 숨기면 그게 더 나쁘다.
 *
 * 쓰는 법
 *   node scripts/make-domain-cert.mjs
 *   node scripts/make-domain-cert.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** 등록기관 계정에서 2026-08-07 12:5x KST 에 직접 읽은 값이다. 손으로 지어낸 것이 아니다. */
export const 도메인들 = [
  { 이름: 'seoulmarkets.com', 등록: '2026-07-31T07:03:07Z', 만료: '2027-07-31T07:03:07Z', 쓰임: '서울마켓닷컴 (인터넷신문 1호 신청)' },
  { 이름: 'kculturewire.com', 등록: '2026-08-05T08:30:17Z', 만료: '2027-08-05T08:30:17Z', 쓰임: '케이컬처와이어 (인터넷신문 2호 신청)' },
  { 이름: '100yearmap.com', 등록: '2026-08-02T06:04:44Z', 만료: '2027-08-02T06:04:44Z', 쓰임: '백년지도' },
  { 이름: 'klifemap.com', 등록: '2026-07-24T09:13:23Z', 만료: '2027-07-24T09:13:23Z', 쓰임: '케이라이프맵' },
  { 이름: 'klifemap.ai', 등록: '2026-07-24T09:13:23Z', 만료: '2028-07-24T09:13:23Z', 쓰임: '케이라이프맵' },
];

export const 등록인 = {
  영문: 'KLifeDesign InC.',
  한글: '주식회사 케이라이프디자인',
  법인등록번호: '164711-0015700',
  사업자등록번호: '456-87-03384',
  주소영문: '101, Commercial Bldg. 1, 441 Namsejong-ro, Boram-dong, Sejong-si, 30150, KR',
  주소한글: '세종특별자치시 남세종로 441, 제상가1동 101호 (보람동, 호려울마을5단지)',
  담당자: 'Intaek Park',
  메일: 'parkintaek@naver.com',
  전화: '+82.1084424994',
};

export const 등록기관 = {
  이름: 'Spaceship, Inc.',
  IANA: '3862',
  누리집: 'https://www.spaceship.com',
  네임서버: ['launch1.spaceship.net', 'launch2.spaceship.net'],
  epp: 'ClientTransferProhibited',
};

/** UTC 를 한국 시각으로 적는다. 관공서 서류에 Z 시각을 그대로 두면 하루가 어긋나 보인다. */
export function 한국시각(iso) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) throw new Error(`시각을 못 읽었다 — ${iso}`);
  const k = new Date(t.getTime() + 9 * 3600 * 1000);
  const 둘 = (n) => String(n).padStart(2, '0');
  return `${k.getUTCFullYear()}-${둘(k.getUTCMonth() + 1)}-${둘(k.getUTCDate())} ${둘(k.getUTCHours())}:${둘(k.getUTCMinutes())} KST`;
}

/** 날짜만 (표에 쓴다) */
export function 한국날짜(iso) {
  return 한국시각(iso).slice(0, 10);
}

export function 문서(찍은날) {
  const 줄 = 도메인들
    .map(
      (d) => `      <tr>
        <td class="dom">${d.이름}</td>
        <td>${한국날짜(d.등록)}</td>
        <td>${한국날짜(d.만료)}</td>
        <td class="use">${d.쓰임}</td>
      </tr>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<title>도메인 등록 확인서 — ${등록인.한글}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Malgun Gothic", "맑은 고딕", sans-serif;
    color: #111; font-size: 10.5pt; line-height: 1.75; margin: 0;
  }
  h1 { font-size: 19pt; letter-spacing: .22em; text-align: center; margin: 0 0 4mm; }
  .sub { text-align: center; color: #555; font-size: 9pt; letter-spacing: .05em; margin-bottom: 10mm; }
  h2 {
    font-size: 11pt; margin: 9mm 0 3mm; padding-bottom: 1.5mm;
    border-bottom: 1.5px solid #111; letter-spacing: .04em;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #b9b9b9; padding: 2.6mm 3mm; text-align: center; vertical-align: middle; }
  th { background: #f2f2f2; font-weight: 700; }
  td.dom { font-family: Consolas, monospace; text-align: center; font-weight: 700; }
  td.use { text-align: center; color: #444; }
  table.kv th { width: 32%; text-align: center; }
  table.kv td { text-align: center; }
  .note {
    margin-top: 4mm; padding: 3.5mm 4mm; border: 1px solid #c9c9c9; background: #fafafa;
    font-size: 9pt; line-height: 1.7; color: #333;
  }
  .note b { color: #000; }
  .sign { margin-top: 12mm; text-align: center; }
  .sign .date { letter-spacing: .1em; margin-bottom: 6mm; }
  .sign .who { font-size: 13pt; font-weight: 700; letter-spacing: .06em; }
  .sign .who small { display: block; font-size: 9pt; font-weight: 400; color: #555; letter-spacing: 0; margin-top: 1.5mm; }
</style>
</head>
<body>

  <h1>도 메 인 등 록 확 인 서</h1>
  <div class="sub">Certificate of Domain Registration</div>

  <h2>1. 등록인 (Registrant)</h2>
  <table class="kv">
    <tr><th>상호 (국문)</th><td>${등록인.한글}</td></tr>
    <tr><th>상호 (영문)</th><td>${등록인.영문}</td></tr>
    <tr><th>법인등록번호</th><td>${등록인.법인등록번호}</td></tr>
    <tr><th>사업자등록번호</th><td>${등록인.사업자등록번호}</td></tr>
    <tr><th>본점 소재지</th><td>${등록인.주소한글}</td></tr>
    <tr><th>영문 주소</th><td>${등록인.주소영문}</td></tr>
    <tr><th>담당자 · 연락처</th><td>${등록인.담당자} · ${등록인.메일} · ${등록인.전화}</td></tr>
  </table>

  <h2>2. 등록 도메인</h2>
  <table>
    <thead>
      <tr><th style="width:30%">도메인</th><th style="width:19%">등록일</th><th style="width:19%">만료일</th><th>용도</th></tr>
    </thead>
    <tbody>
${줄}
    </tbody>
  </table>

  <h2>3. 등록기관 (Registrar)</h2>
  <table class="kv">
    <tr><th>등록기관</th><td>${등록기관.이름}</td></tr>
    <tr><th>IANA ID</th><td>${등록기관.IANA}</td></tr>
    <tr><th>누리집</th><td>${등록기관.누리집}</td></tr>
    <tr><th>네임서버</th><td>${등록기관.네임서버.join(' · ')}</td></tr>
    <tr><th>도메인 상태</th><td>Registered · ${등록기관.epp} (무단 이전 잠금)</td></tr>
  </table>

  <div class="note">
    <b>공개 WHOIS 에 등록인이 보이지 않는 이유</b> — 위 도메인은 모두 <b>등록기관의 개인정보 보호(WHOIS Privacy)</b>가
    적용되어 있어, 공개 조회로는 등록인 정보가 표시되지 않습니다.
    이 확인서는 <b>등록기관 계정에 로그인하여 확인한 실제 등록 정보</b>를 옮겨 적은 것입니다.<br>
    <b>등록인 명의</b> — ${등록인.한글}(${등록인.영문}) 명의로 등록되어 있습니다.<br>
    <b>본 문서의 성격</b> — 등록기관이 발급한 원본 증명서가 아니라 <b>등록인이 작성한 확인서</b>입니다.
    등록기관 발급 원본이 필요한 경우 Spaceship, Inc. 에 별도로 요청할 수 있습니다.
  </div>

  <div class="sign">
    <div class="date">${찍은날}</div>
    <div class="who">
      ${등록인.한글}
      <small>${등록인.주소한글}</small>
      <small>법인등록번호 ${등록인.법인등록번호}</small>
    </div>
  </div>

</body>
</html>`;
}

/* ── 찍기 ─────────────────────────────────────────────────────────── */

async function 하기() {
  const 오늘 = new Date(Date.now() + 9 * 3600 * 1000);
  const 둘 = (n) => String(n).padStart(2, '0');
  const 찍은날 = `${오늘.getUTCFullYear()}년 ${오늘.getUTCMonth() + 1}월 ${오늘.getUTCDate()}일`;
  const 이름날짜 = `${오늘.getUTCFullYear()}${둘(오늘.getUTCMonth() + 1)}${둘(오늘.getUTCDate())}`;

  const html = 문서(찍은날);

  const 낼곳들 = [
    'C:/Users/USER/Documents/경영 관련',
    'C:/Users/USER/Desktop/감수용 리포트-백년지도',
    'C:/Users/USER/OneDrive/감수용 리포트-백년지도',
  ].filter((p) => {
    try { fs.mkdirSync(p, { recursive: true }); return true; } catch { return false; }
  });

  const 임시 = path.join(낼곳들[0], `_도메인등록확인서.html`);
  fs.writeFileSync(임시, html, 'utf8');

  const puppeteer = (
    await import(pathToFileURL('C:/Users/USER/Documents/GitHub/klifemap/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js').href)
  ).default;

  const 브라우저 = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const 쪽 = await 브라우저.newPage();
    await 쪽.goto(pathToFileURL(임시).href, { waitUntil: 'networkidle0' });
    const pdf = await 쪽.pdf({ format: 'A4', printBackground: true });
    for (const 곳 of 낼곳들) {
      const 파일 = path.join(곳, `도메인등록확인서_${이름날짜}.pdf`);
      fs.writeFileSync(파일, pdf);
      console.log(`  → ${파일}`);
    }
  } finally {
    await 브라우저.close();
  }
  fs.unlinkSync(임시);
  console.log(`\n도메인 ${도메인들.length}개 · 등록인 ${등록인.한글}`);
}

/* ── 스스로 검사 ───────────────────────────────────────────────────── */

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 재기 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `\n   본 것 ${JSON.stringify(본것)}\n   바란 것 ${JSON.stringify(바란것)}`}`);
  };

  재기('UTC 07:03 은 한국에서 16:03', 한국시각('2026-07-31T07:03:07Z'), '2026-07-31 16:03 KST');
  재기('날짜가 안 넘어간다', 한국날짜('2026-08-02T06:04:44Z'), '2026-08-02');
  재기('⚠ 밤 시각은 날짜가 넘어간다', 한국날짜('2026-08-02T16:00:00Z'), '2026-08-03');

  let 던졌나 = false;
  try { 한국시각('어제'); } catch { 던졌나 = true; }
  재기('⛔ 못 읽는 시각은 던진다', 던졌나, true);

  const h = 문서('2026년 8월 7일');
  재기('문서에 법인 영문 상호가 있다', h.includes('KLifeDesign InC.'), true);
  재기('문서에 도메인 다섯이 다 있다', 도메인들.every((d) => h.includes(d.이름)), true);
  재기('⛔ 원본이 아니라는 말을 뺄 수 없다', h.includes('등록기관이 발급한 원본 증명서가 아니라'), true);
  재기('가운데 맞춤 — 표 칸이 가운데다', h.includes('text-align: center'), true);

  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

if (!process.argv.includes('--selftest')) await 하기();
