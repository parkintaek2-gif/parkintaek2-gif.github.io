/**
 * kcw-video-sound.mjs — **한 편에 소리가 «나나»를 재 주고, 잰 것을 광에 둔다.**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 왜 만들었나 [2026-09-02]
 *   `archive/kcw-upload-kit.json` 은 서른일곱 벌 전부를 `ready: true` 로 냈다.
 *   그런데 그 중 **열여섯 편은 실측 −91 dB 무음**이었다. 이 킷을 읽은 사람은
 *   무성 영상을 유튜브에 올리게 된다 — 사장님 금지에 정면으로 걸린다.
 *   > 「무성 콘텐트 다신 만들지 말 것」 · 「삭제하지 말고 소리만 입혀서 추가로 배포해」
 *
 * ⛔ **「소리 트랙이 있나」로 재면 전부 통과한다** — 생성기가 anullsrc(빈 소리)를 붙인다.
 *    음량을 «재야» 드러난다. 그래서 `check-kcw-silent-video.mjs` 의 판정을 그대로 빌려 쓴다.
 *    ⭐ 규칙을 두 군데 적지 않는다 — 선(−60 dB)이 갈라지면 두 검사가 다른 답을 낸다.
 *
 * ⚠ 재는 데 한 편당 1초쯤 걸린다(ffmpeg 을 띄운다). 마흔 편이면 한참이다.
 *   그래서 **파일 크기·고친 때로 열쇠를 만들어 광에 둔다.** 파일이 안 바뀌면 다시 안 잰다.
 *   ⛔ 이름만으로 열쇠를 만들지 않는다 — 같은 이름으로 소리를 다시 입히면 옛 값이 남는다.
 *
 * ⛔ **못 잰 것을 「무음」으로 치지 않는다.** `'못쟀다'` 를 그대로 낸다.
 *   0 으로 채우면 소리가 있는 편을 못 올리게 막는다 — 「재 보고 안 되면 안 된다고 적는다」.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg경로 from 'ffmpeg-static';
import { 판정, 평균음량, 무음선 } from '../check-kcw-silent-video.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const 광자리 = path.join(뿌리, 'archive', 'kcw-video-loudness.json');

export { 무음선 };

/** 파일이 «그대로인가»를 가리는 열쇠. ⛔ 이름만으로는 안 된다 — 소리를 다시 입히면 이름은 같다 */
export function 열쇠(파일길) {
  const s = fs.statSync(파일길);
  return `${path.basename(파일길)}|${s.size}|${Math.round(s.mtimeMs)}`;
}

function 광읽기() {
  try { return JSON.parse(fs.readFileSync(광자리, 'utf8')); } catch (e) { return {}; }
}

function 광쓰기(광) {
  try {
    fs.mkdirSync(path.dirname(광자리), { recursive: true });
    fs.writeFileSync(광자리, `${JSON.stringify(광, null, 1)}\n`);
  } catch (e) { /* 광에 못 써도 재기는 됐다 — 다음에 또 재면 된다 */ }
}

/** ffmpeg 을 띄워 한 편을 «실제로» 잰다. */
function 실측(파일길) {
  const r = spawnSync(ffmpeg경로, ['-i', 파일길, '-af', 'volumedetect', '-f', 'null', '-'],
    { encoding: 'utf8' });
  const 글 = String(r.stderr ?? '');
  return { 판: 판정(글), dB: 평균음량(글) };
}

/**
 * 한 편의 소리를 잰다 — 광에 있으면 그것을 쓴다.
 * @returns {{판:'무음'|'소리있음'|'트랙없음'|'못쟀다', dB:number|null, 광에서:boolean}}
 */
export function 소리재기(파일길, { 광다시 = false } = {}) {
  if (!fs.existsSync(파일길)) return { 판: '못쟀다', dB: null, 광에서: false, 까닭: '파일이 없다' };
  const k = 열쇠(파일길);
  const 광 = 광읽기();
  if (!광다시 && 광[k] && 광[k].판) return { ...광[k], 광에서: true };
  const 잰것 = 실측(파일길);
  /* ⛔ 「못쟀다」는 광에 넣지 않는다 — 다음에 다시 재 봐야 한다.
     넣어 두면 한 번 실패한 편이 «영원히» 못 잰 것으로 굳는다. */
  if (잰것.판 !== '못쟀다') { 광[k] = 잰것; 광쓰기(광); }
  return { ...잰것, 광에서: false };
}

/** 올려도 되나 — 소리가 «나는» 것만. ⚠ 「못쟀다」는 올려도 된다고 하지 않는다 */
export function 올려도되나(판) {
  return 판 === '소리있음';
}

/* ─────────────────────────────────────────────────────────────────────────── */
const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  /* ⭐ 이 자의 심장 — 「못쟀다」를 무음으로 치지 않는가 */
  검('⛔ 못 쟀으면 올리지 않는다', 올려도되나('못쟀다') === false);
  검('⛔ 무음은 올리지 않는다', 올려도되나('무음') === false);
  검('⛔ 트랙이 없어도 올리지 않는다', 올려도되나('트랙없음') === false);
  검('✅ 소리가 나면 올린다', 올려도되나('소리있음') === true);
  검('선은 검사 한 곳에서만 정한다', 무음선 === -60);

  /* 열쇠가 «크기와 고친 때»를 물고 있나 — 이름만이면 소리 다시 입힌 것을 못 알아본다 */
  const 임시 = path.join(뿌리, 'archive', `_소리열쇠시험-${Date.now()}.bin`);
  fs.mkdirSync(path.dirname(임시), { recursive: true });
  fs.writeFileSync(임시, 'a');
  const k1 = 열쇠(임시);
  fs.writeFileSync(임시, 'aaaa');
  const k2 = 열쇠(임시);
  fs.rmSync(임시);
  검('⭐ 내용이 바뀌면 열쇠도 바뀐다', k1 !== k2);
  검('열쇠에 이름이 든다', k1.startsWith('_소리열쇠시험'));

  /* 없는 파일에 대고 물어도 안 터지고, 「못쟀다」로 낸다 */
  const 없는것 = 소리재기(path.join(뿌리, 'archive', '없는영상-1234.mp4'));
  검('⛔ 없는 파일은 못쟀다 — 0 이 아니다', 없는것.판 === '못쟀다' && 없는것.dB === null);

  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ kcw-video-sound 자가시험 통과 (8)');
  process.exit(0);
}
