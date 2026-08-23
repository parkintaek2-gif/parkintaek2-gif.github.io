#!/usr/bin/env node
/**
 * measure-kcw-subscribers.mjs — **명단에 몇 명이 있나.** (⛔ 주소를 화면에 안 낸다)
 *
 * ── 왜 (2026-08-23) ───────────────────────────────────────────
 * 오늘 `/subscribe` 를 원클릭으로 고쳤다(2번 실측 지적). 이제 사람이 들어올 수 있으니
 * **세는 자가 있어야 한다.** 없으면 「가입이 늘었나」를 영원히 짐작으로 말하게 된다.
 *
 * 🔴 그리고 오늘 제가 시험하느라 **가짜 주소 셋을 명단에 넣었다** —
 *   `probe-5beon@example.invalid` · `probe-form-5beon@example.invalid` ·
 *   `live-check-5beon@example.invalid`. 메일이 갈 수 없는 주소지만 **세면 세 명이 는다.**
 *   ⛔ 그것을 구독자로 세면 첫 수부터 부풀어 있는 것이다. 자가 처음부터 걸러야 한다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **이메일 주소를 화면에 안 낸다.** 세기만 한다. 저장도 해시라 원문이 없다.
 * ⛔ `confirmed:false` 를 확인된 것처럼 세지 않는다. 아직 확인 메일을 보낸 적이 없다 —
 *   발송 수단이 없기 때문이다. 그러니 **전부 미확인**이고, 그 사실을 그대로 적는다.
 * ⛔ 사이트를 합치지 않는다. 넷 사이트가 한 명단을 쓰므로 사이트별로 가른다.
 *   ⚠ 8/23 이전에 들어온 줄에는 `site` 칸이 아예 없다 — 그것을 「다른 사이트」로 세지 않고
 *     **「모름」으로 따로** 센다. 없는 것과 다른 것은 다른 말이다.
 *
 * 쓰는 법
 *   node scripts/measure-kcw-subscribers.mjs --자가시험
 *   node scripts/measure-kcw-subscribers.mjs --잰다
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 시험하느라 넣은 주소인가.
 * ⛔ 「우리가 넣은 것 같다」로 거르지 않는다. **닿을 수 없는 주소**만 거른다 —
 *   `.invalid` 는 표준으로 절대 존재할 수 없는 최상위 도메인이다(RFC 2606).
 *   그러니 이것을 빼는 것은 취향이 아니라 사실이다.
 * ⚠ `example.com`·`test@` 같은 것은 **안 거른다.** 진짜 사람이 쓸 수도 있고,
 *   우리가 그것을 판정하면 남의 가입을 우리 짐작으로 지우는 것이 된다.
 */
export const 닿을수없나 = (이메일) => /\.invalid$/i.test(String(이메일 ?? '').trim().toLowerCase());

/**
 * 줄 하나를 어느 칸에 넣나.
 * ⚠ 주소가 저장돼 있지 않은 줄(해시만 있는 옛 줄)은 「거를 수 없다」 — 그건 셈에 넣되
 *   **못 거른 것**으로 따로 적는다. 0 으로 지우지 않는다.
 */
export function 가르기(줄들) {
  const 통 = { 전체: 0, 셈에넣음: 0, 닿을수없음: 0, 주소없어못거름: 0, 확인됨: 0, 사이트: {}, 유입: {} };
  for (const r of 줄들 ?? []) {
    통.전체 += 1;
    const 이메일 = typeof r?.email === 'string' ? r.email : null;
    if (이메일 === null) 통.주소없어못거름 += 1;
    if (이메일 !== null && 닿을수없나(이메일)) { 통.닿을수없음 += 1; continue; }
    통.셈에넣음 += 1;
    if (r?.confirmed === true) 통.확인됨 += 1;
    const s = typeof r?.site === 'string' && r.site ? r.site : '모름';
    통.사이트[s] = (통.사이트[s] ?? 0) + 1;
    const u = typeof r?.source === 'string' && r.source ? r.source : '모름';
    통.유입[u] = (통.유입[u] ?? 0) + 1;
  }
  return 통;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('.invalid 는 닿을 수 없다', 닿을수없나('probe@example.invalid') === true);
  검('대문자여도 잡는다', 닿을수없나('A@EXAMPLE.INVALID') === true);
  검('⛔ example.com 은 안 거른다 — 남의 가입을 짐작으로 지우지 않는다',
    닿을수없나('someone@example.com') === false);
  검('⛔ test 가 들어가도 안 거른다', 닿을수없나('test@gmail.com') === false);
  검('⛔ 빈 값도 안 터진다', 닿을수없나(null) === false && 닿을수없나('') === false);

  const 표본 = [
    { email: 'a@real.com', site: 'kculturewire.com', source: 'subscribe-page', confirmed: false },
    { email: 'b@real.com', site: 'seoulmarkets.com', source: 'footer', confirmed: true },
    { email: 'p@example.invalid', site: 'kculturewire.com', source: 'subscribe-page' },
    { email: 'c@real.com', source: 'home' },                 // 사이트 칸이 없는 옛 줄
    { site: 'kculturewire.com', source: 'home' },            // 주소가 없는 줄
  ];
  const t = 가르기(표본);
  검('전체를 센다', t.전체 === 5);
  검('⛔ 닿을 수 없는 주소를 뺀다', t.닿을수없음 === 1 && t.셈에넣음 === 4);
  검('확인된 것만 확인으로 센다', t.확인됨 === 1);
  검('사이트를 가른다', t.사이트['kculturewire.com'] === 2 && t.사이트['seoulmarkets.com'] === 1);
  검('⛔ 사이트 칸이 없는 줄은 «모름» — 남의 사이트로 안 센다', t.사이트['모름'] === 1);
  검('유입을 가른다', t.유입['subscribe-page'] === 1 && t.유입.home === 2);
  검('⚠ 주소가 없어 못 거른 줄을 따로 센다', t.주소없어못거름 === 1);
  검('⛔ 빈 입력도 안 터진다', 가르기([]).전체 === 0 && 가르기(undefined).셈에넣음 === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 실패\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ measure-kcw-subscribers 자가시험 통과 (13)');
  process.exit(0);
}

if (!process.argv.includes('--잰다')) {
  console.log('⛔ --잰다 나 --자가시험 을 준다');
  process.exit(1);
}

/* ── 여기부터 실측 ── */
process.chdir(뿌리);
const { list, get, remoteEnabled } = await import('../src/lib/store.mjs');

if (typeof list !== 'function') {
  console.log('⬜ **못 쟀다** — 저장소에 목록을 뽑는 길이 없다(store.mjs 에 list 가 없다).');
  console.log('   ⛔ 0 명이라고 적지 않는다. 세는 길이 없는 것과 없는 것은 다른 말이다.');
  process.exit(0);
}
if (!remoteEnabled) {
  console.log('⬜ **못 쟀다** — 저장소 자격증명이 이 창에 없다. 0 명이 아니다.');
  process.exit(0);
}

const 열쇠들 = await list('subscribers/');
const 줄들 = [];
for (const k of 열쇠들 ?? []) {
  try {
    const b = await get(typeof k === 'string' ? k : k?.key);
    if (b) 줄들.push(JSON.parse(b.toString('utf8')));
  } catch { /* 한 줄이 깨져도 나머지를 센다 */ }
}

const t = 가르기(줄들);
console.log('# 명단 — K Culture Wire');
console.log(`  줄 ${t.전체}개 · 셈에 넣은 것 **${t.셈에넣음}명**`);
console.log(`  ⛔ 닿을 수 없어 뺀 것 ${t.닿을수없음}개 (.invalid — 오늘 제가 시험하느라 넣은 것들이다)`);
if (t.주소없어못거름) console.log(`  ⚠ 주소가 없어 거르지 못한 줄 ${t.주소없어못거름}개 — 셈에는 넣었다`);
console.log(`  확인된 것 ${t.확인됨}명  ⚠ 확인 메일을 보낸 적이 없다(발송 수단 없음). 전부 미확인이 정상이다`);
console.log('\n사이트마다');
for (const [k, v] of Object.entries(t.사이트).sort((a, b) => b[1] - a[1])) console.log(`  ${String(k).padEnd(22)} ${v}`);
console.log('\n어디서 눌렀나');
for (const [k, v] of Object.entries(t.유입).sort((a, b) => b[1] - a[1])) console.log(`  ${String(k).padEnd(22)} ${v}`);
console.log('\n⛔ 이 자는 주소를 화면에 내지 않는다. 세기만 한다.');
