/**
 * make-kcw-score-card.mjs — **경기 사진이 없을 때 쓰는 「점수판」 그림을 짓는다.**
 *
 * ── 🔴🔴 사장님 지시 (2026-10-28, 원문) ───────────────────────────────
 * 「k-review 드라마 등 각 메뉴에도 썸네일 넣어. **연합뉴스 사진만 있으면 스코어와
 *   각 팀의 엠블럼을 사용해서 이미지를 세련되게 만들어**」
 *
 * ⭐ 앞선 지시(「스포츠에선 각 팀의 엠블럼을 사진으로 쓰지말고」)와 어긋나지 않는다.
 *   그때 막으신 것은 **엠블럼을 경기 사진 «대신» 내거는 것**이다.
 *   여기서 짓는 것은 사진이 아니라 **우리가 만든 그림**이고, 엠블럼은 그 안의 부품이다.
 *   ⇒ 사진이 있으면 늘 사진이 먼저다. 이 그림은 **사진이 없을 때만** 쓴다.
 *
 * ⛔ 엠블럼은 «협회가 내는 것»만 받아 둔다 — `public/brand/kbo/<구단코드>.png`.
 *   남의 블로그에서 받은 파일을 쓰지 않는다.
 * ⛔ 점수를 손으로 적지 않는다 — 기사의 머리말(frontmatter)과 제목에서 읽어 온다.
 *
 * 쓰는 법
 *   node scripts/make-kcw-score-card.mjs --글=content/kcw-reviews/kbo-po2-samsung-kia.md --적는다
 *   node scripts/make-kcw-score-card.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const 뿌리 = fileURLToPath(new URL('..', import.meta.url));

/* ── 구단 — 협회 엠블럼 파일 이름과 «구단이 쓰는 색» ────────────────────── */
export const 구단 = {
  '삼성 라이온즈': { 코드: 'SS', 색: '#074CA1', 짧게: '삼성' },
  'KIA 타이거즈': { 코드: 'HT', 색: '#EA0029', 짧게: 'KIA' },
  '두산 베어스': { 코드: 'OB', 색: '#131230', 짧게: '두산' },
  'LG 트윈스': { 코드: 'LG', 색: '#C30452', 짧게: 'LG' },
  '한화 이글스': { 코드: 'HH', 색: '#FF6600', 짧게: '한화' },
  'SSG 랜더스': { 코드: 'SK', 색: '#CE0E2D', 짧게: 'SSG' },
  'NC 다이노스': { 코드: 'NC', 색: '#315288', 짧게: 'NC' },
  'kt wiz': { 코드: 'KT', 색: '#000000', 짧게: 'kt' },
  '롯데 자이언츠': { 코드: 'LT', 색: '#041E42', 짧게: '롯데' },
  '키움 히어로즈': { 코드: 'WO', 색: '#570514', 짧게: '키움' },
};

/**
 * 제목에서 「8대3」 같은 점수를 집는다.
 * ⛔ 「5대1 제압」의 앞 수가 «이긴 팀»이다 — 제목의 맨 앞에 선 팀이 이긴 팀이다.
 */
export function 점수읽기(제목) {
  const m = String(제목 ?? '').match(/(\d{1,2})\s*대\s*(\d{1,2})/);
  if (!m) return null;
  return { 앞: Number(m[1]), 뒤: Number(m[2]) };
}

/**
 * 「… 삼성 라이온즈 대 KIA 타이거즈」에서 두 팀을 집는다.
 * ⚠ 여기서 나오는 차례는 «경기 표기 차례»(원정 대 홈)이지 승패가 아니다.
 */
export function 두팀읽기(명칭) {
  const 이름들 = Object.keys(구단).filter((n) => String(명칭 ?? '').includes(n));
  if (이름들.length !== 2) return null;
  /* 글에 먼저 나오는 쪽을 앞에 둔다 */
  return 이름들.sort((a, b) => String(명칭).indexOf(a) - String(명칭).indexOf(b));
}

/** 제목 맨 앞에 선 팀이 이긴 팀이다. 「삼성, 플레이오프 2차전 KIA 8대3 제압」 */
export function 이긴팀(제목, 두팀) {
  if (!두팀) return null;
  const 자리 = 두팀.map((n) => {
    const 짧 = 구단[n].짧게;
    const i = String(제목).indexOf(짧);
    return i < 0 ? Number.MAX_SAFE_INTEGER : i;
  });
  if (자리[0] === 자리[1]) return null;
  return 자리[0] < 자리[1] ? 두팀[0] : 두팀[1];
}

/** 머리말에서 한 줄 값을 읽는다(얕은 YAML — 「키: "값"」 또는 「키: 값」) */
export function 머리값(글, 키) {
  const m = String(글).match(new RegExp(`^\\s*${키}:\\s*(.+)$`, 'm'));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, '');
}

/** 그림 파일을 글에 그대로 실어 준다 — 바깥 주소를 타지 않으므로 늘 그려진다 */
export function 글로실은그림(길) {
  return `data:image/png;base64,${fs.readFileSync(길).toString('base64')}`;
}

/** 날짜를 「2026년 10월 27일」로 */
export function 날짜글(iso) {
  const t = new Date(iso);
  if (Number.isNaN(+t)) return '';
  return `${t.getFullYear()}년 ${t.getMonth() + 1}월 ${t.getDate()}일`;
}

/** 그림 한 장의 HTML — 크롬이 그려서 찍는다(글꼴이 확실하다) */
export function 그림글(것) {
  const { 왼, 오, 점수왼, 점수오, 이긴쪽, 대회, 날짜, 엠블럼왼, 엠블럼오 } = 것;
  const 흐리게 = (쪽) => (이긴쪽 && 이긴쪽 !== 쪽 ? 'opacity:.45;' : '');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#fff;
       font-family:'Pretendard','Malgun Gothic',system-ui,sans-serif;
       display:flex;flex-direction:column;}
  .bar{height:8px;display:flex}
  .bar i{flex:1}
  .top{padding:46px 64px 0;text-align:center}
  .meet{font-size:23px;letter-spacing:.02em;color:#5b6472;font-weight:600}
  .when{font-size:19px;color:#97a0ad;margin-top:10px}
  .mid{flex:1;display:flex;align-items:center;justify-content:center;gap:52px;padding:0 64px}
  .team{width:330px;text-align:center}
  /* ⚠ 협회가 내는 엠블럼 파일이 81×59 로 작다. 크게 늘리면 뭉개진다 —
     96px 까지만 올리고(1.6배), 모자란 몫은 «점수 글자»가 메운다. */
  .team img{height:96px;object-fit:contain;image-rendering:auto}
  .team .nm{margin-top:18px;font-size:30px;font-weight:800;color:#161b22;letter-spacing:-.01em}
  .sc{font-size:132px;font-weight:800;line-height:1;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
  .vs{font-size:40px;color:#c3cad4;font-weight:700;padding-bottom:26px}
  .foot{padding:0 64px 44px;text-align:center;font-size:19px;color:#97a0ad}
  </style></head><body>
  <div class="bar"><i style="background:${것.색왼}"></i><i style="background:${것.색오}"></i></div>
  <div class="top"><div class="meet">${대회}</div><div class="when">${날짜}</div></div>
  <div class="mid">
    <div class="team" style="${흐리게(왼)}">
      <img src="${엠블럼왼}" alt="">
      <div class="nm">${왼}</div>
      <div class="sc" style="color:${것.색왼}">${점수왼}</div>
    </div>
    <div class="vs">:</div>
    <div class="team" style="${흐리게(오)}">
      <img src="${엠블럼오}" alt="">
      <div class="nm">${오}</div>
      <div class="sc" style="color:${것.색오}">${점수오}</div>
    </div>
  </div>
  <div class="foot">${것.바닥}</div>
  </body></html>`;
}

/* ───────────────────────────── 자가시험 ───────────────────────────── */
function 자가시험() {
  let 통과 = 0; let 실패 = 0;
  const 참 = (이름, 값) => { if (값) { 통과 += 1; } else { 실패 += 1; console.log('🔴 ' + 이름); } };

  참('점수를 집는다', JSON.stringify(점수읽기('삼성, 플레이오프 2차전 KIA 8대3 제압')) === '{"앞":8,"뒤":3}');
  참('띄어쓴 점수도 집는다', JSON.stringify(점수읽기('KIA 5 대 1 승')) === '{"앞":5,"뒤":1}');
  참('점수가 없으면 없다고 한다', 점수읽기('롯데, 이동욱 감독 선임') === null);
  참('두 자리 점수도 집는다', JSON.stringify(점수읽기('두산 12대10')) === '{"앞":12,"뒤":10}');

  const 두팀 = 두팀읽기('2026 KBO 포스트시즌 플레이오프 2차전 삼성 라이온즈 대 KIA 타이거즈');
  참('두 팀을 적힌 차례로 집는다', JSON.stringify(두팀) === '["삼성 라이온즈","KIA 타이거즈"]');
  참('한 팀만 있으면 못 집는다', 두팀읽기('삼성 라이온즈 훈련') === null);

  참('제목 맨 앞의 팀이 이긴 팀이다',
    이긴팀('삼성, 플레이오프 2차전 KIA 8대3 제압…시리즈 1승 1패', 두팀) === '삼성 라이온즈');
  참('⛔ 대조군 — 차례가 바뀌면 이긴 팀도 바뀐다',
    이긴팀('KIA, 플레이오프 1차전 삼성 5대1 제압', 두팀) === 'KIA 타이거즈');

  참('머리말 한 줄을 읽는다', 머리값('---\ntitle: "가나"\ncategory: baseball\n---', 'category') === 'baseball');
  참('따옴표를 벗긴다', 머리값('title: "가나다"', 'title') === '가나다');
  참('날짜를 사람 말로 적는다', 날짜글('2026-10-27T18:30:00+09:00') === '2026년 10월 27일');

  /* 🔴 그림글이 «진 쪽»을 흐리게 하는지 — 눈으로 보기 전에 글로 잰다 */
  const h = 그림글({
    왼: '삼성 라이온즈', 오: 'KIA 타이거즈', 점수왼: 8, 점수오: 3, 이긴쪽: '삼성 라이온즈',
    대회: '시험', 날짜: '시험', 바닥: '시험', 색왼: '#074CA1', 색오: '#EA0029',
    엠블럼왼: 'a.png', 엠블럼오: 'b.png',
  });
  /* ⛔ 「'KIA 타이거즈' 앞에 opacity 가 없다」로 재면 틀린다 — 진 쪽의 style 은
     그 «이름보다 앞»에 적히기 때문이다. 가운데 쌍점(`class="vs"`)으로 좌우를 가른다. */
  const [왼쪽글, 오른쪽글] = h.split('class="vs"');
  참('이긴 쪽은 흐리지 않다', 왼쪽글.includes('opacity') === false);
  참('진 쪽은 흐리다', 오른쪽글.includes('opacity:.45;'));
  참('점수가 둘 다 들어간다', h.includes('>8<') && h.includes('>3<'));
  /* 🔴 엠블럼이 «글에 실려» 들어가야 한다 — file:// 로 넣으면 빈 자리로 찍힌다 */
  const 참그림 = 그림글({ ...{
    왼: '삼성 라이온즈', 오: 'KIA 타이거즈', 점수왼: 8, 점수오: 3, 이긴쪽: '삼성 라이온즈',
    대회: '시험', 날짜: '시험', 바닥: '시험', 색왼: '#074CA1', 색오: '#EA0029',
  }, 엠블럼왼: 'data:image/png;base64,AAA', 엠블럼오: 'data:image/png;base64,BBB' });
  참('엠블럼은 글에 실어 넣는다', (참그림.match(/src="data:image\/png;base64,/g) || []).length === 2);
  참('⛔ 대조군 — file:// 주소가 남아 있으면 안 된다', 참그림.includes('file://') === false);

  console.log(`점수판 짓는 자 — 자가시험 ${통과} 통과 · ${실패} 실패`);
  return 실패 === 0;
}

/* ───────────────────────────── 본 일 ───────────────────────────── */
async function 한다() {
  const 글인자 = (process.argv.find((a) => a.startsWith('--글=')) || '').slice(4);
  const 적는다 = process.argv.includes('--적는다');
  if (!글인자) { console.error('⛔ 쓰는 법: node scripts/make-kcw-score-card.mjs --글=content/kcw-reviews/<파일>.md [--적는다]'); process.exit(1); }

  const 길 = path.isAbsolute(글인자) ? 글인자 : path.join(뿌리, 글인자);
  const 글 = fs.readFileSync(길, 'utf8');
  const 제목 = 머리값(글, 'title');
  const 명칭 = 머리값(글, '  명칭') ?? 머리값(글, '명칭');
  const 일시 = 머리값(글, '  일시') ?? 머리값(글, '일시');

  const 점수 = 점수읽기(제목);
  const 두팀 = 두팀읽기(명칭);
  if (!점수 || !두팀) {
    console.log(`⬜ ${path.basename(길)} — 점수나 두 팀을 못 읽었다. 점수판을 짓지 않는다`);
    console.log(`   제목 «${제목}»  ·  경기 «${명칭}»`);
    process.exit(0);
  }
  const 이긴쪽 = 이긴팀(제목, 두팀);
  /* 제목은 「이긴 팀, … 진 팀 8대3」 차례다. 경기 표기 차례와 다를 수 있으니 맞춰 넣는다 */
  const 점수표 = new Map();
  if (이긴쪽) {
    점수표.set(이긴쪽, Math.max(점수.앞, 점수.뒤));
    점수표.set(두팀.find((n) => n !== 이긴쪽), Math.min(점수.앞, 점수.뒤));
  } else {
    점수표.set(두팀[0], 점수.앞); 점수표.set(두팀[1], 점수.뒤);
  }

  const 엠블럼 = (이름) => path.join(뿌리, 'public', 'brand', 'kbo', `${구단[이름].코드}.png`);
  for (const n of 두팀) {
    if (!fs.existsSync(엠블럼(n))) {
      console.log(`🔴 ${n} 엠블럼이 없다 — ${엠블럼(n)}`);
      console.log('   협회(KBO)가 내는 파일만 받아 둔다. 다른 데서 받아 쓰지 않는다');
      process.exit(1);
    }
  }

  const 것 = {
    왼: 두팀[0], 오: 두팀[1],
    점수왼: 점수표.get(두팀[0]), 점수오: 점수표.get(두팀[1]),
    이긴쪽,
    색왼: 구단[두팀[0]].색, 색오: 구단[두팀[1]].색,
    /* ⛔ `file://` 주소로 넣지 않는다 — `setContent` 로 띄운 지면은 뿌리가 `about:blank` 라
       그 주소를 못 읽고 «엠블럼 자리가 빈 채로» 찍힌다(2026-10-29 에 그렇게 한 장 나왔다).
       ⇒ 파일을 그대로 글에 실어 보낸다. */
    엠블럼왼: 글로실은그림(엠블럼(두팀[0])),
    엠블럼오: 글로실은그림(엠블럼(두팀[1])),
    대회: 명칭.replace(/\s*삼성 라이온즈 대 KIA 타이거즈|\s*KIA 타이거즈 대 삼성 라이온즈/, '')
      .replace(new RegExp(`\\s*${두팀[0]} 대 ${두팀[1]}`), '').trim(),
    날짜: 날짜글(일시),
    바닥: '엠블럼 — 한국야구위원회(KBO) · 점수판 — K Culture Wire',
  };

  const 낼곳 = path.join(뿌리, 'public', 'wikitip', 'review', `${path.basename(길, '.md')}.jpg`);
  console.log(`🟡 ${것.왼} ${것.점수왼} : ${것.점수오} ${것.오}  (이긴 쪽 ${이긴쪽 ?? '모름'})`);
  console.log(`   ${것.대회} · ${것.날짜}`);
  if (!적는다) { console.log('   --적는다 로 그린다'); process.exit(0); }

  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const p = await b.newPage();
  try {
    await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await p.setContent(그림글(것), { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 400));
    await p.screenshot({ path: 낼곳, type: 'jpeg', quality: 92 });
  } finally {
    await p.close();
    b.disconnect();
  }
  /* 자가시험 — 그린 뒤에 «파일이 그림인가»를 잰다. 0바이트도 「썼다」로 끝나지 않는다 */
  const 크기 = fs.statSync(낼곳).size;
  if (크기 < 10000) { console.log(`🔴 그림이 너무 작다(${크기}바이트) — 제대로 안 그려졌다`); process.exit(1); }
  console.log(`✅ ${path.relative(뿌리, 낼곳)} (${Math.round(크기 / 1024)}KB)`);
  console.log('   ⚠ 그린 것으로 끝이 아니다 — 열어서 눈으로 본다');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--selftest') || process.argv.includes('--자가시험')) {
    process.exit(자가시험() ? 0 : 1);
  } else {
    await 한다();
  }
}
