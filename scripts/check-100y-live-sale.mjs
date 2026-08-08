#!/usr/bin/env node
/** 라이브 실측 — **파는 지면이 팔 수 있는 꼴로 나가 있나**.
 *
 *   node scripts/check-100y-live-sale.mjs
 *
 * 🔴 왜 저장소에 두나 (2026-08-08 12:0x)
 *   2번이 라이브를 재서 「값도 사는 단추도 없다」를 잡아 줬다. 나는 빌드만 재고 있었다.
 *   ⛔ **빌드에서 잰 값을 라이브라고 하면 안 된다** — 오늘 배포가 「성공」이라 하고
 *     아무것도 안 나간 적이 있다.
 *
 * 잰다 — 고정 셋(200·KLifeMap 없음) · 파는 5장(값 있음) · 무료 5장(값 없음) ·
 *        열 장 다 세 링크 · 열 장 다 내부 주석 0
 *
 * ## ⛔ **`npm test` 에 물리지 않는다** — 잊은 것이 아니다 (2026-08-08 15:5x)
 *
 *   2번 지시(15:4x) — *「검사 69개 중 53개가 안 불립니다 … 상시로 돌아야 하는 것이면
 *   `npm test` 에 물리십시오」*. 이 자는 **일부러 안 물렸다.**
 *
 *   ```
 *   ⛔ 네트워크를 탄다        인터넷이 끊긴 자리에서 npm test 가 통째로 죽는다
 *   ⛔ 라이브를 잰다          배포 전에는 당연히 옛 지면이 나온다 — 못 고칠 것으로 운다
 *   ```
 *
 *   ⭐ 이 자를 드는 때는 **배포 직후 한 번**이다. 그때 손으로 부른다.
 *
 * ⚠ 표본은 **고르게** 뽑는다. 앞에서 다섯만 집으면 큰 구만 본다.
 */
/** (원래 메모)
 *  ⛔ 빌드에서 잰 값을 라이브라고 하지 않는다. **100yearmap.com 에서 받아** 센다.
 *  ⚠ 한꺼번에 다 때리지 않는다 — 다섯씩 나눠 보낸다. */
import fs from 'node:fs';
import https from 'node:https';

const 뿌리 = 'C:/Users/USER/Documents/GitHub/dataeconomics';
const areas = JSON.parse(fs.readFileSync(`${뿌리}/src/data/100yearmap/areas.json`, 'utf8'));

const 받기 = (경로) =>
  new Promise((resolve) => {
    https
      .get(
        'https://100yearmap.com' + encodeURI(경로),
        { headers: { 'User-Agent': '100yearmap-selfcheck' } },
        (r) => {
          let b = '';
          r.on('data', (c) => (b += c));
          r.on('end', () => resolve({ 상태: r.statusCode, 글: b }));
        },
      )
      .on('error', (e) => resolve({ 상태: 0, 글: '', 오류: e.message }));
  });

/** 표본은 **골고루** 뽑는다. 앞에서 다섯 개만 집으면 큰 구만 본다 */
const 고르게 = (목록, n) => {
  const 간격 = Math.max(1, Math.floor(목록.length / n));
  return Array.from({ length: n }, (_, i) => 목록[i * 간격]).filter(Boolean);
};

const 파는것 = 고르게(areas.단위.filter((a) => a.한벌로팔만한가), 5);
const 무료것 = 고르게(areas.단위.filter((a) => !a.한벌로팔만한가), 5);

const 잰다 = async (묶음, 이름, 값이있어야하나) => {
  console.log(`\n■ ${이름}`);
  let 다맞음 = 0;
  for (const u of 묶음) {
    const 경로 = `/report/area/${u.slug}`;
    const { 상태, 글 } = await 받기(경로);
    const 값 = /9,900원/.test(글);
    const 세링크 = ['/terms', '/privacy', '/refund'].every((x) => 글.includes(`href="${x}"`));
    const 주석 = (글.match(/<!--/g) || []).length;
    const 값맞나 = 값 === 값이있어야하나;
    const 좋다 = 상태 === 200 && 값맞나 && 세링크 && 주석 === 0;
    if (좋다) 다맞음++;
    console.log(
      `  ${좋다 ? '✅' : '⛔'} ${상태} ${u.slug.padEnd(22)} ${u.곳}곳 · 값 ${값 ? '있음' : '없음'}${값맞나 ? '' : ' ⛔틀림'} · 세링크 ${세링크 ? '✅' : '⛔'} · 주석 ${주석}`,
    );
  }
  console.log(`  → ${다맞음}/${묶음.length}`);
  return 다맞음 === 묶음.length;
};

const 고정 = async () => {
  console.log('\n■ 고정 지면');
  for (const p of ['/terms', '/privacy', '/refund']) {
    const { 상태, 글 } = await 받기(p);
    const kl = /KLifeMap/.test(글);
    console.log(`  ${상태 === 200 && !kl ? '✅' : '⛔'} ${상태} ${p.padEnd(10)} ${글.length}자 · KLifeMap ${kl ? '⛔ 있다' : '없다'}`);
  }
};

await 고정();
const a = await 잰다(파는것, '파는 지면 5장 — 값이 있어야 한다', true);
const b = await 잰다(무료것, '무료 지면 5장 — 값이 없어야 한다', false);
console.log(`\n${a && b ? '✅ 열 장 다 맞다' : '⛔ 어긋난 곳이 있다'}`);
