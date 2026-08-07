/**
 * 기사 `one-flaw-twelve-corrections` 를 **정정 기록에 대고** 맞춘다.
 *
 * ⚠ 이 기사는 「우리가 틀렸던 것」을 다룬다. **그래서 여기가 틀리면 제일 나쁘다.**
 *   정정을 이야기하며 그 수를 틀리면 남은 신뢰까지 잃는다.
 *
 * ⛔ 수를 여기 손으로 안 적는다. `wikitip-page-corrections.json` 과
 *    각 기사 앞말에서 **읽어서** 기사와 맞춘다. 정정이 늘면 검사가 저절로 따라온다.
 * ⛔ 문장 검사는 한 줄로 편 본문에, 표는 원문 줄에 댄다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 기사길 = 'content/kculturewire/one-flaw-twelve-corrections.md';
const 원문 = fs.readFileSync(기사길, 'utf8');
const 한줄 = 원문.replace(/\s+/g, ' ');
const 지면정정 = JSON.parse(fs.readFileSync('src/data/wikitip-page-corrections.json', 'utf8')).rows;

/* 기사 앞말의 정정도 **세어서** 쓴다. /corrections 지면과 같은 셈이다. */
const CD = 'content/kculturewire';
let 기사정정 = 0;
for (const f of fs.readdirSync(CD).filter((x) => x.endsWith('.md'))) {
  const s = fs.readFileSync(path.join(CD, f), 'utf8');
  const b = s.match(/^corrections:\n((?:\s{2}- date:[\s\S]*?)(?=^\w|^---$))/m);
  if (b) 기사정정 += (b[1].match(/- date:/g) || []).length;
}

let 틀림 = 0;
const 본다 = (무엇, ok, 값) => { if (!ok) 틀림++; console.log(`${ok ? '  ' : '❌'} ${String(무엇).padEnd(32)} ${값}`); };

/* ── ① 건수 ── */
const 합 = 지면정정.length + 기사정정;
const 낱말 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
본다('전체 정정 건수', new RegExp(`we changed (${합}|${낱말[합] ?? 'x'}) published figures`, 'i').test(한줄), 합);
본다('지면 정정 건수', new RegExp(`(${지면정정.length}|${낱말[지면정정.length] ?? 'x'}) were on data pages`, 'i').test(한줄), 지면정정.length);
본다('기사 정정 건수', new RegExp(`(${기사정정}|${낱말[기사정정] ?? 'x'}) were inside\\s*articles`, 'i').test(한줄), 기사정정);
본다('제목의 지면·기사 수',
  new RegExp(`wrong figures on ${낱말[지면정정.length]} pages and ${낱말[기사정정]} articles`, 'i').test(한줄), `${지면정정.length} · ${기사정정}`);
본다('한 원인이라고 말하나', /\*\*All twelve came from one flaw\*\*|All \w+ came from one flaw/i.test(한줄), '문장');

/* ── ② 표 — 정정 기록의 **실제 값**과 줄째로 ── */
const 찾기 = (where) => 지면정정.find((r) => r.where === where);
for (const [where, 표기] of [['/watched', '/watched'], ['/titles and /reach', '/titles and /reach'],
  ['/tv-exports', '/tv-exports'], ['/industry', '/industry']]) {
  const r = 찾기(where);
  if (!r) { 본다(`표 ${표기}`, false, '정정 기록에 없다'); continue; }
  /* 기사는 값을 짧게 줄여 쓴다. **기록의 앞 조각이 기사 줄 안에 있어야** 한다. */
  const 줄 = 원문.split('\n').find((l) => l.startsWith(`| ${표기} |`));
  const 앞 = String(r.from).replace(/[.*+?^${}()|[\]\\]/g, '');
  const 뒤 = String(r.to).replace(/[.*+?^${}()|[\]\\]/g, '');
  const ok = !!줄 && 앞.slice(0, 8).split(' ').every((w) => 줄.includes(w))
    && 뒤.slice(0, 8).split(' ').every((w) => 줄.includes(w));
  본다(`표 ${표기}`, ok, `${String(r.from).slice(0, 22)} → ${String(r.to).slice(0, 22)}`);
}

/* ── ③ 미확인 몫은 지면 자료와 같아야 한다 ── */
const t = JSON.parse(fs.readFileSync('src/data/wikitip-titles.json', 'utf8'));
본다('미확인/전체', new RegExp(`${t.unlabelledTitles} of the ${t.titleCount} titles in the Southeast Asia`).test(한줄),
  `${t.unlabelledTitles}/${t.titleCount}`);
본다('204 를 다 안 읽었다고 말하나', new RegExp(`have not read all ${t.unlabelledTitles}`).test(한줄), t.unlabelledTitles);

/* ── ④ 규칙 파일이 실제로 있고, 손 목록에 기사가 댄 이름이 들어 있나 ── */
const 규칙길 = 'scripts/lib/korean-netflix-titles.mjs';
본다('규칙 파일이 있나', fs.existsSync(규칙길) && 한줄.includes(규칙길), 규칙길);
{
  const src = fs.readFileSync(규칙길, 'utf8');
  for (const n of ['Teach You a Lesson', 'Hunger', 'Forgotten Love', 'The Empress']) {
    본다(`손 목록에 ${n}`, src.includes(`'${n}'`) && 한줄.includes(`*${n}*`), '규칙 파일 · 기사 둘 다');
  }
  const 손수 = (src.match(/^\s*\['[^']+', '[^']*'\],$/gm) || []).length;
  본다('손으로 뺀 수', new RegExp(`(${손수}|${낱말[손수] ?? 'x'}) more came out by hand`, 'i').test(한줄), 손수);
}

/* ── ⑤ 오염 검사가 실제로 있나 — 기사가 「검사를 만들었다」고 말한다 ── */
본다('오염 검사가 있나', fs.existsSync('scripts/check-korean-title-rosters.mjs'), 'check-korean-title-rosters.mjs');
본다('한계 노출 검사가 있나', fs.existsSync('scripts/check-disclosed-limits.mjs'), 'check-disclosed-limits.mjs');

if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 기록이 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
console.log('\n✅ 전부 기사와 기록이 맞는다');
