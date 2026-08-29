#!/usr/bin/env node
/**
 * next-silent-video.mjs — **오늘 소리를 입힐 «한 편»을 골라 준다.**
 *
 * ── 사장님 지시 (2026-08-29, 두 번 이르셨다) ──────────────────
 * > 「**무성 콘텐트 삭제하지 말고 소리만 입혀서 추가로 배포해 영상 제목만 바꿔서**」
 * > 「**무성 콘텐트 버전 업은 하루에 1개**」
 * > 「**무음 영상 하루에 1개씩 수정해서 올려. 기존 무음영상 삭제하지말고**」
 *
 * 🔴 사장님이 «두 번» 이르셨다는 것은 내가 잊을 만한 일이라는 뜻이다.
 *   ⭐ 「매일 하는 것은 사장님 손을 쓰지 않는다」 — 사람이 기억해서 지키는 구조를 안 만든다.
 *   그래서 이 자가 **오늘 것이 됐는지 재고, 안 됐으면 다음 한 편을 골라 명령까지 찍는다.**
 *
 * ── 이 자가 지키는 것 ────────────────────────────────────────
 * ⛔ **하루에 한 편이다.** 오늘 이미 냈으면 「오늘 몫 끝」이라고만 하고 더 고르지 않는다.
 *   ⚠ 몰아서 올리면 ① 채널이 재탕으로 보이고 ② 유튜브 하루 한도를 새 편이 못 쓴다.
 * ⛔ **원본 무음판을 지우지 않는다.** 조회수·색인·인용이 거기 붙어 있다.
 * ⛔ **대본이 없는 편을 고르지 않는다** — 대본은 지면 글에서 가져와 «사람이» 적는다.
 *   대본 있는 것이 없으면 「대본부터 적어라」라고 말하고 멈춘다. 지어내라고 시키지 않는다.
 * ⛔ 못 잰 것을 「무음」이라고 하지 않는다 — 음량을 재서 판정한다.
 *
 * ── 어느 것부터 고르나 ───────────────────────────────────────
 * ① 대본이 이미 있는 것 ② 그중 «지면에 걸려 있는» 것(손님이 볼 자리가 있다)
 * ③ 그중 이름 순. ⛔ 내가 좋아하는 편을 고르지 않는다.
 *
 * 쓰는 법
 *   node scripts/next-silent-video.mjs --자가시험
 *   node scripts/next-silent-video.mjs [--오늘 2026-08-29]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg경로 from 'ffmpeg-static';
import { 판정, 평균음량 } from './check-kcw-silent-video.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 영상방 = path.join(뿌리, 'public/wikitip/video');
const 원부길 = path.join(뿌리, 'src/data/wikitip-video.json');
const 대본길 = path.join(뿌리, 'src/data/kcw-narration.json');

/** 소리를 입힌 판의 이름. ⛔ 규칙을 두 군데 적지 않는다 */
export const 소리판꼬리 = '-voiced';
export function 소리판이름(set) { return `${set}${소리판꼬리}`; }
export function 무음판이름(set) {
  return String(set ?? '').endsWith(소리판꼬리) ? String(set).slice(0, -소리판꼬리.length) : null;
}

/**
 * 오늘 이미 한 편을 냈나 — 원부의 uploadDate 로 본다.
 * ⭐ 새 장부를 만들지 않는다. 이미 «내는 날»을 적고 있는 자리를 쓴다.
 * ⛔ 못 읽으면 「안 했다」로 단정하지 않는다 — null 이다.
 */
export function 오늘낸것(원부, 오늘) {
  const v = 원부?.videos;
  if (!Array.isArray(v)) return null;
  return v.filter((x) => x && String(x.set).endsWith(소리판꼬리) && x.uploadDate === 오늘)
    .map((x) => x.set);
}

/**
 * 다음 한 편을 고른다.
 * @param 무음들   무음으로 «잰» set 이름들
 * @param 이미낸것 소리판이 이미 있는 set 이름들
 * @param 대본있음 대본이 적혀 있는 set 이름들
 * @param 지면있음 지면에 걸려 있는 set 이름들
 */
export function 다음한편(무음들, 이미낸것, 대본있음, 지면있음) {
  const 낸것 = new Set(이미낸것 ?? []);
  const 대본 = new Set(대본있음 ?? []);
  const 지면 = new Set(지면있음 ?? []);
  const 남은것 = (무음들 ?? []).filter((s) => !낸것.has(소리판이름(s)));
  const 쓸수있는것 = 남은것.filter((s) => 대본.has(s));
  if (!쓸수있는것.length) {
    return { 고른것: null, 남은수: 남은것.length, 대본없음: 남은것.slice().sort() };
  }
  const 줄 = [...쓸수있는것].sort((a, b) => {
    const A = 지면.has(a) ? 0 : 1; const B = 지면.has(b) ? 0 : 1;
    return A - B || a.localeCompare(b);
  });
  return { 고른것: 줄[0], 남은수: 남은것.length, 대본없음: 남은것.filter((s) => !대본.has(s)).sort() };
}

/* ── 자가시험 ─────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('소리판 이름을 만든다', 소리판이름('actors') === 'actors-voiced');
  검('소리판에서 무음판 이름을 되돌린다', 무음판이름('actors-voiced') === 'actors');
  검('⛔ 소리판이 아니면 null', 무음판이름('actors') === null);
  검('⛔ 빈 것도 안 터진다', 무음판이름(undefined) === null && 소리판이름('') === '-voiced');

  const 원부 = { videos: [
    { set: 'a-voiced', uploadDate: '2026-08-29' },
    { set: 'b-voiced', uploadDate: '2026-08-28' },
    { set: 'c', uploadDate: '2026-08-29' },
  ] };
  검('오늘 낸 소리판을 찾는다',
    JSON.stringify(오늘낸것(원부, '2026-08-29')) === JSON.stringify(['a-voiced']));
  검('⛔ 소리판이 아닌 것은 안 센다', !오늘낸것(원부, '2026-08-29').includes('c'));
  검('어제 것은 오늘로 안 센다', 오늘낸것(원부, '2026-08-27').length === 0);
  검('⛔ 못 읽으면 null 이지 빈 줄이 아니다', 오늘낸것(null, '2026-08-29') === null);

  const 무음 = ['actors', 'debut', 'works'];
  const r1 = 다음한편(무음, ['actors-voiced'], ['debut', 'works'], ['works']);
  검('이미 낸 것은 다시 안 고른다', r1.고른것 !== 'actors');
  검('⭐ 지면에 걸려 있는 것을 먼저 고른다', r1.고른것 === 'works');
  검('남은 수를 센다', r1.남은수 === 2);

  const r2 = 다음한편(무음, [], ['debut'], []);
  검('대본 있는 것만 고른다', r2.고른것 === 'debut');
  검('대본 없는 것을 이름으로 알려 준다',
    JSON.stringify(r2.대본없음) === JSON.stringify(['actors', 'works']));

  const r3 = 다음한편(무음, [], [], []);
  검('⛔ 대본이 하나도 없으면 안 고른다 — 지어내라고 시키지 않는다', r3.고른것 === null);
  검('그래도 남은 수는 말한다', r3.남은수 === 3);

  const r4 = 다음한편(['x'], ['x-voiced'], ['x'], ['x']);
  검('다 냈으면 고를 것이 없다', r4.고른것 === null && r4.남은수 === 0);
  검('⛔ 빈 것도 안 터진다', 다음한편(undefined, undefined, undefined, undefined).남은수 === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ next-silent-video 자가시험 통과 (17)');
  process.exit(0);
}

/* ── 실제로 고른다 ── */
const 인자 = (이름) => {
  const i = process.argv.indexOf(`--${이름}`);
  return i >= 0 ? process.argv[i + 1] : null;
};
const 오늘 = 인자('오늘') ?? new Date().toISOString().slice(0, 10);

if (!fs.existsSync(영상방)) {
  console.log(`⬜ 못 쟀다 — ${영상방} 이 없다`);
  process.exit(0);
}

const 원부 = fs.existsSync(원부길) ? JSON.parse(fs.readFileSync(원부길, 'utf8')) : null;
const 낸것 = 오늘낸것(원부, 오늘);

console.log(`■ 오늘(${오늘}) 소리 입힐 «한 편»\n`);

if (낸것 === null) {
  console.log('⬜ 오늘 것을 냈는지 «못 쟀다» — 원부를 못 읽었다.');
  console.log(`   ⛔ 「안 했다」로 단정하지 않는다. ${path.relative(뿌리, 원부길)} 를 먼저 본다.`);
  process.exit(0);
}
if (낸것.length) {
  console.log(`✅ **오늘 몫 끝** — ${낸것.join(', ')} 를 이미 냈다.`);
  console.log('   ⛔ 하루에 한 편이다. 더 올리지 않는다 —');
  console.log('      몰아서 올리면 채널이 재탕으로 보이고, 유튜브 하루 한도를 새 편이 못 쓴다.');
  process.exit(0);
}

/* 음량을 «재서» 무음을 고른다 */
const 것들 = fs.readdirSync(영상방).filter((f) => f.endsWith('.mp4')).sort();
const 무음들 = [];
const 못쟀다 = [];
for (const f of 것들) {
  const r = spawnSync(ffmpeg경로, ['-i', path.join(영상방, f), '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' });
  const 글 = String(r.stderr ?? '');
  const p = 판정(글);
  const set = f.replace(/\.mp4$/, '');
  if (p === '무음') 무음들.push(set);
  else if (p === '못쟀다' || p === '트랙없음') 못쟀다.push({ set, dB: 평균음량(글), p });
}

const 이미낸것 = (원부?.videos ?? []).map((v) => v.set).filter((s) => String(s).endsWith(소리판꼬리));
const 대본있음 = Object.keys(JSON.parse(fs.readFileSync(대본길, 'utf8')).대본 ?? {});
const 지면있음 = (() => {
  try {
    return (JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-video-index.json'), 'utf8'))
      .videos ?? []).filter((v) => v.page).map((v) => v.set);
  } catch { return []; }
})();

const r = 다음한편(무음들, 이미낸것, 대본있음, 지면있음);

console.log(`   무음으로 «잰» 것 ${무음들.length}편 · 아직 소리 안 입힌 것 ${r.남은수}편`);
if (못쟀다.length) {
  console.log(`   ⬜ 못 쟀다 ${못쟀다.length}편 — ${못쟀다.map((x) => x.set).join(', ')}`);
}

if (!r.고른것) {
  if (!r.남은수) {
    console.log('\n✅ 남은 무음판이 없다. 다 소리를 입혔다.');
    process.exit(0);
  }
  console.log('\n🔴 **대본이 없어서 못 고른다.** 이 자는 대본을 «지어내지 않는다».');
  console.log(`   대본 없는 편 ${r.대본없음.length}: ${r.대본없음.join(', ')}`);
  console.log(`\n   ⭐ 할 일 — 그 편이 걸린 «지면 글»에서 가져와 ${path.relative(뿌리, 대본길)} 에 적는다:`);
  console.log('     "<set>": { "제목": "...", "내레이션": "...", "설명": "..." }');
  console.log('   ⚠ 낱말 서른 개 안팎이면 14초 화면에 든다. 넘치면 도구가 «만들다 멈춘다».');
  process.exit(0);
}

console.log(`\n⭐ 오늘 고른 편 — **${r.고른것}**`);
console.log('\n   ① 소리를 입힌다 (원본은 안 건드린다)');
console.log(`     node scripts/make-kcw-sound.mjs --set ${r.고른것} --목소리 en-US-AndrewNeural`);
console.log('\n   ② 썸네일을 만들고 세 곳에 이름을 올린다');
console.log(`     ① 지면에 <KcwShorts set="${소리판이름(r.고른것)}"> ② sitemap.xml.ts videoSets`
  + ' ③ wikitip-video.json');
console.log('\n   ③ 잰다 — 「배포했다」가 아니라 「손님에게 소리가 간다」까지');
console.log('     node scripts/check-kcw-video-lists.mjs · node scripts/check-kcw-silent-video.mjs');
console.log('\n⛔ 원본 무음판을 «지우지 않는다» — 사장님 「기존 무음영상 삭제하지말고」.');
console.log('⛔ 제목은 «바꾼다» — 같은 제목 둘이 나란히 있으면 손님도 우리도 헷갈린다.');
if (r.대본없음.length) {
  console.log(`\n⚠ 대본이 아직 없는 편 ${r.대본없음.length}: ${r.대본없음.join(', ')}`);
  console.log('   ⭐ 미리 적어 두면 다음 날들이 막히지 않는다.');
}
process.exit(0);
