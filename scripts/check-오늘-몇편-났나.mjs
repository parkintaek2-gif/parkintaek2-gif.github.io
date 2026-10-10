#!/usr/bin/env node
/**
 * check-오늘-몇편-났나.mjs — **새 글이 몇 편 났는지 «주소로» 센다**
 *
 * ── 🔴 왜 이 자가 필요한가 (2026-10-10 11:4x · 5번) ──────────────────────
 *
 * 09:3x 에 1번께 업무지시를 드리면서 이렇게 적었다 —
 *   「오늘 21시까지 사이트맵의 `lastmod` 에 2026-10-10 이 여섯 줄 이상 찍히면 끝난 것」
 * ⛔ **그 잣대가 못 쓸 것이었다.** 11:4x 에 실제로 재 보니 이렇게 나왔다.
 * ```
 *   kculturewire   「오늘 난 것」 2,348장
 *   100yearmap     「오늘 난 것」 4,910장     ← 사이트 전체다
 * ```
 *   배포를 하면 **사이트맵 전체의 lastmod 가 통째로 오늘로 다시 찍힌다.**
 *   그 수로는 새 글을 한 편도 셀 수 없다.
 *
 * ⭐ 「값이 이상하면 대상을 의심하기 전에 자를 의심해라」 — 이번엔 자도 아니고
 *   **내가 고른 잣대**가 틀렸다. 수가 사이트 전체와 같으면 그것은 셈이 아니다.
 *
 * ✅ 그래서 **주소 목록을 통째로 적어 두고 날마다 차집합을 낸다.**
 *   늘어난 주소가 곧 새 글이다. 배포가 lastmod 를 건드려도 주소는 안 는다.
 *
 * ⛔ 이 자가 «못» 하는 것 — 늘어난 주소가 **기사인지 태그 지면인지는 모른다.**
 *   그래서 늘어난 주소를 그대로 보여 준다. 사람이 보고 판단한다.
 *
 * 돌리기:  node scripts/check-오늘-몇편-났나.mjs            어제 적어 둔 것과 견준다
 *          node scripts/check-오늘-몇편-났나.mjs --적어둔다   지금 것을 기준선으로 적는다
 *          node scripts/check-오늘-몇편-났나.mjs --시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
/* ⚠ `archive/` 는 .gitignore 다 — **이 대장은 돌린 PC 에만 남는다.**
   다른 유닛이 이 자를 처음 돌리면 「견줄 대장이 없다」가 나오는 것이 맞다.
   ⛔ 그것을 「0 편」으로 읽지 않는다. 자도 그렇게 말하지 않는다.
   (주소를 통째로 적어 네 사이트 1MB 다. 커밋하면 날마다 저장소가 부푼다) */
const 대장방 = path.join(뿌리, 'archive', '지면대장');

export const 사이트 = [
  { 이름: 'kculturewire', 밑: 'https://www.kculturewire.com', 유닛: '1번/5번' },
  { 이름: '100yearmap', 밑: 'https://100yearmap.com', 유닛: '1번/3번' },
  { 이름: 'seoulmarkets', 밑: 'https://seoulmarkets.com', 유닛: '5번/2번' },
  { 이름: 'klifemap', 밑: 'https://klifemap.ai', 유닛: '1번/4번' },
];

/**
 * 사이트맵을 읽는다 — **색인(sitemapindex)이면 한 겹 더 들어간다.**
 * 🔴 처음 짠 자가 `.xml` 로 끝나는 `<loc>` 를 버려서 seoulmarkets 를
 *   「주소가 없다」로 냈다(2026-10-10 아침). 그 집은 색인을 쓴다.
 */
export async function 사이트맵읽기(주소, 깊이 = 0, 받기 = fetch) {
  if (깊이 > 2) return [];
  const r = await 받기(주소, { redirect: 'follow' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const s = await r.text();
  const locs = [...new Set([...String(s).matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1].trim()).filter((u) => /^https?:/.test(u)))];
  if (!/<sitemapindex/i.test(s)) return locs.filter((u) => !/\.xml($|\?)/.test(u));
  const 모음 = [];
  for (const 아래 of locs.slice(0, 20)) {
    try { 모음.push(...await 사이트맵읽기(아래, 깊이 + 1, 받기)); } catch { /* 못 읽은 겹은 건너뛴다 */ }
  }
  return [...new Set(모음)];
}

/** 어제 것과 오늘 것을 견준다 — 늘어난 것 · 사라진 것 */
export function 견주기(앞, 뒤) {
  const 앞벌 = new Set(앞 ?? []);
  const 뒤벌 = new Set(뒤 ?? []);
  return {
    는것: [...뒤벌].filter((u) => !앞벌.has(u)),
    준것: [...앞벌].filter((u) => !뒤벌.has(u)),
  };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
if (process.argv.includes('--시험')) {
  const 틀렸다 = [];
  const 본다 = (이름, 참) => { if (!참) 틀렸다.push(이름); };

  const r = 견주기(['/a', '/b'], ['/b', '/c']);
  본다('는 것을 센다', r.는것.length === 1 && r.는것[0] === '/c');
  본다('준 것을 센다', r.준것.length === 1 && r.준것[0] === '/a');
  본다('안 바뀌면 둘 다 0', 견주기(['/a'], ['/a']).는것.length === 0);
  본다('앞이 없으면(첫날) 전부 는 것이 아니라 «못 잰 것»으로 다룬다 — 아래 본문이 가른다',
    견주기(null, ['/a', '/b']).는것.length === 2);

  /* 🔴 핵심 — 배포로 lastmod 가 다 바뀌어도 **주소가 안 늘면 0 이어야 한다** */
  본다('⛔ lastmod 가 바뀌어도 주소가 같으면 0 편이다',
    견주기(['/x', '/y', '/z'], ['/z', '/y', '/x']).는것.length === 0);

  /* 사이트맵 색인을 따라가나 — 가짜 받기로 재 본다 */
  const 가짜 = async (u) => ({
    ok: true,
    text: async () => (u.endsWith('/sitemap.xml')
      ? '<sitemapindex><sitemap><loc>https://x/a.xml</loc></sitemap></sitemapindex>'
      : '<urlset><url><loc>https://x/글1</loc></url><url><loc>https://x/글2</loc></url></urlset>'),
  });
  const 따라간것 = await 사이트맵읽기('https://x/sitemap.xml', 0, 가짜);
  본다('색인이면 한 겹 더 들어간다', 따라간것.length === 2);
  본다('.xml 주소는 «글»로 안 센다', !따라간것.some((u) => /\.xml/.test(u)));

  console.log(틀렸다.length ? `🔴 자가시험 ${틀렸다.length}칸 틀림\n  - ${틀렸다.join('\n  - ')}`
    : '✅ 자가시험 7칸 다 지나감');
  process.exit(틀렸다.length ? 1 : 0);
}

/* ── 실제로 재기 ──────────────────────────────────────────────────────── */
const 적어둔다 = process.argv.includes('--적어둔다');
fs.mkdirSync(대장방, { recursive: true });

/* ⛔ toISOString() 금지 — 이 PC 가 이미 한국시간이다 */
const 이제 = new Date();
const 오늘 = `${이제.getFullYear()}-${String(이제.getMonth() + 1).padStart(2, '0')}`
  + `-${String(이제.getDate()).padStart(2, '0')}`;

console.log(`■ 새 글이 몇 편 났나 — ${오늘} ${String(이제.getHours()).padStart(2, '0')}:${String(이제.getMinutes()).padStart(2, '0')}\n`);

for (const s of 사이트) {
  let 지금 = null;
  try { 지금 = await 사이트맵읽기(`${s.밑.replace(/\/$/, '')}/sitemap.xml`); }
  catch (e) { console.log(`■ ${s.이름.padEnd(14)} ⚠ 사이트맵을 못 읽었다 — **못 쟀다** (${String(e.message).slice(0, 24)})`); continue; }
  if (!지금?.length) { console.log(`■ ${s.이름.padEnd(14)} ⚠ 주소가 한 줄도 없다 — **못 쟀다**`); continue; }

  /* 가장 가까운 지난 대장을 찾는다. ⛔ 없으면 「0 편」이 아니라 「못 잰다」다 */
  const 대장들 = fs.readdirSync(대장방)
    .filter((n) => n.startsWith(`${s.이름}-`) && n.endsWith('.json')).sort();
  const 지난것 = 대장들.filter((n) => n < `${s.이름}-${오늘}.json`).at(-1);

  if (!지난것) {
    console.log(`■ ${s.이름.padEnd(14)} 주소 ${지금.length.toLocaleString()}장`
      + ` · ⬜ **견줄 대장이 없다 — 오늘이 기준선이다**  (${s.유닛})`);
  } else {
    const 앞 = JSON.parse(fs.readFileSync(path.join(대장방, 지난것), 'utf8'));
    const { 는것, 준것 } = 견주기(앞.주소, 지금);
    const 잰날 = 지난것.replace(`${s.이름}-`, '').replace('.json', '');
    console.log(`■ ${s.이름.padEnd(14)} 주소 ${지금.length.toLocaleString()}장`
      + ` · ${잰날} 보다 **+${는것.length}** ${준것.length ? `· 사라짐 ${준것.length}` : ''}  (${s.유닛})`);
    는것.slice(0, 6).forEach((u) => console.log(`     + ${u.replace(s.밑, '')}`));
    if (는것.length > 6) console.log(`     … 그 밖 ${는것.length - 6}개`);
    준것.slice(0, 3).forEach((u) => console.log(`     🔴 사라짐 ${u.replace(s.밑, '')}`));
  }

  if (적어둔다) {
    fs.writeFileSync(path.join(대장방, `${s.이름}-${오늘}.json`),
      JSON.stringify({ 잰날: 오늘, 장수: 지금.length, 주소: 지금.sort() }, null, 0) + '\n', 'utf8');
  }
}

console.log('\n⛔ 사이트맵 `lastmod` 로 세지 마십시오 — **배포하면 전부 오늘로 다시 찍힙니다.**');
console.log('   2026-10-10 에 실제로 그래서 「오늘 4,910장이 났다」가 나왔습니다(사이트 전체 수).');
console.log('⚠ 이 자가 못 하는 것 — 늘어난 주소가 «기사»인지 «태그 지면»인지는 모릅니다.');
console.log('   그래서 주소를 그대로 보여 줍니다. 보고 판단하십시오.');
if (!적어둔다) console.log('\n⬜ 오늘 것을 대장에 안 적었습니다. 적으려면 `--적어둔다` 를 붙이십시오.');
