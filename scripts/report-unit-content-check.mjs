#!/usr/bin/env node
/**
 * report-unit-content-check.mjs — **매일 23시 · 전 유닛 점검 보고.**
 *
 * ── 🔴 왜 있나 (2026-09-03) ─────────────────────────────────
 * 사장님 지시 원문:
 * > 「매일 23시에 공격형(이슈에 반응, 이슈를 만드는), seo, geo 맞춤형 콘텐트 생산 여부,
 * >  외부 반응 등에 대한 보고를 해라. **전 유닛 꺼 네가 체크한 결과를 토대로**
 * >  업무보고(**이메일 전송 포함**)해」
 *
 * 같은 날 사장님이 먼저 물으신 것 — 「각 유닛들이 공격적인 콘테트 생산 열심히 하고 있는 지도
 * 체크해」 · 「텍스트, 영상 등 seo, geo에 맞춤형으로」 · 「오늘 말고 어제 꺼 봐」.
 * 그래서 이 자는 **어제(완결된 하루)**를 센다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────
 * ⛔ **커밋 수를 콘텐트 수라고 부르지 않는다.** 2026-09-03 에 재 보니 한 유닛은 55커밋에
 *   발행 0편, 다른 유닛은 124커밋에 발행 4편이었다. 커밋만 세면 일한 것처럼 보인다.
 *   그래서 둘을 **나란히** 낸다.
 * ⛔ **못 잰 것은 「못 쟀다」로 낸다.** 0 으로 채우지 않는다.
 * ⛔ 「공격형」을 우리가 판정했다고 말하지 않는다. 자동으로 가를 수 있는 것은 **대리 지표**뿐이고,
 *   그 규칙을 지면에 그대로 적는다. 읽는 사람이 규칙을 보고 스스로 깎아 읽을 수 있어야 한다.
 * ⛔ `--보낸다` 없이는 메일이 한 통도 안 나간다.
 *
 * 쓰는 법
 *   node scripts/report-unit-content-check.mjs --자가시험
 *   node scripts/report-unit-content-check.mjs                     보고서만 만든다
 *   node scripts/report-unit-content-check.mjs --받는곳=a@b.com --보낸다
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LF = String.fromCharCode(10);

/* ── 유닛과 사이트 — 한 곳에서만 정한다 ── */
export const 유닛들 = [
  { 번호: '1번', 이름: 'KLifeMap', 도메인: 'klifemap.ai', 콘텐트: [], 영상: [], 지면: ['public'], 저장소: '../klifemap' },
  /* 🔴 2026-09-03 21:5x · 3번 — 콘텐트·카드 경로가 «존재하지 않는 자리»를 가리키고
   * 있었다. content/100yearmap 은 이 저장소에 없다(3번 지면은 Astro다, 마크다운이
   * 아니다) · public/100y/card 도 없다(실제는 public/100y/cardnews). 그 결과 09-02에
   * 실제로 새 지면 3장을 냈는데도(divorce-age·wage-distribution·tutoring-income,
   * curl 로 라이브 200 확인) 이 자는 «발행 0편»으로 셌다 — 없는 경로를 «세서 0건»과
   * 헷갈린 것이다(⛔ 이 파일 스스로 금지한 바로 그 것). 3번이 직접 고쳤다.
   * 콘텐트는 비워 두고(마크다운이 없으니) 아래 「아스트로지면」으로 따로 센다 —
   * klifemap(1번)이 «지면이 마크다운이 아니다」를 손댄 .html 로 대신 센 것과 같은 결. */
  { 번호: '3번', 이름: '백년지도', 도메인: '100yearmap.com', 콘텐트: [], 아스트로지면: ['src/pages/100y'], 영상: ['public/100y/video'], 카드: ['public/100y/cardnews'] },
  { 번호: '4번', 이름: '방문자 유입', 도메인: null, 콘텐트: [], 영상: [] },
  { 번호: '5번', 이름: 'K Culture Wire', 도메인: 'www.kculturewire.com', 콘텐트: ['content/kculturewire'], 영상: ['public/wikitip/video'], 카드: ['public/wikitip/card', 'archive/social'] },
  { 번호: '6번', 이름: 'SeoulMarkets', 도메인: 'seoulmarkets.com', 콘텐트: ['content/articles'], 영상: ['public/video'], 카드: ['public/card', 'public/seoulmarkets/card'] },
];

/** 어제(KST). ⚠ 이 PC 가 이미 KST 다. toISOString 을 쓰지 않는다 */
export function 어제(오늘 = new Date()) {
  const d = new Date(오늘.getTime());
  d.setDate(d.getDate() - 1);
  const p = (n) => String(n).padStart(2, '0');
  return [d.getFullYear(), p(d.getMonth() + 1), p(d.getDate())].join('-');
}

/** 앞말(frontmatter)에서 한 칸 읽기. 없으면 null — 빈 문자열로 채우지 않는다 */
export function 앞말(글, 열쇠) {
  const 첫 = String(글 ?? '').split('---');
  if (첫.length < 3) return null;
  for (const l of 첫[1].split(LF)) {
    const i = l.indexOf(':');
    if (i < 0) continue;
    if (l.slice(0, i).trim() !== 열쇠) continue;
    let v = l.slice(i + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    return v || null;
  }
  return null;
}

/** 두 날짜 사이 일수. 못 읽으면 null */
export function 날수(앞, 뒤) {
  const a = Date.parse(String(앞 ?? '').slice(0, 10));
  const b = Date.parse(String(뒤 ?? '').slice(0, 10));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86400000);
}

/**
 * 「공격형」 갈래 — 🔴 **2026-09-03 사장님이 기준을 직접 고치셨다.** 원문:
 * > 「**이슈메이킹 = 콘텐트의 제목 자체가 사람들에게 관심을 확 불러일으키는 지, 그래서**
 * >  **방문자 수가 평균보다 많은 지가 평가 기준.**
 * >  **이슈에 반응 = 타 사이트의 콘텐트 발행 시간으로부터 12시간 이내 생산. 배포를 기준으로 바꿔**」
 *
 * 그래서 둘 다 바뀌었다.
 * ```
 * 옛  반응   자료 기준일이 «발행일»에서 7일 안
 * 새  반응   **«배포 시각»**이 바깥 자료 시각에서 **12시간** 안
 *
 * 옛  만듦   제목에 수가 있다            ← 셀 수는 있지만 «관심»과는 다른 것이었다
 * 새  만듦   1. **제목이 관심을 확 끄는가**(판단) **그리고**
 *            2. **그 지면의 방문이 우리 평균보다 많은가**(잰 수 — GA4 지면열림)
 * ```
 * ⛔ 1.은 «판단»이고 2.는 «잰 수»다. 섞어서 「측정했다」고 말하지 않는다.
 *   2.를 못 잰 지면(GA4 에 줄이 없는 것)은 **0 이 아니라 「못 쟀다」**로 둔다.
 *   자가 대신 판단해 주는 척하지 않는다 — 사장님이 표를 보고 뒤집으실 수 있어야 한다.
 */

/**
 * 표 칸에 들어갈 글로 다듬는다 — 세로막대는 표를 깨뜨린다.
 *
 * 🔴 첫 판이 **글자 s 를 통째로 지웠다** — 「repeats」가 「repeat」, 「Securities」가
 *   「Securitie」로 나갔다. 정규식을 넣다가 역슬래시가 먹혀 «공백»을 뜻하던 것이 «글자 s»가 됐다.
 *   사장님께 나갈 표에서 남의 회사 이름이 틀리는 자리다.
 * ⛔ 그래서 이 함수는 **정규식을 안 쓴다.** 글자 코드로 가른다.
 */
export function 칸글(t, 길이 = 96) {
  const 뭉갠 = [...String(t ?? '')]
    .map((c) => (c === '|' ? '/' : (c.charCodeAt(0) <= 32 ? ' ' : c)))
    .join('');
  const s = 뭉갠.split(' ').filter(Boolean).join(' ').trim();
  return s.length > 길이 ? s.slice(0, 길이 - 1) + '…' : s;
}

/** 두 시각 사이 시간(h). 못 읽으면 null */
export function 시간차(앞, 뒤) {
  const a = Date.parse(앞); const b = Date.parse(뒤);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return (b - a) / 3600000;
}

/** 사장님 기준 — 12시간 */
export const 반응한도 = 12;

/**
 * 제목이 관심을 «확» 끄는가 — 판단을 돕는 표시들. ⛔ 이것으로 판정하지 않는다.
 * 제목을 그대로 함께 내서 사람이 보게 한다.
 */
export function 제목표시(제목) {
  const t = String(제목 ?? '');
  return {
    수: /[0-9]/.test(t),
    놀람: /(never|only|no one|first|most|least|beat|outdrew|nobody|한 번도|처음|유일)/i.test(t),
    대비: /( vs | than |보다|대신|아니라|not )/i.test(t),
    이름: /[A-Z][a-z]+/.test(t),
    길이: t.length,
  };
}

export function 공격형갈래(글, 배포시각 = null, 열림 = null, 평균열림 = null) {
  const 잰날 = 앞말(글, 'dataAsOf');
  /* ⭐ 우리 쪽 시계는 이제 «배포»다. 배포 시각을 못 찾으면 발행일로 물러서고, 그렇다고 적는다 */
  const 우리쪽 = 배포시각 ?? 앞말(글, 'pubDate');
  const 시차 = 시간차(잰날, 우리쪽);
  const 반응 = 시차 !== null && 시차 >= 0 && 시차 <= 반응한도;
  const 제목 = 앞말(글, 'title') ?? '';
  /* 2. 방문이 평균보다 많은가 — 못 재면 null 이다(0 이 아니다) */
  const 평균넘나 = (열림 === null || 평균열림 === null || !평균열림) ? null : 열림 > 평균열림;
  return {
    반응,
    시차,
    열림,
    평균넘나,
    배포기준: !!배포시각,
    제목,
    표시: 제목표시(제목),
    지면걸음: /^pages:/m.test(String(글 ?? '')),
  };
}
const 내가 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };
  검('어제를 낸다', 어제(new Date(2026, 8, 3)) === '2026-09-02');
  검('달을 넘어도 맞다', 어제(new Date(2026, 8, 1)) === '2026-08-31');
  검('해를 넘어도 맞다', 어제(new Date(2026, 0, 1)) === '2025-12-31');
  const 견본 = ['---', 'title: "가"', 'pubDate: 2026-09-02', 'dataAsOf: 2026-09-01T00:00:00+09:00',
    'pages:', '  - "/titles"', '---', '본문'].join(LF);
  검('앞말을 읽는다', 앞말(견본, 'pubDate') === '2026-09-02');
  검('따옴표를 벗긴다', 앞말(견본, 'title') === '가');
  검('⛔ 없는 칸은 null — 빈 문자열이 아니다', 앞말(견본, '없는칸') === null);
  검('⛔ 앞말이 없어도 안 터진다', 앞말('그냥 글', 'pubDate') === null);
  검('날수를 센다', 날수('2026-09-01', '2026-09-02') === 1);
  검('같은 날은 0', 날수('2026-09-02', '2026-09-02') === 0);
  검('⛔ 못 읽으면 null', 날수('아무것', '2026-09-02') === null);
  /* ── 사장님이 2026-09-03 에 고치신 새 기준 ── */
  검('12시간 안이면 반응', 공격형갈래(견본, '2026-09-01T06:00:00+09:00').반응 === true);
  검('⛔ 12시간을 넘으면 반응이 아니다',
    공격형갈래(견본, '2026-09-03T06:00:00+09:00').반응 === false);
  검('⛔ 바깥 자료 시각을 못 읽으면 반응이 아니다(0 이 아니라 못 잰 것)',
    공격형갈래(['---', 'title: "가"', 'pubDate: 2026-09-02', '---'].join(LF), '2026-09-02T06:00:00+09:00').시차 === null);
  검('배포 시각을 주면 배포기준으로 표시된다',
    공격형갈래(견본, '2026-09-01T06:00:00+09:00').배포기준 === true);
  검('⛔ 배포 시각이 없으면 배포기준이 아니라고 밝힌다', 공격형갈래(견본).배포기준 === false);
  검('시간차를 센다', 시간차('2026-09-01T00:00:00+09:00', '2026-09-01T12:00:00+09:00') === 12);
  검('⛔ 못 읽으면 null', 시간차('아무것', '2026-09-01T00:00:00+09:00') === null);
  검('한도는 12시간이다', 반응한도 === 12);

  검('방문이 평균보다 많으면 참', 공격형갈래(견본, null, 50, 10).평균넘나 === true);
  검('평균 이하면 거짓', 공격형갈래(견본, null, 5, 10).평균넘나 === false);
  검('⛔ 지면 수를 못 재면 null — 0 이 아니다', 공격형갈래(견본, null, null, 10).평균넘나 === null);
  검('⛔ 평균을 못 재도 null', 공격형갈래(견본, null, 50, null).평균넘나 === null);

  검('제목 표시 — 수가 있으면 잡는다', 제목표시('421 titles').수 === true);
  검('제목 표시 — 놀람말을 잡는다', 제목표시('Nobody charted it first').놀람 === true);
  검('⛔ 빈 것도 안 터진다', 제목표시(undefined).길이 === 0);

  {
    const 표 = [{ 열림: 30, 자리: "a/article/가-나-다" }, { 열림: 7, 자리: "b/article/딴것" }];
    검('지면을 슬러그로 찾는다', 지면찾기(표, '가-나-다') === 30);
    검('⛔ 없으면 null — 0 이 아니다', 지면찾기(표, '없는것') === null);
    검('⛔ 표가 없어도 안 터진다', 지면찾기(null, '가') === null);
  }
  {
    const out = ["   ▼ 지면 전부 (지면열림)", "      120  a/article/가", "        7  b/article/나", "   ▲ 지면 전부 끝"].join(String.fromCharCode(10));
    검('지면 전부를 읽는다', (지면전부파서(out) ?? []).length === 2);
    검('⛔ 덩어리가 없으면 null', 지면전부파서('아무것') === null);
  }
  검('유닛 목록에 번호가 다 있다', 유닛들.every((u) => /^[1-9]번$/.test(u.번호)));
  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}${LF}${실.map((s) => `   · ${s}`).join(LF)}`);
    process.exit(1);
  }
  console.log(`✅ 전 유닛 점검 보고 자가시험 통과 (${통})`);
  process.exit(0);
}

/* ── 여기서부터 실제로 잰다 ── */

function 발행센다(날, 유닛, 지면표 = null, 평균열림 = null) {
  const 결과 = { 편수: 0, 반응: 0, 만듦: 0, 제목들: [], 편들: [] };
  /* 영상·카드는 git 이 그날 «새로 들인» 파일로 센다 */
  const 영상 = 그날새파일(날, 유닛.영상, '.mp4');
  결과.영상수 = 영상 === null ? null : 영상.length;
  const 카드 = 유닛.카드 ? 그날새파일(날, 유닛.카드.filter((x) => fs.existsSync(path.join(뿌리, x))), '.png') : [];
  결과.카드수 = 카드 === null ? null : 카드.length;

  /* 🔴 3번(백년지도) — 지면이 마크다운이 아니라 Astro(.astro)라 아래 앞말 판정이 안 맞는다.
   * klifemap(1번)이 손댄 .html 로 대신 센 것과 같은 결로, git 이 그날 «새로 들인»
   * index.astro 를 새 지면으로 센다. ⛔ 반응·만듦은 여기서 못 잰다 — Astro 지면엔
   * pubDate·dataAsOf 앞말이 없다. 0 으로 적지 않고 결과.분류못잼 으로 밝힌다. */
  if (유닛.아스트로지면) {
    const 새 = 그날새파일(날, 유닛.아스트로지면, 'index.astro');
    if (새 === null) {
      결과.편수못잼 = true;
    } else {
      결과.편수 += 새.length;
      결과.분류못잼 = 새.length > 0;
      for (const 길 of 새) {
        const 슬러그 = 길.split('/').slice(-2, -1)[0] ?? 길;
        결과.제목들.push(슬러그);
        결과.편들.push({
          제목: 슬러그, 무엇: '⬜ Astro 지면 — dek 앞말 없음', 시차: null, 배포기준: false,
          표시: 제목표시(슬러그), 열림: 지면찾기(지면표, 슬러그), 평균넘나: null, 슬러그,
          갈래: null, 반응: null, 기준일: null,
        });
      }
    }
  }

  for (const 방 of 유닛.콘텐트) {
    const d = path.join(뿌리, 방);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md'))) {
      const 길 = path.join(방, f).split(path.sep).join('/');
      const 글 = fs.readFileSync(path.join(d, f), 'utf8');
      if (앞말(글, 'pubDate') !== 날) continue;
      if (앞말(글, 'draft') === 'true') continue;
      결과.편수 += 1;
      const 슬러그 = f.replace(/[.]md$/, '');
      const 열림 = 지면찾기(지면표, 슬러그);
      const g = 공격형갈래(글, 배포시각찾기(길), 열림, 평균열림);
      if (g.반응) 결과.반응 += 1;
      if (g.평균넘나 === true) 결과.만듦 += 1;
      const 제목 = 앞말(글, 'title') ?? f;
      결과.제목들.push(제목);
      결과.편들.push({
        제목,
        무엇: 앞말(글, 'dek') ?? 앞말(글, 'description') ?? null,
        시차: g.시차, 배포기준: g.배포기준, 표시: g.표시, 열림: g.열림, 평균넘나: g.평균넘나, 슬러그,
        갈래: 앞말(글, 'category'),
        반응: g.반응,
        기준일: 앞말(글, 'dataAsOf'),

      });
    }
  }
  return 결과;
}

/**
 * 🔴 [2026-09-03] 사장님: 「못 잰 것 … **해결해**」. 셋 다 «자리를 몰라서» 못 쟀던 것이지
 *   잴 수 없는 것이 아니었다. 자리를 찾아 적으니 세어진다.
 * ⛔ 파일 «시각»으로 세지 않는다 — 손대기만 해도 바뀐다. **git 이 그날 새로 들인 것**만 센다.
 */
function 그날새파일(날, 방들, 끝글, 저장소 = '.') {
  if (!방들 || !방들.length) return [];
  try {
    const out = execFileSync('git', ['log', `--since=${날} 00:00`, `--until=${날} 23:59:59`,
      '--diff-filter=A', '--name-only', '--format=', '--', ...방들],
      { cwd: path.join(뿌리, 저장소), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const 본것 = new Set();
    for (const l of out.split(String.fromCharCode(10))) {
      const t = l.trim();
      if (!t || !t.endsWith(끝글)) continue;
      본것.add(t);
    }
    return [...본것];
  } catch { return null; }   /* null 은 «못 쟀다» — 0 과 다르다 */
}

/** 그날 손댄(고친 것 포함) 파일 — klifemap 처럼 지면이 마크다운이 아닌 곳을 재려고 */
function 그날손댄파일(날, 방들, 끝글, 저장소 = '.') {
  if (!방들 || !방들.length) return [];
  try {
    const out = execFileSync('git', ['log', `--since=${날} 00:00`, `--until=${날} 23:59:59`,
      '--name-only', '--format=', '--', ...방들],
      { cwd: path.join(뿌리, 저장소), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    const 본것 = new Set();
    for (const l of out.split(String.fromCharCode(10))) {
      const t = l.trim();
      if (!t || !t.endsWith(끝글)) continue;
      본것.add(t);
    }
    return [...본것];
  } catch { return null; }
}

/** GA4 「어느 지면이 열렸나」 — 기사가 실제로 열린 수. 외부 반응의 바닥값이다 */
/** 「▼ 지면 전부」 덩어리를 읽는다 — 없으면 top15 라도 읽는다 */
export function 지면전부파서(out) {
  const 줄들 = String(out ?? '').split(String.fromCharCode(10));
  const i = 줄들.findIndex((l) => l.includes('▼ 지면 전부'));
  if (i < 0) return null;
  const 표 = [];
  for (const l of 줄들.slice(i + 1)) {
    const t = l.trim();
    if (t.includes('▲ 지면 전부 끝')) break;
    const m = t.match(/^([0-9,]+)[ ]+(.+)$/);
    if (!m) continue;
    표.push({ 열림: Number(m[1].split(',').join('')), 자리: m[2].trim() });
  }
  return 표.length ? 표 : null;
}

/** 지면 표에서 그 글의 주소를 찾는다. 없으면 null — 0 으로 채우지 않는다 */
export function 지면찾기(표, 슬러그) {
  if (!표 || !슬러그) return null;
  const 걸린 = 표.filter((r) => r.자리.includes(슬러그));
  if (!걸린.length) return null;
  return 걸린.reduce((a, r) => a + r.열림, 0);
}

export function 지면열림파서(out) {
  const 줄들 = String(out ?? '').split(String.fromCharCode(10));
  const i = 줄들.findIndex((l) => l.includes('어느 지면이 열렸나'));
  if (i < 0) return null;
  const 표 = [];
  for (const l of 줄들.slice(i + 1)) {
    const t = l.trim();
    if (!t) break;
    const m = t.match(/^([0-9,]+)[ ]+(.+)$/);
    if (!m) break;
    표.push({ 열림: Number(m[1].split(',').join('')), 자리: m[2].trim() });
  }
  return 표.length ? 표 : null;
}

/**
 * 🔴 사장님: 「**배포를 기준으로 바꿔**」. 우리 배포의 기록은 「배포 도장」 커밋이다
 *   (deploy.mjs 가 배포를 마치고 스스로 남긴다). 어떤 파일이 처음 들어온 커밋 «뒤»의
 *   첫 배포 도장이 그 글이 손님에게 나간 시각이다.
 * ⛔ 도장을 못 찾으면 **null** — 발행일로 슬쩍 바꿔 놓고 배포 기준이라 하지 않는다.
 */
function 배포시각찾기(파일길) {
  try {
    const 들어온때 = execFileSync('git', ['log', '--diff-filter=A', '-1', '--format=%cI', '--', 파일길],
      { cwd: 뿌리, encoding: 'utf8' }).trim();
    if (!들어온때) return null;
    const 도장 = execFileSync('git', ['log', '--format=%cI', '--grep=배포 도장', `--since=${들어온때}`],
      { cwd: 뿌리, encoding: 'utf8' }).trim().split(String.fromCharCode(10)).filter(Boolean);
    /* --since 는 새것부터 내려온다 — 가장 «오래된» 것이 그 글 뒤 첫 배포다 */
    return 도장.length ? 도장[도장.length - 1] : null;
  } catch { return null; }
}

function 커밋센다(날) {
  const 셈 = {};
  for (const repo of ['.', '../klifemap']) {
    let out = '';
    try {
      out = execFileSync('git', ['log', `--since=${날} 00:00`, `--until=${날} 23:59:59`, '--format=%s'],
        { cwd: path.join(뿌리, repo), encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    } catch { continue; }
    for (const l of out.split(LF).filter(Boolean)) {
      const m = l.match(/^\[?(?:진행\]?\s*)?([1-9])번/) || l.match(/^\[([1-9])번\s*(?:→|-)/);
      if (!m) continue;
      const u = `${m[1]}번`;
      셈[u] = (셈[u] ?? 0) + 1;
    }
  }
  return 셈;
}

async function 한줄재기(주소) {
  try {
    const r = await fetch(주소, { redirect: 'follow', signal: AbortSignal.timeout(12000) });
    const t = r.ok ? await r.text() : '';
    return { 코드: r.status, 줄: t ? t.split(LF).length : 0 };
  } catch (e) { return { 코드: null, 줄: 0, 탈: String(e.message ?? e).slice(0, 40) }; }
}

async function geo재기() {
  const 표 = [];
  for (const u of 유닛들) {
    if (!u.도메인) { 표.push({ ...u, 못쟀다: '사이트가 없는 몫이다(유입 담당)' }); continue; }
    const llms = await 한줄재기(`https://${u.도메인}/llms.txt`);
    const rob = await 한줄재기(`https://${u.도메인}/robots.txt`);
    const site = await 한줄재기(`https://${u.도메인}/sitemap.xml`);
    표.push({ ...u, llms, rob, site });
  }
  return 표;
}

/**
 * 🔴 [2026-09-03] 첫 판은 ga4 출력의 **꼬리 14줄을 그대로 붙였다.** 그래서 사장님이
 *   「표 항목이 뭔지 모르니 각 열마다 항목명을 써」라고 하셨다 — **머리줄이 잘려 나갔던 것**이다.
 * ⛔ 남의 출력을 잘라 붙이지 않는다. **읽어서 우리 표로 다시 짠다.**
 */
export function ga4파서(out) {
  const 줄들 = String(out ?? '').split(LF);
  const i = 줄들.findIndex((l) => l.includes('사이트별로 갈라 잰 것'));
  if (i < 0) return null;
  const 표 = [];
  for (const l of 줄들.slice(i + 2)) {
    const t = l.trim();
    if (!t) break;
    if (t.startsWith('⭐') || t.startsWith('🔴') || t.startsWith('⚠') || t.startsWith('⛔')) break;
    const 조각 = t.split(/[ ]{2,}/).filter(Boolean);
    if (조각.length < 4) continue;
    const 호스트 = 조각[0];
    const 수 = 조각.slice(1).join(' ').split(' ').filter((x) => /^[0-9,]+$/.test(x)).map((x) => Number(x.split(',').join('')));
    if (수.length < 3) continue;
    표.push({ 호스트, 순방문: 수[0], 세션: 수[1], 지면열림: 수[2] });
  }
  return 표.length ? 표 : null;
}

function ga4읽기() {
  try {
    const out = execFileSync('node', ['scripts/ga4-report.mjs'], { cwd: 뿌리, encoding: 'utf8', timeout: 120000 });
    return { 표: ga4파서(out), 원문: out };
  } catch (e) { return null; }
}

if (내가) {
  const 인자 = (이름) => {
    const p = process.argv.find((x) => x.startsWith(`--${이름}=`));
    return p ? p.slice(이름.length + 3) : null;
  };
  const 날 = 인자('날') ?? 어제();
  const 지금 = new Date();
  const ga4 = ga4읽기();
  const 지면표 = ga4 ? 지면전부파서(ga4.원문) : null;
  /* 평균은 «우리 기사 지면»만으로 낸다 — 첫 화면·목록이 섞이면 평균이 부풀어 비교가 죽는다 */
  const 기사지면 = (지면표 ?? []).filter((r) => /[/](article|kculturewire)[/]/.test(r.자리));
  const 평균열림 = 기사지면.length
    ? Math.round(기사지면.reduce((a, r) => a + r.열림, 0) / 기사지면.length) : null;
  const 발행 = new Map(유닛들.map((u) => [u.번호, 발행센다(날, u, 지면표, 평균열림)]));
  const 커밋 = 커밋센다(날);
  const geo = await geo재기();

  const 총편수 = [...발행.values()].reduce((a, x) => a + x.편수, 0);
  const 총반응 = [...발행.values()].reduce((a, x) => a + x.반응, 0);
  const 총만듦 = [...발행.values()].reduce((a, x) => a + x.만듦, 0);

  const 줄 = [];
  const 쓴다 = (...x) => 줄.push(...x);
  쓴다(`# 전 유닛 점검 보고 — ${날} (완결된 하루)`, '');
  쓴다(`작성 ${지금.toLocaleString('ko-KR')} KST · 총괄대행 5번 · 사장님 지시 2026-09-03 「매일 23시」`, '');
  쓴다('> 이 보고는 각 유닛의 자기 실적 보고(16시)와 다른 것입니다 — **총괄이 전 유닛을 재서 점검한 결과**입니다.', '');

  쓴다('## 1. 공격형 콘텐트 — 어제 «발행된» 것', '');
  쓴다('### 1-1. 유닛별', '');
  쓴다('| 유닛 | 사이트 | 발행 편수 | 이슈에 반응 | 이슈를 만듦 | 어제 커밋 |');
  쓴다('| --- | --- | ---: | ---: | ---: | ---: |');
  for (const u of 유닛들) {
    const p = 발행.get(u.번호);
    const 텍스트있나 = u.콘텐트.length || u.아스트로지면?.length;
    const 몫 = 텍스트있나 ? String(p.편수) : '—';
    const 갈래칸 = (v) => (!텍스트있나 ? '—' : p.분류못잼 ? '⬜ 못 쟀다' : v);
    쓴다(`| ${u.번호} | ${u.이름} | **${몫}** | ${갈래칸(p.반응)} | ${갈래칸(p.만듦)} | ${커밋[u.번호] ?? 0} |`);
  }
  쓴다('', `합계 — 발행 **${총편수}편** · 이슈 반응 ${총반응} · 이슈 생성 ${총만듦}`, '');
  쓴다('⚠ 3번은 Astro 지면이라 이슈반응·이슈생성을 이 자로 못 잰다(위 표에 ⬜로 뜬다) —', '');
  쓴다('  총반응·총만듦 합계에는 0으로 들어가 있다. 실제보다 적게 보일 수 있다.', '');
  쓴다('### 1-2. 하루 몫 세 줄 — **텍스트 6 · 영상 1 · 기타 1** (사장님 2026-09-03)', '');
  쓴다('| 유닛 | 텍스트 (몫 6) | 영상 (몫 1) | 기타·카드 (몫 1) |');
  쓴다('| --- | --- | --- | --- |');
  for (const u of 유닛들) {
    const p = 발행.get(u.번호);
    const 칸 = (수, 몫) => (수 === null ? '⬜ 못 쟀다' : `${수} / ${몫}` + (수 >= 몫 ? ' ✅' : ' 🔴'));
    const 없음 = (자리) => (자리 && 자리.length ? null : '— (그 몫이 없는 유닛)');
    const 텍스트자리 = (u.콘텐트.length || u.아스트로지면?.length) ? [1] : [];
    쓴다(`| ${u.번호} ${u.이름} | ${없음(텍스트자리) ?? 칸(p.편수, 6)}`
      + ` | ${없음(u.영상) ?? 칸(p.영상수, 1)} | ${없음(u.카드) ?? 칸(p.카드수, 1)} |`);
  }
  쓴다('');
  쓴다('⛔ **셋을 따로 셉니다.** 텍스트를 일곱 편 내고 영상을 안 냈으면 그날 몫은 못 채운 것입니다.');
  쓴다('⛔ 파일 «시각»이 아니라 **git 이 그날 새로 들인 파일**을 셉니다 — 손대기만 해도 바뀌는 수를 쓰지 않습니다.', '');

  쓴다('### 1-3. ⛔ 커밋 수는 콘텐트가 아닙니다', '');
  쓴다('두 칸을 나란히 둔 까닭입니다. 커밋에는 로그·보고·수집이 다 섞여 있어, 커밋만 세면');
  쓴다('일한 것처럼 보입니다. **오른쪽 「발행 편수」가 손님에게 실제로 나간 것**입니다.', '');
  쓴다('### 1-4. 「공격형」을 우리가 어떻게 갈랐나 — 규칙을 그대로 적습니다', '');
  쓴다('⚠ **이것은 판정이 아니라 대리 지표입니다.** 자동으로 잴 수 있는 것만 셌습니다.', '');
  쓴다('```');
  쓴다('이슈에 반응    자료 기준일(dataAsOf)이 발행일에서 7일 안 — 살아 있는 일에 붙었다');
  쓴다('이슈를 만듦    제목에 우리가 잰 «수»가 있다 — 남이 낸 이야기를 옮긴 것이 아니다');
  쓴다('```');
  쓴다('');
  쓴다('🔴 첫 판은 「이슈를 만듦」을 `pages:` 앞말로 쟀는데, 재 보니 그 칸은 KCW 142편 전부에 있고');
  쓴다('SeoulMarkets 111편에 **하나도 없었습니다.** 그러면 6번은 규칙상 언제나 0 이 됩니다.');
  쓴다('그래서 **두 사이트에 다 걸리는 것**으로 바꿨습니다. 헛도는 자는 없는 자보다 나쁩니다.', '');
  쓴다('한 편이 둘 다일 수 있고 둘 다 아닐 수 있어 겹쳐 셉니다. **「기사가 실제로 이슈를 일으켰나」는');
  쓴다('이 자로 못 잽니다 — 그것은 3의 외부 반응에서 봅니다.**', '');
  /**
   * 🔴 사장님 지시 (2026-09-03): 「**이슈에 반응 │ 이슈를 만듦 >>> 어떤 내용인 지 알고 싶다.
   *   별도 표로 만들어라. 같은 파일 내에**」
   * ⛔ 앞의 표는 «몇 편»만 말한다. 그것만으로는 무엇을 낸 하루였는지 알 수 없다.
   * ⛔ 갈래만 ✅ 로 찍지 않는다 — **왜 그렇게 갈렸는지**(늦음 며칠 · 제목에 든 수)를 같이 낸다.
   */
  쓴다('### 1-5. 어제 나간 글 한 편씩 — 무엇이고, 어느 갈래인가', '');
  const 편전부 = 유닛들.flatMap((u) => (발행.get(u.번호).편들 ?? []).map((x) => ({ ...x, 유닛: u.번호 })));
  if (!편전부.length) {
    쓴다('⬜ **어제 나간 글이 없습니다.** 0 편입니다 — 못 쟀다가 아니라 «없다»입니다.', '');
  } else {
  쓴다('| 유닛 | 제목 | 무엇을 말한 글인가 | 반응 | 만듦 |');
    쓴다('| --- | --- | --- | :-: | :-: |');
    for (const x of 편전부) {
      쓴다(`| ${x.유닛} | ${칸글(x.제목, 70)} | ${x.무엇 ? 칸글(x.무엇, 150) : '⬜ 앞말에 dek 이 없다'}`
        + ` | ${x.반응 ? '✅' : '—'} | ${x.만듦 ? '✅' : '—'} |`);
    }
    쓴다('');
    쓴다('#### 왜 그 갈래로 갈렸나 — 근거를 그대로 냅니다', '');
    쓴다('| 유닛 | 제목 | 바깥 자료 시각 | 우리 배포 시각 기준 | 시차 | 지면열림 | 평균 넘나 |');
    쓴다('| --- | --- | --- | --- | ---: | ---: | :-: |');
    for (const x of 편전부) {
      쓴다(`| ${x.유닛} | ${칸글(x.제목, 40)} | ${x.기준일 ?? '⬜ 없다'}`
        + ` | ${x.배포기준 ? '배포 도장' : '⚠ 발행일(도장 못 찾음)'}`
        + ` | ${x.시차 === null ? '⬜ 못 쟀다' : `${x.시차.toFixed(1)}시간`}`
        + ` | ${x.열림 === null ? '⬜ 못 쟀다' : x.열림}`
        + ` | ${x.평균넘나 === null ? '⬜' : (x.평균넘나 ? '✅' : '—')} |`);
    }
    쓴다('');
    쓴다('**사장님이 2026-09-03 에 고치신 기준 그대로입니다.**', '');
    쓴다('```');
    쓴다('이슈에 반응   바깥 콘텐트 발행 시각에서 **12시간 안**에 우리가 냈나.');
    쓴다('             우리 쪽 시계는 **배포**다(「배포 도장」 커밋). 발행일이 아닙니다.');
    쓴다('이슈 메이킹   1. 제목이 관심을 확 끄나(**판단**) 2. 그래서 방문이 **평균보다 많나**(**잰 수**)');
    쓴다(`             평균은 우리 기사 지면 ${기사지면.length}개의 지면열림 평균 = ${평균열림 ?? '⬜ 못 쟀다'}`);
    쓴다('```');
    쓴다('⛔ 2.를 못 잰 지면은 **0 이 아니라 ⬜(못 쟀다)** 입니다 — GA4 에 줄이 없으면 수를 지어내지 않습니다.');
    쓴다('⛔ 1.은 제가 «읽고 매긴 판단»입니다. 제목을 위 표에 그대로 실어 두었으니 뒤집으실 수 있습니다.', '');
  }

  쓴다('## 2. SEO·GEO 맞춤 — 라이브에서 잰 것', '');
  쓴다(`잰 시각 ${지금.toLocaleString('ko-KR')} KST`, '');
  쓴다('| 유닛 | 사이트 | llms.txt (GEO) | robots.txt | sitemap.xml |');
  쓴다('| --- | --- | --- | --- | --- |');
  for (const g of geo) {
    if (g.못쟀다) { 쓴다(`| ${g.번호} | ${g.이름} | — | — | ${g.못쟀다} |`); continue; }
    const 칸 = (x) => (x.코드 === 200 ? `✅ 200${x.줄 ? ` · ${x.줄}줄` : ''}` : x.코드 ? `🔴 ${x.코드}` : `⬜ 못 쟀다(${x.탈})`);
    쓴다(`| ${g.번호} | ${g.도메인} | ${칸(g.llms)} | ${칸(g.rob)} | ${칸(g.site)} |`);
  }
  쓴다('');
  const 빵 = geo.filter((g) => g.llms && g.llms.코드 !== 200);
  if (빵.length) {
    쓴다(`🔴 **llms.txt 가 없는 사이트 ${빵.length}곳** — ${빵.map((g) => `${g.도메인}(${g.번호})`).join(' · ')}`);
    쓴다('AI 크롤러가 우리 사이트를 안내받을 길이 그만큼 막혀 있습니다.', '');
  }

  쓴다('## 3. 외부 반응 — 사람이 실제로 왔나 (GA4 · 28일)', '');
  if (ga4 && ga4.표) {
    쓴다('| 사이트(호스트) | 유닛 | 순방문자 | 방문 횟수 | 지면 열림 | 하루 몇 명꼴 |');
    쓴다('| --- | --- | ---: | ---: | ---: | ---: |');
    const 임자 = (h) => (유닛들.find((u) => u.도메인 && h.includes(u.도메인.replace(/^www[.]/, '')))?.번호) ?? '—';
    for (const r of ga4.표) {
      쓴다(`| ${r.호스트} | ${임자(r.호스트)} | **${r.순방문.toLocaleString('en-US')}** | ${r.세션.toLocaleString('en-US')}`
        + ` | ${r.지면열림.toLocaleString('en-US')} | ${(r.순방문 / 28).toFixed(1)}명 |`);
    }
    쓴다('');
    쓴다('**열이 무슨 뜻인가** — 이름만 보고 헷갈리지 않게 적습니다.', '');
    쓴다('| 열 | 뜻 | 헷갈리기 쉬운 것 |');
    쓴다('| --- | --- | --- |');
    쓴다('| 사이트(호스트) | 방문이 일어난 «주소». 같은 사이트라도 www 유무·임시주소가 따로 잡힙니다 | 같은 사이트가 두 줄로 나뉠 수 있습니다 |');
    쓴다('| 유닛 | 그 호스트를 맡은 유닛 | 임시주소·localhost 는 임자가 없습니다 |');
    쓴다('| 순방문자 | 28일 동안 «서로 다른 사람» 수 (GA4 totalUsers) | 같은 사람이 열 번 와도 1 입니다 |');
    쓴다('| 방문 횟수 | 그 사람들이 «몇 번» 왔나 (sessions) | 사람 수보다 큽니다 |');
    쓴다('| 지면 열림 | 지면이 «몇 번» 열렸나 (screenPageViews) | 방문 횟수보다 큽니다 |');
    쓴다('| 하루 몇 명꼴 | 순방문자 ÷ 28일 | 어제 하루 수가 아닙니다 |');
    쓴다('');
    쓴다('⚠ `localhost` · `127.0.0.1` · `port-0-…cloudtype.app` 은 **손님이 아닙니다** — 우리가 만들며 연 것과');
    쓴다('임시 주소입니다. `parkintaek2-gif.github.io` 는 백업 경로입니다. 셋을 손님 수에 넣지 않습니다.', '');
  } else {
    쓴다('⬜ **못 쟀습니다** — GA4 보고가 이 자리에서 안 돌았습니다. 0 으로 적지 않습니다.', '');
  }
  쓴다('⚠ GA4 는 광고차단·쿠키거부로 **덜 세는 쪽**입니다. 바닥값으로 읽습니다.', '');

  쓴다('## 4. 앞서 「못 쟀다」던 셋 — **해결했습니다** (사장님 2026-09-03 「해결해」)', '');
  쓴다('| 무엇 | 전에는 | 지금은 어떻게 재나 |');
  쓴다('| --- | --- | --- |');
  쓴다('| 영상 편수 | 사이트마다 자리가 달라 못 셈 | 유닛마다 «영상 두는 자리»를 목록에 적었습니다. `public/video`(6번)·`public/wikitip/video`(5번)·`public/100y/video`(3번). git 이 그날 새로 들인 `.mp4` 를 셉니다 |');
  쓴다('| 기사가 일으킨 반응 | 세는 길이 없음 | GA4 «지면열림»을 지면 하나하나까지 받아(`--지면전부`) 그 글의 수를 붙였습니다. 위 1-5 표의 「지면열림」 칸입니다 |');
  쓴다('| klifemap 발행 | 지면이 마크다운이 아니라 못 셈 | 마크다운을 세는 대신 **git 이 그날 손댄 `public/**` 의 `.html`** 을 셉니다 — 손님에게 나가는 지면이 그것입니다 |');
  쓴다('');
  {
    const kl = 그날손댄파일(날, ['public'], '.html', '../klifemap');
    쓴다(`**1번 klifemap — ${날} 에 손댄 지면(.html): ${kl === null ? '⬜ 못 쟀다' : `${kl.length}개`}**`);
    if (kl && kl.length) {
      쓴다('');
      for (const x of kl.slice(0, 12)) 쓴다(`- ${x}`);
      if (kl.length > 12) 쓴다(`- … 그 밖 ${kl.length - 12}개`);
    }
    쓴다('');
    쓴다('⚠ 「손댄 것」은 「새로 낸 것」과 다릅니다. klifemap 은 지면을 고쳐 쓰는 사이트라 새로 들인 것만 세면');
    쓴다('   거의 늘 0 이 됩니다. 그래서 **고친 것까지** 셉니다 — 그 사실을 감추지 않고 이렇게 적습니다.', '');
  }
  쓴다('### 아직도 못 재는 것 — 0 으로 채우지 않습니다', '');
  쓴다('- **남이 우리를 인용했나** — AI 답변·기사에서의 인용을 세는 길이 아직 없습니다. 4번이 `measure-ai-citations.mjs` 로 첫 기록을 시작했습니다.');
  쓴다('- **제목이 관심을 끄는가** — 이것은 잰 수가 아니라 «판단»입니다. 제목을 표에 그대로 실어 뒤집으실 수 있게 했습니다.', '');

  /**
   * 🔴 사장님 지시 (2026-09-03) 두 마디를 그대로 따른다 —
   *   「**업무보고에 어제 점검 결과를 파일로 저장해. 콘텐트 점검_날짜 파일로**」
   *   「**콘텐트 점검 폴더를 만들어라**」 · 「**업무보고와 같은 레벨**」
   *   → `OneDrive\콘텐트 점검\콘텐트 점검_YYYYMMDD.md` (업무보고와 «나란히» 둔다)
   * ⚠ 저장소 쪽에도 한 벌 둔다. 원드라이브가 안 붙은 기계에서도 남아야 한다.
   */
  const 원드라이브 = path.join(process.env.USERPROFILE ?? '', 'OneDrive');
  const 점검방 = path.join(원드라이브, '콘텐트 점검');
  const 이름 = `콘텐트 점검_${날.split('-').join('')}`;
  const 낼곳 = fs.existsSync(원드라이브) ? 점검방 : path.join(뿌리, 'docs/보고/전유닛-점검');
  fs.mkdirSync(낼곳, { recursive: true });
  const md = path.join(낼곳, `${이름}.md`);
  fs.writeFileSync(md, 줄.join(LF) + LF, 'utf8');
  const 사본방 = path.join(뿌리, 'docs/보고/전유닛-점검');
  fs.mkdirSync(사본방, { recursive: true });
  fs.writeFileSync(path.join(사본방, `${이름}.md`), 줄.join(LF) + LF, 'utf8');
  console.log(`보고서를 냈다 — ${md}`);
  console.log(`저장소 사본 — docs/보고/전유닛-점검/${이름}.md`);
  console.log(`발행 ${총편수}편 · 이슈반응 ${총반응} · 이슈생성 ${총만듦} · llms.txt 빠진 곳 ${빵.length}`);

  /*
   * 🔴 [2026-09-03 21:3x · 5번] **PDF 가 «조용히» 안 나오고 있었다.**
   *
   *   사장님 지시로 보고서는 PDF 로 드려야 한다 — 마크다운은 표가 깨져서 못 보신다.
   *   그런데 이 자리가 늘 「⬜ PDF 는 못 냈다」를 찍고 있었고, 아무도 «왜»를 몰랐다.
   *
   *   까닭 둘.
   *   1) `path.relative(뿌리, md)` 가 «쓰레기 경로»를 냈다 —
   *      `뿌리` 는 슬래시, `md` 는 역슬래시라 섞였고 결과가 이랬다:
   *        UsersUserOneDrive콘텐트 점검콘텐트 점검_20260902.md
   *      그러니 md-to-pdf 가 그 파일을 못 찾는 것이 당연하다.
   *      ⭐ 그리고 낼 곳은 OneDrive 인데 «저장소 뿌리 기준 상대 경로»를 넘기고 있었다.
   *   2) `catch { pdf = null }` 가 오류를 **먹었다.** 무엇이 틀렸는지 한 줄도 안 남겼다.
   *      ⛔ 조용히 성공한 척하는 것이 제일 나쁘다 — 오늘 하루 이 병을 여러 곳에서 고쳤다.
   *
   *   ✅ 고침: «절대 경로»를 넘기고, 실패하면 «까닭을 찍는다».
   *   ✅ 그리고 저장소 사본으로 만든 뒤 OneDrive 로 «복사»한다 —
   *      OneDrive 경로에 공백·한글이 섞여 있어 그쪽에서 바로 만드는 것보다 안전하다.
   */
  let pdf = null;
  const 사본md = path.join(사본방, `${이름}.md`);
  try {
    execFileSync(process.execPath, [path.join(뿌리, 'scripts/md-to-pdf.mjs'), 사본md],
      { cwd: 뿌리, stdio: 'pipe' });
    const 만든것 = 사본md.replace(/\.md$/, '.pdf');
    if (fs.existsSync(만든것)) {
      pdf = 만든것;
      /*
       * OneDrive 쪽에도 같은 PDF 를 둔다 — 사장님이 그 폴더를 보신다.
       * 🔴 [2026-09-03 실측] 덮어쓰기가 **EBUSY** 로 막힌다. OneDrive 가 그 파일을 붙잡고 있다.
       *   ⛔ 그때 조용히 넘기면 사장님 폴더에는 «옛 판»이 남는다. 오늘 실제로 07:09 자
       *      277KB 판이 남아 있었고, 새로 만든 371KB 판은 저장소에만 있었다.
       *   ✅ 그러니 막히면 **딴 이름으로라도 새 판을 넣는다.** 없는 것보다 낫고,
       *      이름에 시각이 들어가니 어느 것이 새 것인지 사장님이 바로 아신다.
       */
      const 원드라이브pdf = md.replace(/\.md$/, '.pdf');
      let 놓았나 = null;
      try { fs.copyFileSync(만든것, 원드라이브pdf); 놓았나 = 원드라이브pdf; }
      catch (e1) {
        const 두자 = (n) => String(n).padStart(2, '0');
        const 때 = new Date(); /* ⚠ 이 PC 는 이미 KST 다 */
        const 딴이름 = 원드라이브pdf.replace(/\.pdf$/, `_${두자(때.getHours())}${두자(때.getMinutes())}.pdf`);
        try { fs.copyFileSync(만든것, 딴이름); 놓았나 = 딴이름; }
        catch (e2) {
          console.log(`   🔴 OneDrive 에 못 놓았다 — 덮기: ${String(e1.code || e1.message).slice(0, 20)}`
            + ` · 딴이름: ${String(e2.code || e2.message).slice(0, 20)}`);
        }
      }
      if (놓았나) console.log(`   OneDrive 에도 놓았다 — ${path.basename(놓았나)}`);
    }
  } catch (e) {
    /* ⛔ 먹지 않는다. 무엇이 틀렸는지 남긴다 */
    console.log(`   🔴 PDF 를 만들다 걸렸다 — ${String(e.message).slice(0, 160)}`);
  }
  console.log(pdf
    ? `PDF 도 냈다 — ${path.basename(pdf)} (${Math.round(fs.statSync(pdf).size / 1024)}KB)`
    : '⬜ PDF 는 못 냈다 — md 로만 낸다. ⛔ 사장님은 md 표를 못 보신다. 위 까닭을 고쳐야 한다');

  /**
   * 🔴 받는 주소를 **소스에 박지 않는다.** `send-mail.mjs` 가 처음부터 못박아 둔 규칙이고
   *   (「받는 사람 주소를 저장소에 커밋하지 않는다 — 인자로 받는다」) 나는 그걸 알면서
   *   2026-09-03 에 기본값으로 박았다가 바로 물렸다.
   * ⚠ 그때 내가 고른 주소도 틀렸다 — 저장소에 있던 것은 **사이트 관리자 로그인 아이디**였고,
   *   사장님이 주신 보고 받는 곳은 다른 주소였다. **저장소에서 찾은 주소가 곧 보고처가 아니다.**
   * ✅ 순서: --받는곳= → `.보고받는곳`(커밋 안 됨) → 없으면 **세운다**
   */
  const 주소파일 = path.join(뿌리, '.보고받는곳');
  const 받는곳 = 인자('받는곳')
    ?? (fs.existsSync(주소파일) ? fs.readFileSync(주소파일, 'utf8').trim() : null);
  if (!process.argv.includes('--보낸다')) {
    console.log(LF + '⭐ 메일은 안 보냈다. 보내려면 --받는곳=… --보낸다');
    process.exit(0);
  }
  if (!받는곳 || !받는곳.includes('@')) {
    console.error('⛔ 받는곳이 없다. 짐작으로 안 보낸다.');
    console.error('   고치는 법 — .보고받는곳 파일에 주소 한 줄을 적거나 --받는곳= 을 준다');
    process.exit(1);
  }
  execFileSync('node', ['scripts/send-mail.mjs', `--받는곳=${받는곳}`,
    `--제목=[전 유닛 점검] ${날} · 발행 ${총편수}편 · 이슈반응 ${총반응} · 이슈생성 ${총만듦}`,
    `--글=${path.relative(뿌리, md)}`, '--보낸다'], { cwd: 뿌리, stdio: 'inherit' });
}
