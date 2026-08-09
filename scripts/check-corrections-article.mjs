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

/* ── ① 건수 ──
   ⛔ 2026-08-08. 여기서 **전체 기록**과 기사를 맞추고 있었다. 기사는 「7일 아침에」를 말하는데
      기록에는 6일 것도 8일 것도 들어온다. 그래서 8일에 새 정정을 하나 넣자 이 검사가 울었고,
      울린 원인을 보니 **기사 쪽이 처음부터 틀려 있었다** — 12건이라 적었지만 그날 것은 11건이고,
      「전부 한 결함 탓」이라 적었지만 그중 셋은 딴 원인이었다(기사 본문이 스스로 그렇게 적어 뒀다).
   ⭐ 자를 날짜로 자르고, **원인표**를 함께 잰다. 세는 것과 까닭이 같이 있어야 이 문장이 산다. */
const 그날 = '2026-08-07';
const 원인표 = JSON.parse(fs.readFileSync('src/data/wikitip-page-corrections.json', 'utf8'));
const 그날지면 = 지면정정.filter((r) => r.date === 그날);
const 그날기사 = (원인표.articleCauses ?? []).filter((a) => a.date === 그날);
const 합 = 그날지면.length + 그날기사.length;
const 결함탓 = [...그날지면, ...그날기사].filter((r) => r.cause === 'title-text').length;
const 낱말 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen'];
본다('그날 정정 건수', new RegExp(`we changed (${합}|${낱말[합] ?? 'x'}) published figures`, 'i').test(한줄), 합);
본다('지면 정정 건수', new RegExp(`(${그날지면.length}|${낱말[그날지면.length] ?? 'x'}) were on data pages`, 'i').test(한줄), 그날지면.length);
본다('기사 정정 건수', new RegExp(`(${그날기사.length}|${낱말[그날기사.length] ?? 'x'}) were inside\\s*articles`, 'i').test(한줄), 그날기사.length);
본다('제목의 지면·기사 수',
  new RegExp(`wrong figures on ${낱말[그날지면.length]} pages and ${낱말[그날기사.length]} articles`, 'i').test(한줄), `${그날지면.length} · ${그날기사.length}`);
본다('한 결함 탓 건수',
  new RegExp(`(${결함탓}|${낱말[결함탓] ?? 'x'}) of the (${합}|${낱말[합] ?? 'x'}) came from one flaw`, 'i').test(한줄),
  `${결함탓}/${합}`);
본다('나머지를 딴 원인이라 말하나',
  new RegExp(`other (${합 - 결함탓}|${낱말[합 - 결함탓] ?? 'x'}) were separate`, 'i').test(한줄), 합 - 결함탓);

/* ①-b 원인표가 앞말과 어긋나지 않나 — 원인은 여기(내 자료)에 두고 정정은 앞말에 있다.
   두 곳이 갈라지면 위 셈이 조용히 틀린다. 슬러그·날짜로 맞춰 본다. */
{
  const 앞말것 = [];
  for (const f of fs.readdirSync(CD).filter((x) => x.endsWith('.md'))) {
    /*
     * 🔴 2026-08-09 09:3x — **줄 끝을 안 눌러 놓고 읽고 있었다.**
     *   저장소에 CRLF 파일과 LF 파일이 섞여 있다(git 이 체크아웃에서 바꾼다).
     *   오늘 손댄 기사 둘이 CRLF 가 되자 `^---$` 가 `---\r` 에 안 걸려
     *   **정정 앞말이 통째로 안 보였다.** 기사는 맞게 적혀 있었는데 자가 못 읽은 것이다.
     * ⚠ `check-table-promises` 가 8/8 에 같은 병을 겪고 적어 뒀다. 두 번째다.
     */
    const s = fs.readFileSync(path.join(CD, f), 'utf8').replace(/\r\n/g, '\n');
    const b = s.match(/^corrections:\n((?:\s{2}- date:[\s\S]*?)(?=^\w|^---$))/m);
    if (!b) continue;
    for (const d of b[1].match(/- date:\s*(\S+)/g) || []) {
      앞말것.push(`${f.replace(/\.md$/, '')}·${d.replace(/- date:\s*/, '')}`);
    }
  }
  const 표것 = (원인표.articleCauses ?? []).map((a) => `${a.slug}·${a.date}`);
  const 표에없음 = 앞말것.filter((x) => !표것.includes(x));
  const 앞말에없음 = 표것.filter((x) => !앞말것.includes(x));
  본다('원인표가 앞말과 맞나', 표에없음.length === 0 && 앞말에없음.length === 0,
    표에없음.length || 앞말에없음.length ? `표에 없음 [${표에없음}] · 앞말에 없음 [${앞말에없음}]` : `${표것.length}건`);
  본다('원인이 다 적혀 있나',
    [...지면정정, ...(원인표.articleCauses ?? [])].every((r) => r.cause && 원인표.causes?.[r.cause]),
    Object.keys(원인표.causes ?? {}).length + '가지');
}

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
  /* ⛔ 2026-08-08. 규칙 파일 전체에서 줄을 세고 있었다. 그날 목록이 둘로 갈렸다 —
     **읽어서 뺀 것(BY_HAND)**과 **판정 질의가 답해서 뺀 것(BY_ATTRIBUTION)**.
     전체를 세면 「손으로 아홉 편을 읽었다」가 읽지도 않고 열일곱이 된다. **읽은 것만 센다.** */
  const 손목록 = src.match(/export const BY_HAND = new Map\(\[([\s\S]*?)\n\]\);/);
  const 손수 = 손목록 ? (손목록[1].match(/^\s*\['[^']+', '[^']*'\],$/gm) || []).length : 0;
  본다('손으로 뺀 수', new RegExp(`(${손수}|${낱말[손수] ?? 'x'}) more came out by hand`, 'i').test(한줄), 손수);
}

/* ── ⑤ 오염 검사가 실제로 있나 — 기사가 「검사를 만들었다」고 말한다 ── */
본다('오염 검사가 있나', fs.existsSync('scripts/check-korean-title-rosters.mjs'), 'check-korean-title-rosters.mjs');
본다('한계 노출 검사가 있나', fs.existsSync('scripts/check-disclosed-limits.mjs'), 'check-disclosed-limits.mjs');

if (틀림) { console.error(`\n❌ ${틀림}개가 기사와 기록이 어긋난다. 자를 먼저 의심한다.`); process.exit(1); }
console.log('\n✅ 전부 기사와 기록이 맞는다');
