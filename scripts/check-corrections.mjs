/**
 * 정정을 적어 놓고 목록에 안 넣는 것을 막는다. (npm test)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * `/corrections` 는 「우리가 틀렸던 것 전부」를 내는 지면이다. **전부가 아니면 값이 없다.**
 * 빠진 정정 목록은 안 하느니만 못하다 — 읽는 사람이 「이게 전부구나」로 읽기 때문이다.
 *
 * 기사 정정은 앞말에서 자동으로 온다. 빠질 수가 없다.
 * 지면 정정은 **손으로 적은 문단**이라 빠질 수 있다. 그것만 본다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * ① 지면에 「Corrected …」 문단이 있는데 wikitip-page-corrections.json 에 그 주소가 없으면 잡는다
 * ② 목록에 있는 주소의 지면이 실제로 있는지 본다
 * ③ 목록의 날짜가 앞뒤가 맞는지 본다
 *
 * ⛔ 정정 내용이 맞는지는 안 본다. 그건 사람이 할 일이다. 여기서 하는 말은 **빠졌나**뿐이다.
 *
 * 남의 지면이 걸리면 고치지 말고 그 자리에 알린다.
 */
import fs from 'node:fs';
import path from 'node:path';

const PAGE_DIR = 'src/pages/wikitip';
const LIST = 'src/data/wikitip-page-corrections.json';

const 문제 = [];
const 목록 = JSON.parse(fs.readFileSync(LIST, 'utf8')).rows;

/* 지면 파일 이름 → 주소. index 는 첫 화면이라 「/」다. */
const 주소 = (f) => (f === 'index.astro' ? '/' : `/${f.replace(/\.astro$/, '')}`);
const 적힌주소 = new Set(목록.map((r) => r.path));

/* ── ① 지면에 정정 문단이 있는데 목록에 없나 ── */
const 정정문단 = /\b(Corrected|corrected)\s+\d{4}-\d{2}-\d{2}/;
for (const f of fs.readdirSync(PAGE_DIR).filter((x) => x.endsWith('.astro'))) {
  const src = fs.readFileSync(path.join(PAGE_DIR, f), 'utf8');
  /* 주석 안의 「정정」 이야기는 지면에 안 나간다. 본문만 본다. */
  const 본문 = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  if (!정정문단.test(본문)) continue;
  if (!적힌주소.has(주소(f))) {
    문제.push(`${f} — 지면에 정정 문단이 있는데 ${LIST} 에 '${주소(f)}' 가 없다`);
  }
}

/* ── ② 목록의 주소에 지면이 실제로 있나 ── */
for (const r of 목록) {
  const 후보 = r.path === '/' ? 'index.astro' : `${r.path.replace(/^\//, '')}.astro`;
  /* 「/titles and /reach」처럼 한 줄이 두 지면을 가리키는 것이 있다. 대표 주소만 본다. */
  if (!fs.existsSync(path.join(PAGE_DIR, 후보))) {
    문제.push(`${LIST} — '${r.path}' 에 해당하는 지면이 없다 (${후보})`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) 문제.push(`${LIST} — '${r.where}' 날짜가 이상하다: ${r.date}`);
  for (const k of ['where', 'what', 'from', 'to', 'why']) {
    if (!r[k] || !String(r[k]).trim()) 문제.push(`${LIST} — '${r.path}' 의 '${k}' 가 비었다`);
  }
}

/* ── 자가시험 ── 안 잡는 검사는 통과를 못 믿는다. */
if (process.argv.includes('--selftest')) {
  const 시험 = [
    ['본문의 Corrected 는 잡는다', '<p>Corrected 2026-08-07. …</p>', true],
    ['주석 안의 정정은 안 잡는다', '/* 2026-08-07 정정: … */', false],
    ['날짜 없는 corrected 는 안 잡는다', '<p>corrected figures</p>', false],
    ['HTML 주석 안도 안 잡는다', '<!-- Corrected 2026-08-07 -->', false],
    ['소문자도 잡는다', '<p>corrected 2026-08-07</p>', true],
  ];
  let 통과 = 0;
  for (const [이름, src, 걸려야하나] of 시험) {
    const 본문 = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
    if (정정문단.test(본문) === 걸려야하나) 통과++;
    else console.log(`  ❌ 자가시험 실패: ${이름}`);
  }
  console.log(`정정 목록 검사 — 자가시험 ${시험.length}건 중 ${통과}건 통과`);
  if (통과 !== 시험.length) process.exit(1);
}

console.log(`정정 목록 검사 — 지면 정정 ${목록.length}건`);
if (문제.length) {
  console.log(`❌ ${문제.length}건`);
  문제.forEach((m) => console.log(`   ${m}`));
  console.log('   정정을 지면에만 적고 목록에 안 넣으면 /corrections 가 전부가 아니게 된다.');
  process.exit(1);
}
console.log('✅ 지면에 적힌 정정이 전부 목록에 있다');
