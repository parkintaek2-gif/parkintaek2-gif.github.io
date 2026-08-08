/**
 * 자 ① — **우리 질의가 우리 패널과 어긋나지 않는가.** (원인 `attribution-contradiction`)
 *
 * ── 무엇을 막나 ────────────────────────────────────────────────
 * 2026-08-08 새벽에 여덟 편을 뺐다. 까닭은 하나였다 —
 * **우리 위키데이터 질의가 「그 이름의 한국 작품은 없다」고 답했는데 그 편이 패널에 있었다.**
 * Waterworld(1995 미국) · Re/Member(일본) · Wildflower(필리핀) 같은 것들이다.
 *
 * 그때는 사람이 눈으로 찾았다. **다시 나면 사람이 아니라 이 검사가 잡는다.**
 *
 * ⛔ 판정이 `unknown` 인 것은 **어긋남이 아니다.** 위키데이터가 그 이름을 아예 모르는 것이라
 *    「한국 것이 아니다」가 아니다. 그건 세어서 밝히기만 한다.
 * ⚠ 이 자는 **두 파일을 맞대 본다.** 한쪽만 다시 세면 같은 잘못을 두 번 한다.
 */
import fs from 'node:fs';

const 패널길 = 'src/data/wikitip-titles.json';
const 판정길 = 'src/data/wikitip-title-ambiguity.json';

/** 위키데이터가 이 이름으로 **한국 작품을 대는가**. 판정이 unknown 이면 묻지 않는다. */
export function 어긋났나(판정) {
  if (!판정) return false;                       // 판정 자체가 없으면 다른 검사가 잡는다
  if (판정.verdict === 'unknown') return false;  // 모르는 것과 아니라는 것은 다르다
  /* 🔴 2026-08-09. **이름으로 못 찾는다고 없는 것이 아니다.**
     위키데이터는 한국 영화 `Land` 를 `LAND` 로, `Deliver Us from Evil` 을
     `Deliver Us From Evil` 로 적어 둔다. 이름표 대조는 대소문자를 가려서 한국 것만 빠지고
     철자가 딱 맞는 **외국 것만** 남는다 — 그러면 이 자가 「어긋났다」고 운다. 실은 안 어긋났다.
     ⛔ 그래서 이름이 아니라 **열쇠**를 본다. Q번호가 있으면 한국 작품이 확인된 것이다. */
  if (판정.q) return false;
  return !(판정.countries ?? []).includes('South Korea');
}

if (process.argv[1] && process.argv[1].endsWith('check-attribution-agrees.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('한국을 대면 어긋남 아님', !어긋났나({ verdict: 'koreaOnly', countries: ['South Korea'] }));
  자가('겹쳐도 한국이 있으면 아님', !어긋났나({ verdict: 'shared', countries: ['Japan', 'South Korea'] }));
  자가('한국이 없으면 어긋남', 어긋났나({ verdict: 'shared', countries: ['Philippines'] }));
  자가('unknown 은 넘긴다', !어긋났나({ verdict: 'unknown', countries: [] }));
  자가('열쇠가 있으면 이름표가 안 맞아도 아님',
    !어긋났나({ verdict: 'koreaOnly', countries: [], q: 'Q136691896' }));
  자가('열쇠가 없고 외국만 대면 어긋남',
    어긋났나({ verdict: 'koreaUnconfirmed', countries: ['Netherlands'], q: null }));
  자가('판정이 없으면 넘긴다', !어긋났나(null));
  console.log(`질의 어긋남 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const t = JSON.parse(fs.readFileSync(패널길, 'utf8'));
  const a = JSON.parse(fs.readFileSync(판정길, 'utf8'));
  const 판 = new Map(a.perTitle.map((p) => [p.title, p]));

  const 어긋남 = [];
  const 판정없음 = [];
  let 모름 = 0;
  for (const r of t.rows) {
    const p = 판.get(r.title);
    if (!p) { 판정없음.push(r.title); continue; }
    if (p.verdict === 'unknown') { 모름++; continue; }
    if (어긋났나(p)) 어긋남.push({ title: r.title, countries: p.countries ?? [] });
  }

  console.log(`패널 ${t.rows.length}편 · 판정 ${판.size}편 · 위키데이터가 모르는 이름 ${모름}편`);

  let 틀림 = 0;
  if (판정없음.length) {
    틀림++;
    console.log(`\n🔴 판정이 아예 없는 패널 제목 ${판정없음.length}편 — 두 파일이 어긋났다`);
    for (const s of 판정없음.slice(0, 5)) console.log(`   · ${s}`);
    console.log('   scripts/collect-korean-titles-keyed.mjs 를 다시 돌려 두 파일을 맞춘다');
  }
  if (어긋남.length) {
    틀림++;
    console.log(`\n🔴 패널에 있는데 **우리 질의가 한국을 안 대는 것** ${어긋남.length}편`);
    for (const x of 어긋남.slice(0, 8)) console.log(`   · ${x.title} — 위키데이터가 대는 나라: ${x.countries.join(', ') || '(없음)'}`);
    console.log('\n⛔ 이건 판단이 아니라 **모순**이다. 우리 자료가 우리 지면과 다른 말을 한다.');
    console.log('   빼든 판정을 고치든 하나로 맞춘다. 뺀 것은 /corrections 에 근거와 함께 남긴다.');
  }
  if (틀림) process.exit(1);
  console.log('✅ 패널과 질의가 서로 맞는다 — 한국을 안 대는 편이 패널에 0편');
}
