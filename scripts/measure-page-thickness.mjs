/**
 * 갈래마다 «지면이 얼마나 두꺼운가»를 잰다.
 * ⛔ 바이트로 재지 않는다 — 틀·스타일이 같이 세어져 두께가 아니라 «틀 크기»가 나온다.
 * ⚠ 본문 글자 · 표 줄 · 그 지면에만 있는 «남과 다른 글자»를 따로 센다.
 *   같은 갈래 지면끼리 겹치는 문장은 틀이지 내용이 아니다.
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = 'dist/wikitip';
const 갈래들 = ['group', 'title', 'person', 'born-on', 'firm', 'market', 'star-sign'];

const 벗기기 = (h) => h
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<header[\s\S]*?<\/header>/gi, ' ')
  .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
  .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&[a-z]+;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const 문장들 = (t) => t.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter((s) => s.length > 30);

for (const 갈래 of 갈래들) {
  const 방 = path.join(뿌리, 갈래);
  if (!fs.existsSync(방)) { console.log(`${갈래.padEnd(11)} — 방이 없다(못 쟀다)`); continue; }
  const 파일 = fs.readdirSync(방).filter((f) => f.endsWith('.html'));
  if (!파일.length) { console.log(`${갈래.padEnd(11)} — 지면이 없다`); continue; }

  /* 문장이 몇 장에 나오는지 세어 «틀 문장»을 가려낸다 */
  const 문장몇장 = new Map();
  const 잰것 = [];
  for (const f of 파일) {
    const 글 = 벗기기(fs.readFileSync(path.join(방, f), 'utf8'));
    const ss = new Set(문장들(글));
    for (const s of ss) 문장몇장.set(s, (문장몇장.get(s) ?? 0) + 1);
    잰것.push({ f, 글, ss });
  }
  const 절반 = 파일.length / 2;
  let 글자합 = 0; let 저만의합 = 0; let 표줄합 = 0;
  for (const g of 잰것) {
    글자합 += g.글.length;
    저만의합 += [...g.ss].filter((s) => 문장몇장.get(s) < 절반).reduce((a, s) => a + s.length, 0);
    표줄합 += (fs.readFileSync(path.join(방, g.f), 'utf8').match(/<tr[\s>]/g) ?? []).length;
  }
  const n = 파일.length;
  console.log(
    `${갈래.padEnd(11)} ${String(n).padStart(4)}장 · 본문 ${String(Math.round(글자합 / n)).padStart(5)}자`
    + ` · 그 지면에만 있는 글 ${String(Math.round(저만의합 / n)).padStart(5)}자`
    + ` (${(저만의합 / 글자합 * 100).toFixed(0).padStart(3)}%)`
    + ` · 표 ${String(Math.round(표줄합 / n)).padStart(3)}줄`,
  );
}
