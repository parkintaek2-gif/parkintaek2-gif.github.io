/**
 * stamp-site-entrance.mjs — **이미 만든 영상에 «우리 사이트 입구»를 화면으로 굽는다.**
 *
 * ── 🔴 왜 이 자가 생겼나 ───────────────────────────────────────
 * 2026-08-25 오후, 사장님 지시 —
 * ```
 *   「숏츠 등에 우리 사이트 입구를 만들어놔. 텍스트라도」
 * ```
 * 그 직전에 내가 유입 경로를 처음 재서 이렇게 보고했다 —
 * ```
 *   유튜브 숏츠 10편   조회 88회
 *   그 영상이 사이트로 보낸 사람   «0명»
 * ```
 * 설명 첫 줄을 전부 지면 주소로 넣어 두었는데도 0이었다. **숏츠는 설명이 두 줄만 접힌 채
 * 보이고 보는 사람이 펼치지 않는다.** 그래서 「텍스트라도」 — 링크가 아니라 **눈에 보이는
 * 글자**로 화면에 넣으라는 말씀이다.
 *
 * ⛔ 영상 만드는 자가 21개다(`make-video-kcw-*.mjs`). 그것을 스물한 번 고치지 않는다 —
 *   **이미 만들어진 mp4 에 굽는다.** 그러면 다른 유닛 영상에도 그대로 쓸 수 있다
 *   (6번 58편 · 4번 킷도 같은 처지다).
 *
 * ── ⛔ 이 자가 지키는 것 ───────────────────────────────────────
 * ⛔ **원본을 덮어쓰지 않는다.** 낼 곳을 따로 두고, 낼 곳이 이미 있으면 --덮는다 없이는 안 한다.
 * ⛔ 글자를 «영상 내내» 띄우지 않는다. 숏츠는 아래쪽에 제목·계정이 겹쳐 뜨므로
 *   그 자리를 피하고, 마지막 몇 초에만 크게 띄운다 — 보는 사람이 끝까지 봤을 때 남는 것이다.
 * ⚠ 이것으로 유입이 늘지는 **모른다.** 「구웠다」와 「사람이 온다」는 다른 말이다 —
 *   그것을 몰라서 오늘 0을 봤다. 올린 뒤 `measure-referrals.mjs` 로 다시 잰다.
 *
 * 쓰는 법  node scripts/stamp-site-entrance.mjs --자가시험
 *          node scripts/stamp-site-entrance.mjs --방=public/wikitip/video --낼방=archive/video-stamped
 *          node scripts/stamp-site-entrance.mjs --방=... --글=seoulmarkets.com   (다른 유닛)
 */
import { readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 인자 = (이름, 기본) => {
  const 머리 = `--${이름}=`;
  const a = process.argv.find((x) => x.startsWith(머리));
  return a ? a.slice(머리.length) : 기본;
};

/**
 * ffmpeg 의 drawtext 는 글에 든 `:` `'` `\` 를 뜻있는 글자로 읽는다.
 * ⛔ 안 막으면 `www.kculturewire.com` 은 괜찮아도 `https://` 를 넣는 순간 필터가 깨진다.
 *   그리고 깨진 필터는 «조용히 다른 그림»을 내지 않고 ffmpeg 가 통째로 실패한다 — 그건 다행이다.
 */
export function 글막기(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
    .replace(/%/g, '\\%');
}

/** 윈도우 글꼴 경로도 drawtext 안에서는 `C:` 의 콜론을 막아야 한다 */
export function 글꼴막기(p) {
  return String(p ?? '').replace(/\\/g, '/').replace(/:/g, '\\:');
}

/**
 * 마지막 몇 초에만 띄우는 drawtext 필터를 만든다.
 * ⚠ 숏츠는 **아래쪽 25% 쯤에 제목·계정·버튼이 겹쳐 뜬다.** 거기 글자를 두면 가려진다.
 *   그래서 가운데보다 조금 아래(0.72) 에 둔다 — 화면 아래 끝이 아니다.
 */
export function 필터(글, 글꼴, 길이초, 보일초 = 4) {
  const 시작 = Math.max(0, Number(길이초) - Number(보일초));
  return [
    `drawtext=fontfile='${글꼴막기(글꼴)}'`,
    `text='${글막기(글)}'`,
    'fontcolor=white',
    'fontsize=44',
    'box=1',
    'boxcolor=0x0e0c14@0.72',
    'boxborderw=18',
    'x=(w-text_w)/2',
    'y=h*0.72',
    `enable='between(t,${시작.toFixed(2)},${Number(길이초).toFixed(2)})'`,
  ].join(':');
}

/**
 * 🔴 겹쳐 쓰지 않고 **뒤에 «끝화면»을 붙인다.** 왜 바꿨는지 적어 둔다.
 *
 * 위 `필터` 로 21편을 굽고 **눈으로 열어 봤더니 글자가 본문 위에 겹쳐 있었다.**
 * 숏영상은 14초 안에 화면을 꽉 채워 쓰기 때문에 «빈 자리가 없다» — 어디에 놓아도 겹친다.
 * ⛔ 수만 보고 넘겼으면 21편을 겹친 채로 올릴 뻔했다. 8/24 밤에 썸네일을 11초에서
 *   뽑았다가 글자가 겹친 것을 눈으로 보고 고친 것과 «같은 자리»다.
 *
 * ⭐ 그리고 열어 보고 하나 더 알았다 — **영상 맨 끝에 이미 주소가 있었다**
 *   (`kculturewire.com/actors-first`, 작은 분홍 글자). 그런데도 유입이 0이었다.
 *   그러니 「주소를 넣었나」가 아니라 **「눈에 들어오나」**가 문제였다.
 *   그래서 겹쳐 쓰지 않고 **아무것도 없는 화면을 뒤에 붙여** 거기에 크게 적는다.
 */
export function 끝화면필터(글, 글꼴, 길이초, 붙일초 = 2.5, 아래글 = '') {
  const t = Math.max(0.5, Number(붙일초));
  const 끝 = Number(길이초);
  /* ⛔ tpad 로 «단색» 화면을 뒤에 붙인다. clone 으로 마지막 프레임을 늘리면
       거기에도 본문이 남아 또 겹친다 — 빈 화면이어야 글자가 눈에 들어온다 */
  const 조각 = [
    `tpad=stop_mode=add:stop_duration=${t.toFixed(2)}:color=0x0e0c14`,
    [
      `drawtext=fontfile='${글꼴막기(글꼴)}'`,
      `text='${글막기(글)}'`,
      'fontcolor=white', 'fontsize=76',
      'x=(w-text_w)/2', 'y=(h-text_h)/2-40',
      `enable='gt(t,${끝.toFixed(2)})'`,
    ].join(':'),
  ];
  if (아래글) {
    조각.push([
      `drawtext=fontfile='${글꼴막기(글꼴)}'`,
      `text='${글막기(아래글)}'`,
      'fontcolor=0xf0a5c0', 'fontsize=44',
      'x=(w-text_w)/2', 'y=(h-text_h)/2+70',
      `enable='gt(t,${끝.toFixed(2)})'`,
    ].join(':'));
  }
  return 조각.join(',');
}

/**
 * 🔴 2026-08-25 저녁, 사장님이 자리를 «하나 더» 주셨다.
 *
 *   「숏 영상 계속 올려…**영상 내에도 사이트 소개+주소 올려라, 아주 작게**..마지막에도
 *    올리지만.. 우리 사이트를 홍보하기 좋으니까」
 *
 * 그때까지 나는 **끝화면 하나**만 붙여 두고 「입구를 만들었다」고 여기고 있었다.
 * ⛔ 끝까지 안 보고 넘기는 사람에게는 끝화면이 «없는 것과 같다». 숏츠는 대부분 그렇다.
 * 그래서 영상이 도는 **내내** 한 줄을 띄운다.
 *
 * ── 어디에 두나 — 화면을 «뽑아 보고» 정했다 ──────────────────
 * 1080×1920 프레임을 2초·7초·12초에서 뽑아 눈으로 봤다.
 * ```
 *   2초   위쪽 0.10 아래로 큰 숫자가 선다. 맨 위 90px 은 비어 있다
 *   12초  표와 각주가 0.93 까지 내려온다 — «아래쪽에는 빈 띠가 없다»
 * ```
 * ⛔ 그래서 아래에 두면 안 된다. 숏츠는 아래 25%에 제목·계정·버튼까지 겹쳐 뜬다.
 * ⭐ 두 시각에 모두 비어 있는 곳은 **맨 위 띠 하나뿐**이라 거기 둔다.
 * ⚠ 「아주 작게」라고 하셨으므로 1080 폭에 글자 32(≈3%)다. ⛔ 키우지 않는다 —
 *   8/25 낮에 크게 넣었다가 본문을 가려 21편을 다시 만들었다.
 * ⚠ 그런데 «작아서 안 보이는 것»도 실패다 — 원본에 이미 회색 주소가 있었는데 유입이 0이었다.
 *   그래서 작되 **흐리지는 않게** 한다(흰색 0.82, 어두운 띠 위).
 */
export function 내내필터(소개, 주소, 글꼴) {
  const 글 = [소개, 주소].filter(Boolean).join("  ·  ");
  return [
    `drawtext=fontfile='${글꼴막기(글꼴)}'`,
    `text='${글막기(글)}'`,
    'fontcolor=white@0.82',
    'fontsize=32',
    'box=1',
    'boxcolor=0x0e0c14@0.55',
    'boxborderw=14',
    'x=(w-text_w)/2',
    'y=18',
    /* ⛔ enable 을 안 준다 — «내내»가 지시다. 끝화면 위에도 그대로 남는다 */
  ].join(':');
}

/** 영상 길이를 ffmpeg 로 읽는다. ⛔ 못 읽으면 null 이다 — 0 으로 안 적는다 */
export function 길이재기(파일, 부르기 = execFileSync) {
  try {
    const out = 부르기(ffmpegPath, ['-i', 파일], { stdio: ['ignore', 'ignore', 'pipe'], encoding: 'utf8' });
    return 시간뽑기(out);
  } catch (e) {
    return 시간뽑기(String(e?.stderr ?? ''));
  }
}

/** `Duration: 00:00:14.52` 에서 초를 뽑는다 */
export function 시간뽑기(글) {
  const m = String(글 ?? '').match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

/* ────────────────────────── 자가시험 ────────────────────────── */
function 자가시험() {
  const 시험 = [];
  const T = (이름, 참) => 시험.push([이름, !!참]);

  T('글막기 — 콜론을 막는다', 글막기('https://a.com').includes('\\:'));
  T('글막기 — 홑따옴표를 막는다', 글막기("it's").includes("\\'"));
  T('글막기 — 퍼센트를 막는다', 글막기('50%').includes('\\%'));
  T('글막기 — 보통 글자는 그대로', 글막기('www.kculturewire.com') === 'www.kculturewire.com');
  T('글막기 — 빈 값에 안 터진다', 글막기(undefined) === '');

  T('글꼴막기 — 역슬래시를 슬래시로', 글꼴막기('C:\\Windows\\Fonts\\arial.ttf').includes('/'));
  T('글꼴막기 — 드라이브 콜론을 막는다', 글꼴막기('C:/x.ttf').startsWith('C\\:'));

  const f = 필터('www.kculturewire.com', 'C:/Windows/Fonts/arialbd.ttf', 14, 4);
  T('필터 — 글이 들어간다', f.includes('www.kculturewire.com'));
  T('필터 — 마지막 4초에만 띄운다', f.includes('between(t,10.00,14.00)'));
  /* ⚠ 숏츠 아래쪽엔 제목·계정이 겹쳐 뜬다. 화면 맨 아래에 두면 가려진다 */
  T('필터 — 화면 «맨 아래»에 두지 않는다', f.includes('y=h*0.72') && !f.includes('y=h-'));
  T('필터 — 뒤에 상자를 깔아 읽히게 한다', f.includes('box=1'));
  T('필터 — 길이가 짧아도 시작이 음수가 안 된다',
    필터('a', 'x.ttf', 2, 4).includes('between(t,0.00,2.00)'));

  T('시간뽑기 — Duration 에서 초를 뽑는다',
    Math.abs(시간뽑기('  Duration: 00:00:14.52, start:') - 14.52) < 0.01);
  T('시간뽑기 — 시·분도 센다', 시간뽑기('Duration: 01:02:03.00') === 3723);
  /* ⛔ 못 읽은 것을 0 으로 적으면 「길이 0인 영상」이 되어 필터가 엉뚱해진다 */
  T('시간뽑기 — 못 읽으면 null(0 이 아니다)', 시간뽑기('아무것도') === null);
  T('시간뽑기 — 빈 값도 null', 시간뽑기(undefined) === null);
  T('길이재기 — ffmpeg 가 stderr 로 내도 읽는다',
    길이재기('x.mp4', () => { const e = new Error('x'); e.stderr = 'Duration: 00:00:09.00,'; throw e; }) === 9);

  const 진 = 시험.filter(([, ok]) => !ok);
  for (const [이름] of 진) console.error(`❌ ${이름}`);
  if (진.length) { console.error(`⛔ stamp-site-entrance 자가시험 ${진.length}개 실패`); process.exit(1); }
  console.log(`✅ stamp-site-entrance 자가시험 통과 (${시험.length})`);
}

/* ────────────────────────── 실행 ────────────────────────── */
if (process.argv.includes('--자가시험')) {
  자가시험();
} else {
  const 방 = path.resolve(뿌리, 인자('방', 'public/wikitip/video'));
  const 낼방 = path.resolve(뿌리, 인자('낼방', 'archive/video-stamped'));
  const 글 = 인자('글', 'www.kculturewire.com');
  const 보일초 = Number(인자('붙일초', '2.5'));
  const 글꼴 = 인자('글꼴', 'C:/Windows/Fonts/arialbd.ttf');
  const 덮는다 = process.argv.includes('--덮는다');

  if (!existsSync(방)) { console.error(`⛔ ${방} 이 없다`); process.exit(1); }
  if (!existsSync(글꼴)) {
    console.error(`⛔ 글꼴이 없다 — ${글꼴}. --글꼴= 으로 준다. 못 굽는다`);
    process.exit(1);
  }
  mkdirSync(낼방, { recursive: true });

  const 것들 = readdirSync(방).filter((f) => f.endsWith('.mp4')).sort();
  if (!것들.length) { console.error(`⛔ ${방} 에 mp4 가 없다`); process.exit(1); }
  console.log(`■ 영상 ${것들.length}편 뒤에 「${글}」 끝화면 ${보일초}초를 붙인다`);
  console.log(`  낼 곳 ${path.relative(뿌리, 낼방)}  ⛔ 원본은 안 건드린다\n`);

  let 구운것 = 0; let 건너뛴것 = 0; let 못한것 = 0;
  for (const f of 것들) {
    const 원본 = path.join(방, f);
    const 낼것 = path.join(낼방, f);
    if (existsSync(낼것) && !덮는다) { 건너뛴것 += 1; continue; }
    const 길이 = 길이재기(원본);
    if (길이 === null) {
      console.log(`  ⬜ ${f.padEnd(16)} 길이를 «못 쟀다» — 건너뛴다(0 으로 안 굽는다)`);
      못한것 += 1;
      continue;
    }
    try {
      execFileSync(ffmpegPath, [
        '-y', '-i', 원본,
        /* ⛔ 순서가 뜻이 있다 — 끝화면을 «먼저» 붙이고 그 위에 내내 줄을 얹어야
           늘어난 끝화면 위에도 줄이 남는다. 뒤집으면 끝 2.5초에서 줄이 사라진다 */
        '-vf', [끝화면필터(글, 글꼴, 길이, 보일초), 내내필터(소개, 글, 글꼴)].join(','),
        '-c:a', 'copy', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
        낼것,
      ], { stdio: 'ignore' });
      const 잰것 = existsSync(낼것) ? statSync(낼것).size : 0;
      if (잰것 < 1000) throw new Error('낸 파일이 너무 작다');
      console.log(`  ✅ ${f.padEnd(16)} ${길이.toFixed(1)}초 · ${(잰것 / 1024 / 1024).toFixed(1)}MB`);
      구운것 += 1;
    } catch (e) {
      console.log(`  ⛔ ${f.padEnd(16)} 못 구웠다 — ${String(e.message).slice(0, 60)}`);
      못한것 += 1;
    }
  }
  console.log(`\n구운 것 ${구운것} · 이미 있어 건너뛴 것 ${건너뛴것} · 못 한 것 ${못한것}`);
  console.log('⚠ 이것으로 «유입이 늘지는 모른다». 구운 것과 사람이 오는 것은 다른 말이다 —');
  console.log('   올린 뒤 measure-referrals.mjs 로 다시 잰다. 안 늘면 안 늘었다고 적는다.');
}
