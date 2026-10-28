#!/usr/bin/env node
/**
 * 잰다-투자AI-회전율.mjs — **우리 신호가 퇴직연금에 쓸 만큼 느린가.**
 *
 * 🔴 사장님 2026-10-28 「1단계 해봐」 — 신호·지수 공급으로 진행하라는 지시.
 *   기획서(docs/기획-퇴직연금-로보어드바이저-20261028.md) §7-2 에 적은 첫 숙제가 이것이다.
 *
 * ── 왜 회전율인가 ─────────────────────────────────────────────────────
 *   2026-10-27 금융감독원이 퇴직연금 로보어드바이저 사업자들에게 제출하라고 한
 *   **첫 항목이 회전율**이다. 퇴직연금은 장기 자금이라 잦은 매매를 싫어한다.
 *   우리 신호 엔진은 분·시간 단위로 판단하도록 설계됐다 —
 *   그 속도가 퇴직연금에 맞는지 **아직 아무도 재지 않았다.**
 *
 * ── 무엇을 어떻게 재나 ────────────────────────────────────────────────
 *   ① 포트폴리오 회전율 — 승인된 비중이 하루 사이 얼마나 바뀌나
 *        한쪽 회전율 = 0.5 × Σ|오늘 비중 − 어제 비중|
 *        연 회전율  = 한쪽 회전율 평균 × 한 해 교체 횟수
 *      ⚠ 이것이 금감원이 묻는 수치다. 나머지는 참고다.
 *   ② 신호 교체율 — 하루 사이 신호 목록이 얼마나 바뀌나(겉잡이)
 *      ⚠ 신호는 입력이고 포트폴리오는 결과다. 둘을 같은 말로 적지 않는다.
 *
 * ⛔ **못 재면 못 쟀다고 적는다.** 숫자를 만들어 채우지 않는다.
 *
 * 쓰는 법
 *   node scripts/잰다-투자AI-회전율.mjs
 *   node scripts/잰다-투자AI-회전율.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 자리 = path.join(뿌리, 'src', 'data', 'invest-ai');

/** 한쪽 회전율 — 두 비중표 사이에서 «산 것»만 센다(판 것과 같으므로 절반) */
export function 한쪽회전율(어제, 오늘) {
  const a = 어제 || {}; const b = 오늘 || {};
  const 모든것 = new Set([...Object.keys(a), ...Object.keys(b)]);
  let 합 = 0;
  for (const k of 모든것) 합 += Math.abs((b[k] || 0) - (a[k] || 0));
  return 합 / 2;
}

/** 두 목록이 얼마나 바뀌었나 — 0 이면 그대로, 1 이면 통째로 갈렸다 */
export function 교체율(어제목록, 오늘목록) {
  const a = new Set(어제목록 || []); const b = new Set(오늘목록 || []);
  if (!a.size && !b.size) return 0;
  let 겹침 = 0;
  for (const x of b) if (a.has(x)) 겹침 += 1;
  const 모두 = new Set([...a, ...b]).size;
  return 모두 ? 1 - 겹침 / 모두 : 0;
}

/** 대장에서 «날짜마다 마지막 비중표»만 남긴다 — 같은 날 여러 줄은 시험 기록이다 */
export function 날짜별비중(줄들) {
  const 표 = new Map();
  for (const l of 줄들) {
    let j = null; try { j = JSON.parse(l); } catch (e) { continue; }
    if (!j || !j.asOf) continue;
    const 비중 = j.승인비중 || {};
    /* 빈 비중은 「그날 승인된 것이 없다」이지 「다 팔았다」가 아니다 —
       둘을 같게 보면 회전율이 거짓으로 부풀어 오른다. 빈 날은 셈에서 뺀다. */
    if (!Object.keys(비중).length) continue;
    표.set(String(j.asOf), 비중);
  }
  return [...표.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

function 신호날짜별종목() {
  const 표 = new Map();
  if (!fs.existsSync(자리)) return 표;
  for (const f of fs.readdirSync(자리)) {
    const m = f.match(/^signals-(\d{8})\.jsonl$/);
    if (!m) continue;
    const 것 = new Set();
    for (const l of fs.readFileSync(path.join(자리, f), 'utf8').split('\n')) {
      if (!l.trim()) continue;
      let j = null; try { j = JSON.parse(l); } catch (e) { continue; }
      const e = j && j.entity;
      if (e && e.code) 것.add((e.market || '') + ':' + e.code);
    }
    if (것.size) 표.set(m[1], [...것]);
  }
  return new Map([...표.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
}

/* ── 자가시험 ─────────────────────────────────────────────────────── */
export function 자가시험() {
  const 것 = [];
  const 본다 = (이름, 참) => 것.push({ 이름, 참: !!참 });
  본다('그대로면 회전율 0', 한쪽회전율({ a: 0.5, b: 0.5 }, { a: 0.5, b: 0.5 }) === 0);
  본다('통째로 갈리면 1', Math.abs(한쪽회전율({ a: 1 }, { b: 1 }) - 1) < 1e-9);
  본다('절반만 갈리면 0.5', Math.abs(한쪽회전율({ a: 1 }, { a: 0.5, b: 0.5 }) - 0.5) < 1e-9);
  본다('빈 것에 안 터진다', 한쪽회전율(null, null) === 0);
  본다('교체율 — 그대로면 0', 교체율(['a', 'b'], ['a', 'b']) === 0);
  본다('교체율 — 통째로 갈리면 1', 교체율(['a'], ['b']) === 1);
  본다('🔴 빈 비중 날은 셈에서 뺀다 — 「다 팔았다」가 아니다',
    날짜별비중(['{"asOf":1,"승인비중":{"a":1}}', '{"asOf":2,"승인비중":{}}']).length === 1);
  본다('같은 날 여러 줄이면 마지막 것만 센다',
    날짜별비중(['{"asOf":1,"승인비중":{"a":1}}', '{"asOf":1,"승인비중":{"b":1}}'])[0][1].b === 1);
  const 빨강 = 것.filter((x) => !x.참);
  console.log(`■ 투자AI 회전율 자가시험 ${것.length - 빨강.length}/${것.length}`);
  for (const x of 것) console.log(`  ${x.참 ? '✅' : '🔴'} ${x.이름}`);
  return 빨강.length === 0;
}

/* ── 진입점 ───────────────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  if (process.argv.includes('--자가시험')) process.exit(자가시험() ? 0 : 1);

  console.log('■ 투자AI 회전율 — 퇴직연금에 쓸 만큼 느린가');
  console.log('  (금융감독원이 퇴직연금 로보어드바이저 사업자에게 요구한 첫 항목)\n');

  /* ① 포트폴리오 회전율 */
  const 대장길 = path.join(자리, 'paper-ledger.jsonl');
  const 줄들 = fs.existsSync(대장길) ? fs.readFileSync(대장길, 'utf8').split('\n').filter(Boolean) : [];
  const 날짜표 = 날짜별비중(줄들);
  console.log('① 포트폴리오 회전율');
  console.log(`   대장 줄 ${줄들.length}개 · 비중이 실제로 담긴 날 ${날짜표.length}일`);
  if (날짜표.length < 2) {
    console.log('   🔴 **못 쟀다.** 비중표가 두 날 이상 있어야 사이를 잴 수 있는데 '
      + 날짜표.length + '일뿐이다.');
    console.log('      ⛔ 숫자를 만들어 채우지 않는다. 이것이 지금의 사실이다.');
    console.log('      ⇒ 할 일 — 승인 비중을 **날마다** 대장에 남긴다. 그래야 다음 달에 잴 수 있다.');
    if (날짜표.length === 1) {
      console.log(`      (지금 있는 하루 — ${날짜표[0][0]} · 종목 ${Object.keys(날짜표[0][1]).length}개)`);
    }
  } else {
    let 합 = 0;
    for (let i = 1; i < 날짜표.length; i += 1) {
      const v = 한쪽회전율(날짜표[i - 1][1], 날짜표[i][1]);
      합 += v;
      console.log(`   ${날짜표[i - 1][0]} → ${날짜표[i][0]}  한쪽 회전율 ${(v * 100).toFixed(1)}%`);
    }
    const 평균 = 합 / (날짜표.length - 1);
    console.log(`   평균 한쪽 회전율 ${(평균 * 100).toFixed(1)}% · 교체 ${날짜표.length - 1}회`);
    console.log('   ⚠ 연 회전율로 바꾸려면 한 해 교체 횟수를 곱한다 — 교체 주기를 정한 뒤에 적는다.');
  }

  /* ② 신호 교체율 — 겉잡이 */
  const 신호표 = 신호날짜별종목();
  console.log('\n② 신호 교체율 (겉잡이 — 신호는 입력이지 포트폴리오가 아니다)');
  if (신호표.size < 2) {
    console.log('   🔴 못 쟀다 — 신호 파일이 두 날 이상 있어야 한다.');
  } else {
    const 날들 = [...신호표.keys()];
    let 합 = 0; let 셈 = 0;
    const 보기 = [];
    for (let i = 1; i < 날들.length; i += 1) {
      const v = 교체율(신호표.get(날들[i - 1]), 신호표.get(날들[i]));
      합 += v; 셈 += 1;
      if (i >= 날들.length - 5) 보기.push(`${날들[i - 1]}→${날들[i]} ${(v * 100).toFixed(0)}%`);
    }
    console.log(`   신호가 있는 날 ${날들.length}일 · ${날들[0]} ~ ${날들[날들.length - 1]}`);
    console.log(`   하루 사이 평균 교체율 ${((합 / 셈) * 100).toFixed(1)}%`);
    console.log('   마지막 다섯 — ' + 보기.join(' · '));
    const 평균 = 합 / 셈;
    console.log('');
    if (평균 > 0.5) {
      console.log('   🔴 하루에 절반 넘게 갈린다 — 그대로는 퇴직연금에 못 쓴다.');
      console.log('      ⇒ 퇴직연금용으로 «느린 신호»를 따로 만들어야 한다(월 단위 교체 등).');
    } else if (평균 > 0.2) {
      console.log('   ⚠ 하루에 다섯 중 하나꼴로 갈린다 — 그대로 쓰기에는 빠르다.');
    } else {
      console.log('   ✅ 하루 사이 거의 안 갈린다 — 퇴직연금 속도에 가깝다.');
    }
  }

  /* ③ 달 단위로 묶으면 얼마나 갈리나 — 퇴직연금용 「느린 신호」가 될 수 있나 */
  console.log('\n③ 달 단위로 묶으면 (퇴직연금용 느린 신호가 될 수 있나)');
  {
    const 달표 = new Map();
    for (const [날, 종목들] of 신호표) {
      const 달 = 날.slice(0, 6);
      if (!달표.has(달)) 달표.set(달, new Set());
      for (const x of 종목들) 달표.get(달).add(x);
    }
    const 달들 = [...달표.keys()].sort();
    if (달들.length < 2) {
      console.log('   🔴 못 쟀다 — 달이 둘 이상 있어야 사이를 잴 수 있다.');
    } else {
      let 합 = 0;
      for (let i = 1; i < 달들.length; i += 1) {
        const v = 교체율([...달표.get(달들[i - 1])], [...달표.get(달들[i])]);
        합 += v;
        console.log(`   ${달들[i - 1]} → ${달들[i]}  교체율 ${(v * 100).toFixed(1)}%`
          + `  (종목 ${달표.get(달들[i - 1]).size} → ${달표.get(달들[i]).size})`);
      }
      const 평균 = 합 / (달들.length - 1);
      console.log(`   달 사이 평균 교체율 ${((평균 * 100)).toFixed(1)}%`);
      console.log('   ⚠ 이것은 «신호가 한 번이라도 뜬 종목»을 달마다 모은 것이다 —');
      console.log('     실제 포트폴리오가 아니다. 고를 규칙을 정하면 더 줄어든다.');
    }
  }

  console.log('\n⚠ 이 자는 «기록에 남은 것»만 잰다. 기록이 없으면 못 잰 것이지 0 이 아니다.');
}
