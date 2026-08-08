#!/usr/bin/env node
/**
 * **파는 단위(시·군·구)를 세어** 한 벌 목록을 낸다 — 백년지도(100yearmap) 몫.
 *
 *   node scripts/count-100y-areas.mjs           센다
 *   node scripts/count-100y-areas.mjs --selftest 자를 시험한다
 *
 * ## 🔴 왜 (2026-08-08 · 2번이 값을 정했다)
 *
 *   ```
 *   10곳 이상   한 벌 9,900원
 *   9곳 이하    무료로 연다
 *   시 지면     무료 목차
 *   ```
 *
 *   그러니 **가르는 자가 파는 단위를 정한다.** 05:2x 에 주소 둘째 낱말만 봤더니
 *   창원시 53곳·수원시 48곳이 한 덩어리가 됐다 — **한 장에 안 들어간다.**
 *   이제 「수원시 장안구」까지 본다(`src/lib/school-area.ts`).
 *
 * ⛔ 이 파일은 **세기만 한다.** 값도 지면도 여기서 안 만든다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { 지역가르기, 지역슬러그, 슬러그풀기, 한벌로팔만한가, 한벌최소 } from '../src/lib/school-area.ts';

const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 학교자료 = path.join(뿌리, 'src', 'data', '100yearmap', 'pages-school.json');
const 진로자료 = path.join(뿌리, 'src', 'data', '100yearmap', 'school-career.json');
const 낼곳 = path.join(뿌리, 'src', 'data', '100yearmap', 'areas.json');

function 셀프테스트() {
  const 검사 = [];
  const 확인 = (이름, 실제, 기대) => 검사.push({ 이름, 통과: JSON.stringify(실제) === JSON.stringify(기대) });
  const 이름만 = (주소) => 지역가르기(주소)?.이름 ?? null;

  확인('서울 구', 이름만('서울특별시 강동구 고덕로 227'), '강동구');
  확인('⭐ 큰 시 안의 구', 이름만('경기도 수원시 장안구 정조로 1'), '수원시 장안구');
  확인('⭐ 성남시 분당구', 이름만('경기도 성남시 분당구 판교로 1'), '성남시 분당구');
  확인('구 없는 시', 이름만('강원특별자치도 동해시 중앙로 1'), '동해시');
  확인('군', 이름만('경기도 가평군 가평읍 1'), '가평군');
  확인('⭐ 세종은 시 자체가 단위다 — 구가 없는 게 그 도시의 생김새다', 이름만('세종특별자치시 남세종로 441'), '세종특별자치시');
  확인('⭐ 도로 끝나면 여전히 못 가른다', 이름만('경기도 어딘가로 1'), null);
  확인('빈 주소', 이름만(''), null);
  확인('한 낱말뿐', 이름만('경기도'), null);
  확인('⭐ 시 뒤가 구가 아니면 시까지만', 이름만('경기도 수원시 정조로 1'), '수원시');

  확인('열쇠에 시도가 붙는다', 지역가르기('경기도 고양시 일산동구 1')?.열쇠, '경기도 고양시 일산동구');
  확인('시안의구 표시', 지역가르기('경기도 고양시 일산동구 1')?.시안의구, true);
  확인('구만 있으면 시안의구가 아니다', 지역가르기('서울특별시 강동구 1')?.시안의구, false);

  확인('슬러그', 지역슬러그(지역가르기('경기도 수원시 장안구 1')), '경기도-수원시-장안구');
  확인('슬러그 되돌리기', 슬러그풀기('경기도-수원시-장안구'), { 시도: '경기도', 이름: '수원시 장안구' });
  확인('⭐ 슬러그 왕복', 슬러그풀기(지역슬러그(지역가르기('서울특별시 강동구 1'))), { 시도: '서울특별시', 이름: '강동구' });

  확인('10곳이면 한 벌', 한벌로팔만한가(한벌최소), true);
  확인('9곳이면 아니다', 한벌로팔만한가(한벌최소 - 1), false);

  for (const c of 검사) console.log(`${c.통과 ? '✅' : '⛔'} ${c.이름}`);
  const 실패 = 검사.filter((c) => !c.통과).length;
  console.log(`\n검사 ${검사.length}개 · 실패 ${실패}개`);
  process.exit(실패 ? 1 : 0);
}

function 본일() {
  const 학교들 = JSON.parse(fs.readFileSync(학교자료, 'utf8'));
  const 진로 = JSON.parse(fs.readFileSync(진로자료, 'utf8'));
  const 진학있음 = new Set(진로.자료.filter((r) => r.진학률 != null).map((r) => r.code));

  const 묶음 = new Map();
  const 못가른곳 = [];
  for (const x of 학교들) {
    const g = 지역가르기(x.주소);
    if (!g) {
      못가른곳.push({ code: x.code, 이름: x.title, 주소: x.주소 ?? null });
      continue;
    }
    if (!묶음.has(g.열쇠)) 묶음.set(g.열쇠, { ...g, slug: 지역슬러그(g), 곳: 0, 진학잰곳: 0, 갈래: new Set() });
    const v = 묶음.get(g.열쇠);
    v.곳++;
    if (진학있음.has(x.code)) v.진학잰곳++;
    if (x.고교유형) v.갈래.add(String(x.고교유형).trim());
  }

  const 목록 = [...묶음.values()]
    .map((v) => ({
      열쇠: v.열쇠,
      시도: v.시도,
      이름: v.이름,
      slug: v.slug,
      시안의구: v.시안의구,
      곳: v.곳,
      진학잰곳: v.진학잰곳,
      갈래수: v.갈래.size,
      갈래: [...v.갈래].sort(),
      한벌로팔만한가: 한벌로팔만한가(v.곳),
    }))
    .sort((a, b) => b.곳 - a.곳);

  const 팔것 = 목록.filter((x) => x.한벌로팔만한가);
  const 열것 = 목록.filter((x) => !x.한벌로팔만한가);

  /* 🔴 큰 시를 가른 효과 — **가르기 전과 견준다.** 안 견주면 고친 값어치를 모른다 */
  const 시별 = new Map();
  for (const x of 목록) {
    const 시 = x.시안의구 ? x.이름.split(/\s+/)[0] : x.이름;
    const k = `${x.시도} ${시}`;
    시별.set(k, (시별.get(k) ?? 0) + x.곳);
  }
  const 갈린시 = [...new Set(목록.filter((x) => x.시안의구).map((x) => `${x.시도} ${x.이름.split(/\s+/)[0]}`))];
  const 가르기전최대 = Math.max(...시별.values());
  const 가른뒤최대 = Math.max(...목록.map((x) => x.곳));

  const 낼것 = {
    이름: '파는 단위 — 시·군·구별 고등학교 수',
    '⚠가르는법': '주소 첫 낱말이 시·도, 둘째가 구·군·시. 둘째가 「…시」이고 셋째가 「…구」면 「수원시 장안구」까지 본다. src/lib/school-area.ts 한 곳에서 한다',
    '⛔못가른것': '구·군이 없는 곳(세종 등)은 「기타」로 뭉치지 않고 따로 센다',
    한벌최소,
    전체: { 학교: 학교들.length, 단위: 목록.length, 한벌: 팔것.length, 무료: 열것.length, 못가른학교: 못가른곳.length },
    가른효과: { 갈린시: 갈린시.length, 갈린시목록: 갈린시, 가르기전최대: 가르기전최대, 가른뒤최대: 가른뒤최대 },
    못가른곳,
    단위: 목록,
  };
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2), 'utf8');

  console.log(`학교 ${학교들.length.toLocaleString()} · 단위 ${목록.length} · 한 벌(${한벌최소}곳 이상) ${팔것.length} · 무료 ${열것.length} · 못 가른 학교 ${못가른곳.length}`);
  console.log(`\n■ 큰 시를 가른 효과 — 갈린 시 ${갈린시.length}곳`);
  console.log(`  가르기 전 가장 큰 단위 ${가르기전최대}곳  →  가른 뒤 ${가른뒤최대}곳`);
  console.log('  ' + 갈린시.join(' · '));
  console.log('\n■ 큰 단위 열');
  for (const x of 목록.slice(0, 10)) console.log(`  ${String(x.곳).padStart(3)}곳  ${x.열쇠}  (진학 잰 곳 ${x.진학잰곳} · 갈래 ${x.갈래수})`);
  if (못가른곳.length) {
    console.log(`\n■ 못 가른 학교 ${못가른곳.length}곳`);
    for (const x of 못가른곳.slice(0, 8)) console.log(`  ${x.이름} — ${x.주소 ?? '(주소 없음)'}`);
  }
  console.log(`\n✅ ${path.relative(뿌리, 낼곳)}`);
}

if (process.argv.includes('--selftest')) 셀프테스트();
else 본일();
