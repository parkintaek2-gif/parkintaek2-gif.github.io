#!/usr/bin/env node
/**
 * list-kcw-title-candidates.mjs — **제목엔 이름이 없고, 본문엔 큰 이름이 있는 편.** (고를 자료)
 *
 * 🔴 사장님 지시(8/20·8/21):
 *   「키워드 잘 선택해야지 · 스타이름·팀이름이 제목과 본문 앞에 · 제목은 사람들이 관심 가질만한 내용으로」
 *
 * ⛔ 이 자는 **고르지 않는다.** 본문에 실제로 있는 이름만 꺼내 놓는다.
 *   ⭐ 제목을 쓰는 것은 사람이고, **본문이 뒷받침하는지 읽고 나서** 쓴다.
 *   앞서 한 번 틀렸다 — 「Malaysia over-reads … **not BTS**」라고 썼는데 본문은
 *   말레이시아가 BTS 를 덜 읽는다고 말하지 않았다. 그래서 이 자는 이름만 준다.
 *
 * ⛔ 이름의 크기는 내 느낌이 아니라 **읽힌 수**(seaPerMillionTotal)로 줄 세운다.
 * ⛔ 주소(slug)는 못 바꾼다 — 이 자는 제목·dek 만 본다.
 *
 * 쓰는 법
 *   node scripts/list-kcw-title-candidates.mjs           후보를 줄 세워 낸다
 *   node scripts/list-kcw-title-candidates.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 명단읽기, 들었나, 자만들기 } from './check-kcw-star-names.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 기사방 = path.join(뿌리, 'content', 'kculturewire');

/** 읽힌 수를 이름에 붙인다 — 없는 사람은 0 이 아니라 null 이다 */
export function 읽힌수() {
  const 표 = new Map();
  for (const f of ['sea-actors', 'sea-musicians', 'sea-athletes']) {
    const d = JSON.parse(fs.readFileSync(path.join(뿌리, 'archive', 'raw', 'wikipedia', `${f}.json`), 'utf8'));
    for (const x of d.people ?? []) {
      if (!x.name) continue;
      const v = typeof x.seaPerMillionTotal === 'number' ? x.seaPerMillionTotal : null;
      const 전 = 표.get(x.name);
      if (전 == null || (v != null && (전 == null || v > 전))) 표.set(x.name, v);
    }
  }
  return 표;
}

/** 앞말과 본문을 가른다 — 제목은 앞말에, 이름은 본문에 있어야 후보다 */
export function 가르기(글) {
  const m = 글.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const t = m[1].match(/^title:\s*"?(.*?)"?\s*$/m);
  return { 앞말: m[1], 제목: t ? t[1] : null, 본문: m[2] };
}

/** ⛔ 링크·표 안에만 있는 이름도 본문이다 — 지우지 않는다. 앞자리는 따로 센다 */
export function 이름찾기(본문, 자들, 크기) {
  const 찾 = 들었나(본문, 자들);
  return 찾.map((n) => ({
    name: n,
    perMillion: 크기.get(n) ?? null,
    /* 첫 등장 위치 — 앞에 나온 이름이 그 편의 주인공일 확률이 높다 */
    at: 본문.search(자만들기(n)),
    times: (본문.match(new RegExp(자만들기(n).source, 'g')) ?? []).length,
  })).sort((a, b) => (b.perMillion ?? -1) - (a.perMillion ?? -1));
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };
  const g = 가르기('---\ntitle: "A and B"\ndek: "x"\n---\nBTS and IU are read.\n');
  재본다('⭐ 제목을 앞말에서만 뽑는다', g.제목, 'A and B');
  재본다('⛔ 본문에 앞말이 안 섞인다', /dek:/.test(g.본문), false);
  재본다('⛔ 앞말이 없으면 null', 가르기('no frontmatter'), null);

  const 크 = new Map([['BTS', 380.76], ['IU', 200], ['Nobody', null]]);
  const 자 = [['BTS', 자만들기('BTS')], ['IU', 자만들기('IU')], ['Nobody', 자만들기('Nobody')]];
  const 찾 = 이름찾기('IU first, then BTS and BTS again.', 자, 크);
  재본다('⭐ 읽힌 수로 줄 세운다 — 앞에 쓰인 순서가 아니다', 찾.map((x) => x.name), ['BTS', 'IU']);
  재본다('⛔ 두 번 나온 것을 두 번으로 센다', 찾.find((x) => x.name === 'BTS').times, 2);
  재본다('⛔ 못 잰 사람은 0 이 아니라 null', 크.get('Nobody'), null);

  const 크기 = 읽힌수();
  재본다('⭐ 읽힌 수 표에 BTS 가 있다', 크기.get('BTS'), (v) => typeof v === 'number' && v > 300);
  재본다('⭐ 기사방이 있다', fs.existsSync(기사방), true);

  console.log(`제목 후보 고르는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 자들 = 명단읽기();
  const 크기 = 읽힌수();
  const 후보 = [];
  let 이름있는제목 = 0;
  for (const f of fs.readdirSync(기사방).filter((x) => x.endsWith('.md'))) {
    const g = 가르기(fs.readFileSync(path.join(기사방, f), 'utf8'));
    if (!g || !g.제목) continue;
    if (들었나(g.제목, 자들).length) { 이름있는제목 += 1; continue; }
    const 이름 = 이름찾기(g.본문, 자들, 크기);
    if (!이름.length) continue;
    후보.push({ 파일: f, 제목: g.제목, 이름 });
  }
  후보.sort((a, b) => (b.이름[0].perMillion ?? -1) - (a.이름[0].perMillion ?? -1));

  console.log(`제목엔 이름이 없고 본문엔 이름이 있는 기사 — ${후보.length}편`);
  console.log(`(제목에 이미 이름이 든 기사 ${이름있는제목}편은 뺐다)\n`);
  for (const c of 후보) {
    console.log(`■ ${c.파일}`);
    console.log(`   지금 제목: ${c.제목}`);
    console.log(`   본문의 이름: ${c.이름.slice(0, 6).map((x) => `${x.name}(${x.perMillion ?? '못쟀다'}·${x.times}번)`).join(' · ')}`);
  }
  console.log('\n⛔ 이 자는 고르지 않는다. **본문을 읽고** 뒷받침되는 이름만 제목에 올린다.');
}
