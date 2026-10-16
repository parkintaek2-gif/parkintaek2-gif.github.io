#!/usr/bin/env node
/**
 * 잰다-두지면이-같은말로-서로겨루나.mjs — 자기잠식(cannibalisation)을 찾는다.
 *
 * ── 🔴 왜 만드나 (2026-10-16) ──────────────────────────────────────────
 * 사장님 — 「대체 언제 방문자를 각 사이트마다 하루 1,000명 만들건데?」
 *
 * 재 보니 SeoulMarkets 는 1페이지에 306회 뜨는데 클릭이 3회였다. 까닭을 파니
 * 「korean companies」 다발 46회가 전부 70~90위인데, 그 말에 «우리 지면 둘»이
 * 같이 떠서 서로 겨루고 있었다 —
 *
 *   /article/korea-largest-listed-companies   80위   (표 0개 · 17,763자)
 *   /data/largest-companies                   80위   (표 8개 · 32,068자)
 *
 * 10/4 에 기사 제목을 「치는 말」에 맞춘 것이 되레 겹침을 만들었다. 66위 → 73위.
 *
 * ⭐ **고친 것이 다시 생기지 않게 재는 자리를 만든다.** 제목을 고칠 때마다
 *   「그 말을 이미 쥔 다른 지면이 있나」를 먼저 묻는다.
 *
 * 쓰는 법
 *   node scripts/잰다-두지면이-같은말로-서로겨루나.mjs
 *   node scripts/잰다-두지면이-같은말로-서로겨루나.mjs --자료=src/data/gsc-kcw-2026-10-13.json
 *   node scripts/잰다-두지면이-같은말로-서로겨루나.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');

/** 가장 최근 GSC 질의+지면 자료를 고른다 */
export function 최근자료고르기(이름들, 앞머리 = 'gsc-seoulmarkets-qp-') {
  const 걸린것 = (이름들 || []).filter((n) => n.startsWith(앞머리) && n.endsWith('.json'));
  return 걸린것.sort().pop() ?? null;
}

/** 행 묶음에서 «한 검색어에 두 지면 이상»인 것만 골라 낸다 */
export function 겨루는것찾기(행들, 최소노출 = 2) {
  const 말별 = new Map();
  for (const r of 행들 || []) {
    const q = String(r.key ?? '');
    const p = String(r.page ?? '');
    if (!q || !p) continue;
    if (!말별.has(q)) 말별.set(q, new Map());
    const 지면별 = 말별.get(q);
    const 앞 = 지면별.get(p) ?? { 지면: p, 노출: 0, 클릭: 0, 자리합: 0, 줄: 0 };
    앞.노출 += Number(r.impressions ?? 0);
    앞.클릭 += Number(r.clicks ?? 0);
    앞.자리합 += Number(r.position ?? 0);
    앞.줄 += 1;
    지면별.set(p, 앞);
  }

  const 결과 = [];
  for (const [q, 지면별] of 말별) {
    if (지면별.size < 2) continue;
    const 지면들 = [...지면별.values()].map((x) => ({
      지면: x.지면, 노출: x.노출, 클릭: x.클릭, 자리: x.줄 ? x.자리합 / x.줄 : 0,
    })).sort((a, b) => b.노출 - a.노출);
    const 노출합 = 지면들.reduce((s, x) => s + x.노출, 0);
    if (노출합 < 최소노출) continue;
    결과.push({ 말: q, 노출합, 지면수: 지면들.length, 지면들 });
  }
  return 결과.sort((a, b) => b.노출합 - a.노출합);
}

/** 겨루는 지면 «짝»으로 묶는다 — 고칠 자리는 말이 아니라 지면이다 */
export function 짝으로묶기(겨루는것) {
  const 짝 = new Map();
  for (const x of 겨루는것 || []) {
    const 이름들 = x.지면들.map((p) => p.지면).sort();
    for (let i = 0; i < 이름들.length; i += 1) {
      for (let j = i + 1; j < 이름들.length; j += 1) {
        const k = 이름들[i] + ' ⟷ ' + 이름들[j];
        const 앞 = 짝.get(k) ?? { 짝: k, 말수: 0, 노출합: 0, 보기: [] };
        앞.말수 += 1;
        앞.노출합 += x.노출합;
        if (앞.보기.length < 4) 앞.보기.push(x.말);
        짝.set(k, 앞);
      }
    }
  }
  return [...짝.values()].sort((a, b) => b.노출합 - a.노출합);
}

/* ── 자가시험 ────────────────────────────────────────────────────── */
const 곧바로부른것 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (곧바로부른것 && process.argv.includes('--자가시험')) {
  let 통과 = 0; let 깨짐 = 0;
  const 참 = (이름, 맞나) => { if (맞나) { 통과 += 1; } else { 깨짐 += 1; console.log('  ⛔ ' + 이름); } };

  const 보기 = [
    { key: 'korean companies', page: 'https://a.com/article/x', impressions: 5, clicks: 0, position: 80 },
    { key: 'korean companies', page: 'https://a.com/data/x', impressions: 8, clicks: 0, position: 80 },
    { key: '혼자만 뜨는 말', page: 'https://a.com/only', impressions: 9, clicks: 1, position: 4 },
    { key: 'top korean companies', page: 'https://a.com/article/x', impressions: 4, clicks: 0, position: 90 },
    { key: 'top korean companies', page: 'https://a.com/data/x', impressions: 1, clicks: 0, position: 85 },
  ];
  const 겨룸 = 겨루는것찾기(보기, 1);

  참('겨루는 말만 골라 낸다', 겨룸.length === 2);
  참('혼자 뜨는 말은 안 걸린다', !겨룸.some((x) => x.말 === '혼자만 뜨는 말'));
  참('노출 큰 말이 앞에 온다', 겨룸[0].말 === 'korean companies');
  참('지면 수를 센다', 겨룸[0].지면수 === 2);
  참('노출을 합친다', 겨룸[0].노출합 === 13);

  /* ⛔ 문턱 아래는 걸리지 않아야 한다 — 노출 1~2 짜리 잡음으로 날마다 울면 못 믿는다 */
  참('문턱 아래는 버린다', 겨루는것찾기(보기, 20).length === 0);

  const 짝들 = 짝으로묶기(겨룸);
  참('짝으로 묶는다', 짝들.length === 1);
  참('짝의 말 수를 센다', 짝들[0].말수 === 2);
  참('짝의 노출을 합친다', 짝들[0].노출합 === 18);

  /* 대조군 — 겹치는 지면이 하나도 없으면 빈 손이어야 한다 */
  const 대조군 = [
    { key: 'a', page: 'https://a.com/1', impressions: 50, clicks: 3, position: 2 },
    { key: 'b', page: 'https://a.com/2', impressions: 40, clicks: 2, position: 3 },
  ];
  참('대조군 — 안 겹치면 빈 손이다', 겨루는것찾기(대조군, 1).length === 0);

  참('빈 입력에도 안 터진다', 겨루는것찾기(null).length === 0 && 짝으로묶기(null).length === 0);
  참('자료 이름 고르기 — 가장 최근', 최근자료고르기(
    ['gsc-seoulmarkets-qp-2026-10-01.json', 'gsc-seoulmarkets-qp-2026-10-13.json', 'gsc-kcw-2026-10-13.json'],
  ) === 'gsc-seoulmarkets-qp-2026-10-13.json');
  참('없으면 null', 최근자료고르기(['다른것.json']) === null);

  console.log((깨짐 ? '⛔ ' + 깨짐 + '개 깨짐 · ' : '✅ ') + 통과 + '개 통과');
  process.exit(깨짐 ? 1 : 0);
}

/* ── 실제로 잰다 ──────────────────────────────────────────────────── */
if (곧바로부른것 && !process.argv.includes('--자가시험')) {
  const 인자 = (이름) => process.argv.find((a) => a.startsWith('--' + 이름 + '='))?.split('=').slice(1).join('=');
  const 자료폴더 = path.join(뿌리, 'src', 'data');
  let 길 = 인자('자료');
  if (!길) {
    const 이름 = 최근자료고르기(fs.readdirSync(자료폴더));
    if (!이름) { console.log('⬜ 못 쟀다 — gsc-seoulmarkets-qp-*.json 을 못 찾았다'); process.exit(0); }
    길 = path.join('src', 'data', 이름);
  }
  const 날것 = JSON.parse(fs.readFileSync(path.join(뿌리, 길), 'utf8'));
  const 행들 = Array.isArray(날것) ? 날것 : (날것.rows ?? 날것.data ?? Object.values(날것).find(Array.isArray) ?? []);

  console.log('■ 두 지면이 «같은 말»로 서로 겨루나 — ' + 길);
  console.log('  ⛔ 겹치면 구글이 어느 쪽이 답인지 못 정해 둘 다 자리를 못 올린다.');
  console.log('');

  const 겨룸 = 겨루는것찾기(행들, 2);
  const 전체노출 = 행들.reduce((s, r) => s + Number(r.impressions ?? 0), 0);
  const 겨루는노출 = 겨룸.reduce((s, x) => s + x.노출합, 0);

  if (!겨룸.length) {
    console.log('✅ 겨루는 말이 없다 — 지면끼리 안 겹친다');
    process.exit(0);
  }

  console.log('  겨루는 검색어 ' + 겨룸.length + '개 · 노출 ' + 겨루는노출
    + '회 (전체 ' + 전체노출 + '회의 ' + Math.round((겨루는노출 / (전체노출 || 1)) * 100) + '%)');
  console.log('');
  console.log('■ 고칠 «짝» — 말이 아니라 지면을 고친다');
  for (const p of 짝으로묶기(겨룸).slice(0, 10)) {
    console.log('  노출 ' + String(p.노출합).padStart(4) + ' · 말 ' + String(p.말수).padStart(3) + '개   '
      + p.짝.replace(/https:[/][/][^/]+/g, ''));
    console.log('        보기: ' + p.보기.join(' · '));
  }
  console.log('');
  console.log('■ 노출이 큰 말부터');
  for (const x of 겨룸.slice(0, 8)) {
    console.log('  ' + String(x.노출합).padStart(3) + '회  ' + x.말);
    for (const g of x.지면들) {
      console.log('        ' + String(Math.round(g.자리)).padStart(3) + '위 · 노출 '
        + String(g.노출).padStart(3) + ' · 클릭 ' + g.클릭 + '   ' + g.지면.replace(/https:[/][/][^/]+/, ''));
    }
  }
  console.log('');
  console.log('  ⬜ 고치는 길 — 한쪽에 그 말을 «몰아준다». 다른 쪽은 제목·리드·H2·tags 에서');
  console.log('     그 말을 빼고 자기만의 각도로 좁힌다. 지우거나 슬러그를 바꾸지 않는다.');
}
