import fs from 'node:fs';
const p = 'C:/Users/USER/Documents/GitHub/dataeconomics/scripts/check-actor-titles-article.mjs';
const L = String.fromCharCode(10);
let s = fs.readFileSync(p, 'utf8');
const 헌 = [
"  본다('노윤서 문장', r ? new RegExp(`Roh Yoon-seo drew ${콤마(r.합)} views across four\\\\s+charting titles`).test(본문) : false,",
'    r ? `${콤마(r.합)} · ${r.작품수}편` : \'자료에 없다\');',
].join(L);
if (!s.includes(헌)) { console.log('🔴 자리 못 찾음'); process.exit(1); }
const 새 = [
"  /* 🔴 2026-08-23 — 여기 'four' 가 **박혀 있었다.** 자료가 세 편으로 바뀌자 기사를 맞게 고쳐도",
'     이 자가 계속 빨강을 냈다. ⛔ 검사가 자기 안에 값을 들고 있으면 자료를 따라오지 못한다.',
'     **편수 낱말도 자료에서 만든다.** 기사는 숫자가 아니라 낱말로 쓰므로 낱말로 견준다. */',
"  const 낱말 = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];",
'  const 편수말 = r ? (낱말[r.작품수] ?? String(r.작품수)) : null;',
"  본다('노윤서 문장',",
'    r ? new RegExp(`Roh Yoon-seo drew ${콤마(r.합)} views across ${편수말}\\\\s+charting titles`).test(본문) : false,',
'    r ? `${콤마(r.합)} · ${r.작품수}편(${편수말})` : \'자료에 없다\');',
].join(L);
s = s.replace(헌, 새);
fs.writeFileSync(p, s);
console.log('검사가 편수 낱말을 자료에서 만들게 고쳤다');
