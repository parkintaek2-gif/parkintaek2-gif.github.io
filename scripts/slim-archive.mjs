/**
 * 아카이브를 «뜻은 안 잃고» 줄인다.
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-04] 사장님 지시 — 「**사진이 너무 저장공간을 차지하지 않게 해**」
 *
 * ⭐ 먼저 밝힐 것 — **우리는 이미지 파일을 «하나도» 안 받는다.** 주소만 담는다.
 *   그런데도 자리를 먹는 곳이 있었다. 재 보니 —
 *
 *     박스오피스 190,956행 · 78MB
 *       원문(KOBIS 주소)  20.6MB (55%)  ← 같은 앞머리가 19만 번 되풀이된다
 *       설명              7.8MB (21%)  ← 매출액·관객수를 «이미 풀어 담았으니» 겹친다
 *
 * ✅ 그래서 둘을 줄인다.
 *   1. 되풀이되는 주소 앞머리를 «머리말에 한 번»만 두고, 항목에는 뒤쪽만 남긴다
 *   2. 이미 풀어 담은 «원본 문장»은 버린다
 *
 * ⛔ 뜻을 잃지 않는다 — 앞머리를 머리말에 남기므로 주소를 그대로 되살릴 수 있다.
 *   되살릴 수 없게 되는 줄임은 하지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';

/** 여러 주소에서 «가장 긴 공통 앞머리»를 찾는다. 되살릴 수 있어야 하므로 이것만 뗀다 */
export function 공통앞머리(주소들) {
  const 것들 = 주소들.filter((s) => typeof s === 'string' && s.length);
  if (것들.length < 2) return '';
  let 앞 = 것들[0];
  for (const s of 것들) {
    let i = 0;
    while (i < 앞.length && i < s.length && 앞[i] === s[i]) i += 1;
    앞 = 앞.slice(0, i);
    if (!앞) return '';
  }
  return 앞;
}

/**
 * 한 아카이브 파일을 줄인다.
 * @param 자료 원본 객체 (항목 배열을 가진 것)
 * @param 옵 {주소칸, 버릴칸들}
 */
export function 줄이기(자료, { 주소칸 = '원문', 버릴칸들 = [] } = {}) {
  const 항목 = 자료.항목 || [];
  if (!항목.length) return { 자료, 줄인칸: [], 앞머리: '' };
  const 앞머리 = 공통앞머리(항목.map((x) => x[주소칸]));
  /* 앞머리가 너무 짧으면 떼도 이득이 없다 — 괜히 복잡하게만 만든다 */
  const 뗄까 = 앞머리.length >= 20;
  const 줄인칸 = [];
  const 새항목 = 항목.map((x) => {
    const y = { ...x };
    for (const k of 버릴칸들) if (k in y) { delete y[k]; if (!줄인칸.includes(k)) 줄인칸.push(k); }
    if (뗄까 && typeof y[주소칸] === 'string' && y[주소칸].startsWith(앞머리)) {
      y[주소칸] = y[주소칸].slice(앞머리.length);
    }
    return y;
  });
  const 새자료 = { ...자료, 항목: 새항목 };
  if (뗄까) {
    새자료.주소앞머리 = 앞머리;
    새자료.주소되살리는법 = `항목의 «${주소칸}» 앞에 주소앞머리를 붙이면 원래 주소다`;
    if (!줄인칸.includes(주소칸)) 줄인칸.push(`${주소칸}(앞머리 뗌)`);
  }
  if (버릴칸들.length) 새자료.버린칸 = { 칸: 버릴칸들, 까닭: '이미 풀어 담은 값과 겹쳐서 버렸다' };
  return { 자료: 새자료, 줄인칸, 앞머리: 뗄까 ? 앞머리 : '' };
}

/** 주소를 되살린다 — 되살릴 수 있어야 줄인 것이 맞다 */
export function 주소되살리기(자료, 항목, 주소칸 = '원문') {
  const 앞 = 자료.주소앞머리 || '';
  const v = 항목[주소칸];
  return typeof v === 'string' ? 앞 + v : v;
}

/* ── 자가시험 ─────────────────────────────────────────────────────────────── */
export function 재기() {
  const 참 = []; const 거 = [];
  const 봄 = (이름, 값) => (값 ? 참 : 거).push(이름);

  봄('공통 앞머리를 찾는다', 공통앞머리(['http://a.com/x?id=1', 'http://a.com/x?id=2']) === 'http://a.com/x?id=');
  봄('겹치는 것이 없으면 빈 문자열', 공통앞머리(['abc', 'xyz']) === '');
  봄('하나뿐이면 떼지 않는다', 공통앞머리(['http://a.com/x']) === '');
  봄('빈 목록이면 빈 문자열', 공통앞머리([]) === '');

  const 원 = { 항목: [
    { 제목: 'a', 원문: 'http://kobis.or.kr/kobis/business/mast/mvie/x?dtCd=2018964', 설명: '매출액 : 1 관객수 : 2', 매출액: 1, 관객수: 2 },
    { 제목: 'b', 원문: 'http://kobis.or.kr/kobis/business/mast/mvie/x?dtCd=2018489', 설명: '매출액 : 3 관객수 : 4', 매출액: 3, 관객수: 4 },
  ] };
  const { 자료: 줄, 줄인칸 } = 줄이기(원, { 버릴칸들: ['설명'] });
  봄('겹치는 칸을 버린다', !('설명' in 줄.항목[0]) && 줄인칸.includes('설명'));
  /* ⚠ 공통 앞머리는 «아이디 앞자리까지» 먹는다 — 2018964 와 2018489 의 공통은 …dtCd=2018 이다.
     내가 처음에 '2018964' 가 남을 줄 알았는데 자가시험이 잡았다.
     보기에는 덜 읽히지만 «되살아나면» 맞는 것이다 — 그것을 아래에서 본다. */
  봄('주소 앞머리를 뗀다 (뒤쪽만 남는다)', 줄.항목[0].원문 === '964' && 줄.항목[1].원문 === '489');
  봄('앞머리를 머리말에 남긴다', 줄.주소앞머리.endsWith('dtCd=2018'));
  봄('🔴 주소를 그대로 되살릴 수 있다',
    주소되살리기(줄, 줄.항목[0]) === 원.항목[0].원문 && 주소되살리기(줄, 줄.항목[1]) === 원.항목[1].원문);
  봄('버린 칸의 까닭을 적는다', !!줄.버린칸 && 줄.버린칸.칸.includes('설명'));
  봄('⛔ 풀어 담은 값은 그대로 있다', 줄.항목[0].매출액 === 1 && 줄.항목[1].관객수 === 4);

  const 짧 = 줄이기({ 항목: [{ 원문: 'a1' }, { 원문: 'a2' }] });
  봄('앞머리가 짧으면 안 뗀다 (괜히 복잡해진다)', 짧.자료.항목[0].원문 === 'a1' && !짧.자료.주소앞머리);
  봄('빈 항목이면 그대로 둔다', 줄이기({ 항목: [] }).줄인칸.length === 0);
  return { 참: 참.length, 거: 거.length, 틀린것: 거 };
}

const 나인가 = import.meta.url.endsWith(encodeURI(path.basename(String(process.argv[1] || 'x'))));
if (나인가) {
  const r = 재기();
  if (process.argv.includes('--재기')) {
    console.log(`자가시험 ${r.참}/${r.참 + r.거}`);
    if (r.거) { console.log('🔴 틀린 것:'); r.틀린것.forEach((x) => console.log('   · ' + x)); process.exit(1); }
    process.exit(0);
  }
  if (r.거) { console.log(`🔴 자가시험 ${r.거}가지 깨졌다 — 멈춘다`); process.exit(1); }
  console.log(`자가시험 ${r.참}/${r.참}\n`);

  /* 줄일 것 — 칸 이름이 자료마다 달라 여기 적어 둔다 */
  const 할것 = [
    { 길: 'archive/raw/kcisa-boxoffice/2026-09-04/boxoffice.json', 주소칸: '원문', 버릴칸들: ['설명', '갈래'] },
    { 길: 'archive/raw/kcisa-gongu/2026-09-04/photo.json', 주소칸: '그림', 버릴칸들: ['영상'] },
    { 길: 'archive/raw/kcisa-gongu/2026-09-04/expired.json', 주소칸: '주소', 버릴칸들: ['영상'] },
  ];
  const 해볼까 = !process.argv.includes('--쓴다');
  let 전 = 0; let 후 = 0;
  for (const h of 할것) {
    const p = path.join(process.cwd(), h.길);
    if (!fs.existsSync(p)) { console.log(`  ⬜ ${h.길} — 없다`); continue; }
    const 앞크기 = fs.statSync(p).size;
    const 자료 = JSON.parse(fs.readFileSync(p, 'utf8'));
    const { 자료: 줄, 줄인칸 } = 줄이기(자료, h);
    const 글 = JSON.stringify(줄, null, 1);
    /* ⛔ 줄이고 나서 «되살아나는지» 한 번 본다. 안 되면 안 쓴다 */
    const 다시 = JSON.parse(글);
    const 첫 = (자료.항목 || [])[0];
    if (첫 && 주소되살리기(다시, 다시.항목[0], h.주소칸) !== 첫[h.주소칸]) {
      console.log(`  🔴 ${h.길} — 주소를 못 되살린다. **안 쓴다**`);
      continue;
    }
    전 += 앞크기; 후 += Buffer.byteLength(글, 'utf8');
    console.log(`  ${해볼까 ? '⬜ 해보기' : '✅ 씀'} ${path.basename(h.길).padEnd(16)} `
      + `${(앞크기 / 1024 / 1024).toFixed(1)}MB → ${(Buffer.byteLength(글, 'utf8') / 1024 / 1024).toFixed(1)}MB`
      + ` (${Math.round((1 - Buffer.byteLength(글, 'utf8') / 앞크기) * 100)}% 줄음) · 줄인 칸 ${줄인칸.join(', ')}`);
    if (!해볼까) fs.writeFileSync(p, 글, 'utf8');
  }
  console.log(`\n합계 ${(전 / 1024 / 1024).toFixed(1)}MB → ${(후 / 1024 / 1024).toFixed(1)}MB`);
  if (해볼까) console.log('⭐ 해보기만 했다. 정말 줄이려면 --쓴다 를 붙인다');
  console.log('⛔ 이미지 «파일»은 애초에 받지 않는다 — 주소만 담는다. 자리를 먹던 것은 되풀이되는 주소였다');
}
