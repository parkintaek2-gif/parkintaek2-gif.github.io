/**
 * measure-click-gap.mjs — **「왜 안 눌리나」를 세 갈래로 갈라 주는 자. 전 유닛이 쓴다.**
 *
 * ── 왜 이 자가 생겼나 (2026-08-24) ────────────────────────────
 * 사장님: 「오늘도 방문자가 거의 없지? 어떻게든 방문자를 늘리자. 스스로 방법을 찾아,
 *          스스로 발전하라. **효과적인 방법을 찾으면 모든 유닛에 공유해라.** 마음이 무겁다」
 *
 * 나는 그동안 「지면이 모자라다」로 보고 지면을 늘려 왔다. 그런데 이 자를 만들어 재 보니
 * **자리마다 병목이 아예 다르다.** 하나로 뭉쳐 「클릭이 없다」로만 보면 손댈 곳을 모른다.
 *
 * ```
 *   순위 1~10위인데 클릭 0    → 순위는 이미 있다. «제목·설명»을 고칠 자리다 (가장 빠르다)
 *   순위 11위 밖              → 제목을 고쳐도 안 보인다. «순위»를 올릴 자리다
 *   노출 자체가 없다          → 위의 둘 다 헛일이다. «색인·수요 맞춤»부터다
 * ```
 *
 * ── 🔴 이 자가 나에게 가르친 것 — 내 진단이 틀렸다 ─────────────
 * 나는 「노출 2,412에 클릭 4니 CTR만 올리면 열두 배」라고 사장님께 올렸다. **그게 틀렸다.**
 * 갈라 보니 —
 * ```
 *   10위 안·클릭 0 노출              346
 *     그중 넷플릭스 «자기 주소»를 치는 물음   259 (75%)  ← 손님은 넷플릭스에 가려는 것이다
 *     내가 고칠 수 있는 것                    87 (25%)  ← 21장에 흩어져 있고 최대가 24다
 * ```
 * 「netflix.com/tudum/top10?week=2024-11-03」을 치는 사람은 우리 제목이 무엇이든 안 누른다.
 * ⛔ **그 노출을 CTR 계산에 넣으면 없는 기회를 만들어 낸다.** 그래서 이 자는 그것을 갈라 낸다.
 * 그리고 남은 87 노출은 8~10위에 있는데, 그 순위의 정상 CTR 이 1~2%다 —
 * **지금 받는 것이 그 순위가 주는 것과 거의 같다.** 내 병목은 제목이 아니라 «노출 총량»이다.
 *
 * ⭐ 반대로 3번 백년지도는 다르다. 4~7위에 「우송대 취업률」·「수원대 취업률」·
 *   「대구 북구 고등학교」처럼 **사람이 뜻을 갖고 치는 말**이 있는데 클릭이 0이다.
 *   4위의 정상 CTR 은 5~8%다 — 거기는 «정말로» 제목을 고칠 자리다.
 *
 * ⇒ **같은 「클릭 0」이 자리마다 다른 뜻이다.** 그것을 갈라 주는 것이 이 자가 하는 일이다.
 *
 * ── 쓰기 (자기 유닛 것으로 바꿔 쓴다) ─────────────────────────
 *   node scripts/measure-click-gap.mjs --사이트=sc-domain:100yearmap.com --집=https://100yearmap.com
 *   node scripts/measure-click-gap.mjs --사이트=sc-domain:seoulmarkets.com --집=https://seoulmarkets.com
 *   node scripts/measure-click-gap.mjs                       (인자 없으면 5번 것)
 *   node scripts/measure-click-gap.mjs --자가시험
 *
 * ⚠ `GOOGLE_APPLICATION_CREDENTIALS` 가 `.env` 에 있어야 한다. 서비스 계정이 그 속성에
 *   등록돼 있어야 하고, 안 돼 있으면 403 이 온다 — 그때는 **「못 쟀다」**로 적는다.
 * ⚠ 검색어는 구글이 **약 15%만** 드러낸다. 그래서 이 자가 보는 노출은 전체보다 적다.
 *   ⛔ 그 차이를 「노출이 줄었다」로 읽지 않는다. 아래 화면에 둘을 같이 적는다.
 */
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import path from 'node:path';

(function 환경파일읽기() {
  try {
    for (const 줄 of readFileSync(path.resolve('.env'), 'utf8').split(/\r?\n/)) {
      const m = 줄.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* 없으면 정상 */ }
})();

const 인자 = (이름, 기본) => {
  const a = process.argv.find((x) => x.startsWith(`--${이름}=`));
  return a ? a.slice(이름.length + 3) : 기본;
};

/**
 * 순위를 갈래로. **문턱을 여기 한 곳에만 둔다** — 화면과 판정이 갈라지지 않게.
 * ⚠ 정상 CTR 은 순위마다 크게 다르다. 그래서 「클릭 0」의 뜻도 순위마다 다르다.
 *   아래 `기대CTR` 은 널리 알려진 어림이다 — **우리가 잰 값이 아니다.** 그래서 그렇게 적는다.
 */
export const 순위칸 = [
  { 이름: '1~3위', 아래: 0, 위: 3, 기대CTR: 10, 판정할까: true, 손댈곳: '제목·설명 (순위는 이미 좋다)' },
  { 이름: '4~10위', 아래: 3, 위: 10, 기대CTR: 3, 판정할까: true, 손댈곳: '제목·설명' },
  /* ⛔ 아래 두 칸은 **손해라고 판정하지 않는다.** 11위 밖에서 클릭이 0 인 것은
     흠이 아니라 그 순위가 원래 그렇다. 여기를 「손해」로 적으면 제목을 고치러 가게 되고,
     제목을 고쳐도 안 보이니 시간만 버린다. 여기서 할 일은 «순위»다 */
  { 이름: '11~20위', 아래: 10, 위: 20, 기대CTR: 0.5, 판정할까: false, 손댈곳: '순위 (제목을 고쳐도 거의 안 보인다)' },
  { 이름: '21위 밖', 아래: 20, 위: Infinity, 기대CTR: 0.1, 판정할까: false, 손댈곳: '순위' },
];

export function 갈래(순위) {
  if (!Number.isFinite(순위) || 순위 <= 0) return null;   // ⛔ 못 잰 것은 0위가 아니다
  for (const c of 순위칸) if (순위 > c.아래 && 순위 <= c.위) return c.이름;
  return null;
}

/**
 * **남의 주소를 찾는 물음인가.** 이것이 이 자의 알맹이다.
 * 사람이 `netflix.com/tudum/...` 를 구글에 치는 것은 «넷플릭스에 가려는 것»이다.
 * 우리가 그 자리에 떠 있어도 우리 제목을 고쳐서 얻을 클릭이 아니다.
 * ⛔ 이것을 안 갈라 내면 없는 기회를 만들어 낸다 — 내가 오늘 사장님께 그 잘못을 올렸다.
 * ⚠ 우리 «자기» 도메인을 치는 것은 다르다 — 그건 우리에게 오려는 것이니 갈라 내지 않는다.
 */
export function 남의주소찾기(말, 내집) {
  const s = String(말 ?? '').toLowerCase();
  if (!s) return false;
  /* ⚠ 나라 도메인을 빠뜨리면 남의 주소가 「고칠 수 있는 것」으로 새어 들어온다 —
     3번 자료로 돌려 보다 `career.go.kr` 이 안 걸려서 알았다. 흔한 꼬리를 두루 본다.
     ⛔ 완벽하지 않다. 못 거르는 것이 있으면 그만큼 「고칠 수 있는 것」이 부풀 뿐이니,
        부푸는 쪽을 알고 읽는다 — 이 자는 기회를 «작게» 보는 쪽으로 틀리지 않는다 */
  const 주소같나 = /https?:\/\/|www\.|\.(com|net|org|io|co|tv|info|gov|edu|kr|jp|cn|me|app|dev)\b|\.(tsv|csv|json|xlsx?|pdf)\b/.test(s);
  if (!주소같나) return false;
  /* 내 도메인을 치는 것은 나에게 오려는 것이다 */
  const 내도메인 = String(내집 ?? '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (내도메인 && s.includes(내도메인)) return false;
  return true;
}

/** 갈래마다 묶는다. ⛔ 순위를 못 잰 줄을 조용히 버리지 않는다 — 「못 잼」 칸에 남긴다 */
export function 칸으로묶기(줄들) {
  const 통 = new Map(순위칸.map((c) => [c.이름, { 이름: c.이름, 검색어: 0, 노출: 0, 클릭: 0 }]));
  통.set('못 잼', { 이름: '못 잼', 검색어: 0, 노출: 0, 클릭: 0 });
  for (const x of 줄들 ?? []) {
    const g = 갈래(x.position) ?? '못 잼';
    const v = 통.get(g);
    v.검색어++; v.노출 += x.impressions ?? 0; v.클릭 += x.clicks ?? 0;
  }
  return [...통.values()].filter((v) => v.검색어 > 0);
}

/**
 * 그 칸이 **손해를 보고 있나**. 「클릭 0」이 아니라 «순위가 주는 것보다 적게 받나»를 본다.
 * ⛔ 「클릭 0이면 문제다」가 아니다. 21위 밖에서 클릭 0 인 것은 정상이다.
 * ⚠ 노출이 적으면 아무 말도 안 한다 — 노출 5에 클릭 0 은 그냥 표본이 없는 것이다.
 */
export const 말할수있는노출 = 30;
export function 손해보나(칸) {
  const c = 순위칸.find((x) => x.이름 === 칸?.이름);
  if (!c) return null;                                  // 못 잼 칸은 판정 안 한다
  if (!c.판정할까) return null;                          // ⛔ 11위 밖은 클릭 0 이 정상이다
  if (!Number.isFinite(칸.노출) || 칸.노출 < 말할수있는노출) return null;  // 표본이 없다
  const 받는CTR = (100 * 칸.클릭) / 칸.노출;
  /* 절반 아래면 손해로 본다. ⚠ 기대CTR 은 우리가 잰 값이 아니라 널리 알려진 어림이다 */
  return 받는CTR < c.기대CTR / 2;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('1위는 첫 칸', 갈래(1) === '1~3위');
  검('3위는 첫 칸', 갈래(3) === '1~3위');
  검('4위는 둘째 칸', 갈래(4) === '4~10위');
  검('10위는 둘째 칸', 갈래(10) === '4~10위');
  검('11위는 셋째 칸', 갈래(11) === '11~20위');
  검('아주 낮아도 칸이 있다', 갈래(400) === '21위 밖');
  /* ⛔ 못 잰 순위를 0위나 1위로 만들지 않는다 */
  검('⭐ 못 잰 순위는 null — 0위가 아니다', 갈래(null) === null && 갈래(0) === null && 갈래(-1) === null);
  /* 칸에 구멍이 없나 — 1위부터 500위까지 다 훑는다 */
  const 빈칸 = [];
  for (let p = 1; p <= 500; p++) if (갈래(p) === null) 빈칸.push(p);
  검('⭐ 1위부터 500위까지 빠지는 순위가 없다', 빈칸.length === 0);

  const 집 = 'https://www.kculturewire.com';
  검('넷플릭스 자기 주소를 가려낸다',
    남의주소찾기('https://www.netflix.com/tudum/top10?week=2024-11-03', 집) === true);
  검('따옴표 붙은 주소도 가려낸다',
    남의주소찾기('"netflix.com/tudum/top10?week=2024-11-03"', 집) === true);
  검('파일 이름도 가려낸다', 남의주소찾기('all-weeks-countries.tsv', 집) === true);
  /* ⭐ 내 도메인을 치는 것은 나에게 오려는 것이다 — 갈라 내면 진짜 기회를 버린다 */
  검('⭐ 우리 도메인을 치는 것은 남의 주소가 아니다',
    남의주소찾기('kculturewire.com', 집) === false);
  검('⭐ www 붙여 쳐도 우리 것이다', 남의주소찾기('www.kculturewire.com/titles', 집) === false);
  검('보통 말은 주소가 아니다', 남의주소찾기('decision to leave netflix country', 집) === false);
  검('빈 것은 주소가 아니다', 남의주소찾기('', 집) === false && 남의주소찾기(null, 집) === false);
  /* 다른 유닛이 써도 같아야 한다 */
  검('3번이 써도 자기 도메인은 안 걸린다',
    남의주소찾기('100yearmap.com 고등학교', 'https://100yearmap.com') === false);
  검('3번이 쓸 때 남의 주소는 걸린다',
    남의주소찾기('career.go.kr', 'https://100yearmap.com') === true);

  const 묶음 = 칸으로묶기([
    { position: 2, impressions: 10, clicks: 1 },
    { position: 8, impressions: 100, clicks: 0 },
    { position: 8, impressions: 50, clicks: 2 },
    { position: 30, impressions: 5, clicks: 0 },
    { position: null, impressions: 3, clicks: 0 },
  ]);
  검('칸마다 묶는다', 묶음.length === 4);
  검('같은 칸을 합친다', 묶음.find((x) => x.이름 === '4~10위').노출 === 150);
  검('클릭도 합친다', 묶음.find((x) => x.이름 === '4~10위').클릭 === 2);
  /* ⛔ 순위를 못 잰 줄을 조용히 버리면 노출 합이 줄고 아무도 모른다 */
  검('⭐ 못 잰 순위 줄을 버리지 않는다', 묶음.find((x) => x.이름 === '못 잼').노출 === 3);
  검('빈 칸은 안 보여 준다', !묶음.some((x) => x.검색어 === 0));
  검('빈 것을 넣어도 안 터진다', 칸으로묶기(null).length === 0);

  /* 손해 판정 — 「클릭 0」이 아니라 «순위가 주는 것보다 적나» 를 본다 */
  검('4~10위에서 노출 많고 클릭 0 이면 손해다',
    손해보나({ 이름: '4~10위', 노출: 200, 클릭: 0 }) === true);
  검('4~10위에서 CTR 3% 면 손해가 아니다',
    손해보나({ 이름: '4~10위', 노출: 200, 클릭: 6 }) === false);
  /* ⛔ 21위 밖에서 클릭 0 은 정상이다 — 이것을 「손해」로 적으면 제목을 고치러 가게 되고,
     제목을 고쳐도 안 보이니 시간만 버린다. 그래서 «판정하지 않는다»(null)로 둔다.
     ⚠ false(손해가 아니다)가 아니라 null(판정 안 했다)이다 — 둘은 다른 말이다 */
  검('⭐ 21위 밖은 아예 판정하지 않는다 — 「손해 아님」이 아니라 「판정 안 함」이다',
    손해보나({ 이름: '21위 밖', 노출: 200, 클릭: 0 }) === null
    && 손해보나({ 이름: '11~20위', 노출: 200, 클릭: 0 }) === null);
  /* ⚠ 노출이 적으면 아무 말도 안 한다 — 「모른다」와 「손해다」는 다른 말이다 */
  검('⭐ 노출이 적으면 판정하지 않는다 — 못 잼이다',
    손해보나({ 이름: '4~10위', 노출: 5, 클릭: 0 }) === null);
  검('문턱 바로 아래는 못 잼, 바로 위는 판정한다',
    손해보나({ 이름: '4~10위', 노출: 말할수있는노출 - 1, 클릭: 0 }) === null
    && 손해보나({ 이름: '4~10위', 노출: 말할수있는노출, 클릭: 0 }) === true);
  검('못 잼 칸은 판정 안 한다', 손해보나({ 이름: '못 잼', 노출: 100, 클릭: 0 }) === null);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ measure-click-gap 자가시험 통과 (31)');
  process.exit(0);
}

const 사이트 = 인자('사이트', 'sc-domain:kculturewire.com');
const 집 = 인자('집', 'https://www.kculturewire.com');
const 일수 = Number(인자('일수', 28));

const 키파일 = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!키파일) { console.error('⛔ GOOGLE_APPLICATION_CREDENTIALS 가 .env 에 없다'); process.exit(1); }
const 키 = JSON.parse(readFileSync(키파일, 'utf8'));

const 지금초 = Math.floor(Date.now() / 1000);
const 머리 = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
const 몸 = Buffer.from(JSON.stringify({
  iss: 키.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  aud: 'https://oauth2.googleapis.com/token', iat: 지금초, exp: 지금초 + 3600,
})).toString('base64url');
const 서명 = createSign('RSA-SHA256').update(`${머리}.${몸}`).sign(키.private_key, 'base64url');
const 토큰답 = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${머리}.${몸}.${서명}`,
  }),
})).json();
if (!토큰답.access_token) { console.error('⛔ 토큰 실패 — 못 쟀다'); process.exit(1); }

const 끝날 = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
const 첫날 = new Date(Date.now() - (일수 + 3) * 864e5).toISOString().slice(0, 10);

async function 물어(차원) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(사이트)}/searchAnalytics/query`,
    { method: 'POST',
      headers: { Authorization: `Bearer ${토큰답.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: 첫날, endDate: 끝날, dimensions: 차원, rowLimit: 25000 }) });
  const j = await r.json();
  if (j.error) return { 못잼: j.error.message };
  return { 줄: j.rows ?? [] };
}

console.log(`■ 왜 안 눌리나 — ${사이트}  (${첫날} ~ ${끝날})\n`);

const 지면답 = await 물어(['page']);
const 검색어답 = await 물어(['query', 'page']);

if (지면답.못잼) {
  console.log(`⛔ **못 쟀다** — ${지면답.못잼.slice(0, 110)}`);
  console.log('   서비스 계정이 이 속성에 등록돼 있지 않을 수 있다. 0 으로 적지 않는다.');
  process.exit(0);
}

const 전체노출 = (지면답.줄 ?? []).reduce((s, x) => s + x.impressions, 0);
const 전체클릭 = (지면답.줄 ?? []).reduce((s, x) => s + x.clicks, 0);
console.log(`전체   노출 ${전체노출} · 클릭 ${전체클릭} · 노출 붙은 지면 ${(지면답.줄 ?? []).length}장`);

if (검색어답.못잼 || !(검색어답.줄 ?? []).length) {
  console.log('\n⛔ **검색어를 못 쟀다.** 구글이 검색어를 안 드러냈거나 노출이 없다.');
  console.log('   ⇒ 이 자리의 병목은 CTR 이 아니라 **노출 총량**이다. 제목을 고칠 일이 아니고');
  console.log('     색인과 「손님이 치는 말」을 맞추는 일이다.');
  process.exit(0);
}

const 줄 = 검색어답.줄;
const 드러난노출 = 줄.reduce((s, x) => s + x.impressions, 0);
console.log(`검색어 드러난 것   노출 ${드러난노출} (전체의 ${(100 * 드러난노출 / Math.max(1, 전체노출)).toFixed(0)}%)`);
console.log('⚠ 구글은 검색어를 일부만 드러낸다. 아래는 «드러난 것»만이다 — 전체가 아니다.\n');

console.log('순위칸       검색어    노출   클릭      CTR   순위가 줄 만한 CTR   판정');
for (const v of 칸으로묶기(줄)) {
  const c = 순위칸.find((x) => x.이름 === v.이름);
  const ctr = v.노출 ? `${(100 * v.클릭 / v.노출).toFixed(2)}%` : '못 잼';
  const 기대 = c ? `${c.기대CTR}%` : '—';
  const 판 = 손해보나(v);
  const 판글 = 판 === null ? '못 잼(표본 적다)' : (판 ? '🔴 손해 본다' : '✅ 순위값만큼 받는다');
  console.log(`${v.이름.padEnd(10)} ${String(v.검색어).padStart(6)} ${String(v.노출).padStart(7)}`
    + ` ${String(v.클릭).padStart(6)} ${ctr.padStart(8)} ${기대.padStart(18)}   ${판글}`);
}
console.log('⚠ 「순위가 줄 만한 CTR」은 널리 알려진 어림이지 **우리가 잰 값이 아니다.**');

/* ── 알맹이 — 10위 안인데 클릭 0 인 것을, «고칠 수 있는 것»과 «없는 것»으로 가른다 ── */
const 위쪽클릭0 = 줄.filter((x) => x.position <= 10 && x.clicks === 0);
const 못고침 = 위쪽클릭0.filter((x) => 남의주소찾기(x.keys[0], 집));
const 고칠것 = 위쪽클릭0.filter((x) => !남의주소찾기(x.keys[0], 집));
const 합 = (a) => a.reduce((s, x) => s + x.impressions, 0);

console.log(`\n■ 10위 안인데 클릭 0 — ${위쪽클릭0.length}줄 · 노출 ${합(위쪽클릭0)}`);
console.log(`   ⛔ 고칠 수 없는 것 (남의 주소를 치는 물음)   ${못고침.length}줄 · 노출 ${합(못고침)}`);
if (못고침.length) {
  console.log('      손님은 그 사이트에 가려는 것이다. 우리 제목을 고쳐도 안 눌린다.');
  console.log('      ⛔ 이 노출을 CTR 계산에 넣으면 «없는 기회»를 만들어 낸다.');
  for (const x of 못고침.sort((a, b) => b.impressions - a.impressions).slice(0, 3)) {
    console.log(`         ${Math.round(x.position)}위 · 노출 ${x.impressions} · 「${String(x.keys[0]).slice(0, 60)}」`);
  }
}
console.log(`   ⭐ 고칠 수 있는 것                            ${고칠것.length}줄 · 노출 ${합(고칠것)}`);

if (!고칠것.length) {
  console.log('      없다. ⇒ 이 자리는 «제목을 고칠 일»이 아니다. 노출 총량이 병목이다.');
} else {
  const 통 = new Map();
  for (const x of 고칠것) {
    const p = (() => { try { return new URL(x.keys[1]).pathname; } catch { return String(x.keys[1]); } })();
    const v = 통.get(p) ?? { 길: p, 노출: 0, 물음: [] };
    v.노출 += x.impressions;
    v.물음.push({ 말: x.keys[0], 노출: x.impressions, 순위: Math.round(x.position) });
    통.set(p, v);
  }
  const 지면 = [...통.values()].sort((a, b) => b.노출 - a.노출);
  console.log(`      지면 ${지면.length}장에 흩어져 있다. 노출 많은 순으로 열 장 —\n`);
  for (const g of 지면.slice(0, 10)) {
    console.log(`   ${g.길}   노출 ${g.노출}`);
    for (const q of g.물음.sort((a, b) => b.노출 - a.노출).slice(0, 2)) {
      console.log(`      ${q.순위}위 · 노출 ${q.노출} · 손님 말 「${q.말}」`);
    }
  }
  /* 🔴 여기서 멈추지 않는다 — 가장 큰 지면 하나가 몇 노출인지 말해 준다.
     그것이 작으면 「제목을 고쳐도 몇 클릭 안 늘어난다」는 뜻이고, 그 말을 해 줘야 한다 */
  const 가장큰것 = 지면[0];
  console.log(`\n   ⚠ 가장 큰 지면이 노출 ${가장큰것.노출} 이다.`);
  if (합(고칠것) < 200) {
    console.log('     ⇒ 다 고쳐도 늘어날 클릭이 한 자리 수다. **이 자리의 병목은 제목이 아니다.**');
    console.log('       노출 총량을 늘리는 일(색인·손님 말 맞추기)이 먼저다. 이 목록은 그 다음이다.');
  } else {
    console.log('     ⇒ 노출이 이만큼 있으면 제목을 고쳐 얻을 것이 있다. 위 목록부터 손댄다.');
  }
}
