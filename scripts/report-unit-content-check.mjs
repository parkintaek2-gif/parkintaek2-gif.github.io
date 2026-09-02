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
  { 번호: '1번', 이름: 'KLifeMap', 도메인: 'klifemap.ai', 콘텐트: [] },
  { 번호: '3번', 이름: '백년지도', 도메인: '100yearmap.com', 콘텐트: ['content/100yearmap'] },
  { 번호: '4번', 이름: '방문자 유입', 도메인: null, 콘텐트: [] },
  { 번호: '5번', 이름: 'K Culture Wire', 도메인: 'www.kculturewire.com', 콘텐트: ['content/kculturewire'] },
  { 번호: '6번', 이름: 'SeoulMarkets', 도메인: 'seoulmarkets.com', 콘텐트: ['content/articles'] },
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
 * 「공격형」 대리 지표. ⛔ 판정이 아니다 — 규칙을 그대로 지면에 적는다.
 *
 * 🔴 첫 판은 「이슈를 만든다」를 `pages:` 로 쟀다. **그것은 아무것도 못 재는 자였다** —
 *   재 보니 `pages:` 는 kculturewire 142편 전부에 있고 content/articles 111편에 **하나도 없다.**
 *   그러면 6번은 규칙상 언제나 0 이 된다. 우리 자 규칙 「헛도는 자는 없는 자보다 나쁘다」에 걸린다.
 * ✅ 그래서 **두 사이트에 다 있는 것**으로 바꿨다 — 제목에 «수»가 있나.
 *   우리가 잰 수를 제목에 걸었다면 그것은 남이 낸 이야기를 옮긴 것이 아니라 우리가 낸 것이다.
 *
 *   이슈에 반응   자료 기준일(dataAsOf)이 발행일에서 7일 안 → 살아 있는 일에 붙었다
 *   이슈를 만든다  **제목에 우리가 잰 수가 있다**          → 남의 이야기를 옮긴 것이 아니다
 *   (곁 지표) 우리 자료 지면을 걸었나 — `pages:` 가 있는 사이트에서만 잰다
 *
 * 둘 다인 편도 있고 둘 다 아닌 편도 있다. 그래서 겹쳐서 센다.
 */
export function 공격형갈래(글) {
  const 낸날 = 앞말(글, 'pubDate');
  const 잰날 = 앞말(글, 'dataAsOf');
  const 늦음 = 날수(잰날, 낸날);
  const 반응 = 늦음 !== null && 늦음 >= 0 && 늦음 <= 7;
  const 제목 = 앞말(글, 'title') ?? '';
  /* 제목에 수가 있나 — 「50%」·「421」·「3.5 weeks」 다 받는다 */
  const 제목에수 = /[0-9]/.test(제목);
  const 지면 = /^pages:/m.test(String(글 ?? ''));
  return { 반응, 만듦: 제목에수, 지면걸음: 지면, 늦음 };
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
  const g = 공격형갈래(견본);
  검('하루 전 자료는 반응으로 센다', g.반응 === true);
  검('곁 지표 — 지면을 걸면 표시된다', g.지면걸음 === true);
  검('⛔ 제목에 수가 없으면 만듦이 아니다', 공격형갈래(견본).만듦 === false);
  const 수제목 = ['---', 'title: "421 titles moved"', 'pubDate: 2026-09-02',
    'dataAsOf: 2026-09-02T00:00:00+09:00', '---'].join(LF);
  검('제목에 수가 있으면 만듦으로 센다', 공격형갈래(수제목).만듦 === true);
  검('⛔ pages: 없는 사이트에서도 만듦을 잴 수 있다', 공격형갈래(수제목).지면걸음 === false
    && 공격형갈래(수제목).만듦 === true);
  const 옛 = ['---', 'pubDate: 2026-09-02', 'dataAsOf: 2026-01-01T00:00:00+09:00', '---'].join(LF);
  검('⛔ 여덟 달 묵은 자료는 반응이 아니다', 공격형갈래(옛).반응 === false);
  검('지면이 없으면 만듦이 아니다', 공격형갈래(옛).만듦 === false);
  검('유닛 목록에 번호가 다 있다', 유닛들.every((u) => /^[1-9]번$/.test(u.번호)));
  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}${LF}${실.map((s) => `   · ${s}`).join(LF)}`);
    process.exit(1);
  }
  console.log(`✅ 전 유닛 점검 보고 자가시험 통과 (${통})`);
  process.exit(0);
}

/* ── 여기서부터 실제로 잰다 ── */

function 발행센다(날, 유닛) {
  const 결과 = { 편수: 0, 반응: 0, 만듦: 0, 제목들: [] };
  for (const 방 of 유닛.콘텐트) {
    const d = path.join(뿌리, 방);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.md'))) {
      const 글 = fs.readFileSync(path.join(d, f), 'utf8');
      if (앞말(글, 'pubDate') !== 날) continue;
      if (앞말(글, 'draft') === 'true') continue;
      결과.편수 += 1;
      const g = 공격형갈래(글);
      if (g.반응) 결과.반응 += 1;
      if (g.만듦) 결과.만듦 += 1;
      결과.제목들.push(앞말(글, 'title') ?? f);
    }
  }
  return 결과;
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

function ga4읽기() {
  try {
    const out = execFileSync('node', ['scripts/ga4-report.mjs'], { cwd: 뿌리, encoding: 'utf8', timeout: 120000 });
    return out.split(LF).filter((l) => l.trim()).slice(-14).join(LF);
  } catch (e) { return null; }
}

if (내가) {
  const 인자 = (이름) => {
    const p = process.argv.find((x) => x.startsWith(`--${이름}=`));
    return p ? p.slice(이름.length + 3) : null;
  };
  const 날 = 인자('날') ?? 어제();
  const 지금 = new Date();
  const 발행 = new Map(유닛들.map((u) => [u.번호, 발행센다(날, u)]));
  const 커밋 = 커밋센다(날);
  const geo = await geo재기();
  const ga4 = ga4읽기();

  const 총편수 = [...발행.values()].reduce((a, x) => a + x.편수, 0);
  const 총반응 = [...발행.values()].reduce((a, x) => a + x.반응, 0);
  const 총만듦 = [...발행.values()].reduce((a, x) => a + x.만듦, 0);

  const 줄 = [];
  const 쓴다 = (...x) => 줄.push(...x);
  쓴다(`# 전 유닛 점검 보고 — ${날} (완결된 하루)`, '');
  쓴다(`작성 ${지금.toLocaleString('ko-KR')} KST · 총괄대행 5번 · 사장님 지시 2026-09-03 「매일 23시」`, '');
  쓴다('> 이 보고는 각 유닛의 자기 실적 보고(16시)와 다른 것입니다 — **총괄이 전 유닛을 재서 점검한 결과**입니다.', '');

  쓴다('## Ⅰ. 공격형 콘텐트 — 어제 «발행된» 것', '');
  쓴다('### 1-1. 유닛별', '');
  쓴다('| 유닛 | 사이트 | 발행 편수 | 이슈에 반응 | 이슈를 만듦 | 어제 커밋 |');
  쓴다('| --- | --- | ---: | ---: | ---: | ---: |');
  for (const u of 유닛들) {
    const p = 발행.get(u.번호);
    const 몫 = u.콘텐트.length ? String(p.편수) : '—';
    쓴다(`| ${u.번호} | ${u.이름} | **${몫}** | ${u.콘텐트.length ? p.반응 : '—'} | ${u.콘텐트.length ? p.만듦 : '—'} | ${커밋[u.번호] ?? 0} |`);
  }
  쓴다('', `합계 — 발행 **${총편수}편** · 이슈 반응 ${총반응} · 이슈 생성 ${총만듦}`, '');
  쓴다('### 1-2. ⛔ 커밋 수는 콘텐트가 아닙니다', '');
  쓴다('두 칸을 나란히 둔 까닭입니다. 커밋에는 로그·보고·수집이 다 섞여 있어, 커밋만 세면');
  쓴다('일한 것처럼 보입니다. **오른쪽 「발행 편수」가 손님에게 실제로 나간 것**입니다.', '');
  쓴다('### 1-3. 「공격형」을 우리가 어떻게 갈랐나 — 규칙을 그대로 적습니다', '');
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
  쓴다('이 자로 못 잽니다 — 그것은 Ⅲ의 외부 반응에서 봅니다.**', '');
  for (const u of 유닛들) {
    const p = 발행.get(u.번호);
    if (!p.제목들.length) continue;
    쓴다(`**${u.번호} ${u.이름}** — 어제 나간 것`, '');
    for (const t of p.제목들) 쓴다(`- ${t}`);
    쓴다('');
  }

  쓴다('## Ⅱ. SEO·GEO 맞춤 — 라이브에서 잰 것', '');
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

  쓴다('## Ⅲ. 외부 반응', '');
  if (ga4) { 쓴다('```', ga4, '```', ''); } else {
    쓴다('⬜ **못 쟀습니다** — GA4 보고가 이 자리에서 안 돌았습니다. 0 으로 적지 않습니다.', '');
  }
  쓴다('⚠ GA4 는 광고차단·쿠키거부로 **덜 세는 쪽**입니다. 바닥값으로 읽습니다.', '');

  쓴다('## Ⅳ. 못 잰 것', '');
  쓴다('- **영상 편수** — 발행 편수는 글만 셉니다. 영상은 사이트마다 두는 자리가 달라 아직 한 자로 못 셉니다.');
  쓴다('- **기사가 일으킨 반응** — 인용·언급을 세는 길이 아직 없습니다. 「못 쟀다」로 둡니다.');
  쓴다('- **klifemap 의 콘텐트 발행** — 그 사이트는 지면이 마크다운이 아니라, 이 자가 세는 꼴이 아닙니다.', '');

  const 낼곳 = path.join(뿌리, 'docs/보고/전유닛-점검');
  fs.mkdirSync(낼곳, { recursive: true });
  const md = path.join(낼곳, `전유닛-점검_${날.split('-').join('')}.md`);
  fs.writeFileSync(md, 줄.join(LF) + LF, 'utf8');
  console.log(`보고서를 냈다 — ${path.relative(뿌리, md)}`);
  console.log(`발행 ${총편수}편 · 이슈반응 ${총반응} · 이슈생성 ${총만듦} · llms.txt 빠진 곳 ${빵.length}`);

  let pdf = null;
  try {
    execFileSync('node', ['scripts/md-to-pdf.mjs', path.relative(뿌리, md)], { cwd: 뿌리, stdio: 'pipe' });
    pdf = md.replace(/\.md$/, '.pdf');
    if (!fs.existsSync(pdf)) pdf = null;
  } catch { pdf = null; }
  console.log(pdf ? `PDF 도 냈다 — ${path.relative(뿌리, pdf)}` : '⬜ PDF 는 못 냈다 — md 로만 낸다');

  /**
   * 기본 받는곳. ⛔ 짐작한 주소가 아니다 — `docs/사장님-접속-자원.md` 10~18줄에 세 사이트의
   *   관리자 계정으로 적혀 있는 주소이고, 파는 한 벌 README 의 연락처와도 같다.
   *   그래도 인자로 덮을 수 있게 둔다.
   */
  const 받는곳 = 인자('받는곳') ?? 'parkintaek2@gmail.com';
  if (!process.argv.includes('--보낸다')) {
    console.log(LF + '⭐ 메일은 안 보냈다. 보내려면 --받는곳=… --보낸다');
    process.exit(0);
  }
  if (!받는곳 || !받는곳.includes('@')) { console.error('⛔ 받는곳이 주소가 아니다. 짐작으로 안 보낸다'); process.exit(1); }
  execFileSync('node', ['scripts/send-mail.mjs', `--받는곳=${받는곳}`,
    `--제목=[전 유닛 점검] ${날} · 발행 ${총편수}편 · 이슈반응 ${총반응} · 이슈생성 ${총만듦}`,
    `--글=${path.relative(뿌리, md)}`, '--보낸다'], { cwd: 뿌리, stdio: 'inherit' });
}
