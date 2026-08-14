#!/usr/bin/env node
/**
 * mix-voice-kcw.mjs — **숏영상에 목소리를 얹는다.**
 *
 * 🔴 사장님(2026-08-13) — 「숏영상에 목소리를 넣도록. 젊고 멋진 남성과 여성의 목소리로」
 *
 * ⛔ 목소리가 **영상 길이를 넘으면 잘린다.** 얹기 전에 재고, 넘으면 멈춘다.
 * ⛔ 소리 없는 판을 덮어쓰지 않는다 — 소리 없는 것도 쓸 데가 있다(자동재생 없는 자리).
 *
 * 쓰는 법
 *   node scripts/mix-voice-kcw.mjs --video <mp4> --voice <방> --out <mp4>
 *   node scripts/mix-voice-kcw.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

/**
 * 줄마다 `때` 초에 넣는다. ffmpeg 의 `adelay` 는 **밀리초**를 받는다.
 * ⚠ 채널마다 값을 줘야 한다(`|`) — 하나만 주면 한쪽 귀에서만 들린다. 그렇게 한 번 틀렸다.
 */
export function 섞기필터(줄들, 총초 = 14) {
  const 지연 = 줄들.map((줄, i) => {
    const ms = Math.round(줄.때 * 1000);
    return `[${i + 1}:a]adelay=${ms}|${ms},volume=1.6[v${i}]`;
  });
  const 입력 = 줄들.map((_, i) => `[v${i}]`).join('');
  /**
   * 🔴 2026-08-14 — 얹은 영상이 **12.32초로 잘렸다.** 원본은 14초다.
   *   `-shortest` 가 짧은 쪽(소리)에 맞춰 끊었고, 날아간 1.7초가 **끝 화면 = 주소**였다.
   *   ⛔ 외부유입용 영상에서 주소가 잘리는 것은 영상을 안 만든 것과 같다.
   *   ⭐ 소리를 총초까지 **묵음으로 채운다**(apad). 그러면 두 흐름이 같은 길이가 된다.
   */
  return `${지연.join(';')};${입력}amix=inputs=${줄들.length}:normalize=0:duration=longest[말];`
    + `[말]apad,atrim=0:${총초},asetpts=N/SR/TB[말끝]`;
}

/** ⛔ 목소리가 영상을 넘으면 잘린다 */
export function 넘치나(줄들, 총초 = 14) {
  return 줄들.filter((줄) => 줄.때 + (줄.초 ?? 0) > 총초)
    .map((줄) => `${줄.때}초 + ${줄.초}초 = ${(줄.때 + 줄.초).toFixed(1)}초`);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 셋 = [{ 때: 0.5, 초: 2 }, { 때: 4, 초: 1 }];
  재본다('섞기필터 — 줄마다 지연이 있다', 섞기필터(셋), (s) => s.includes('adelay=500|500') && s.includes('adelay=4000|4000'));
  재본다('⚠ 두 채널에 다 준다 — 한쪽 귀만 들리면 안 된다', 섞기필터(셋), (s) => !/adelay=\d+[,\]]/.test(s));
  재본다('섞기필터 — 입력 수가 맞다', 섞기필터(셋), (s) => s.includes('amix=inputs=2'));
  재본다('섞기필터 — 영상 길이에서 자른다', 섞기필터(셋, 14), (s) => s.includes('atrim=0:14'));
  재본다('넘치나 — 안 넘으면 빈 목록', 넘치나(셋), []);
  재본다('넘치나 — 넘으면 잡는다', 넘치나([{ 때: 13, 초: 3 }]), (x) => x.length === 1);
  console.log(`섞는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  /**
   * 🔴 2026-08-14 — **이 자리가 오늘 사고의 뿌리였다.**
   *   `--영상` 을 줬는데 이 자는 `--video` 만 알아본다. 모르는 깃발을 **조용히 무시하고**
   *   기본값(fame 영상)을 썼다. 그래서 brands 소리가 fame 화면에 얹혀
   *   `kcw-05-brands-voiced.mp4` 라는 이름으로 저장됐다. 오류는 하나도 안 났다.
   *
   *   ⛔ **조용한 기본값이 거짓말을 만든다.** 두 가지를 고친다:
   *     ① 한글 깃발도 알아본다 — 이 저장소의 다른 자들은 한글을 쓴다
   *     ② 모르는 깃발이 하나라도 있으면 **멈춘다.** 짐작해서 돌지 않는다
   */
  const 아는깃발 = { 영상: ['--video', '--영상'], 소리: ['--voice', '--소리'], 낼곳: ['--out', '--낼곳'] };
  const 모두 = Object.values(아는깃발).flat();
  const 모르는 = process.argv.slice(2).filter((a) => a.startsWith('--') && !모두.includes(a)
    && !['--자가시험', '--selftest'].includes(a));
  if (모르는.length) {
    console.error(`⛔ 모르는 깃발 — ${모르는.join(' ')}`);
    console.error(`   아는 것: ${모두.join(' · ')}`);
    console.error('⛔ 짐작해서 돌지 않는다. 모르는 깃발을 주면 기본값이 조용히 쓰여 거짓이 나간다.');
    process.exit(1);
  }
  const 값 = (깃발들, 기본) => {
    for (const 깃 of 깃발들) {
      const i = process.argv.indexOf(깃);
      if (i >= 0) return process.argv[i + 1];
    }
    return 기본;
  };
  const 영상 = 값(아는깃발.영상, 'archive/video/kcw-02-fame-compare.mp4');
  const 소리방 = 값(아는깃발.소리, 'archive/video/voice');
  const 낼길 = 값(아는깃발.낼곳, 'archive/video/kcw-02-fame-compare-voiced.mp4');

  for (const p of [영상, path.join(소리방, 'script.json')]) {
    if (!fs.existsSync(p)) { console.error(`⛔ 없다 — ${p}`); process.exit(1); }
  }
  const 대본 = JSON.parse(fs.readFileSync(path.join(소리방, 'script.json'), 'utf8'));
  const 줄들 = 대본.lines;

  /**
   * 🔴 2026-08-14 — **fame 영상에 brands 목소리를 얹었다.**
   *   대본 만들기가 실패(exit 1)했는데 옛 소리가 방에 남아 있었고, 얹기는 그것을 그냥 썼다.
   *   화면은 BTS 를 보이는데 소리는 인도네시아 자동차를 말했다.
   *   ⛔ 오류도 안 나고 파일도 멀쩡하다. **제일 조용한 거짓말**이다.
   *   ⭐ 대본이 이 영상 것인지 이름으로 맞춰 본다. 다르면 멈춘다.
   */
  const 벌 = 대본.set;
  if (!벌) {
    console.error('⛔ 대본에 어느 벌인지 안 적혀 있다 — 다시 만들어라(옛 script.json 이다)');
    process.exit(1);
  }
  if (!path.basename(영상).includes(벌)) {
    console.error(`\n🔴 **대본과 영상이 딴것이다** — 대본은 「${벌}」, 영상은 「${path.basename(영상)}」`);
    console.error('⛔ 이대로 얹으면 화면과 소리가 딴말을 한다. 그 영상의 대본을 먼저 만들어라:');
    console.error(`   node scripts/make-voice-kcw.mjs --대본 <벌>`);
    process.exit(1);
  }

  const 넘은것 = 넘치나(줄들);
  if (넘은것.length) {
    console.error('⛔ 목소리가 영상보다 길다 — 얹으면 잘린다:');
    for (const t of 넘은것) console.error(`   · ${t}`);
    process.exit(1);
  }

  const ff = require('ffmpeg-static');
  const 인자 = ['-y', '-i', 영상];
  for (const 줄 of 줄들) 인자.push('-i', 줄.길);
  인자.push(
    '-filter_complex', 섞기필터(줄들),
    '-map', '0:v', '-map', '[말끝]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart', '-shortest', 낼길,
  );
  execFileSync(ff, 인자, { stdio: 'ignore' });

  /**
   * 🔴 얹은 영상이 **짧아졌는지 잰다.** 한 번 12.32초로 잘려 끝 주소가 날아갔다.
   *   ⛔ 「만들었다」는 「맞게 만들었다」가 아니다. 실물에 물어본다.
   */
  const 길이재기 = (길) => {
    try { execFileSync(ff, ['-i', 길], { stdio: 'pipe' }); } catch (e) {
      const m = String(e.stderr).match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
      return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;
    }
    return null;
  };
  const 원 = 길이재기(영상); const 낸 = 길이재기(낼길);
  if (원 !== null && 낸 !== null && 원 - 낸 > 0.2) {
    console.error(`\n🔴 **얹으면서 짧아졌다** — 원본 ${원}초 → 얹은 것 ${낸}초`);
    console.error('⛔ 잘린 끝에는 주소가 있다. 외부유입용 영상에서 그것이 없으면 안 낸 것과 같다.');
    process.exit(1);
  }

  const 크기 = (fs.statSync(낼길).size / 1024).toFixed(0);
  console.log(`✅ ${낼길}  ${크기}KB · ${줄들.length}줄 · ${낸}초 (원본 ${원}초 — 안 잘렸다)`);
  console.log(`   ${대본.engine ?? '?'} · ${대본.license ?? '라이선스 안 적힘'}`);
  console.log(`   남 ${대본.voices?.남?.piper ?? '?'} · 여 ${대본.voices?.여?.piper ?? '?'}`);
}
