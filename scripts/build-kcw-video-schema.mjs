/**
 * build-kcw-video-schema.mjs — **영상 21편을 구글이 «영상»으로 알아보게 만든다.**
 *
 * ── 🔴 왜 (2026-08-24 밤, 사장님 「방문자 늘리는 데 올인하라」) ──
 * 밤에 세어 보고 알았다 —
 * ```
 *   K Culture Wire 숏영상        21편   만들어져 있고 라이브에도 있다
 *   그 영상에 VideoObject 스키마   0장   ← 구글이 이것을 «영상»으로 못 본다
 * ```
 * 구글 **비디오 검색과 비디오 캐러셀은 웹 검색과 «다른 자리»**다. 스키마가 없으면
 * 그 자리에 뜰 기회가 0이다. 우리는 21편을 만들어 놓고 그 자리를 통째로 비워 두고 있었다.
 *
 * ⭐ 그리고 이것은 **계정이 필요 없다.** 유튜브 업로드는 로그인(사장님 손)이 막고 있지만
 *   이것은 우리 지면에 글자를 넣는 일이라 지금 할 수 있다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **수를 지어내지 않는다.** 길이는 ffmpeg 으로 «재고», 올린 날은 파일이 만들어진 날을 쓴다.
 *   구글에 거짓 길이를 주면 그 지면 전체의 구조화 데이터가 의심받는다.
 * ⛔ **썸네일 없이 스키마를 내지 않는다.** `thumbnailUrl` 은 구글이 요구하는 칸이고,
 *   없는 채로 내면 「유효하지 않은 항목」이 되어 오히려 손해다. 그래서 여기서 만들어 낸다.
 * ⛔ 못 잰 영상은 **그 영상만 건너뛴다.** 하나가 안 된다고 스무 편을 다 버리지 않는다.
 * ⚠ 이것이 방문자를 «오늘 밤» 늘리지는 않는다. 색인이 붙어야 한다.
 *   그렇게 적는다 — 「했으니 늘 것이다」로 적지 않는다.
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 영상방 = path.join(뿌리, 'public/wikitip/video');
const 그림방 = path.join(뿌리, 'public/wikitip/video/thumb');
const 낼길 = path.join(뿌리, 'src/data/wikitip-video.json');

/**
 * 초를 ISO 8601 기간으로. 구글이 요구하는 꼴이다(PT14S).
 * ⛔ 못 잰 초는 0 이 아니라 null 이다 — 「0초짜리 영상」이라는 거짓을 내지 않는다.
 */
export function 기간글(초) {
  if (!Number.isFinite(초) || 초 <= 0) return null;
  const 총 = Math.round(초);
  const 분 = Math.floor(총 / 60);
  const 남 = 총 % 60;
  return 분 > 0 ? `PT${분}M${남}S` : `PT${남}S`;
}

/** 파일 이름에서 벌 이름. ⛔ 확장자를 그냥 자르지 않는다 — 점이 든 이름을 안 망가뜨린다 */
export function 벌이름(파일) {
  const s = String(파일 ?? '');
  if (!s.toLowerCase().endsWith('.mp4')) return null;
  const n = s.slice(0, -4);
  return n || null;
}

/**
 * 한 영상의 스키마 조각. ⛔ 길이나 썸네일이 없으면 **null 을 돌려준다** —
 * 반쪽짜리 구조화 데이터는 없느니만 못하다.
 */
export function 조각(벌, 초, 올린날, 집, 제목, 설명) {
  const 기간 = 기간글(초);
  if (!벌 || !기간 || !올린날) return null;
  if (!제목 || !설명) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 제목,
    description: 설명,
    thumbnailUrl: [`${집}/video/thumb/${벌}.jpg`],
    uploadDate: 올린날,
    duration: 기간,
    contentUrl: `${집}/video/${벌}.mp4`,
    /* ⛔ embedUrl 을 안 쓴다 — 우리는 플레이어 지면을 따로 두지 않는다. 없는 것을 적지 않는다 */
    publisher: { '@type': 'Organization', name: 'K Culture Wire' },
    isFamilyFriendly: true,
  };
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('초를 구글 꼴로', 기간글(14) === 'PT14S');
  검('분이 넘으면 분을 쓴다', 기간글(75) === 'PT1M15S');
  검('딱 1분', 기간글(60) === 'PT1M0S');
  /* ⛔ 0초짜리 영상이라는 거짓을 내지 않는다 */
  검('⭐ 못 잰 길이는 0 이 아니라 null', 기간글(0) === null && 기간글(null) === null && 기간글(-3) === null);

  검('벌 이름을 뽑는다', 벌이름('actors.mp4') === 'actors');
  검('점이 든 이름도 산다', 벌이름('half.life.mp4') === 'half.life');
  검('mp4 가 아니면 null', 벌이름('actors.png') === null && 벌이름('') === null);

  const 집 = 'https://www.kculturewire.com';
  const o = 조각('actors', 14, '2026-08-21', 집, '제목', '설명');
  검('스키마를 만든다', o && o['@type'] === 'VideoObject');
  검('길이를 넣는다', o.duration === 'PT14S');
  검('썸네일 주소가 있다', o.thumbnailUrl[0] === `${집}/video/thumb/actors.jpg`);
  검('영상 주소가 있다', o.contentUrl === `${집}/video/actors.mp4`);
  /* 🔴 반쪽짜리 구조화 데이터는 없느니만 못하다 — 구글이 「유효하지 않은 항목」으로 잡는다 */
  검('⭐ 길이를 못 재면 스키마를 안 만든다', 조각('actors', null, '2026-08-21', 집, '제목', '설명') === null);
  검('⭐ 올린 날이 없으면 안 만든다', 조각('actors', 14, null, 집, '제목', '설명') === null);
  검('⭐ 제목이나 설명이 없으면 안 만든다',
    조각('actors', 14, '2026-08-21', 집, '', '설명') === null
    && 조각('actors', 14, '2026-08-21', 집, '제목', '') === null);
  검('⛔ 없는 embedUrl 을 적지 않는다', !('embedUrl' in o));

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ build-kcw-video-schema 자가시험 통과 (15)');
  process.exit(0);
}

if (!existsSync(영상방)) { console.error(`⛔ ${영상방} 이 없다`); process.exit(1); }

const ffmpegPath = (await import('ffmpeg-static')).default;
if (!ffmpegPath) { console.error('⛔ ffmpeg 이 없다'); process.exit(1); }

mkdirSync(그림방, { recursive: true });

/** ffmpeg 으로 길이를 «잰다». ⛔ 짐작으로 14초라고 적지 않는다 */
function 길이재기(파일) {
  try {
    /* ffmpeg 은 길이를 stderr 에 적는다. -i 만 주면 오류로 끝나지만 그 글에 길이가 있다 */
    execFileSync(ffmpegPath, ['-i', 파일], { stdio: ['ignore', 'ignore', 'pipe'] });
    return null;
  } catch (e) {
    const 글 = String(e?.stderr ?? '');
    const m = 글.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
    if (!m) return null;
    return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
}

/**
 * ⭐⭐ 2026-08-24 밤 — **썸네일을 「영상에서 뽑기」에서 「카드뉴스 첫 장」으로 바꿨다.**
 *
 * 6번이 seoulmarkets 에서 먼저 그렇게 했고, 까닭을 이렇게 적었다 —
 *   「썸네일은 첫 카드뉴스(디자인된 제목카드, ffmpeg 없이·검은프레임 함정 없이)」
 * 내 것으로 확인해 보니 **6번 말이 맞다.** 세 자리를 실제로 열어 봤다 —
 * ```
 *   2초   제목·요약은 읽히는데 화면 아래 60%가 비어 있다
 *   11초  🔴 «글자가 겹친다» — 화면이 넘어가는 중이라 앞 문장과 뒤 문장이 포개졌다
 *   13초  마지막 주소 카드다. 뒤 내용이 흐려져 읽을 것이 없다
 * ```
 * ⛔ 영상 프레임은 «움직이는 중»을 잡을 수밖에 없다. 어느 초를 골라도 그 위험이 남는다.
 * ⭐ 카드뉴스 첫 장은 **디자인된 정지 화면**이라 겹칠 일이 없고, 큰 글자와 브랜드가 들어 있다.
 *   그리고 벌 이름이 영상과 1:1 로 맞는다(21편 전부).
 *
 * ⚠ 카드뉴스는 가로 1080×1080 이고 썸네일은 세로가 낫다 — 세로 캔버스에 «가운데 놓는다».
 *   ⛔ 잘라 내지 않는다. 자르면 글자가 잘린다. 위아래에 같은 배경색을 채운다.
 * ⛔ 카드뉴스가 없는 영상은 그때만 영상 프레임(2초)으로 떨어진다 — 그 셋 중 가장 안전했다.
 */
function 그림뽑기(파일, 낼곳, 초, 카드) {
  /* ① 카드뉴스 첫 장이 있으면 그것을 쓴다 */
  if (카드 && existsSync(카드)) {
    try {
      execFileSync(ffmpegPath, ['-y', '-i', 카드,
        '-vf', 'scale=405:405,pad=405:720:0:158:0x0e0c14', '-q:v', '3', 낼곳], { stdio: 'ignore' });
      if (existsSync(낼곳) && statSync(낼곳).size > 1000) return true;
    } catch { /* 아래로 떨어진다 */ }
  }
  /* ② 없으면 영상 2초 — 열어 본 셋 중 가장 안전했다 */
  try {
    execFileSync(ffmpegPath, ['-y', '-ss', '2', '-i', 파일, '-frames:v', '1',
      '-vf', 'scale=405:720', '-q:v', '3', 낼곳], { stdio: 'ignore' });
    return existsSync(낼곳) && statSync(낼곳).size > 1000;
  } catch { return false; }
}

const 파일들 = readdirSync(영상방).filter((f) => f.toLowerCase().endsWith('.mp4')).sort();
console.log(`■ 영상 ${파일들.length}편 — 길이를 재고 썸네일을 뽑는다\n`);

const 나온것 = [];
const 못한것 = [];
for (const f of 파일들) {
  const 벌 = 벌이름(f);
  if (!벌) { 못한것.push({ f, 왜: '이름을 못 읽었다' }); continue; }
  const 길 = path.join(영상방, f);
  const 초 = 길이재기(길);
  if (초 === null) { 못한것.push({ f, 왜: '길이를 못 쟀다' }); continue; }
  const 그림 = path.join(그림방, `${벌}.jpg`);
  /* 벌 이름이 카드뉴스 폴더 이름과 1:1 로 맞는다(21편 전부 확인했다) */
  const 카드첫장 = path.join(뿌리, 'public/wikitip/cardnews', 벌, '01.png');
  const 됐나 = 그림뽑기(길, 그림, 초, 카드첫장);
  if (!됐나) { 못한것.push({ f, 왜: '썸네일을 못 뽑았다' }); continue; }
  const 올린날 = statSync(길).mtime.toISOString().slice(0, 10);
  나온것.push({ set: 벌, seconds: Math.round(초 * 10) / 10, uploadDate: 올린날,
    thumb: `/video/thumb/${벌}.jpg`, src: `/video/${벌}.mp4` });
  console.log(`  ✅ ${벌.padEnd(14)} ${초.toFixed(1)}초 · ${올린날}`);
}

for (const x of 못한것) console.log(`  ⛔ ${x.f} — ${x.왜} (이 영상은 스키마를 안 낸다)`);

writeFileSync(낼길, `${JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'Duration measured with ffmpeg; upload date is the file date. Nothing here is estimated.',
  whatThisIsNot: 'This does not mean the videos rank. Google still has to index them.',
  videos: 나온것,
  unmeasured: 못한것.map((x) => ({ file: x.f, reason: x.왜 })),
}, null, 2)}\n`);

console.log(`\n잰 것 ${나온것.length}편 · 못 잰 것 ${못한것.length}편`);
console.log(`냈다 — ${path.relative(뿌리, 낼길)} · 썸네일 ${path.relative(뿌리, 그림방)}`);
console.log('⚠ 이것이 오늘 밤 방문자를 늘리지는 않는다. 구글이 색인해야 뜬다 — 며칠 걸린다.');
