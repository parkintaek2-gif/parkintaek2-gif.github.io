/**
 * check-archive-freshness.mjs — **아카이빙이 빠진 날을 «검사»가 잡는다.**
 *
 * ── 🔴 왜 만들었나 (2026-09-09 10:0x · 5번) ─────────────────────────────────
 * 2번이 물었다 — 「한경컨센서스를 «매일» 받는 예약이 없습니다. CronCreate 로 걸까요?」
 *
 * ⛔ **cron 이 답이 아니다.** `CLAUDE.md` 가 이미 세 가지를 못박아 뒀다 —
 * ```
 *   ① 예약은 세션 메모리에만 있다 — 세션이 바뀌면 사라진다
 *   ② recurring 은 7일 뒤 자동 만료된다
 *   ③ 세션이 바쁘면 그 시각에 «안 뜬다»
 * ```
 * ⇒ 예약에 기대면 **조용히 안 돈다.** 그리고 아카이빙은 소급이 안 되므로
 *   조용히 안 도는 것이 가장 비싼 사고다.
 *
 * ⭐ 회사 강령이 답을 이미 적어 뒀다 —
 *   「규칙은 문장이 아니라 **검사**로 둔다. 말로 하는 규칙은 잊힌다.」
 *   그래서 예약을 걸지 않고 **`npm test` 가 매번 잡게** 한다.
 *   빠지면 초록이 안 된다. 사람이 기억해서 지키는 구조를 만들지 않는다.
 *
 * ── ⛔ 이 자가 지키는 것 ────────────────────────────────────────────────────
 * ```
 * ⛔ 주말·공휴일에 «없는 것이 맞는» 갈래를 빠뜨렸다고 하지 않는다 (거래일 갈래)
 * ⛔ 폴더가 아예 없는 것과 «오래된» 것을 섞지 않는다 — 다른 사고다
 * ⛔ 「못 쟀다」를 관문으로 세우지 않는다 — 폴더가 없으면 그렇게 «적고» 통과시킨다.
 *    못 잰 하나가 잴 수 있는 나머지를 가리지 않게 한다
 * ⚠ 파일 «수정시각»으로 재지 않는다. 파일 «이름의 날짜»로 잰다 —
 *   git 이 체크아웃하면 수정시각이 오늘로 바뀌어 다 새것처럼 보인다
 * ```
 *
 * 쓰는 법
 *   node scripts/check-archive-freshness.mjs
 *   node scripts/check-archive-freshness.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 지켜보는 갈래.
 * `참는날` — 며칠까지 안 들어와도 넘어가나. 갈래마다 다르다.
 * `거래일` — 참이면 주말을 세지 않는다(장이 안 열리면 «없는 것이 맞다»).
 */
export const 갈래들 = [
  { 길: 'archive/raw/newsdesk-korean-press', 이름: '신문 제목', 몫: '5번', 참는날: 1, 거래일: false, 무늬: /(\d{8})\.json$/ },
  { 길: 'archive/raw/community-desk', 이름: '커뮤니티·SNS', 몫: '5번', 참는날: 1, 거래일: false, 무늬: /(\d{4}-\d{2}-\d{2})\.json$/ },
  { 길: 'archive/raw/hankyung-consensus', 이름: '한경컨센서스', 몫: '2번', 참는날: 1, 거래일: true, 무늬: /(\d{4}-\d{2}-\d{2})\.json$/ },
  { 길: 'archive/raw/broker', 이름: '증권사 직접수집', 몫: '6번', 참는날: 2, 거래일: true, 무늬: /^(\d{4}-\d{2}-\d{2})$/ },
  { 길: 'archive/raw/krx', 이름: 'KRX 일별시세', 몫: '6번', 참는날: 3, 거래일: true, 무늬: /-(\d{8})\.json$/ },
];

/** ⚠ 시각은 KST. 이 PC 가 이미 KST 다 — UTC 로 바꾸면 새벽에 하루 어긋난다 */
export function 오늘날(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** 파일 이름에서 날짜를 뽑는다. `20260909` 와 `2026-09-09` 둘 다 받는다 */
export function 날뽑기(이름, 무늬) {
  const m = String(이름 ?? '').match(무늬);
  if (!m) return null;
  const s = m[1].replace(/-/g, '');
  if (!/^\d{8}$/.test(s)) return null;
  const y = Number(s.slice(0, 4)); const mo = Number(s.slice(4, 6)); const d = Number(s.slice(6, 8));
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

/**
 * 두 날 사이의 «셈에 넣는» 날 수.
 * `거래일` 이면 토·일을 세지 않는다.
 * ⚠ 공휴일은 모른다 — 그래서 거래일 갈래의 `참는날` 을 넉넉히 둔다. 모르는 것을 아는 척하지 않는다.
 */
export function 지난날수(마지막, 오늘, 거래일 = false) {
  if (!(마지막 instanceof Date) || !(오늘 instanceof Date)) return null;
  let n = 0;
  const d = new Date(마지막.getTime());
  while (d < 오늘) {
    d.setDate(d.getDate() + 1);
    const 요일 = d.getDay();
    if (거래일 && (요일 === 0 || 요일 === 6)) continue;
    n += 1;
  }
  return n;
}

/** 한 갈래를 잰다. ⛔ 폴더가 없으면 «못 쟀다»로 두고 관문을 세우지 않는다 */
export function 재기(갈래, { 오늘 = 오늘날(), 목록읽기 = (p) => fs.readdirSync(p), 있나 = (p) => fs.existsSync(p) } = {}) {
  const 절대 = path.join(뿌리, 갈래.길);
  if (!있나(절대)) return { ...갈래, 상태: '못쟀다', 까닭: '폴더가 없다', 마지막: null, 지남: null };
  let 이름들 = [];
  try { 이름들 = 목록읽기(절대); } catch (e) { return { ...갈래, 상태: '못쟀다', 까닭: `폴더를 못 읽었다 — ${e.message}`, 마지막: null, 지남: null }; }
  const 날들 = 이름들.map((n) => 날뽑기(n, 갈래.무늬)).filter(Boolean).sort((a, b) => a - b);
  if (!날들.length) return { ...갈래, 상태: '못쟀다', 까닭: '이름에서 날짜를 못 읽었다', 마지막: null, 지남: null };
  const 마지막 = 날들[날들.length - 1];
  const 지남 = 지난날수(마지막, 오늘, 갈래.거래일);
  const 상태 = 지남 > 갈래.참는날 ? '빠짐' : '괜찮다';
  return { ...갈래, 상태, 까닭: null, 마지막, 지남, 파일수: 날들.length };
}

const 날글 = (d) => (d instanceof Date
  ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  : '—');

const 나 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (나 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('날뽑기 — 20260909 꼴', 날글(날뽑기('stk_bydd_trd-20260909.json', /-(\d{8})\.json$/)) === '2026-09-09');
  검('날뽑기 — 2026-09-09 꼴', 날글(날뽑기('consensus-2026-09-09.json', /(\d{4}-\d{2}-\d{2})\.json$/)) === '2026-09-09');
  검('날뽑기 — 폴더 이름 꼴', 날글(날뽑기('2026-09-08', /^(\d{4}-\d{2}-\d{2})$/)) === '2026-09-08');
  검('⛔ 날뽑기 — 안 맞으면 null', 날뽑기('README.md', /-(\d{8})\.json$/) === null);
  검('⛔ 날뽑기 — null 도 견딘다', 날뽑기(null, /-(\d{8})\.json$/) === null);
  검('⛔ 날뽑기 — 말이 안 되는 달은 버린다', 날뽑기('x-20261309.json', /-(\d{8})\.json$/) === null);

  const 수 = (a, b) => 지난날수(new Date(a[0], a[1] - 1, a[2]), new Date(b[0], b[1] - 1, b[2]), false);
  검('지난날수 — 하루', 수([2026, 9, 8], [2026, 9, 9]) === 1);
  검('지난날수 — 같은 날은 0', 수([2026, 9, 9], [2026, 9, 9]) === 0);
  검('지난날수 — 사흘', 수([2026, 9, 6], [2026, 9, 9]) === 3);
  /* 2026-09-04 는 금요일, 09-07 은 월요일 — 주말 둘은 세지 않는다 */
  검('🔴 거래일 — 주말을 세지 않는다',
    지난날수(new Date(2026, 8, 4), new Date(2026, 8, 7), true) === 1);
  검('거래일 아니면 주말도 센다',
    지난날수(new Date(2026, 8, 4), new Date(2026, 8, 7), false) === 3);
  검('⛔ 지난날수 — 못 재면 null', 지난날수(null, new Date()) === null);

  const 견본 = { 길: 'x', 이름: '견본', 몫: '5번', 참는날: 1, 거래일: false, 무늬: /(\d{4}-\d{2}-\d{2})\.json$/ };
  const 어제 = 재기(견본, { 오늘: new Date(2026, 8, 9), 있나: () => true, 목록읽기: () => ['a-2026-09-08.json'] });
  검('어제 것이 있으면 괜찮다', 어제.상태 === '괜찮다' && 어제.지남 === 1);
  const 오래 = 재기(견본, { 오늘: new Date(2026, 8, 9), 있나: () => true, 목록읽기: () => ['a-2026-09-05.json'] });
  검('나흘 지났으면 빠짐', 오래.상태 === '빠짐' && 오래.지남 === 4);
  const 없 = 재기(견본, { 오늘: new Date(2026, 8, 9), 있나: () => false });
  검('⛔ 폴더가 없으면 «못쟀다» — 「빠짐」과 섞지 않는다', 없.상태 === '못쟀다');
  const 빈 = 재기(견본, { 오늘: new Date(2026, 8, 9), 있나: () => true, 목록읽기: () => ['README.md'] });
  검('⛔ 날짜를 못 읽으면 «못쟀다»', 빈.상태 === '못쟀다');
  검('⛔ 폴더를 못 읽어도 안 죽는다',
    재기(견본, { 오늘: new Date(2026, 8, 9), 있나: () => true, 목록읽기: () => { throw new Error('권한'); } }).상태 === '못쟀다');

  검('갈래가 다섯 이상 있다 — 비어 있으면 아무것도 안 보고 통과한다', 갈래들.length >= 5);
  검('갈래마다 몫이 붙어 있다', 갈래들.every((x) => /^[1-8]번$/.test(x.몫)));
  검('한경컨센서스가 목록에 있다 — 2026-09-09 에 소급 불가를 확인해 넣었다',
    갈래들.some((x) => x.이름 === '한경컨센서스' && x.몫 === '2번'));
  검('🔴 「cron 이 답이 아니다」가 코드에 살아 있다',
    fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').includes('cron 이 답이 아니다'));

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}\n${실.map((s) => `   · ${s}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`✅ 아카이브 빠진 날 검사 — 자가시험 ${통}개 통과`);
  process.exit(0);
}

if (나) {
  const 결과 = 갈래들.map((g) => 재기(g));
  const 빠짐 = 결과.filter((r) => r.상태 === '빠짐');
  const 못쟀 = 결과.filter((r) => r.상태 === '못쟀다');

  console.log('■ 아카이빙 — 소급이 안 되는 항목이다. 폴더 이름의 날짜로 잰다');
  for (const r of 결과) {
    const 표 = r.상태 === '빠짐' ? '🔴' : r.상태 === '못쟀다' ? '⬜' : '✅';
    const 꼬리 = r.상태 === '못쟀다' ? r.까닭
      : `마지막 ${날글(r.마지막)} · ${r.지남}${r.거래일 ? '거래일' : '일'} 지남 (참는 선 ${r.참는날})`;
    console.log(`  ${표} ${r.이름.padEnd(14)} [${r.몫}] ${꼬리}`);
  }

  if (못쟀.length) {
    console.log('');
    console.log(`⬜ 못 쟨 것 ${못쟀.length}개 — 「없다」가 아니라 「못 쟀다」다. 관문으로 세우지 않는다.`);
  }
  if (빠짐.length) {
    console.log('');
    console.log(`🔴 빠진 갈래 ${빠짐.length}개 — **소급이 안 된다. 오늘 안 받으면 그날치는 영영 없다**`);
    for (const r of 빠짐) console.log(`   · ${r.이름} (${r.몫}) — 마지막이 ${날글(r.마지막)} 이다`);
    console.log('');
    console.log('⛔ 예약(cron)으로 막지 않는다 — 세션이 바뀌면 사라지고 7일 뒤 만료된다.');
    console.log('✅ 돌리고 다시 이 검사를 돌린다. 초록이 되어야 끝난 것이다.');
    process.exit(1);
  }
  console.log('');
  console.log('✅ 빠진 갈래 없다');
  process.exit(0);
}
