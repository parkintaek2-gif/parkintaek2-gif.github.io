#!/usr/bin/env node
/**
 * make-voice-kcw.mjs — **K Culture Wire 숏영상 목소리.** 영어 · 남녀 둘.
 *
 * 🔴 사장님(2026-08-13) — 「숏영상에 목소리를 넣도록. **젊고 멋진 남성과 여성**의 목소리로」
 *
 * ── 어떻게 풀었나 ──────────────────────────────────────────────
 *   이 기계에 있던 영어 목소리는 **Zira(어른 여자) 하나**였다. 남성이 없고 낡았다.
 *   ⛔ 라이선스가 회색인 우회로(비공식 edge-tts)는 안 썼다. 우리는 상업 매체다.
 *   ⛔ 남의 열쇠를 기다리지도 않았다 — 사장님이 「네가 해결해」 하셨다.
 *   ⭐ **Piper** 로 풀었다 — 프로그램도 목소리 모델도 **MIT**, 열쇠 없이 이 기계에서 돈다.
 *      받기 전에 라이선스를 확인했고, 남녀 넷을 받아 **들어 보고** 골랐다.
 *
 * ⚠ Piper 는 저장소 밖(`_tools/piper`)에 둔다. 모델 하나가 60MB 라 깃에 넣으면 안 된다.
 *   없으면 `node scripts/_get-piper.mjs` 가 다시 받아 온다.
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
import { 지금 } from './_kst.mjs';

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');

/**
 * 두 목소리. ⚠ 사장님 말씀은 「젊고 멋진」이다 — Azure 목소리 중 그 결에 가장 가까운 둘.
 * ⛔ 자리마다 바꾸지 않는다. K Culture Wire 의 목소리는 이 둘이다.
 */
export const 목소리 = {
  남: { piper: 'en_US-hfc_male-medium', 결: '젊은 남성 · 낮고 차분' },
  여: { piper: 'en_US-hfc_female-medium', 결: '젊은 여성 · 밝고 또렷' },
};

/** Piper 가 있는 곳. ⛔ 저장소 안에 안 둔다 — 모델 하나가 60MB 다 */
export const 파이퍼방 = 'C:\\Users\\USER\\Documents\\GitHub\\_tools\\piper\\piper';

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

/**
 * 87편 대본 — 「자를 바꿔 읽었다」.
 * ⛔ 화면에 없는 수를 말하지 않는다. ⛔ 인과로 말하지 않는다.
 */
export function 자대본만들기(d) {
  return 때매기기([
    /* ⚠ 14초에 맞춘다. 말이 길면 잘려서 반쪽 문장이 나간다 */
    { 누가: '여', 말: 'Yesterday this came out flat.', 쉼: 0.5 },
    { 누가: '남', 말: 'Today it reads.', 쉼: 0.5 },
    { 누가: '여', 말: `${d.multiple} times more reads at five titles.`, 쉼: 0.6 },
    { 누가: '남', 말: 'We changed the ruler, not the panel.', 쉼: 0.5 },
    { 누가: '여', 말: 'Which way it points, we cannot say.', 쉼: 0 },
  ]);
}

/**
 * 88편 대본 — 「같은 나라가 갈래마다 자리를 바꾼다」(`/brand-kinds`).
 * ⛔ 화면에 없는 수를 말하지 않는다. 한국 차 배수는 **기사도 안 냈다** — 여기서도 없다.
 * ⛔ 「어느 나라가 관심이 많다」로 들리면 거짓이다. 그래서 두 수를 나란히만 놓는다.
 */
export function 브랜드대본만들기(d) {
  const 흔 = d.positionSwing.제일;
  const 나라 = d.countryNames[흔];
  const 차 = d.kinds.find((k) => k.key === 'car').판별[흔];
  const 명 = d.kinds.find((k) => k.key === 'luxury').판별[흔];
  /**
   * ⚠ 넷이다. 다섯째 줄(「Same country, opposite appetites」)을 **뺐다** —
   *   실제 소리로 재니 다섯이면 15.19초로 넘쳤다. Piper 가 숫자를 풀어 읽어서
   *   「${차} against ${명}」 한 줄이 3.6초를 먹는다.
   *   ⛔ 수를 반올림해 짧게 만들지 않았다. 그러면 화면과 어긋난다.
   *   ⭐ 뺀 줄의 뜻은 화면이 이미 하고 있다 — 「Not that one country cares more」.
   */
  return 때매기기([
    { 누가: '여', 말: `${나라} reads German cars the most.`, 쉼: 0.5 },
    { 누가: '남', 말: 'And luxury houses the least.', 쉼: 0.6 },
    { 누가: '여', 말: `${차} against ${명}.`, 쉼: 0.6 },
    /* ⚠ 마지막 줄은 짧게. 끝에서 넘치면 반쪽 문장이 나간다 */
    { 누가: '남', 말: 'One ranking would hide that.', 쉼: 0 },
  ]);
}

/**
 * 89편 대본 — 「관광 집계가 다섯 구밖에 못 말한다」(`/read-vs-visited`).
 * ⛔ 화면에 없는 수를 말하지 않는다.
 * ⚠ Piper 가 큰 수를 풀어 읽어 오래 걸린다. 1,683,727 은 **말하지 않고** 화면에만 둔다.
 */
export function 셈대본만들기(d) {
  return 때매기기([
    { 누가: '여', 말: `Seoul has ${d.seoulDistrictsAll} districts.`, 쉼: 0.5 },
    { 누가: '남', 말: `The tourist count can speak for ${d.districtsCompared}.`, 쉼: 0.6 },
    { 누가: '여', 말: `In ${d.districtsWithNoCountedSite} of them, nothing is counted.`, 쉼: 0.5 },
    /* ⚠ 마지막 줄은 짧게 */
    { 누가: '남', 말: 'That is where counting stops.', 쉼: 0 },
  ]);
}

/**
 * 90편 대본 — 「두 자가 만나는 자리는 바닥이다」(`/look-vs-fly`).
 * ⛔ 「12월에 알아보고 1월에 간다」로 들리면 거짓이다. **바닥을 먼저** 말한다.
 * ⚠ 달 이름은 Piper 가 잘 읽는다. 수는 두 개만 — 진폭은 화면에 있다.
 */
export function 철대본만들기(d) {
  const 이름 = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const 말 = (mm) => 이름[Number(mm) - 1] ?? mm;
  return 때매기기([
    { 누가: '여', 말: `Looking peaks in ${말(d.lookPeak.peak)}.`, 쉼: 0.5 },
    { 누가: '남', 말: `Flying peaks in ${말(d.flyPeak.peak)}.`, 쉼: 0.6 },
    { 누가: '여', 말: 'That gap is the weakest thing here.', 쉼: 0.5 },
    /* ⚠ 마지막 줄이 요점이다. 짧게 */
    { 누가: '남', 말: `Both fall lowest in ${말(d.lookPeak.trough)}.`, 쉼: 0 },
  ]);
}

/**
 * 어느 대본인가. ⚠ 벌이 늘면 여기 한 줄을 같이 넣는다 —
 *   안 넣으면 새 영상에 **옛 영상의 목소리**가 얹힌다. 그것이 제일 조용한 거짓말이다.
 *
 * 🔴 8/15 — 이 표가 실행부 안에 있어서 **자가시험이 못 봤다.** 검사는 `fame` 대본 하나만
 *   재고 있었고, 뒤에 붙은 다섯 벌은 「남녀가 번갈아 나오나」·「끝에서 잘리지 않나」를
 *   **한 번도 통과한 적이 없었다.** 검사가 볼 수 있는 자리로 뺀다.
 */
export const 대본목록 = {
  fame: { 자료: 'src/data/wikitip-fame-compare.json', 짓기: (d) => 대본만들기(d) },
  instrument: { 자료: 'src/data/wikitip-titles-to-name.json', 짓기: (d) => 자대본만들기(d) },
  brands: { 자료: 'src/data/wikitip-brand-kinds.json', 짓기: (d) => 브랜드대본만들기(d) },
  counting: { 자료: 'src/data/wikitip-read-vs-visited.json', 짓기: (d) => 셈대본만들기(d) },
  season: { 자료: 'src/data/wikitip-look-vs-fly.json', 짓기: (d) => 철대본만들기(d) },
  control: { 자료: 'src/data/wikitip-what-fell.json', 짓기: (d) => 대조대본만들기(d) },
  wave: { 자료: 'src/data/wikitip-wave-floor.json', 짓기: (d) => 파도대본만들기(d) },
  halflife: { 자료: 'src/data/wikitip-half-life.json', 짓기: (d) => 반감기대본만들기(d) },
  oneout: { 자료: 'src/data/wikitip-one-out.json', 짓기: (d) => 하나빼기대본만들기(d) },
};

/**
 * 94편 대본 — 「하나를 빼면」(`/one-out`).
 *
 * ⛔ **「우리가 틀렸다」로 들리게 두지 않는다.** 흔들리는 답은 아직 답이 아닌 것이다.
 * ⚠ 수는 둘만 말한다 — 0 배와 그 배수. 나머지는 화면에 맡긴다.
 */
export function 하나빼기대본만들기(d) {
  const 흔들 = d.findings.find((f) => f.atFirstPublication.verdict?.steady === false);
  return 때매기기([
    { 누가: '여', 말: 'We published two findings this morning.', 쉼: 0.5 },
    { 누가: '남', 말: 'By evening we had corrected one.', 쉼: 0.5 },
    /* ⭐ 이 줄이 기사의 뼈다 */
    { 누가: '여', 말: 'Removing one title moved it, and not the other.', 쉼: 0.5 },
    /* ⚠ 마지막 줄은 짧게 */
    { 누가: '남', 말: 'That check costs one line.', 쉼: 0 },
  ]);
}

/**
 * 93편 대본 — 「반감기」(`/half-life`).
 *
 * ⛔ **「두 달이면 끝」으로 들리게 두지 않는다.** 열여섯 중 열둘이 다시 올랐다.
 *   그 줄이 없으면 소리가 기사보다 앞선 말을 하는 셈이 된다.
 * ⚠ Piper 는 큰 수를 풀어 읽는다. 수는 셋만 말하고 나머지는 화면에 맡긴다.
 */
export function 반감기대본만들기(d) {
  const 답 = d.answer;
  const 되풀이 = d.titles.filter((t) => t.roseAboveHalfAgain).length;
  return 때매기기([
    { 누가: '여', 말: `Half the readers are gone in ${답.halfLifeMedianMonths} months.`, 쉼: 0.5 },
    { 누가: '남', 말: 'The two biggest waves went in one.', 쉼: 0.5 },
    /* ⭐ 이 줄이 없으면 「두 달이면 끝」으로 들린다 */
    { 누가: '여', 말: `But ${되풀이} of ${답.measured} came back.`, 쉼: 0.5 },
    /* ⚠ 마지막 줄은 짧게 */
    { 누가: '남', 말: 'It recurs. It does not recede.', 쉼: 0 },
  ]);
}

/**
 * 92편 대본 — 「파도가 지나간 자리」(`/wave-and-floor`).
 *
 * ⛔ **오징어게임 35배를 소리로 내지 않는다.** 그 편은 표에서 뺀 것이다 — 뒤바닥에
 *   시즌 3 이 들어앉아 있었다. 소리가 기사보다 앞서면 안 된다.
 * ⛔ **평균을 말하지 않는다.** 다섯 편에서 평균은 +0.8% 로 「그대로다」가 된다.
 * ⚠ Piper 는 큰 수를 풀어 읽는다. 수는 둘만 말하고 나머지는 화면에 맡긴다.
 */
export function 파도대본만들기(d) {
  const 답 = d.answer;
  const 태어난것 = d.titlesNotMeasured.filter((t) => /did not exist/.test(t.why)).length;
  return 때매기기([
    { 누가: '여', 말: 'A Korean series lands, and the encyclopaedia fills up.', 쉼: 0.5 },
    /* ⭐ 이 줄이 기사의 뼈다 — 신작에는 물음 자체가 안 선다 */
    { 누가: '남', 말: 'But the article is born with the show.', 쉼: 0.5 },
    { 누가: '여', 말: `So ${태어난것} of them have no before.`, 쉼: 0.5 },
    /* ⚠ 마지막 줄은 짧게. 넘치면 잘려 반쪽이 된다 */
    { 누가: '남', 말: 'Only old titles can answer.', 쉼: 0 },
  ]);
}

/**
 * 91편 대본 — 「무엇이 떨어졌나」(`/what-actually-fell`).
 *
 * ⭐ 열네 초에 들어가는 것은 **네 수 중 둘**뿐이다. 고른 둘은
 *   「한국 여행이 떨어졌다」와 **「일본·대만 문화는 올랐다」**이다.
 *   ⛔ 앞의 것만 말하면 우리가 안 쓰기로 한 헤드라인이 **소리로** 나간다. 둘은 붙어 다녀야 한다.
 * ⚠ Piper 는 큰 수를 풀어 읽어 시간을 먹는다. 수는 둘만 말하고 나머지는 화면에 맡긴다.
 */
export function 대조대본만들기(d) {
  /**
   * 🔴 처음엔 「fell 30 percent」·「up 7 percent」로 읽혔다. 자료는 30.4 와 6.8 이다.
   *   ⛔ **반올림한 수를 소리로 내면 화면의 표와 어긋난다.** 8/14 에 같은 자리에서 걸렸다.
   *   ⭐ 그래서 소리는 **방향과 크기**만 말하고, 정확한 수는 화면에 맡긴다.
   *     「a third」는 기사 제목과 같은 말이라 어긋날 것이 없다.
   * ⚠ 마지막 줄이 오르내림의 부호를 뒤집어 말하면 안 되므로, 자료에서 부호를 직접 읽는다.
   */
  const 올랐나 = d.axes.culture.control > 0;
  return 때매기기([
    { 누가: '여', 말: 'Korean travel articles fell by a third.', 쉼: 0.5 },
    { 누가: '남', 말: 'We nearly called that cooling interest.', 쉼: 0.5 },
    /* ⭐ 이 줄이 기사의 뼈다 — 넷 중 유일하게 떨어지지 않은 칸 */
    { 누가: '여', 말: `Japanese culture articles went ${올랐나 ? 'up' : 'down'} instead.`, 쉼: 0.6 },
    /* ⚠ 마지막 줄은 짧게. 넘치면 잘려 반쪽이 된다 */
    { 누가: '남', 말: 'It was travel, not Korea.', 쉼: 0 },
  ]);
}

export function 대본만들기(d) {
  /* ⚠ 14초에 다 넣으려다 두 번 넘쳤다. **말수를 줄였다** — 화면이 이미 표를 보이고 있다
     🔴 8/14 실제 소리로 다시 매니 14.43초였다. Piper 가 큰 수(213)를 풀어 읽는다.
        ⛔ 수를 반올림하지 않았다 — 화면과 어긋난다. 대신 그 줄의 **군말**을 뺐다 */
  return 때매기기([
    { 누가: '여', 말: `One Korean act reads more than ${d.topAthleteName}.`, 쉼: 0.5 },
    { 누가: '남', 말: 'It is BTS.', 쉼: 0.5 },
    /* ⛔ 화면에 없는 수는 말하지 않는다. 선수 수(877)는 화면에 없어서 뺐다 — 자가시험이 잡았다 */
    { 누가: '여', 말: `Out of ${d.entertainersCounted.toLocaleString('en-US')}.`, 쉼: 0.6 },
    { 누가: '남', 말: 'Readers follow the person.', 쉼: 0.5 },
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

/**
 * ⭐ **실제 소리 길이를 잰다.** 글자로 어림잡은 값이 틀리면 겹치거나 잘린다.
 *   WAV 는 머리 44바이트 뒤가 소리다. 초당 바이트로 나누면 길이가 나온다.
 */
export function 소리길이(wav길) {
  if (!fs.existsSync(wav길)) return null;
  const b = fs.readFileSync(wav길);
  if (b.length < 44 || b.toString('ascii', 0, 4) !== 'RIFF') return null;
  const 초당바이트 = b.readUInt32LE(28);
  if (!초당바이트) return null;
  return +((b.length - 44) / 초당바이트).toFixed(2);
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
  재본다('⭐ 열쇠 없이 도는 것으로 골랐다', 목소리.남.piper, (s) => s.startsWith('en_US-'));
  재본다('남녀가 다른 모델이다', 목소리.남.piper !== 목소리.여.piper, true);
  재본다('소리길이 — 없는 파일은 null(0 이 아니다)', 소리길이('없는파일.wav'), null);
  재본다('걸리는초 — 열세 낱말이면 다섯 초쯤', 걸리는초('one two three four five six seven eight nine ten eleven twelve thirteen'), 5);
  재본다('걸리는초 — 빈 글은 0', 걸리는초('   '), 0);
  const d = JSON.parse(fs.readFileSync('src/data/wikitip-fame-compare.json', 'utf8'));
  const 대본 = 대본만들기(d);
  /**
   * 🔴 여기 「대본이 다섯 줄」이라 박혀 있었다. **자물쇠였다** —
   *   91편 대본은 넉 줄인데, 넉 줄이 옳다(말이 길어 다섯이면 14초를 넘는다).
   * ⭐ 「몇 줄인가」가 아니라 **「제대로 된 대본인가」**를 묻는다.
   */
  재본다('대본에 줄이 있다', 대본.length > 0, true);
  재본다('⛔ 빈 말이 없다', 대본.filter((x) => !String(x.말).trim()), []);
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

  /**
   * 🔴 **여기까지가 `fame` 대본 하나만 잰 것이다.**
   *   대본이 여섯 벌인데 검사는 하나만 봤다. 나머지 다섯은 「남녀가 번갈아 나오나」도
   *   「끝에서 잘리지 않나」도 한 번도 통과한 적이 없었다.
   * ⭐ **벌마다 다 잰다.** 벌이 늘면 검사도 저절로 늘어난다 — 손으로 한 줄 더 안 적는다.
   * ⚠ 자료가 없는 벌은 **없다고 잡는다.** 조용히 건너뛰면 검사가 없는 것과 같다.
   */
  for (const [이름, 벌] of Object.entries(대본목록)) {
    if (!fs.existsSync(벌.자료)) { 재본다(`⛔ ${이름} 의 자료가 있다`, 벌.자료, () => false); continue; }
    const 짠것 = 벌.짓기(JSON.parse(fs.readFileSync(벌.자료, 'utf8')));
    재본다(`[${이름}] 줄이 있다`, 짠것.length > 0, true);
    재본다(`[${이름}] 남녀가 번갈아 나온다`, 짠것.map((x) => x.누가).join(''), (s) => !/(남남|여여)/.test(s));
    재본다(`[${이름}] ⛔ 14초를 안 넘고 안 겹친다`, 대본검사(짠것), []);
    재본다(`[${이름}] ⛔ 「인기」라고 말하지 않는다`,
      짠것.map((x) => x.말).join(' ').toLowerCase(), (s) => !s.includes('popular'));
    /**
     * ⚠ **여기서 13.6 같은 여유 문턱을 재지 않는다.**
     *   `걸리는초` 는 낱말 수로 잡는 **어림**이고, Piper 실제와 ±30% 어긋난다
     *   (오늘도 3.08 어림이 2.85 로, 1.15 어림이 1.56 으로 나왔다).
     *   🔴 어림으로 13.6 을 재니 `instrument` 가 13.74 로 걸렸는데, 얹은 영상은 14초 그대로였다.
     *     **헛경보였다.** 헛경보를 내는 검사는 없는 것만 못하다.
     * ⭐ 진짜 여유는 **실제 소리를 만든 뒤** 실행부가 잰다(위 「실제 길이로 다시 매도 안 들어간다」).
     *   여기서는 어림으로 잴 수 있는 것 — **14초를 넘나·겹치나**까지만 본다.
     */
    재본다(`[${이름}] 어림으로도 14초 안에 든다`,
      짠것[짠것.length - 1].때 + 걸리는초(짠것[짠것.length - 1].말), (v) => v <= 14);
    /* 🔴 화면에 없는 수를 말하면 거짓말이 된다 — 벌 이름이 곧 영상 자 이름이다 */
    const 영상길 = `./make-video-kcw-${이름}.mjs`;
    if (!fs.existsSync(path.join(path.dirname(fileURLToPath(import.meta.url)), `make-video-kcw-${이름}.mjs`))) {
      재본다(`⛔ ${이름} 의 영상 자가 있다`, 영상길, () => false); continue;
    }
    const 그영상 = await import(영상길);
    const 그화면 = [0.6, 3.4, 4.6, 8, 11.6, 13].map((t) => 그영상.칸HTML(t)).join(' ');
    재본다(`[${이름}] ⛔ 대본의 수가 전부 화면에 있다`, 수가화면에있나(짠것, 그화면), []);
  }
  console.log(`목소리 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

/* ── 실제로 소리 내기 ────────────────────────────────────────── */

const env = fs.existsSync('.env')
  ? Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]))
  : {};

/**
 * Piper 로 소리를 낸다. ⛔ 인터넷을 안 탄다 — 이 기계에서 돈다.
 * ⚠ `--length_scale` 이 빠르기다. 1.0 이 보통, 낮을수록 빠르다.
 *   0.95 로 살짝 당긴다 — 쇼츠는 늘어지면 안 넘긴다.
 */
function 파이퍼로(글, 목소리이름, 낼길) {
  const exe = path.join(파이퍼방, 'piper.exe');
  const 모델 = path.join(파이퍼방, `${목소리이름}.onnx`);
  for (const p of [exe, 모델]) {
    if (!fs.existsSync(p)) {
      throw new Error(`없다 — ${p}\n   node scripts/_get-piper.mjs 로 받는다`);
    }
  }
  const r = spawnSync(exe, ['-m', 모델, '-f', path.resolve(낼길), '--length_scale', '0.95'], {
    input: 글, timeout: 120000, cwd: 파이퍼방,
  });
  if (!fs.existsSync(낼길) || fs.statSync(낼길).size < 1000) {
    throw new Error(`Piper 실패: ${String(r.stderr ?? '').slice(0, 200)}`);
  }
  return 낼길;
}

if (내가실행됐다) {
  const i = process.argv.indexOf('--out');
  const 낼방 = i >= 0 ? process.argv[i + 1] : 'archive/video/voice';
  fs.mkdirSync(낼방, { recursive: true });

  const j = process.argv.indexOf('--대본');
  const 고른 = j >= 0 ? process.argv[j + 1] : 'fame';
  if (!대본목록[고른]) {
    console.error(`⛔ 모르는 대본 ${고른} — 있는 것: ${Object.keys(대본목록).join(', ')}`);
    process.exit(1);
  }
  const d = JSON.parse(fs.readFileSync(대본목록[고른].자료, 'utf8'));
  const 대본 = 대본목록[고른].짓기(d);
  console.log(`대본 ${고른} · ${대본목록[고른].자료}`);
  const 탈 = 대본검사(대본);
  if (탈.length) { console.error('⛔ 대본이 안 맞는다:'); for (const t of 탈) console.error(`   · ${t}`); process.exit(1); }

  console.log(`⭐ Piper — 남 ${목소리.남.piper} · 여 ${목소리.여.piper}`);
  console.log('   열쇠 없이 이 기계에서 돈다. 프로그램도 모델도 MIT 다.\n');

  const 낸것 = [];
  for (let n = 0; n < 대본.length; n += 1) {
    const 줄 = 대본[n];
    const 길 = path.join(낼방, `${String(n).padStart(2, '0')}-${줄.누가}.wav`);
    try {
      파이퍼로(줄.말, 목소리[줄.누가].piper, 길);
      /* ⭐ 글자로 어림잡지 않고 **실제 소리 길이**를 잰다 — 어림값이 틀리면 겹친다 */
      const 참길이 = 소리길이(길);
      낸것.push({ ...줄, 길, 초: 참길이 ?? 걸리는초(줄.말), 어림: 걸리는초(줄.말) });
      console.log(`   ${String(줄.때).padStart(5)}초 [${줄.누가}] ${(참길이 ?? 0).toFixed(2)}초 (어림 ${걸리는초(줄.말)})  ${줄.말.slice(0, 52)}`);
    } catch (e) {
      console.error(`   ⛔ ${n}번째 실패 — ${e.message}`);
      process.exit(1);
    }
  }

  /**
   * 🔴 2026-08-14 — 어림이 **틀리는 것이 정상**이라는 것을 알았다.
   *   「53.79 against 38.45.」는 어림 1.15초인데 실제 3.56초다 — Piper 가 숫자를
   *   「fifty-three point seven nine」로 풀어 읽기 때문이다. 글자 수로는 못 맞힌다.
   *
   *   ⛔ 그때마다 대본을 깎는 것은 **자를 자료에 맞추는 짓**이다. 말이 옳으면 말을 안 고친다.
   *   ⭐ **실제 길이가 나온 뒤에 때를 다시 맨다.** 어림은 첫 짐작일 뿐이다.
   */
  let 때 = 0.5;
  for (const 줄 of 낸것) {
    줄.때 = +때.toFixed(2);
    때 += 줄.초 + (줄.쉼 ?? 0.45);
  }

  /* 다시 맨 뒤에도 14초를 넘으면 그건 **말이 정말 많은 것**이다. 그때는 막는다 */
  const 넘은것 = [];
  for (let i = 0; i < 낸것.length; i += 1) {
    const 끝 = 낸것[i].때 + 낸것[i].초;
    if (끝 > 14) 넘은것.push(`${i}번째가 ${끝.toFixed(2)}초에 끝난다 — 말이 길다`);
    if (i + 1 < 낸것.length && 끝 > 낸것[i + 1].때 + 0.15) {
      넘은것.push(`${i}번째(${끝.toFixed(2)}초)와 ${i + 1}번째(${낸것[i + 1].때}초)가 겹친다`);
    }
  }
  if (넘은것.length) {
    console.error('\n🔴 **실제 길이로 다시 매도 안 들어간다** — 말이 14초보다 길다:');
    for (const t of 넘은것) console.error(`   · ${t}`);
    console.error('⛔ 대본의 말을 줄여라. 때를 옮겨서는 못 푼다.');
    process.exit(1);
  }
  console.log('\n⭐ 실제 소리 길이로 때를 다시 맸다 (어림은 첫 짐작일 뿐이다)');
  for (const 줄 of 낸것) console.log(`   ${String(줄.때).padStart(6)}초 [${줄.누가}] ${줄.초}초  ${줄.말}`);

  fs.writeFileSync(path.join(낼방, 'script.json'), `${JSON.stringify({
    generated: 지금(),
    /**
     * 🔴 2026-08-14 — **어느 대본인지 안 적어서 사고가 났다.**
     *   대본 만들기가 실패해 옛 소리가 방에 남았는데, 얹기는 그것을 그냥 얹었다.
     *   fame 영상에 brands 목소리가 올라갔다 — 화면과 소리가 딴말을 했다.
     *   ⛔ 그것이 **제일 조용한 거짓말**이다. 아무도 안 죽고 아무 오류도 안 난다.
     *   ⭐ 이름을 적어 둔다. 얹는 쪽이 영상 이름과 맞춰 보고 다르면 멈춘다.
     */
    set: 고른,
    engine: 'piper',
    license: 'Piper MIT; voice models MIT (rhasspy/piper-voices)',
    voices: 목소리,
    lines: 낸것,
  }, null, 2)}\n`);

  console.log(`\n✅ ${낼방} — ${낸것.length}줄 · 실제 길이로 검산까지 맞다`);
}
