#!/usr/bin/env node
/**
 * check-asset-files-committed.mjs — **지면이 부르는 파일이 «커밋됐는가».**
 *
 * ── 🔴 왜 또 생겼나 (2026-09-05) ────────────────────────────────
 * 2026-08-29 에 같은 사고가 나서 `check-live-assets.mjs` 를 만들었다. 그것은 «라이브»를
 * 눌러 보는 자다. 그런데 **아무 것도 그 자를 부르지 않아서** 아무도 안 돌렸고,
 * 9월 5일에 내가 똑같이 당했다 —
 *
 * ```
 *   지면·사이트맵·영상목록·색인 «네 곳»을 malaysia-voiced 로 갈아 끼웠다
 *   그런데 mp4 와 섬네일을 **커밋하지 않았다**
 *   → 배포는 성공, 손님 화면에는 재생 안 되는 자리, 내 보고에는 「영상 1/1 ✅」
 * ```
 *
 * ⛔ **자를 만들어 두고 안 부르면 없는 것과 같다.** 그래서 이 자는 라이브가 아니라
 *   «배포 전 원본»을 본다 — 인터넷을 안 타므로 배포 관문에서 늘 돌릴 수 있다.
 *
 * ⭐ 규칙: 지면이 `/video/x.mp4` 라 적으면 그 파일이 **디스크에 있고 git 이 알고 있어야** 한다.
 *   git 이 모르면 배포 서버는 clone 만 하므로 그 파일은 «없는 것»이다.
 *
 * ── 집 접두 ─────────────────────────────────────────────────
 * 서버가 손님 호스트를 보고 경로 접두를 갈아 끼운다(server.mjs). 그래서 원본에서
 * `/video/a.mp4` 는 어느 지면이 부르느냐에 따라 다른 폴더를 가리킨다.
 *
 * ```
 *   src/pages/wikitip/…  →  public/wikitip/…   (kculturewire.com)
 *   src/pages/100y/…     →  public/100y/…      (100yearmap.com)
 *   그 밖                →  public/…           (seoulmarkets.com)
 * ```
 *
 * 쓰는 법
 *   node scripts/check-asset-files-committed.mjs
 *   node scripts/check-asset-files-committed.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.join(__dirname, '..');

/** 우리가 «파일»로 재는 확장자만 본다 — 지면 주소(/school)는 파일이 아니다 */
const 재는확장자 = ['.mp4', '.webm', '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.avif', '.mp3', '.m4a', '.vtt'];

export function 파일주소인가(주소) {
  const s = String(주소 ?? '').split('?')[0].split('#')[0];
  if (!s.startsWith('/')) return false;
  /* 🔴 `/og/${a.slug}.png` 처럼 «틀»인 것은 파일 하나가 아니다 — 이 자가 잴 수 없다.
     빈 칸이 무엇으로 채워지는지는 빌드가 정한다. 여기서 재면 열 건이 다 헛것이 된다
     (2026-09-05 첫 측정에서 실제로 그랬다). 틀은 지면의 빌드 가드가 지킨다. */
  if (s.includes('${')) return false;
  return 재는확장자.some((e) => s.toLowerCase().endsWith(e));
}

/**
 * 어느 지면이 부르는가에 따라 실제 폴더를 정한다.
 * @param {string} 지면길 저장소 뿌리 기준 경로 (예: `src/pages/wikitip/malaysia.astro`)
 * @param {string} 주소  지면이 적은 주소 (예: `/video/a.mp4`)
 */
export function 실제파일길(지면길, 주소) {
  const 길 = String(지면길ary(지면길)).split('\\').join('/');
  const 깨끗 = String(주소).split('?')[0].split('#')[0];
  let 접두 = '';
  if (길.includes('src/pages/wikitip/')) 접두 = 'wikitip';
  else if (길.includes('src/pages/100y/')) 접두 = '100y';
  /* 지면이 이미 접두를 적었으면 두 번 붙이지 않는다 */
  if (접두 && 깨끗.startsWith(`/${접두}/`)) 접두 = '';
  return path.posix.join('public', 접두, 깨끗.replace(/^\//, ''));
}
/* 인자를 문자열로 못 박는다 — undefined 가 들어오면 조용히 'undefined' 를 만들지 않는다 */
function 지면길ary(v) {
  if (typeof v !== 'string' || !v) throw new Error('지면길이 문자열이 아니다');
  return v;
}

/** 파일 본문에서 부르는 «파일 주소»만 뽑는다 */
export function 부르는파일뽑기(글) {
  const 나온것 = new Set();
  for (const m of String(글 ?? '').matchAll(/["'`](\/[^"'`\s>]+)["'`]/g)) {
    if (파일주소인가(m[1])) 나온것.add(m[1].split('?')[0].split('#')[0]);
  }
  return [...나온것];
}

/* ── 자가시험 ───────────────────────────────────────────────── */
const 내가실행됐다 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실 = []; let 통 = 0;
  const 같나 = (이름, 본, 기대) => {
    const a = JSON.stringify(본); const b = JSON.stringify(기대);
    if (a === b) 통 += 1; else 실.push(`${이름}: ${a} ≠ ${b}`);
  };

  같나('mp4 는 파일이다', 파일주소인가('/video/a.mp4'), true);
  같나('지면 주소는 파일이 아니다', 파일주소인가('/school'), false);
  같나('상대 주소는 안 센다', 파일주소인가('video/a.mp4'), false);
  같나('물음표 뒤가 붙어도 잡는다', 파일주소인가('/img/a.png?v=2'), true);
  같나('대문자 확장자도 잡는다', 파일주소인가('/img/A.PNG'), true);
  /* 🔴 2026-09-05 첫 측정에서 나온 열 건이 «전부» 이것이었다 — 틀은 파일이 아니다 */
  같나('템플릿 틀은 파일이 아니다', 파일주소인가('/og/${a.slug}.png'), false);
  같나('틀은 뽑지도 않는다', 부르는파일뽑기('src="/cardnews/${id}-1.png"'), []);
  같나('틀이 아닌 이웃은 그대로 뽑는다',
    부르는파일뽑기('"/cardnews/${id}-1.png" "/video/b.mp4"'), ['/video/b.mp4']);

  같나('wikitip 지면은 public/wikitip 아래를 본다',
    실제파일길('src/pages/wikitip/malaysia.astro', '/video/a.mp4'), 'public/wikitip/video/a.mp4');
  같나('100y 지면은 public/100y 아래를 본다',
    실제파일길('src/pages/100y/age.astro', '/img/a.png'), 'public/100y/img/a.png');
  같나('그 밖은 public 바로 아래다',
    실제파일길('src/pages/about.astro', '/img/a.png'), 'public/img/a.png');
  같나('접두를 이미 적었으면 두 번 붙이지 않는다',
    실제파일길('src/pages/wikitip/x.astro', '/wikitip/video/a.mp4'), 'public/wikitip/video/a.mp4');
  같나('윈도 역슬래시 길도 받는다',
    실제파일길('src\\pages\\wikitip\\x.astro', '/video/a.mp4'), 'public/wikitip/video/a.mp4');

  같나('따옴표 안 주소를 뽑는다', 부르는파일뽑기('src="/video/a.mp4"'), ['/video/a.mp4']);
  같나('지면 주소는 안 뽑는다', 부르는파일뽑기('href="/school"'), []);
  같나('같은 것이 두 번 나와도 하나다',
    부르는파일뽑기('"/img/a.png" ... "/img/a.png"'), ['/img/a.png']);
  같나('바깥 주소는 안 뽑는다', 부르는파일뽑기('src="https://x.com/a.png"'), []);
  같나('빈 글은 빈 목록이다', 부르는파일뽑기(''), []);

  /* 🔴 이 자가 생긴 «그 사고» 자체를 시험으로 굳힌다 */
  같나('2026-09-05 사고 — malaysia 소리판이 보던 자리',
    실제파일길('src/pages/wikitip/malaysia.astro', '/video/malaysia-voiced.mp4'),
    'public/wikitip/video/malaysia-voiced.mp4');

  let 던졌나 = false;
  try { 실제파일길(undefined, '/a.png'); } catch { 던졌나 = true; }
  같나('지면길이 없으면 조용히 넘어가지 않는다', 던졌나, true);

  if (실.length) { console.error(`❌ 자가시험 ${실.length}건 실패\n${실.map((s) => `   · ${s}`).join('\n')}`); process.exit(1); }
  console.log(`✅ 부르는 파일이 커밋됐는지 재는 자 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

/* ── 실제로 잰다 ─────────────────────────────────────────────── */
/**
 * 저장소를 훑어 «부르는데 없는» 파일을 돌려준다.
 * ⭐ 배포 관문이 이것을 부른다 — **자를 만들어 놓고 아무도 안 부르면 없는 것과 같다.**
 *   2026-08-29 에 만든 `check-live-assets.mjs` 가 딱 그 꼴이어서 9월 5일에 같은 사고가 났다.
 */
export function 본다() {
  const 깃이아는것 = new Set(
    execFileSync('git', ['-c', 'core.quotepath=false', 'ls-files'], { cwd: 뿌리, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
      .split('\n').map((s) => s.trim()).filter(Boolean),
  );

  const 볼것 = [];
  const 훑기 = (디렉) => {
    for (const e of fs.readdirSync(디렉, { withFileTypes: true })) {
      const p = path.join(디렉, e.name);
      if (e.isDirectory()) { 훑기(p); continue; }
      if (/\.(astro|ts|tsx|js|mjs)$/.test(e.name)) 볼것.push(p);
    }
  };
  훑기(path.join(뿌리, 'src', 'pages'));

  const 빠진것 = [];
  for (const p of 볼것) {
    const 상대 = path.relative(뿌리, p).split('\\').join('/');
    let 글; try { 글 = fs.readFileSync(p, 'utf8'); } catch { continue; }
    for (const 주소 of 부르는파일뽑기(글)) {
      const 파일 = 실제파일길(상대, 주소);
      if (깃이아는것.has(파일)) continue;
      const 디스크에있나 = fs.existsSync(path.join(뿌리, 파일));
      빠진것.push({ 지면: 상대, 주소, 파일, 까닭: 디스크에있나 ? '커밋 안 됨 — 배포 서버에는 없다' : '파일 자체가 없다' });
    }
  }

  return { 지면수: 볼것.length, 빠진것 };
}

/** 관문과 사람이 함께 읽는 줄 — 판정과 글쓰기를 갈라 둔다 */
export function 판정줄(r) {
  if (!r.빠진것.length) return [`✅ 지면 ${r.지면수}개가 부르는 파일 — 빠진 것 없음`];
  const 줄 = [`🔴 손님에게 404 로 보일 파일 ${r.빠진것.length}건`];
  for (const b of r.빠진것) {
    줄.push(`   · ${b.지면}`);
    줄.push(`       부른 주소 ${b.주소} → 있어야 할 곳 ${b.파일}`);
    줄.push(`       ${b.까닭}`);
  }
  줄.push('⛔ 그 파일을 커밋한 뒤에 배포하십시오. 지면만 나가면 깨진 자리가 보입니다.');
  return 줄;
}

if (내가실행됐다) {
  const r = 본다();
  for (const 줄 of 판정줄(r)) (r.빠진것.length ? console.error : console.log)(줄);
  process.exit(r.빠진것.length ? 1 : 0);
}
