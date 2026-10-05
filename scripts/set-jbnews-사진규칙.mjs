#!/usr/bin/env node
/**
 * set-jbnews-사진규칙.mjs
 *   — **「사진 없어도 쓴다」를 e스포츠에만 두도록 회차 여섯의 지침을 고친다.**
 *
 * ── 🔴🔴 왜 (2026-10-05 · 5번) — 두 지시가 부딪치고 있었다 ─────────────
 * ```
 *   2026-09-26  회차 지침   「연합뉴스에 사진이 없으면 안 쓴다」
 *   2026-09-28  사장님     「**e스포츠 기사는** 연합뉴스에 사진이 거의 없다. 구단이
 *                          e스포츠협회의 선수 사진이나 경기 사진을 쓸 예정이니
 *                          연합뉴스에 사진이 없어도 중요한 경기는 기사를 쓰게 해라」
 *                         ⇒ 지침을 「사진 없어도 쓴다」로 바꾸고
 *                           「앞선 판은 되살리지 않는다」고 못박았다
 *   2026-10-02  사장님     「연합뉴스에 **관련 사진이 없는 건 아예 쓰지 말라고** 해라」
 *                         ⇒ «거두는 자»가 사진 없는 기사를 막기 시작했다
 * ```
 * 그래서 **쓰는 자는 「써라」, 거두는 자는 「막아라」**가 됐다.
 * 회차는 기사를 쓰고, 거두는 자는 그것을 버린다. 아무도 모른다.
 *
 * 실제로 **이틀에 세 건이 버려졌다** — 전부 프로야구다.
 * ```
 *   2026-10-04 11시  김도영 결승 득점…KIA, 3위 LG에 1경기 차 추격
 *   2026-10-04 14시  KT, 매직넘버 4 안고 롯데전…배제성 선발 출격
 *   2026-10-05 09시  KIA, 9회 3점 뒤집기로 3위…한화는 안방서 키움에 덜미
 * ```
 * ⚠ 셋 다 **프로야구**다. 연합뉴스에 사진이 없을 리 없는 경기다.
 *   09-28 지시는 **「e스포츠 기사는」**으로 시작한다 — e스포츠 이야기였다.
 *   그 예외가 종목 구분 없이 넓게 적혀 있어 프로야구까지 덮고 있었다.
 *
 * ⇒ 이 자가 하는 일 — **예외를 사장님이 말씀하신 자리(e스포츠)로 좁힌다.**
 *   ⛔ 어느 지시도 뒤집지 않는다. 09-28 은 e스포츠에 그대로 살고,
 *     10-02 는 나머지 종목에 그대로 선다.
 *   ⛔ 「사진이 없으면 안 쓴다」를 통째로 되살리지 않는다 — 그러면 09-28 을 어긴다.
 *
 * 쓰는 법
 *   node scripts/set-jbnews-사진규칙.mjs --재본다   (고치지 않고 지금 지침만 본다)
 *   node scripts/set-jbnews-사진규칙.mjs --고친다
 *   node scripts/set-jbnews-사진규칙.mjs --자가시험
 *
 * ⛔ 사장님 크롬 창을 닫지 않는다 — `disconnect()` 만. 언제나 새 탭.
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 요구 = createRequire(import.meta.url);

/** 고칠 회차 여섯 — `collect-jbnews-sports-articles.mjs` 의 온회차와 같아야 한다 */
export const 회차들 = [
  ['09', 'trig_01GeyrdjqmGjtu3cCt6ynZHm'], ['10', 'trig_01QLALBiamUfmxWngeTULv12'],
  ['11', 'trig_01X5A3DCXwYi2T3bBosKTQnk'], ['14', 'trig_01RgAwm6L1q4nBhanUgz3s8N'],
  ['15', 'trig_01EwjhZx3AKXuEyHK82N9DEn'], ['16', 'trig_01ErSZQm2VhuNYMRBi3MCufF'],
];

/** 지금 지침에 든 넓은 예외 — 이 줄을 좁힌 것으로 바꾼다 */
export const 옛줄 = '🔴 **연합뉴스에 사진이 없어도 «중요한 경기»면 쓴다** (사장님 2026-09-28)';

export const 새줄 = '🔴 **e스포츠에 한해** 연합뉴스에 사진이 없어도 «중요한 경기»면 쓴다 (사장님 2026-09-28)\n'
  + '     ⛔⛔ **e스포츠가 아닌 종목은 연합뉴스 사진이 없으면 그 경기를 쓰지 않는다.**\n'
  + '       사장님 2026-10-02: 「연합뉴스에 관련 사진이 없는 건 아예 쓰지 말라고 해라」\n'
  + '       ⇒ 사진이 없으면 **다른 경기로 바꿔서** 쓴다. 사진 없는 채로 써 봐야 버려진다.\n'
  + '       ⚠ 실제로 2026-10-04 두 건과 10-05 한 건이 그렇게 버려졌다 — 전부 프로야구였다.\n'
  + '         회차는 썼는데 사장님은 못 받으셨다.\n'
  + '     ⭐ 09-28 지시는 **「e스포츠 기사는」**으로 시작한다 — e스포츠 이야기였다.';

/* ───────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-10-05 10:5x · 5번] **좁혔는데 10시 회차가 또 사진 없이 썼다.**
 *
 * 09:4x 에 여섯 회차의 예외를 e스포츠로 좁혔다. 그런데 **10:10 에 돈** 10시 회차가
 * 「삼성 완패에 KT 매직넘버 2」를 사진 없이 써서 또 버려졌다 — 고친 «뒤»에 돈 회차다.
 * ⛔ 「고쳤다」를 「막혔다」로 읽지 않는다. 다음 회차를 재서야 안다.
 *
 * 지침을 열어 보고 두 가지를 알았다 —
 *   ① 맨 앞 스물두 줄이 **2026-09-26·27 이틀짜리 예외**다. 아홉 날 지난 지시인데
 *      **글자 하나 안 틀리고 두 번** 들어 있다. 기자가 제일 먼저 읽는 자리가 그것이다.
 *   ② 사진 규칙은 10% 자리에 있다 — §1 «안»이지만 머리가 아니라 중간이다.
 *      기자는 경기를 «고른 뒤»에 그 줄을 만난다. 고르기 전에 읽어야 듣는다.
 *
 * ⇒ 지난 지시를 걷어 내고, 사진 규칙 한 줄을 **§1 머리**에 세운다.
 *   ⛔ 긴 설명은 그대로 둔다 — 까닭을 지우면 다음 사람이 되살린다.
 * ─────────────────────────────────────────────────────────────────────── */

/** 지난 이틀짜리 예외 — 맨 앞에 «두 번» 들어 있다 */
export const 지난예외머리 = '🔴🔴 **오늘이 2026-09-26 이거나 2026-09-27 이면 이 절을 통째로 건너뛰고 1번으로 간다.**';
/** 그 덩이의 끝 — 여기까지가 한 덩이다 */
export const 지난예외꼬리 = '⛔ 2026-09-28(월)부터는 이 예외가 끝난다 — 아래 상시 규칙으로 돌아간다.';

/** §1 머리에 세울 한 줄 — 기자가 «고르기 전»에 읽어야 한다 */
export const 고르기규칙 = [
  '🔴🔴 **고르기 전에 사진부터 본다.** e스포츠가 아니면 **연합뉴스에 그 경기 사진이 있는 것만** 고른다',
  '(사장님 2026-10-02 「연합뉴스에 관련 사진이 없는 건 아예 쓰지 말라고 해라」).',
  '사진이 없으면 **그 경기를 버리고 다른 경기를 고른다.** 사진 없이 써 봐야 데스크가 버린다 —',
  '2026-10-04 두 건, 2026-10-05 두 건이 그렇게 버려졌고 사장님은 그 넷을 못 받으셨다.',
  '',
].join('\n');

/**
 * 지난 지시를 걷고 고르기 규칙을 §1 머리에 세운다.
 * ⛔ 꼬리를 못 찾으면 **안 걷는다** — 반만 지우면 설명만 남아 더 헷갈린다.
 */
export function 머리손질(글) {
  let s = String(글 ?? '');
  let 걷은수 = 0;

  for (let 돌이 = 0; 돌이 < 10; 돌이 += 1) {
    const i = s.indexOf(지난예외머리);
    if (i < 0) break;
    const j = s.indexOf(지난예외꼬리, i);
    if (j < 0) break;
    s = s.slice(0, i) + s.slice(j + 지난예외꼬리.length).replace(/^\n+/, '\n');
    걷은수 += 1;
  }

  const 일절 = '### 1. 무엇을 쓸지 «내가» 고른다\n';
  let 세웠나 = false;
  if (!s.includes('고르기 전에 사진부터 본다') && s.includes(일절)) {
    s = s.replace(일절, `${일절}\n${고르기규칙}`);
    세웠나 = true;
  }
  return { 글: s, 걷은수, 세웠나 };
}

/** 지침 글에서 그 줄을 좁힌 것으로 바꾼다. ⛔ 못 찾으면 null — 아무 데나 넣지 않는다 */
export function 고친글(글) {
  const s = String(글 ?? '');
  /* 🔴 **이미 고쳤나를 «먼저» 본다.** 고치고 나면 옛 줄이 사라지므로,
     옛 줄부터 찾으면 두 번째 돌릴 때 「그 줄이 없다」로 떨어진다(자가시험이 잡았다). */
  if (s.includes('e스포츠에 한해')) return { 글: s, 이미했나: true };
  if (!s.includes(옛줄)) return null;
  return { 글: s.split(옛줄).join(새줄), 이미했나: false };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 진 = [];
  const 본다 = (이름, 참) => { if (참) 통 += 1; else 진.push(이름); };

  const 앞 = `앞글\n   - ${옛줄}\n     원문: 「…」\n뒷글`;
  const r = 고친글(앞);
  본다('🔴 그 줄을 찾아 바꾼다', r && r.이미했나 === false);
  본다('🔴 e스포츠로 좁힌다', r.글.includes('e스포츠에 한해'));
  본다('🔴 다른 종목은 안 쓴다고 못박는다', r.글.includes('e스포츠가 아닌 종목은'));
  본다('🔴 10-02 지시 원문을 적는다', r.글.includes('2026-10-02'));
  본다('🔴 09-28 지시를 안 지운다 — 그대로 산다', r.글.includes('2026-09-28'));
  본다('⛔ 「사진이 없으면 안 쓴다」를 통째로 되살리지 않는다',
    !/^\s*연합뉴스에 사진이 없으면 안 쓴다/m.test(r.글));
  본다('앞뒤 글은 그대로다', r.글.startsWith('앞글') && r.글.endsWith('뒷글'));
  본다('⛔ 그 줄이 없으면 null — 아무 데나 넣지 않는다', 고친글('딴 글') === null);
  본다('⛔ 빈 글도 null', 고친글('') === null && 고친글(null) === null);
  본다('🔴 두 번 고치지 않는다', 고친글(r.글).이미했나 === true);
  본다('회차가 여섯이다', 회차들.length === 6);
  본다('⛔ 같은 회차를 두 번 적지 않았다',
    new Set(회차들.map(([, t]) => t)).size === 회차들.length);
  /* 🔴 거두는 자의 목록과 어긋나면 어느 한쪽이 빠진다 — 글자로 맞대어 본다.
     ⛔ `import` 로 읽지 않는다. 이 자가 자가시험만 돌 때 그 자까지 끌어올 까닭이 없다. */
  const 거두는자 = 요구('node:fs')
    .readFileSync(path.join(뿌리, 'scripts', 'collect-jbnews-sports-articles.mjs'), 'utf8');
  const 빠진것 = 회차들.filter(([, t]) => !거두는자.includes(t));
  본다(`🔴 거두는 자의 온회차와 같다${빠진것.length ? ` (${빠진것.map(([시]) => 시).join(',')})` : ''}`,
    빠진것.length === 0);

  /* 🔴 머리 손질 — 2026-10-05 10:5x */
  const 겹친머리 = [지난예외머리, '설명 줄', 지난예외꼬리,
    지난예외머리, '설명 줄', 지난예외꼬리,
    '- 토·일이면 멈춘다', '', '### 1. 무엇을 쓸지 «내가» 고른다', '본문'].join('\n');
  const h = 머리손질(겹친머리);
  본다('🔴 지난 예외를 «두 덩이 다» 걷는다', h.걷은수 === 2);
  본다('⛔ 걷은 뒤 그 글자가 안 남는다',
    !h.글.includes(지난예외머리) && !h.글.includes(지난예외꼬리));
  본다('✅ 토·일 규칙은 안 걷는다 — 그것은 상시 규칙이다', h.글.includes('토·일이면 멈춘다'));
  본다('🔴 고르기 규칙을 §1 머리에 세운다', h.세웠나 === true);
  /* ⛔ 「들어 있다」가 아니라 «§1 바로 뒤»인지를 본다 — 아무 데나 들어가면 안 읽힌다 */
  본다('🔴 §1 «바로 뒤»에 선다',
    h.글.includes('### 1. 무엇을 쓸지 «내가» 고른다\n\n🔴🔴 **고르기 전에 사진부터 본다'));
  본다('⛔ 두 번 세우지 않는다', 머리손질(h.글).세웠나 === false);
  본다('⛔ 걸 자리가 없으면 안 세운다', 머리손질('아무 글').세웠나 === false);
  본다('⛔ 빈 글에도 안 터진다', 머리손질(null).걷은수 === 0);
  본다('🔴 꼬리를 못 찾으면 안 걷는다 — 반만 지우면 더 헷갈린다',
    머리손질(`${지난예외머리}\n꼬리 없음`).걷은수 === 0);

  console.log(진.length ? `🔴 ${진.length} 떨어졌다 —\n  ${진.join('\n  ')}` : `✅ 자가시험 ${통} 통과`);
  process.exit(진.length ? 1 : 0);
}

if (내가실행됐다) {
  const 고칠까 = process.argv.includes('--고친다');
  if (!고칠까 && !process.argv.includes('--재본다')) {
    console.log('⛔ 쓰는 법: node scripts/set-jbnews-사진규칙.mjs --재본다 | --고친다');
    process.exit(1);
  }

  const puppeteer = 요구('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();          /* ⛔ 사장님 탭을 쓰지 않는다 */
  try {
    await page.goto('https://claude.ai/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const 조직 = await page.evaluate(async () => {
      const r = await fetch('/api/bootstrap', { headers: { accept: 'application/json' } });
      if (!r.ok) return null;
      const j = await r.json();
      return j?.account?.memberships?.[0]?.organization?.uuid ?? null;
    });
    if (!조직) { console.log('🔴 조직을 못 찾았다 — 크롬에 로그인돼 있나 본다'); process.exit(1); }

    let 고친수 = 0; let 이미 = 0; let 못찾음 = 0;
    for (const [시, trig] of 회차들) {
      const 받은것 = await page.evaluate(async (org, t) => {
        const res = await fetch(`/api/organizations/${org}/cowork/scheduled_tasks/${t}`,
          { headers: { accept: 'application/json' } });
        if (!res.ok) return { 흠: res.status };
        return { 몸: await res.json() };
      }, 조직, trig);
      if (받은것.흠) { console.log(`  ${시}시 🔴 못 읽었다 (${받은것.흠})`); 못찾음 += 1; continue; }

      /* 🔴 [2026-10-05] 지침은 `derived_state.prompt` 에 있고, 쓸 때는 **`{ prompt }` 한 칸**이다.
         `session_request` 를 통째로 보냈다가 「bound_session_template_version is required」로
         여섯 번 다 400 이 났다. ⭐ `set-asiangames-evening.mjs` 가 쓰는 길을 그대로 따른다. */
      const 몸 = 받은것.몸?.trigger ?? 받은것.몸;
      const 지금지침 = String(몸?.derived_state?.prompt ?? '');
      const r = 고친글(지금지침);
      /* ⛔ 좁히기가 이미 돼 있어도 **머리 손질은 따로** 본다 —
         둘을 한 깃발로 묶었다가 「이미 했다」로 건너뛰면 머리가 영영 안 고쳐진다 */
      const h = 머리손질(r ? r.글 : 지금지침);
      const 바뀐글 = h.글;
      const 한일 = [
        r && !r.이미했나 ? 'e스포츠로 좁힘' : null,
        h.걷은수 ? `지난 예외 ${h.걷은수}덩이 걷음` : null,
        h.세웠나 ? '고르기 규칙을 §1 머리에' : null,
      ].filter(Boolean).join(' · ');
      if (!한일) {
        if (!r) { console.log(`  ${시}시 ⬜ 고칠 자리가 없다 (지침 ${지금지침.length}자)`); 못찾음 += 1; }
        else { console.log(`  ${시}시 ✅ 이미 다 돼 있다`); 이미 += 1; }
        continue;
      }
      if (!고칠까) { console.log(`  ${시}시 ⭐ ${한일} (${지금지침.length} → ${바뀐글.length}자)`); 고친수 += 1; continue; }

      const 낸것 = await page.evaluate(async (org, t, prompt) => {
        const res = await fetch(`/api/organizations/${org}/cowork/scheduled_tasks/${t}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        return { ok: res.ok, status: res.status, 글: (await res.text()).slice(0, 200) };
      }, 조직, trig, 바뀐글);
      if (!낸것.ok) { console.log(`  ${시}시 🔴 못 고쳤다 (${낸것.status}) ${낸것.글}`); 못찾음 += 1; continue; }

      /* ⛔ 「썼다」를 믿지 않는다 — 다시 읽어서 «실제로 들어갔나»를 본다 */
      const 다시 = await page.evaluate(async (org, t) => {
        const res = await fetch(`/api/organizations/${org}/cowork/scheduled_tasks/${t}`,
          { headers: { accept: 'application/json' } });
        const j = await res.json();
        return String((j?.trigger ?? j)?.derived_state?.prompt ?? '');
      }, 조직, trig);
      /* ⛔ **세 가지를 다 본다.** 하나만 보면 나머지가 빠져도 ✅ 로 찍힌다 */
      const 좁혔나 = 다시.includes('e스포츠에 한해');
      const 세웠나 = 다시.includes('고르기 전에 사진부터 본다');
      const 지난것남았나 = 다시.includes(지난예외머리);
      if (좁혔나 && 세웠나 && !지난것남았나) {
        console.log(`  ${시}시 ✅ ${한일} — 다시 읽어 확인했다`);
        고친수 += 1;
      } else {
        console.log(`  ${시}시 🔴 썼다는데 덜 들어갔다 — 좁힘 ${좁혔나} · 고르기 ${세웠나}`
          + ` · 지난 예외 남음 ${지난것남았나}`);
        못찾음 += 1;
      }
    }

    console.log(`\n${고칠까 ? '고쳤다' : '고칠 것'} ${고친수} · 이미 ${이미} · 못 한 것 ${못찾음}`);
    if (!고칠까 && 고친수) console.log('⭐ node scripts/set-jbnews-사진규칙.mjs --고친다');
    if (못찾음) console.log('⚠ 못 한 것이 있다 — 0 으로 읽지 않는다. 화면에서 손으로 본다');
  } finally { await page.close(); b.disconnect(); }   /* ⛔ b.close() 금지 */
}
