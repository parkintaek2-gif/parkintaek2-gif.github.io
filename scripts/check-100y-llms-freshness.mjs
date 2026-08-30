#!/usr/bin/env node
/**
 * check-100y-llms-freshness.mjs — **llms.txt가 실제 지면 목록과 같이 늙는가**
 *
 * 🔴 왜 만드나 (2026-08-30) — 2번이 종합한 결론(전 유닛 유튜브·SNS·AI Agent 연구)으로
 *   **AI Assistant 채널(챗GPT·퍼플렉시티)이 지금 유일하게 실제로 작동 중인 외부 유입**
 *   이라는 게 실측으로 확인됐다. 그 채널이 읽는 안내문이 `llms.txt`다.
 *
 *   그런데 그 llms.txt(`src/pages/100y/llms.txt.ts`)는 **정적 문자열**이다. 손으로
 *   재서 보니 나이 차례(`HundredAgeWalk.astro`의 `차례`+`온줄` — 나이 지면의 정본)에
 *   있는 지면 6개(nursery-fill·tutoring·real-wage·polytech·training-card·pension)가
 *   빠져 있었다. 새 나이 지면을 낼 때마다 이 파일에 손으로 옮겨 적는 걸 잊으면
 *   **AI가 그 지면의 존재 자체를 모르는 채로** 방치된다 — 이제 막 우선순위가 된
 *   채널에서 이런 누락은 이전보다 더 비싸다.
 *
 * ⛔ HundredAgeWalk의 「정본 하나」 원칙을 여기서도 따른다 — 이 자는 그 정본과 비교만
 *   한다. llms.txt에 어떤 문구를 쓸지는 사람이 정한다(이 자는 «빠졌나»만 본다).
 * ⚠ 나이 차례에 없지만 llms.txt에 있는 지면(pets·travel·promotion 등)은 정상이다 —
 *   이 자는 «차례에 있는데 llms.txt에 없는 것»만 결함으로 본다.
 *
 * 쓰는 법  node scripts/check-100y-llms-freshness.mjs
 *          node scripts/check-100y-llms-freshness.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** HundredAgeWalk.astro 소스에서 `주소: '/…'` 전부를 뽑는다 */
export function 주소뽑기(walk소스) {
  return [...String(walk소스 ?? '').matchAll(/주소:\s*'(\/[a-z0-9-]+)'/g)].map((m) => m[1]);
}

/** llms.txt.ts 소스에 그 주소가 «https://100yearmap.com{주소})» 꼴로 걸려 있나 */
export function 빠진것찾기(주소들, llms소스) {
  const s = String(llms소스 ?? '');
  return (주소들 ?? []).filter((a) => !s.includes(`(https://100yearmap.com${a})`));
}

const 내가돌려졌다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가돌려졌다 && process.argv.includes('--자가시험')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('주소뽑기 — 차례 꼴을 읽는다', 주소뽑기("{ 키: 'a', 나이: 0, 주소: '/a', 말: 'x' },"), ['/a']);
  재본다('주소뽑기 — 여러 줄도 다 읽는다',
    주소뽑기("주소: '/a',\n주소: '/b',"), ['/a', '/b']);
  재본다('주소뽑기 — 빈 것도 안 터진다', 주소뽑기(undefined), []);
  재본다('빠진것찾기 — 있으면 안 잡는다',
    빠진것찾기(['/a'], '[x](https://100yearmap.com/a): 뜻'), []);
  재본다('빠진것찾기 — 없으면 잡는다',
    빠진것찾기(['/a', '/b'], '[x](https://100yearmap.com/a): 뜻'), ['/b']);
  재본다('빠진것찾기 — 빈 것도 안 터진다', 빠진것찾기(undefined, 'x'), []);
  console.log(`llms.txt 신선도 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가돌려졌다 && !process.argv.includes('--자가시험')) {
  const walk길 = path.join(뿌리, 'src/components/HundredAgeWalk.astro');
  const llms길 = path.join(뿌리, 'src/pages/100y/llms.txt.ts');
  if (!fs.existsSync(walk길) || !fs.existsSync(llms길)) {
    console.log('⬜ 못 쟀다 — 두 파일 중 하나가 없다');
    process.exit(0);
  }
  const 주소들 = 주소뽑기(fs.readFileSync(walk길, 'utf8'));
  const 빠진것 = 빠진것찾기(주소들, fs.readFileSync(llms길, 'utf8'));
  if (빠진것.length) {
    console.error(`🔴 llms.txt에 없는 나이 지면 ${빠진것.length}개 — AI가 이 지면들을 모른다:`);
    for (const a of 빠진것) console.error(`   · ${a}`);
    console.error('   ⇒ src/pages/100y/llms.txt.ts에 한 줄씩 더한다(뜻은 지어내지 않는다).');
    process.exit(1);
  }
  console.log(`✅ 나이 차례 ${주소들.length}개 전부 llms.txt에 있다`);
  process.exit(0);
}
