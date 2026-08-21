#!/usr/bin/env node
/**
 * build-100y-video-meta.mjs — **영상 구조화 자료의 빠진 칸을 채운다**
 *
 * 🔴 사장님이 8/21 에 넘겨 주신 Search Console 편지 —
 *   `100yearmap.com` 동영상 구조화된 데이터 문제 3개
 *     ① 심각    「thumbnailUrl」 입력란이 누락되었습니다   ← 이것 때문에 검색에 **안 나온다**
 *     ② 심각 아님 「uploadDate」의 datetime 값이 잘못됨
 *     ③ 심각 아님 datetime 속성(「uploadDate」)에 시간대가 누락됨
 *
 * ── 왜 그랬나 ─────────────────────────────────────────────────
 * `/video` 의 JSON-LD 가 `uploadDate: v.만든날` 로 «2026-08-20» 만 적었다.
 * 그것은 날짜이고 datetime 이 아니다. 시간도 시간대도 없다. 썸네일 칸은 아예 없었다.
 *
 * ── ⛔ 어떻게 고치나 — 여기가 이 자의 핵심이다 ─────────────────
 * ⛔ **시각을 지어내지 않는다.** 「2026-08-20T00:00:00+09:00」 처럼 0시를 박으면
 *    구조화 자료 검사는 통과하지만 **거짓을 적은 것**이다. 그 영상은 0시에 안 나갔다.
 *    ⇒ 그 파일이 **git 에 실제로 들어간 때**를 쓴다. 그것이 진짜 「올라간 때」이고
 *      타임존이 붙어 있고(+09:00) 기계가 바뀌어도 같다.
 * ⛔ **썸네일도 지어내지 않는다.** 없는 그림 주소를 적으면 그것도 거짓이다.
 *    ⇒ 그 영상에서 **한 칸을 실제로 뽑아** jpg 로 낸다(ffmpeg).
 *
 * ⚠ 첫 칸은 검은 화면일 수 있다 — 그래서 **1초 지점**을 뽑는다.
 *
 * 쓰는 법
 *   node scripts/build-100y-video-meta.mjs            썸네일을 뽑고 대장에 적는다
 *   node scripts/build-100y-video-meta.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 대장길 = path.join(뿌리, 'src/data/100yearmap/videos.json');
export const 그림방 = path.join(뿌리, 'public/100y/video/thumb');
/**
 * ⚠ **어느 칸을 뽑나** — 이것이 썸네일의 전부다.
 *   첫 칸(0초)은 검고, 1초는 제목만 있고 **수가 아직 안 떠 있다**(눈으로 보고 알았다).
 *   썸네일은 검색 결과에 «그림»으로 나가는 자리다. 수가 없으면 아무 말도 안 한다.
 *   ⇒ 14초 영상의 **중반(7초)** 을 뽑는다. 그때 수가 화면에 있다.
 */
export const 뽑을때 = '00:00:07';

/**
 * 초를 ISO 8601 기간으로 — Google 이 `duration` 에 원하는 꼴이다.
 * ⛔ 없으면 null 을 낸다. 「PT0S」 로 만들면 「0초 영상」이라는 거짓이 된다.
 */
export function 기간말(초) {
  const n = Number(초);
  if (!Number.isFinite(n) || n <= 0) return null;
  return `PT${Math.round(n)}S`;
}

/**
 * ⛔ **시각을 지어내는지 검사한다.** 0시 0분 0초가 박힌 값은 거짓일 확률이 크다.
 *   Search Console 을 통과하려고 0시를 박는 것이 바로 우리가 안 하려는 일이다.
 */
export function 지어낸시각인가(s) {
  return typeof s === 'string' && /T00:00:00([+Z-]|$)/.test(s);
}

/** datetime 이 제대로 된 꼴인가 — 날짜만 있으면 안 된다. 시간대가 있어야 한다 */
export function 제대로된datetime(s) {
  if (typeof s !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(s);
}

/** 그 파일이 git 에 실제로 들어간 때 — ⛔ 못 찾으면 null. 지어내지 않는다 */
export function 깃에들어간때(상대길) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%aI', '--', 상대길],
      { cwd: 뿌리, encoding: 'utf8' }).trim();
    return 제대로된datetime(out) ? out : null;
  } catch {
    return null;
  }
}

/* ── 자가시험 ─────────────────────────────────────────── */
if (process.argv.includes('--selftest')) {
  const 본다 = (말, 참) => { console.log(참 ? '✅' : '🔴', 말); if (!참) process.exitCode = 1; };
  본다('① 초를 ISO 기간으로', 기간말(14) === 'PT14S' && 기간말(60) === 'PT60S');
  본다('② ⛔ 없거나 0 이면 기간을 안 낸다', 기간말(null) === null && 기간말(0) === null);
  본다('③ 날짜만 있으면 datetime 이 아니다', !제대로된datetime('2026-08-20'));
  본다('④ 시간대가 없으면 datetime 이 아니다', !제대로된datetime('2026-08-20T19:59:04'));
  본다('⑤ 시간대가 붙으면 datetime 이다',
    제대로된datetime('2026-08-20T19:59:04+09:00') && 제대로된datetime('2026-08-20T10:59:04Z'));
  본다('⑥ ⛔ 0시가 박힌 값을 「지어낸 것」으로 잡는다',
    지어낸시각인가('2026-08-20T00:00:00+09:00') && !지어낸시각인가('2026-08-20T19:59:04+09:00'));
  process.exit();
}

const 내가직접불렸나 = !!process.argv[1] && path.basename(process.argv[1]) === 'build-100y-video-meta.mjs';
if (내가직접불렸나) {
  const 갖다 = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
  const ff = 갖다('ffmpeg-static');
  const 대장 = JSON.parse(fs.readFileSync(대장길, 'utf8'));
  fs.mkdirSync(그림방, { recursive: true });

  const 못한것 = [];
  let 그림낸것 = 0, 때찾은것 = 0;

  for (const v of 대장.영상) {
    const 영상길 = path.join(뿌리, 'public', v.파일.replace(/^\//, ''));
    if (!fs.existsSync(영상길)) { 못한것.push(`${v.슬러그} — 영상 파일이 없다`); continue; }

    /* ① 썸네일 — 그 영상에서 실제로 한 칸을 뽑는다 */
    const 그림이름 = `${v.슬러그}.jpg`;
    const 그림길 = path.join(그림방, 그림이름);
    try {
      execFileSync(ff, ['-y', '-ss', 뽑을때, '-i', 영상길, '-frames:v', '1',
        '-q:v', '3', 그림길], { stdio: 'pipe' });
      if (!fs.existsSync(그림길) || fs.statSync(그림길).size < 1000) throw new Error('그림이 너무 작다');
      v.그림 = `/100y/video/thumb/${그림이름}`;
      그림낸것++;
    } catch (e) {
      /* ⛔ 못 뽑았으면 주소를 «안» 적는다. 없는 그림을 적는 것이 지금 문제의 원인이다 */
      delete v.그림;
      못한것.push(`${v.슬러그} — 썸네일을 못 뽑았다(${String(e.message).slice(0, 50)})`);
    }

    /* ② 올라간 때 — ⛔ git 에서 «실제로» 가져온다. 없으면 안 적는다 */
    const 때 = 깃에들어간때(`public${v.파일}`);
    if (때) { v.올라간때 = 때; 때찾은것++; }
    else { delete v.올라간때; 못한것.push(`${v.슬러그} — git 에 들어간 때를 못 찾았다`); }

    /* ③ 길이 */
    const 기간 = 기간말(v.초);
    if (기간) v.기간 = 기간; else delete v.기간;
  }

  대장['⛔ 시각을 지어내지 않는다'] =
    '「올라간때」는 그 영상 파일이 git 에 실제로 들어간 때입니다. '
    + '구조화 자료 검사를 통과하려고 0시를 박지 않았습니다 — 그 영상은 0시에 나가지 않았습니다.';
  대장['⛔ 썸네일을 지어내지 않는다'] =
    '「그림」은 그 영상의 1초 지점을 실제로 뽑은 jpg 입니다. 못 뽑은 영상에는 주소를 적지 않았습니다.';
  대장.구조화자료고친날 = 깃에들어간때('src/data/100yearmap/videos.json') ? undefined : undefined;
  delete 대장.구조화자료고친날;

  fs.writeFileSync(대장길, JSON.stringify(대장, null, 1), 'utf8');

  console.log(`✅ ${path.relative(뿌리, 대장길)}`);
  console.log(`   영상 ${대장.영상.length}개 · 썸네일 ${그림낸것}개 뽑음 · 올라간 때 ${때찾은것}개 찾음`);
  for (const v of 대장.영상) {
    console.log(`   ${v.그림 ? '✅' : '🔴'} ${v.슬러그.padEnd(14)} ${v.올라간때 ?? '(때 없음)'} ${v.기간 ?? ''}`);
  }
  if (못한것.length) { console.log('\n🔴 못한 것:'); for (const m of 못한것) console.log('  ', m); }
  else console.log('\n⛔ 지어낸 값 0개 — 못 구한 칸은 아예 안 적었다');
}
