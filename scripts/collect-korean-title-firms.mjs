#!/usr/bin/env node
/**
 * 한국 작품마다 **어느 회사 것인가**를 받아 둔다. (제작 P272 · 첫방송 P449 · 배급 P750)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-09 사장님 지시: 「케이컬쳐와이어에게 **b2b 판매**와 광고수익, 콘텐트 제공 수익까지 검토하라」.
 * 2번이 못박은 확인 기준 — **손님을 이름으로 셀 수 있게.** 「일반 독자」는 못 센다.
 * 우리가 파는 것은 「당신 작품이 93개 시장에서 어떻게 다녔나」다.
 * 그러면 손님은 **그 작품을 가진 회사**다. 그 회사가 누구인지 여기서 받는다.
 *
 * ── 🔴 처음에 손님을 절반만 셌다 ──────────────────────────────
 * 01:3x 에 제작사(P272)·방송사(P449)만 물어 **172곳**이라 적었다. 배급사(P750)를 안 물었다.
 * 그 칸이 **395편**에 붙어 있었다 — 우리 작품 901편 중 **539편이 영화**라 배급사가 붙는다.
 * ⛔ 「172곳」은 손님이 그만큼인 것이 아니라 **내가 그만큼만 물어본 것**이었다.
 * ⭐ 팀 규칙 그대로다 — **답이 작게 나오면 자를 먼저 의심한다.**
 *
 * ── ⛔ Netflix 는 손님이 아니다 ────────────────────────────────
 * 211편으로 제일 큰데 뺀다. **그 자료를 이미 가진 쪽**이다. 가진 사람에게 못 판다.
 *
 * ── ⚠ 같은 회사가 두 번 세어진다 ──────────────────────────────
 * `SBS TV` 와 `Seoul Broadcasting System` 은 같은 곳이다(채널 이름 · 법인 이름).
 * **이름만으로 확실한 것만** 합친다. 그룹 소유(CJ ENM 계열 따위)는 **짐작이라 안 합친다.**
 *
 * 결과 → archive/raw/netflix-top10/firm-works.json
 * 쓰는 법: node scripts/collect-korean-title-firms.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'KCultureWire/1.0 (parkintaek2@gmail.com) firm of Korean Netflix titles';
const ENDPOINT = 'https://query.wikidata.org/sparql';
const 열쇠파일 = 'archive/raw/netflix-top10/korean-titles-keyed.json';
const 낼곳 = 'archive/raw/netflix-top10/firm-works.json';
const BATCH = 150;

/** 우리가 파는 자료를 **이미 가진 쪽**. 손님이 아니다. */
export const 손님아님 = new Set(['Netflix']);

/**
 * 이름만으로 같은 곳이 확실한 것. ⛔ 그룹 소유는 여기 안 넣는다 — 그건 짐작이다.
 * (`CJ ENM Films & Television`·`tvN`·`Studio Dragon`·`TVING` 이 한 그룹인지는 확인 안 했다)
 */
export const 같은곳 = new Map([
  ['SBS TV', 'SBS'], ['Seoul Broadcasting System', 'SBS'],
  ['KBS 2TV', 'KBS'], ['Korean Broadcasting System', 'KBS'],
  ['MBC TV', 'MBC'], ['Munhwa Broadcasting Corporation', 'MBC'],
]);

/** 회사 이름을 하나로 모은다. 합칠 것이 없으면 그대로 둔다 */
export function 이름고르기(이름) {
  return 같은곳.get(이름) ?? 이름;
}

/** 이름표가 없어 Q번호가 그대로 온 것은 손님 명단에 못 올린다 */
export function 이름인가(s) {
  return typeof s === 'string' && s.length > 0 && !/^Q\d+$/.test(s);
}

/** 작품 수로 등급을 매긴다. ⛔ 순위가 아니라 **값을 매기는 칸**이다 */
export function 등급(편수) {
  if (편수 >= 10) return 'A';
  if (편수 >= 5) return 'B';
  return 'C';
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통과 = 0; let 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : JSON.stringify(실제) === JSON.stringify(바람);
    if (ok) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('SBS 두 이름을 합친다', [이름고르기('SBS TV'), 이름고르기('Seoul Broadcasting System')], ['SBS', 'SBS']);
  재본다('KBS 두 이름을 합친다', [이름고르기('KBS 2TV'), 이름고르기('Korean Broadcasting System')], ['KBS', 'KBS']);
  재본다('⛔ 그룹은 안 합친다', [이름고르기('tvN'), 이름고르기('Studio Dragon')], ['tvN', 'Studio Dragon']);
  재본다('모르는 이름은 그대로', 이름고르기('SHOWBOX Co., Ltd.'), 'SHOWBOX Co., Ltd.');
  재본다('Q번호는 이름이 아니다', [이름인가('Q123'), 이름인가('tvN'), 이름인가('')], [false, true, false]);
  재본다('등급 경계 — 10·9·5·4', [등급(10), 등급(9), 등급(5), 등급(4)], ['A', 'B', 'B', 'C']);
  재본다('Netflix 는 손님이 아니다', 손님아님.has('Netflix'), true);
  console.log(실패 ? `⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

if (내가실행됐다) {
  const 열쇠 = JSON.parse(fs.readFileSync(열쇠파일, 'utf8'));
  const 작품들 = Object.values(열쇠.작품);
  const 제목 = new Map(작품들.map((x) => [x.q, x.넷플릭스제목]));
  const qs = 작품들.map((x) => x.q);
  console.log(`열쇠를 든 작품 ${qs.length}편에 회사를 묻는다 (P272 제작 · P449 첫방송 · P750 배급)`);

  const 회사 = new Map();          // 고른이름 → Map(작품Q → Set(속성))
  const 원래이름 = new Map();       // 고른이름 → Set(위키데이터가 준 이름들)
  let 못물음 = 0;

  for (let i = 0; i < qs.length; i += BATCH) {
    const v = qs.slice(i, i + BATCH).map((q) => `wd:${q}`).join(' ');
    const query = `SELECT ?w ?p ?firmLabel WHERE {
      VALUES ?w { ${v} }
      VALUES ?p { wdt:P272 wdt:P449 wdt:P750 }
      ?w ?p ?firm .
      SERVICE wikibase:label { bd:serviceParam wikibase:language 'en'. }
    }`;
    let ok = false;
    for (let 시도 = 0; 시도 < 3 && !ok; 시도 += 1) {
      try {
        const r = await fetch(`${ENDPOINT}?format=json&query=${encodeURIComponent(query)}`, {
          headers: { 'User-Agent': UA, Accept: 'application/sparql-results+json' },
        });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const j = await r.json();
        for (const b of j.results.bindings) {
          const 준이름 = b.firmLabel.value;
          if (!이름인가(준이름)) continue;
          if (손님아님.has(준이름)) continue;
          const 이름 = 이름고르기(준이름);
          const w = b.w.value.split('/').pop();
          const p = b.p.value.split('/').pop();
          if (!회사.has(이름)) { 회사.set(이름, new Map()); 원래이름.set(이름, new Set()); }
          원래이름.get(이름).add(준이름);
          const m = 회사.get(이름);
          if (!m.has(w)) m.set(w, new Set());
          m.get(w).add(p);
        }
        ok = true;
      } catch (e) {
        if (시도 === 2) { 못물음 += 1; console.log(`  ⛔ 못 물었다 — ${e.message}`); }
      }
    }
    process.stdout.write(ok ? '.' : 'x');
  }
  console.log();

  const 속성이름 = { P272: '제작', P449: '첫방송', P750: '배급' };
  const 줄 = [...회사].map(([이름, m]) => ({
    firm: 이름,
    labels: [...원래이름.get(이름)].sort(),
    grade: 등급(m.size),
    works: [...m].map(([q, ps]) => ({
      q, title: 제목.get(q) ?? null, roles: [...ps].map((p) => 속성이름[p] ?? p).sort(),
    })).sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '')),
  })).sort((a, b) => b.works.length - a.works.length || a.firm.localeCompare(b.firm));

  const 붙은작품 = new Set(줄.flatMap((x) => x.works.map((w) => w.q)));
  const out = {
    생성: new Date().toISOString(),
    출처: 'Wikidata P272 (production company) · P449 (original broadcaster) · P750 (distributor), '
      + 'over the Korean titles we hold Q-numbers for (korean-titles-keyed.json)',
    /** ⛔ 이 셋을 적어 두지 않으면 다음 사람이 「손님이 이만큼뿐」으로 읽는다 */
    물은작품: qs.length,
    회사붙은작품: 붙은작품.size,
    회사안붙은작품: qs.length - 붙은작품.size,
    뺀곳: [...손님아님],
    합친이름: [...같은곳].map(([a, b]) => `${a} → ${b}`),
    못물은묶음: 못물음,
    회사수: 줄.length,
    등급별: { A: 줄.filter((x) => x.grade === 'A').length, B: 줄.filter((x) => x.grade === 'B').length, C: 줄.filter((x) => x.grade === 'C').length },
    firms: 줄,
  };

  /* 산수를 스스로 본다. 틀리면 파일을 안 낸다 */
  const 합 = out.등급별.A + out.등급별.B + out.등급별.C;
  if (합 !== out.회사수) throw new Error(`등급 합 ${합} 이 회사수 ${out.회사수} 와 다르다`);
  if (out.회사붙은작품 + out.회사안붙은작품 !== out.물은작품) throw new Error('붙은/안붙은 합이 물은 편수와 다르다');

  fs.writeFileSync(낼곳, JSON.stringify(out, null, 1));
  console.log(`회사 ${out.회사수}곳 — A ${out.등급별.A} · B ${out.등급별.B} · C ${out.등급별.C}`);
  console.log(`회사가 붙은 작품 ${out.회사붙은작품} / ${out.물은작품} · ⚠ 아직 안 붙은 것 ${out.회사안붙은작품}편`);
  console.log(`→ ${낼곳}`);
}
