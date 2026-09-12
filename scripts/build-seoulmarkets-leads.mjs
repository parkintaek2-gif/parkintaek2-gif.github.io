/* 🔴 잠재 고객 명단을 «우리 데이터»에서 캔다 — 추측이 아니라 공시 사실이다.
 *
 * 생각의 뼈대:
 *   한국 주식을 5% 넘게 들고 있다고 «스스로 공시한» 외국 기관 = 한국 데이터가 필요한 곳.
 *   그들은 한국어를 못 읽는다. 우리는 영문으로 만든다. 이보다 정확한 잠재고객이 없다.
 *
 * ⛔ 이름을 지어내지 않는다. 공시에 적힌 보고자 이름만 쓴다.
 * ⚠ 개인(사람 이름)은 «세지만 명단에 올리지 않는다» — 우리 손님은 기관이다.
 *   그리고 실제 사람의 사적인 것을 공용 저장소에 적지 않는다(강령).
 */
import fs from 'node:fs';
const 길 = 'C:/Users/User/Documents/GitHub/dataeconomics/archive/raw/dart-ownership/ownership.ndjson';

const 기관꼴 = /(capital|asset|invest|fund|management|partners|holdings?|advisors?|securities|bank|insurance|trust|group|limited|ltd|llc|inc\.?|corp|company|co\.|s\.a\.|gmbh|plc|pte|sarl|n\.v\.|b\.v\.)/i;
const 센다 = new Map();
let 줄수 = 0, 보고수 = 0;

for (const 줄 of fs.readFileSync(길, 'utf8').split('\n')) {
  if (!줄.trim()) continue;
  줄수++;
  let o; try { o = JSON.parse(줄); } catch (e) { continue; }
  for (const b of (o.대량보유 || [])) {
    보고수++;
    const 이름 = String(b.보고자 || '').trim();
    if (!이름) continue;
    /* 라틴 문자가 절반 넘게 들어간 이름 = 외국 보고자로 본다 */
    const 라틴 = (이름.match(/[A-Za-z]/g) || []).length;
    if (라틴 < 4) continue;
    if (!기관꼴.test(이름)) continue;          /* 사람 이름은 뺀다 */
    const 것 = 센다.get(이름) || { 이름, 건수: 0, 종목: new Set() };
    것.건수++;
    것.종목.add(o.영문 || o.이름);
    센다.set(이름, 것);
  }
}

const 목록 = [...센다.values()]
  .map((x) => ({ 이름: x.이름, 건수: x.건수, 종목수: x.종목.size, 보기: [...x.종목].slice(0, 3) }))
  .sort((a, c) => c.종목수 - a.종목수 || c.건수 - a.건수);

console.log('■ 대량보유 공시 ' + 줄수 + '종목 · 보고 ' + 보고수 + '건');
console.log('■ 외국 «기관» 보고자 ' + 목록.length + '곳\n');
목록.slice(0, 40).forEach((x, i) => {
  console.log(String(i + 1).padStart(3) + '. ' + x.이름.slice(0, 52).padEnd(54)
    + '종목 ' + String(x.종목수).padStart(3) + ' · 보고 ' + String(x.건수).padStart(3)
    + '  [' + x.보기.map((s) => String(s).slice(0, 18)).join(', ') + ']');
});
fs.writeFileSync('C:/Users/User/Documents/GitHub/dataeconomics/src/data/seoulmarkets-leads.json',
  JSON.stringify(목록, null, 1));
console.log('\n전체를 leads.json 에 적었다 (' + 목록.length + '곳)');
