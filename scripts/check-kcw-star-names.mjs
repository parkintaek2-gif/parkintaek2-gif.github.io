#!/usr/bin/env node
/**
 * check-kcw-star-names.mjs — **제목에 스타 이름이 있나.** (보는 검사)
 *
 * 🔴 사장님 지시(2026-08-16·08-20):
 *   「스타 이름을 **항상 제목과 본문에** 놓아 검색 유입되도록 하라.
 *    사람들은 스타의 이름을 검색한다. 「배우 몇 명」 같은 수는 아무도 안 찾는다.」
 *
 * ⛔ 말로 된 다짐은 다음 편에서 잊힌다. 그래서 **센다.**
 *
 * ── ⚠ 이 자를 만들며 다섯 번 틀렸다. 자가 틀리면 답도 틀린다 ──
 *   ① 선수 명단(sea-athletes)을 안 봐서 손흥민이 든 제목을 「없음」으로 셌다
 *   ② `length > 3` 으로 걸러 **BTS · IU · V** 를 통째로 뺐다
 *   ③ includes 로 봐서 「June(달)」이 예명 June 으로 걸렸다 → 낱말 경계로 본다
 *   ④ 경계에 아포스트로피를 넣어 **「BTS's」가 BTS 로 안 걸렸다**
 *   ⑤ 소스의 `const TITLE` 만 봐서 **자료로 만드는 제목**을 놓쳤다
 *      → ⭐ **빌드된 `<title>`** 을 본다. 검색엔진이 보는 것은 그것이다.
 *
 * ⛔ 막지 않는다 — 장소·차트·정정 편에 이름을 억지로 넣으면 거짓이 된다.
 *   ⭐ 세어서 보이기만 한다. 넣을지는 사람이 편마다 정한다.
 *
 * 쓰는 법
 *   node scripts/check-kcw-star-names.mjs           빌드된 것을 잰다(먼저 astro build)
 *   node scripts/check-kcw-star-names.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 명단길 = ['sea-actors', 'sea-musicians', 'sea-athletes']
  .map((f) => path.join(뿌리, 'archive', 'raw', 'wikipedia', `${f}.json`));
export const 낸방 = path.join(뿌리, 'dist', 'wikitip');

/**
 * ⛔ 예명이 보통 낱말과 부딪힌다. 손으로 뺀다 — **뺀 것을 밝혀 둔다.**
 *   이 목록이 길어지면 그만큼 우리가 못 세는 이름이 는다는 뜻이다.
 */
export const 부딪힘 = new Set(['Since', 'June', 'Seven', 'Monday', 'Love', 'Lady', 'Luna', 'Solo',
  'Key', 'Rain', 'Sun', 'Kid', 'Boy', 'Girl', 'One', 'Ten', 'Now', 'Home', 'Free', 'Real',
  'Sunday', 'April', 'May', 'August', 'Winter', 'Summer', 'Chart', 'Star', 'Space', 'Gold',
  'Point', 'Base', 'Line', 'Data', 'Fact', 'Up', 'Ha', 'Zero', 'Hope', 'Dream',
  /* 2026-08-21 에 더했다 — 우리 표·작품명 안에서 걸렸다.
     ⛔ Joy 는 실제 Red Velvet 멤버다. 빼면 그 사람을 영구히 못 센다 — 그것을 알고 뺀다.
     걸린 자리: 「Win rate」 표머리 · 「Dynamite Kiss」 작품명 · 「Secret Royal Inspector & Joy」 작품명 */
  'Win', 'Kiss', 'Joy']);

/** ⭐ 낱말 경계로 본다. 아포스트로피는 경계다 — 소유격도 이름이다 */
export function 자만들기(이름) {
  const n = 이름.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^A-Za-z0-9-])${n}([^A-Za-z0-9-]|$)`);
}

export function 들었나(제목, 자들) {
  return 자들.filter(([, r]) => r.test(제목)).map(([n]) => n);
}

export function 제목뽑기(html) {
  const m = html.match(/<title>([^<]*)<\/title>/);
  return m ? m[1].replace(/\s*\|\s*K Culture Wire\s*$/, '') : null;
}

/**
 * ⛔ **곳간이 없는 것은 「깨졌다」가 아니라 「못 쟀다」다.**
 *   2026-08-23 에 이 자가 `archive/raw/wikipedia/sea-actors.json` 이 없다는 이유로
 *   ENOENT 로 죽었다. 곳간은 OneDrive·R2 에 있고 창마다 다 내려와 있지 않다 —
 *   그런데 죽으면 화면에는 「검사 실패」로 보이고, 못 잰 것이 깨진 것으로 적힌다.
 *   ⭐ 그래서 없는 파일은 **건너뛰고 이름을 적어 둔다.** 부르는 쪽이 갈라 적을 수 있게.
 */
export const 못읽은명단 = [];

export function 명단읽기(길들 = 명단길) {
  const 이름 = new Set();
  못읽은명단.length = 0;
  for (const p of 길들) {
    if (!fs.existsSync(p)) { 못읽은명단.push(p); continue; }
    for (const x of JSON.parse(fs.readFileSync(p, 'utf8')).people ?? []) if (x.name) 이름.add(x.name);
  }
  return [...이름].filter((n) => !부딪힘.has(n) && n.length >= 2).map((n) => [n, 자만들기(n)]);
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  const 자 = [['IU', 자만들기('IU')], ['BTS', 자만들기('BTS')], ['Son Heung-min', 자만들기('Son Heung-min')]];

  /* ② 짧은 이름을 빼면 안 된다 */
  재본다('⛔⛔ IU 를 센다', 들었나('Rank musicians and IU is not first', 자), ['IU']);
  /* ④ 소유격도 이름이다 */
  재본다('⛔⛔ BTS 의 소유격을 센다', 들었나("a quarter of BTS's month", 자), ['BTS']);
  /* ③ 낱말 조각에 걸리면 안 된다 */
  재본다('⛔ 낱말 조각에 안 걸린다', 들었나('BTSX and IUY are not names', 자), []);
  재본다('⛔ 붙임표 이름을 통째로 본다', 들었나('Son Heung-min is read more', 자), ['Son Heung-min']);
  재본다('⛔ 붙임표가 더 붙으면 다른 이름이다', 들었나('Son Heung-min-ho', 자), []);

  /* ⑤ 잴 것은 나간 글자다 */
  재본다('⭐ 빌드된 제목을 뽑는다',
    제목뽑기('<title>IU is a Rooster | K Culture Wire</title>'), 'IU is a Rooster');
  재본다('⛔ 제목이 없으면 null', 제목뽑기('<p>no title</p>'), null);

  /* ⛔ 없는 파일에서 죽지 않는다 — 없으면 적어 두고 넘어간다 */
  재본다('⭐ 없는 명단 파일에서 안 죽는다',
    (() => { 명단읽기([path.join(뿌리, '없는-파일-입니다.json')]); return 못읽은명단.length; })(), 1);

  const 자들 = 명단읽기();
  if (못읽은명단.length === 명단길.length) {
    console.log('   ⚠ 명단 곳간이 하나도 없다 — 「명단에 이름이 3,000개」는 **못 쟀다**.');
  } else {
    재본다('⭐ 명단에 이름이 3,000개 넘는다', 자들.length, (n) => n > 3000);
    재본다('⛔ 부딪히는 예명은 빠져 있다', 자들.some(([n]) => n === 'June'), false);
  }

  console.log(`제목에 스타 이름 있나 보는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(낸방)) {
    console.log('⚠ dist 가 없다 — 먼저 `npx astro build` 를 돌린다. **못 쟀다**고 적는다.');
    process.exit(0);
  }
  const 자들 = 명단읽기();
  /**
   * 🔴 명단이 하나도 없으면 **셀 수가 없다.** 그때 0% 를 찍으면
   *   「제목에 이름이 하나도 없다」는 거짓말이 된다. 못 쟀다고 적고 나간다.
   */
  if (!자들.length) {
    console.log('⚠ 스타 명단 곳간이 없다 — **못 쟀다.**');
    for (const p of 못읽은명단) console.log(`   · 없다: ${path.relative(뿌리, p)}`);
    console.log('');
    console.log('   내리는 법: OneDrive·R2 의 archive/raw/wikipedia 를 받아 온다.');
    console.log('   ⛔ 이것은 「통과」가 아니다. 0% 도 아니다 — **재지 못한 것**이다.');
    process.exit(0);
  }
  if (못읽은명단.length) {
    console.log('⚠ 명단 일부가 없다 — 아래 셈은 **있는 명단으로만** 잰 것이다:');
    for (const p of 못읽은명단) console.log(`   · 없다: ${path.relative(뿌리, p)}`);
    console.log('');
  }
  const 재기 = (방) => {
    const 것들 = fs.readdirSync(방).filter((f) => f.endsWith('.html'));
    let 있음 = 0; const 없음 = [];
    for (const f of 것들) {
      const t = 제목뽑기(fs.readFileSync(path.join(방, f), 'utf8'));
      if (t == null) continue;
      if (들었나(t, 자들).length) 있음 += 1; else 없음.push([f.replace('.html', ''), t]);
    }
    return { 있음, 없음, 전체: 있음 + 없음.length };
  };
  const ㅈ = 재기(낸방);
  const 기사방 = path.join(낸방, 'article');
  const ㄱ = fs.existsSync(기사방) ? 재기(기사방) : { 있음: 0, 없음: [], 전체: 0 };
  const 다 = ㅈ.전체 + ㄱ.전체; const 든것 = ㅈ.있음 + ㄱ.있음;

  console.log('제목에 스타 이름이 있나 — 사장님 지시(8/16·8/20)\n');
  console.log(`   지면 ${String(ㅈ.전체).padStart(4)}장   이름 있음 ${String(ㅈ.있음).padStart(3)}  (${((100 * ㅈ.있음) / (ㅈ.전체 || 1)).toFixed(0)}%)`);
  console.log(`   기사 ${String(ㄱ.전체).padStart(4)}편   이름 있음 ${String(ㄱ.있음).padStart(3)}  (${((100 * ㄱ.있음) / (ㄱ.전체 || 1)).toFixed(0)}%)`);
  console.log(`   합계 ${String(다).padStart(4)}장   이름 있음 ${String(든것).padStart(3)}  (${((100 * 든것) / (다 || 1)).toFixed(0)}%)`);
  console.log('\n⚠ 이 자는 **세기만 한다.** 장소·차트·정정 편에 이름을 억지로 넣으면 거짓이 된다.');
  console.log(`⚠ 부딪히는 예명 ${부딪힘.size}개는 못 센다 — 그만큼 실제는 이 수보다 높을 수 있다.`);
}
