#!/usr/bin/env node
/**
 * build-kcw-which-ranking.mjs — **「어느 순위가 진짜인가」 — 세 자로 잰 같은 작품들.**
 *
 * ── 🔴 왜 (2026-08-31 · 사장님 지시) ─────────────────────────
 * > 「**논쟁꺼리를 우리가 만든다.** 거기에 댓글을 붙일 수 있는 기능을 2번이 만들기 시작했다」
 * > 「사람들이 관심이 많은 모든 것에 대해 순위를 매겨...**그 순위가 의미가 있는 지 생각해보게 해**」
 *
 * ⭐ 논쟁이 되려면 **정말 어긋나야** 한다. 그래서 먼저 쟀다 —
 *   넷플릭스 시간 순위 상위 12편 가운데 **8편이 나라 수 순위와 세 자리 이상 어긋난다.**
 *   Extraordinary Attorney Woo 는 시간 2위인데 나라 수로는 49위다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────
 * ⛔ **우리가 사람·작품을 «평가»해 순위를 새로 만들지 않는다.** 세 순위 다 «센 것»이다 —
 *   ① 넷플릭스가 «직접 공개»한 시청시간 ② 우리가 센 나라 수 ③ 우리가 센 주 수.
 * ⛔ 「이게 진짜 1위다」로 바꿔치기하지 않는다. 셋을 나란히 놓고 손님이 정한다.
 *   우리는 바늘을 안 세운다 — 지형만 그린다.
 * ⛔ 우리 표에 없는 작품을 「0」으로 세우지 않는다. 「우리가 못 잰 것」으로 «따로» 적는다.
 * ⚠ 시청시간은 **세계 합계**이고 나라 수·주 수는 **나라별 톱10**이다. 잰 자리가 다르다 —
 *   그 사실을 자료에 담아 지면이 반드시 말하게 한다.
 *
 * 쓰는 법
 *   node scripts/build-kcw-which-ranking.mjs --자가시험
 *   node scripts/build-kcw-which-ranking.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 낼곳 = 'src/data/kcw-which-ranking.json';

/** 몇 편을 표에 놓을까 — ⛔ 여기 한 곳에만 적는다 */
export const 볼편수 = 15;

/** 자리(1부터). ⛔ 없으면 null — 0 이 아니다 */
export function 자리찾기(줄들, 제목) {
  if (!Array.isArray(줄들)) return null;
  const i = 줄들.findIndex((x) => x?.title === 제목);
  return i < 0 ? null : i + 1;
}

/** 두 자리가 얼마나 어긋났나. ⛔ 한쪽이라도 못 재면 null */
export function 어긋남(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.abs(a - b);
}

/**
 * 어긋남을 사람 말로. ⛔ 「진짜 순위」라고 말하지 않는다 — 무엇으로 쟀는지만 말한다.
 */
export function 어긋남말(시간자리, 나라자리) {
  const d = 어긋남(시간자리, 나라자리);
  if (d === null) return '한쪽을 못 쟀다';
  if (d === 0) return '같은 자리';
  return `${d}자리 차이`;
}

/** 큰 수를 사람이 읽는 말로. ⛔ 어림을 «정확한 값처럼» 쓰지 않는다 */
export function 시간말(시간) {
  if (!Number.isFinite(시간) || 시간 <= 0) return null;
  const 억 = 시간 / 1e9;
  return 억 >= 1 ? `${억.toFixed(2)}bn hours` : `${Math.round(시간 / 1e6)}m hours`;
}

/* ── 자가시험 ───────────────────────────────────────────────── */
export function 자가시험() {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  const 줄 = [{ title: 'A' }, { title: 'B' }, { title: 'C' }];
  검('자리를 1부터 센다', 자리찾기(줄, 'A') === 1 && 자리찾기(줄, 'C') === 3);
  검('⛔ 없으면 null — 0 이 아니다', 자리찾기(줄, 'Z') === null);
  검('⛔ 배열이 아니면 null', 자리찾기(null, 'A') === null);

  검('어긋남을 센다', 어긋남(2, 49) === 47);
  검('차례가 바뀌어도 같다', 어긋남(49, 2) === 47);
  검('⛔ 한쪽을 못 재면 null', 어긋남(2, null) === null);
  검('같으면 0', 어긋남(3, 3) === 0);

  검('말로 바꾼다', 어긋남말(2, 49) === '47자리 차이');
  검('같은 자리는 그렇게 말한다', 어긋남말(3, 3) === '같은 자리');
  검('⛔ 못 잰 것을 「0자리」라 안 한다', 어긋남말(2, null) === '한쪽을 못 쟀다');

  검('억 단위를 읽는다', 시간말(5048300000) === '5.05bn hours');
  검('작은 것은 백만으로', 시간말(662090000) === '662m hours');
  검('⛔ 0 이나 못 잰 것은 null', 시간말(0) === null && 시간말(null) === null);

  검('볼 편수가 한 곳에 있다', 볼편수 === 15);

  return 실패;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--자가시험')) {
  const 실패 = 자가시험();
  if (실패.length) {
    console.error(`❌ 자가시험 실패 ${실패.length}\n${실패.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log('✅ 어느 순위가 진짜인가 — 자가시험 14 통과');
  process.exit(0);
}

if (내가실행됐다) {
  const 읽기 = (p) => JSON.parse(fs.readFileSync(path.join(뿌리, p), 'utf8'));
  const g = 읽기('src/data/wikitip-global.json');
  const 시간표 = Object.values(g).find(Array.isArray);
  const 작품 = 읽기('src/data/wikitip-title-pages.json').titles;
  if (!Array.isArray(시간표) || !시간표.length || !Array.isArray(작품)) {
    console.error('⛔ 원자료를 못 읽었다 — 빈 표를 내지 않는다');
    process.exit(1);
  }

  /* 같은 작품들을 «다른 자»로 세운다. ⛔ 새로 평가하지 않는다 — 이미 센 값을 줄 세울 뿐이다 */
  const 나라순 = [...작품].filter((x) => Number.isFinite(x.markets)).sort((a, b) => b.markets - a.markets);
  const 주순 = [...작품].filter((x) => Number.isFinite(x.weeks)).sort((a, b) => b.weeks - a.weeks);

  const 행 = [];
  const 못잰것 = [];
  for (let i = 0; i < Math.min(볼편수, 시간표.length); i += 1) {
    const t = 시간표[i];
    const x = 작품.find((y) => y.title === t.title);
    if (!x) { 못잰것.push(t.title); continue; }   /* ⛔ 0 으로 세우지 않는다 */
    행.push({
      제목: t.title, slug: x.slug, 종류: t.kind,
      시간자리: i + 1, 시간: t.hours, 시간말: 시간말(t.hours),
      나라자리: 자리찾기(나라순, t.title), 나라수: x.markets,
      주자리: 자리찾기(주순, t.title), 주수: x.weeks,
      어긋남: 어긋남(i + 1, 자리찾기(나라순, t.title)),
    });
  }

  const 크게어긋난것 = 행.filter((r) => Number.isFinite(r.어긋남) && r.어긋남 >= 3);
  const 낼것 = {
    잰날: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 16),
    무엇: '같은 한국 작품들을 세 가지 자로 줄 세운 것 — 넷플릭스가 공개한 시청시간 · 우리가 센 나라 수 · 우리가 센 주 수',
    '⛔ 안 하는 것': '우리가 작품을 평가해 순위를 «만들지» 않았다. 셋 다 «센» 것이다. 그리고 어느 하나를 「진짜」라고 말하지 않는다 — 셋을 나란히 놓고 보는 사람이 정한다',
    '⚠ 잰 자리가 다르다': '시청시간은 넷플릭스가 내는 «세계 합계»이고, 나라 수·주 수는 «나라별 톱10»에서 우리가 센 것이다. 같은 저울이 아니다 — 그래서 순서가 달라지는 것이 이상한 일이 아니다',
    원자료: { 시간: g.source, 주: `${g.weekFrom}~${g.weekTo}`, 세계톱10작품수: g.titleCount, 총시간: g.totalHours },
    본편수: 행.length,
    크게어긋난편수: 크게어긋난것.length,
    가장어긋난것: [...행].filter((r) => Number.isFinite(r.어긋남)).sort((a, b) => b.어긋남 - a.어긋남)[0] ?? null,
    나라수1위: { 제목: 나라순[0].title, slug: 나라순[0].slug, 나라수: 나라순[0].markets },
    주수1위: { 제목: 주순[0].title, slug: 주순[0].slug, 주수: 주순[0].weeks },
    행,
    '⬜ 우리 표에 없어 못 잰 작품': 못잰것,
  };
  fs.writeFileSync(path.join(뿌리, 낼곳), `${JSON.stringify(낼것, null, 1)}\n`);
  console.log(`■ 본 ${행.length}편 중 나라 수 순위와 «세 자리 이상» 어긋난 것 ${크게어긋난것.length}편`);
  if (낼것.가장어긋난것) {
    const m = 낼것.가장어긋난것;
    console.log(`  가장 크게 — ${m.제목}: 시간 ${m.시간자리}위 · 나라 수 ${m.나라자리}위 (${m.어긋남}자리)`);
  }
  console.log(`  나라 수 1위 ${낼것.나라수1위.제목}(${낼것.나라수1위.나라수}개국) · 주 수 1위 ${낼것.주수1위.제목}(${낼것.주수1위.주수}주)`);
  if (못잰것.length) console.log(`  ⬜ 우리 표에 없어 못 잰 것 ${못잰것.length}편: ${못잰것.join(', ')}`);
  console.log(`  냈다 — ${낼곳}`);
}
