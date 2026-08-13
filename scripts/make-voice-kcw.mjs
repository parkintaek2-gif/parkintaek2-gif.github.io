#!/usr/bin/env node
/**
 * make-voice-kcw.mjs — **K Culture Wire 숏영상 목소리.** 영어 · 남녀 둘.
 *
 * 🔴 사장님(2026-08-13) — 「숏영상에 목소리를 넣도록. **젊고 멋진 남성과 여성**의 목소리로」
 *
 * ── ⛔ 먼저 못 하는 것을 적는다 ────────────────────────────────
 *   이 기계에 있는 영어 목소리는 **Zira(어른 여자) 하나**다. 남성이 없고, 낡았다.
 *   실물로 확인했다 — edge-tts·piper·espeak 전부 없고, 윈도 신경망 목소리는 한국어뿐이다.
 *   ⭐ 그래서 **두 갈래로 짓는다** —
 *     ① Azure 열쇠가 있으면 신경망 목소리(Andrew·Emma). 이것이 사장님이 말씀하신 그것이다
 *     ② 없으면 Zira 로 **뼈대만** 만든다. 대본·길이·섞기를 미리 맞춰 두면
 *        열쇠가 오는 날 목소리만 갈아끼우면 된다
 *   ⛔ 라이선스가 회색인 우회로(비공식 edge-tts)는 **안 쓴다.** 우리는 상업 매체다.
 *
 * ── ⛔ 대본이 지키는 것 ──────────────────────────────────────
 * ⛔ 화면에 없는 수를 **말하지 않는다.** 귀로 들은 수를 눈으로 못 찾으면 거짓말이 된다.
 * ⛔ 「인기」라고 말하지 않는다. 우리가 잰 것은 찾아본 횟수다.
 * ⚠ 14초에 영어는 **1초에 2.6낱말**쯤이 편하다. 그보다 빠르면 밖에서 안 들린다.
 *
 * 쓰는 법
 *   node scripts/make-voice-kcw.mjs --out archive/video/voice
 *   node scripts/make-voice-kcw.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync, spawnSync } from 'node:child_process';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

/**
 * 두 목소리. ⚠ 사장님 말씀은 「젊고 멋진」이다 — Azure 목소리 중 그 결에 가장 가까운 둘.
 * ⛔ 자리마다 바꾸지 않는다. K Culture Wire 의 목소리는 이 둘이다.
 */
export const 목소리 = {
  남: { azure: 'en-US-AndrewMultilingualNeural', 대체: null, 결: '젊은 남성 · 낮고 차분' },
  여: { azure: 'en-US-EmmaMultilingualNeural', 대체: 'Microsoft Zira Desktop', 결: '젊은 여성 · 밝고 또렷' },
};

/** 1초에 몇 낱말. ⚠ 밖에서 폰으로 본다. 빠르면 안 들린다 */
export const 초당낱말 = 2.6;

export function 걸리는초(글) {
  const 낱말 = 글.trim().split(/\s+/).filter(Boolean).length;
  return +(낱말 / 초당낱말).toFixed(2);
}

/**
 * 대본 — 영상 `make-video-kcw-fame.mjs` 의 화면 차례에 맞춘다.
 * ⛔ 여기 나오는 수는 **전부 화면에 있는 수**다. 자료에서 읽어 넣는다.
 */
/**
 * 🔴 8/13 — 때를 손으로 적었다가 **세 번 어긋났다.** 한 줄을 고치면 뒤가 다 밀린다.
 *   ⭐ 그래서 **때를 자가 센다.** 앞줄이 끝나고 쉼만큼 뒤에 다음 줄이 선다.
 *   ⛔ 손으로 적은 때는 이제 없다. 고칠 것은 말과 쉼뿐이다.
 */
export function 때매기기(줄들, 처음 = 0.5) {
  let 때 = 처음;
  return 줄들.map((줄) => {
    const 이번 = { ...줄, 때: +때.toFixed(2) };
    때 += 걸리는초(줄.말) + (줄.쉼 ?? 0.45);
    return 이번;
  });
}

export function 대본만들기(d) {
  /* ⚠ 14초에 다 넣으려다 두 번 넘쳤다. **말수를 줄였다** — 화면이 이미 표를 보이고 있다 */
  return 때매기기([
    { 누가: '여', 말: `One Korean act reads more than ${d.topAthleteName}.`, 쉼: 0.5 },
    { 누가: '남', 말: 'It is BTS.', 쉼: 0.5 },
    /* ⛔ 화면에 없는 수는 말하지 않는다. 선수 수(877)는 화면에 없어서 뺐다 — 자가시험이 잡았다 */
    { 누가: '여', 말: `Out of ${d.entertainersCounted.toLocaleString('en-US')} we measured.`, 쉼: 0.7 },
    { 누가: '남', 말: 'Readers follow the person, not the label.', 쉼: 0.5 },
    /* ⚠ 마지막 줄은 짧게. 끝에서 넘치면 잘려 나가 문장이 반쪽이 된다 */
    { 누가: '여', 말: 'Every figure has a table.', 쉼: 0 },
  ]);
}

/** ⛔ 대본이 영상보다 길면 잘린다. 겹치지도 않아야 한다 */
export function 대본검사(대본, 총초 = 14) {
  const 탈 = [];
  for (let i = 0; i < 대본.length; i += 1) {
    const 끝 = 대본[i].때 + 걸리는초(대본[i].말);
    if (끝 > 총초) 탈.push(`${i}번째가 ${끝.toFixed(1)}초에 끝난다 — 영상은 ${총초}초다`);
    if (i + 1 < 대본.length && 끝 > 대본[i + 1].때 + 0.15) {
      탈.push(`${i}번째(${끝.toFixed(1)}초)와 ${i + 1}번째(${대본[i + 1].때}초)가 겹친다`);
    }
  }
  return 탈;
}

/** ⛔ 화면에 없는 수를 말하지 않는다 — 대본의 수가 전부 화면 HTML 에 있나 */
export function 수가화면에있나(대본, 화면글) {
  const 없는것 = [];
  for (const 줄 of 대본) {
    for (const 수 of 줄.말.match(/\d[\d,]*/g) ?? []) {
      if (!화면글.includes(수)) 없는것.push(수);
    }
  }
  return 없는것;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('목소리가 둘 — 사장님이 남녀를 말씀하셨다', Object.keys(목소리), ['남', '여']);
  재본다('걸리는초 — 열세 낱말이면 다섯 초쯤', 걸리는초('one two three four five six seven eight nine ten eleven twelve thirteen'), 5);
  재본다('걸리는초 — 빈 글은 0', 걸리는초('   '), 0);
  const d = JSON.parse(fs.readFileSync('src/data/wikitip-fame-compare.json', 'utf8'));
  const 대본 = 대본만들기(d);
  재본다('대본이 다섯 줄', 대본.length, 5);
  /* 🔴 때를 손으로 적었다가 세 번 어긋났다. 자가 세는지 확인한다 */
  재본다('때매기기 — 앞줄이 끝난 뒤에 선다',
    때매기기([{ 말: 'one two three four five six', 쉼: 0.5 }, { 말: 'seven' }], 0).map((x) => x.때),
    [0, 2.81]);
  재본다('때매기기 — 말을 늘리면 뒤가 따라 밀린다',
    때매기기([{ 말: 'one two three four five six seven eight nine ten twelve', 쉼: 0.5 }, { 말: 'x' }], 0)[1].때,
    (v) => v > 2.81);
  재본다('남녀가 번갈아 나온다', 대본.map((x) => x.누가).join(''), (s) => !/(남남|여여)/.test(s));
  재본다('⛔ 14초를 안 넘고 안 겹친다', 대본검사(대본), []);
  재본다('⛔ 「인기」라고 말하지 않는다',
    대본.map((x) => x.말).join(' ').toLowerCase(), (s) => !s.includes('popular'));
  /* ⚠ 주소는 화면에 내내 떠 있다. 말로도 하면 14초 안에 안 들어간다 — 화면에 맡긴다 */
  재본다('마지막 줄이 우리가 무엇인지 말한다',
    대본[대본.length - 1].말, (s) => s.toLowerCase().includes('table'));
  /* ⚠ 끝에서 넘치면 문장이 반쪽으로 잘린다. 여유를 재 둔다 */
  재본다('마지막이 13.6초 전에 끝난다 — 잘릴 여유를 둔다',
    대본[대본.length - 1].때 + 걸리는초(대본[대본.length - 1].말), (v) => v <= 13.6);
  /* 🔴 화면에 없는 수를 말하면 거짓말이 된다 */
  const 영상 = await import('./make-video-kcw-fame.mjs');
  const 화면 = [0.6, 3.4, 4.6, 8, 11.6, 13].map((t) => 영상.칸HTML(t)).join(' ');
  재본다('⛔ 대본의 수가 전부 화면에 있다', 수가화면에있나(대본, 화면), []);
  재본다('수가화면에있나 — 없으면 잡는다',
    수가화면에있나([{ 말: 'nine hundred and 9999 more' }], '<b>1</b>'), ['9999']);
  console.log(`목소리 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/* ── 실제로 소리 내기 ────────────────────────────────────────── */

const env = fs.existsSync('.env')
  ? Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
  : {};

const 아주르열쇠 = env.AZURE_SPEECH_KEY;
const 아주르지역 = env.AZURE_SPEECH_REGION || 'koreacentral';

function 아주르로(글, 목소리이름, 낼길) {
  return new Promise((resolve, reject) => {
    const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">`
      + `<voice name="${목소리이름}"><prosody rate="+4%">${글.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</prosody></voice></speak>`;
    const req = https.request({
      host: `${아주르지역}.tts.speech.microsoft.com`,
      path: '/cognitiveservices/v1',
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': 아주르열쇠,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-48khz-16bit-mono-pcm',
        'User-Agent': 'KCultureWire',
      },
    }, (res) => {
      const 조각 = [];
      res.on('data', (c) => 조각.push(c));
      res.on('end', () => {
        if (res.statusCode !== 200) { reject(new Error(`Azure ${res.statusCode}`)); return; }
        fs.writeFileSync(낼길, Buffer.concat(조각));
        resolve(낼길);
      });
    });
    req.on('error', reject);
    req.write(ssml);
    req.end();
  });
}

function 지라로(글, 낼길) {
  /* ⚠ 뼈대용이다. 사장님이 말씀하신 「젊고 멋진」이 아니다 */
  const ps = `Add-Type -AssemblyName System.Speech;`
    + `$s=New-Object System.Speech.Synthesis.SpeechSynthesizer;`
    + `$s.SelectVoice('Microsoft Zira Desktop');$s.Rate=1;`
    + `$s.SetOutputToWaveFile('${낼길.replace(/\\/g, '\\\\')}');`
    + `$s.Speak(@'\n${글}\n'@);$s.Dispose()`;
  const r = spawnSync('powershell', ['-NoProfile', '-Command', ps], { encoding: 'utf8', timeout: 60000 });
  if (r.status !== 0) throw new Error(`Zira 실패: ${(r.stderr ?? '').slice(0, 200)}`);
  return 낼길;
}

if (내가실행됐다) {
  const i = process.argv.indexOf('--out');
  const 낼방 = i >= 0 ? process.argv[i + 1] : 'archive/video/voice';
  fs.mkdirSync(낼방, { recursive: true });

  const d = JSON.parse(fs.readFileSync('src/data/wikitip-fame-compare.json', 'utf8'));
  const 대본 = 대본만들기(d);
  const 탈 = 대본검사(대본);
  if (탈.length) { console.error('⛔ 대본이 안 맞는다:'); for (const t of 탈) console.error(`   · ${t}`); process.exit(1); }

  const 신경망 = Boolean(아주르열쇠);
  console.log(신경망
    ? '⭐ Azure 열쇠가 있다 — **젊고 멋진 신경망 목소리**로 만든다'
    : '⚠ Azure 열쇠가 없다 — **뼈대만** 만든다(Zira 여자 하나). 열쇠가 오면 목소리만 갈아끼운다');
  console.log(`   남 ${목소리.남.azure} · 여 ${목소리.여.azure}\n`);

  const 낸것 = [];
  for (let n = 0; n < 대본.length; n += 1) {
    const 줄 = 대본[n];
    const 길 = path.join(낼방, `${String(n).padStart(2, '0')}-${줄.누가}.wav`);
    try {
      if (신경망) await 아주르로(줄.말, 목소리[줄.누가].azure, 길);
      else 지라로(줄.말, 길);
      낸것.push({ ...줄, 길, 초: 걸리는초(줄.말) });
      console.log(`   ${String(줄.때).padStart(5)}초 [${줄.누가}] ${줄.말.slice(0, 62)}`);
    } catch (e) {
      console.error(`   ⛔ ${n}번째 실패 — ${e.message}`);
      process.exit(1);
    }
  }

  fs.writeFileSync(path.join(낼방, 'script.json'), `${JSON.stringify({
    generated: new Date().toISOString(),
    neural: 신경망,
    voices: 목소리,
    note: 신경망 ? null
      : 'Built with the one English voice on this machine (Zira). This is scaffolding — the timing '
        + 'and mix are correct, the voice is not what was asked for. An Azure Speech key swaps it.',
    lines: 낸것,
  }, null, 2)}\n`);

  console.log(`\n${신경망 ? '✅' : '⚠'} ${낼방} — ${낸것.length}줄`);
  if (!신경망) {
    console.log('🖐 사장님 손 — Azure Speech 무료 열쇠(월 50만 자). .env 에 AZURE_SPEECH_KEY 로 넣으면');
    console.log('   같은 명령이 en-US-Andrew(젊은 남성)·en-US-Emma(젊은 여성)로 다시 만든다');
  }
}
