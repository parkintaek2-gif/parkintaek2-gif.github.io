#!/usr/bin/env node
/**
 * check-star-saju-daypillar.mjs — **스타사주 기사에 적힌 일주가 만세력과 맞나.** (npm test)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-22 03:3x. 4번이 넘긴 첫 감명(아이유 1993-05-16)의 일주가 **병신(丙申)**이었다.
 * 우리 만세력(`scripts/lib/일주.mjs`)은 같은 날을 **정유(丁酉)**로 낸다 — **딱 하루 차이**다.
 *
 * 손으로도 세어 봤다. 널리 적힌 두 날에서 각각 세었고 둘 다 같은 답이었다.
 *   2000-01-01 무오(n=54) 에서 −2,421일  → n=33 = 정유
 *   1949-10-01 갑자(n=0)  에서 +15,933일 → n=33 = 정유
 *   (병신은 n=32 — 하루 앞이다)
 *
 * ⛔ 어느 쪽이 옳은지는 이 자가 정하지 않는다. 이 자가 하는 일은 **어긋난 채로 활자가
 *   되는 것을 막는 것**이다. 우리 강령이 「편수보다 숫자가 먼저다 — 틀린 숫자 하나가
 *   옳은 스물셋을 같이 의심받게 한다」이기 때문이다.
 *
 * ⚠ 남의 엔진(KLifeMap)을 여기서 안 고친다. 4번 자리다. 어긋나면 **알리고 세운다.**
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * `content/kculturewire/` 에서 사주 기사(tags 에 `saju`)를 찾아,
 * ① 본문에 적힌 생년월일(YYYY-MM-DD)과
 * ② 본문에 적힌 일주 한자 두 글자(예: 丁酉)를
 * 뽑아 만세력과 견준다. 어긋나면 선다.
 *
 * ⛔ 사주 기사가 없으면 **「볼 것이 없다」로 끝낸다.** 없는 것을 빨강으로 만들지 않는다.
 * ⚠ 시주는 여기서 안 본다 — 출생 시각이 공개 자료에 없어 아무도 못 센다.
 *
 * 자가시험 — `node scripts/check-star-saju-daypillar.mjs --자가시험`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 일주 } from './lib/일주.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CD = path.join(뿌리, 'content/kculturewire');

/** 본문에서 「1993-05-16」 꼴을 찾는다. 앞말의 pubDate·dataAsOf 는 세지 않는다 */
export const 생년월일찾기 = (본문) => {
  const 후보 = [...본문.matchAll(/\b(19\d{2}|20\d{2})-(\d{2})-(\d{2})\b/g)].map((m) => m[0]);
  return [...new Set(후보)];
};

/** 본문에서 육십갑자 한자 두 글자를 찾는다 — 「丁酉」·「(丁酉)」 어느 꼴이든 */
export const 일주찾기 = (본문) => {
  const 천간 = '甲乙丙丁戊己庚辛壬癸';
  const 지지 = '子丑寅卯辰巳午未申酉戌亥';
  const 무늬 = new RegExp(`[${천간}][${지지}]`, 'g');
  return [...new Set([...본문.matchAll(무늬)].map((m) => m[0]))];
};

/**
 * 한 편을 잰다. **적힌 간지 중 하나라도 그 날의 일주와 같으면 맞은 것**으로 본다 —
 * 기사에는 연주·월주도 함께 적히므로, 「일주만 골라 읽는 것」을 글자로는 못 한다.
 * ⚠ 그래서 이 자는 「일주가 아예 안 적혀 있다」를 잡는 자이기도 하다.
 */
export const 한편잰다 = (본문, { 날짜, 간지들 } = {}) => {
  const 날 = 날짜 ?? 생년월일찾기(본문)[0];
  if (!날) return { 꼴: '못쟀다', 말: '생년월일을 본문에서 못 찾았다' };
  const 적힌것 = 간지들 ?? 일주찾기(본문);
  if (!적힌것.length) return { 꼴: '못쟀다', 말: `${날} — 간지가 본문에 하나도 없다` };
  const 참 = 일주(날);
  if (!참.일주한자) return { 꼴: '못쟀다', 말: `${날} — 만세력이 못 읽는 날짜다` };
  if (적힌것.includes(참.일주한자)) return { 꼴: '맞다', 말: `${날} = ${참.일주}(${참.일주한자})` };
  return {
    꼴: '어긋났다',
    말: `${날} 의 일주는 만세력으로 ${참.일주}(${참.일주한자}) 인데 본문에 그 두 글자가 없다. 본문에 적힌 간지: ${적힌것.join(' · ')}`,
  };
};

/* ── 자가시험 ───────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('맞는 편을 맞다고 한다',
    한편잰다('IU was born on 1993-05-16. The day pillar is 丁酉.').꼴 === '맞다');
  검('하루 어긋난 것을 잡는다 (8/22 에 실제로 온 꼴 — 丙申)',
    한편잰다('IU was born on 1993-05-16. The day pillar is 丙申.').꼴 === '어긋났다');
  검('연주·월주가 같이 적혀 있어도 맞다고 한다',
    한편잰다('1993-05-16 · 癸酉 · 丁巳 · 丁酉').꼴 === '맞다');
  검('간지가 없으면 못 쟀다고 한다',
    한편잰다('IU was born on 1993-05-16.').꼴 === '못쟀다');
  검('날짜가 없으면 못 쟀다고 한다',
    한편잰다('The day pillar is 丁酉.').꼴 === '못쟀다');
  /* 남의 손으로 한 번 맞은 칸 — 정국 1997-09-01 = 병오(丙午) */
  검('정국 병오도 맞다고 한다',
    한편잰다('Jungkook was born on 1997-09-01 — 丙午.').꼴 === '맞다');
  검('⛔ 못 쟀다를 맞다로 넘기지 않는다',
    한편잰다('').꼴 === '못쟀다');

  if (실패.length) { console.error('❌ 자가시험 실패\n' + 실패.map((s) => `   · ${s}`).join('\n')); process.exit(1); }
  console.log('✅ check-star-saju-daypillar 자가시험 통과 (7)');
  process.exit(0);
}

/* ── 실제 기사를 잰다 ───────────────────────────────────────── */
if (!fs.existsSync(CD)) { console.log('⚠ content/kculturewire 가 없다 — 볼 것이 없다'); process.exit(0); }

const 사주기사 = fs.readdirSync(CD)
  .filter((f) => f.endsWith('.md'))
  .map((f) => ({ f, src: fs.readFileSync(path.join(CD, f), 'utf8') }))
  .filter(({ src }) => /^tags:.*"saju"/m.test(src) && !/^draft:[^\S\r\n]*true/m.test(src));

if (!사주기사.length) { console.log('⚠ 사주 기사가 아직 없다 — 볼 것이 없다(빨강 아님)'); process.exit(0); }

const 어긋남 = [];
const 못쟀다 = [];
for (const { f, src } of 사주기사) {
  const 본문 = src.replace(/^---[\s\S]*?\r?\n---/, ''); /* 앞말의 날짜를 안 세게 잘라 낸다 */
  const 잼 = 한편잰다(본문);
  if (잼.꼴 === '어긋났다') 어긋남.push(`${f} — ${잼.말}`);
  else if (잼.꼴 === '못쟀다') 못쟀다.push(`${f} — ${잼.말}`);
}

console.log(`사주 기사 ${사주기사.length}편 · 맞음 ${사주기사.length - 어긋남.length - 못쟀다.length} · 어긋남 ${어긋남.length} · 못 쟀다 ${못쟀다.length}`);
for (const m of 못쟀다) console.log(`⚠ ${m}`);

if (어긋남.length) {
  console.error('❌ 활자가 만세력과 어긋난다 — 나가면 안 된다\n' + 어긋남.map((s) => `   · ${s}`).join('\n'));
  console.error('   ⚠ 어느 쪽이 옳은지는 이 자가 안 정한다. 4번(KLifeMap)과 세운 뒤에 낸다.');
  process.exit(1);
}
console.log('✅ 적힌 일주가 만세력과 맞다');
