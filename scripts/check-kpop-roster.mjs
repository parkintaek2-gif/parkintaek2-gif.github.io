/**
 * K팝 명단에 **누구나 아는 이름이 빠졌는지** 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-07, 명단을 위키데이터 `P31 = musical group` 하나로 뽑았더니 412팀이 나왔고
 * 그 안에 **Twice · Blackpink · 소녀시대 · aespa · NewJeans · IVE 가 전부 없었다.**
 * 블랙핑크는 위키데이터에 **girl group 으로만** 달려 있어 걸리지 않았다.
 *
 * 수치는 멀쩡해 보였다 — 412팀, 1,958명, 실패 0. **빠진 것은 세어지지 않는다.**
 * 지면이 라이브로 나가기 전에 사람이 이름을 눈으로 찾아보고서야 알았다.
 * 그 눈을 검사로 바꾼다.
 *
 * ── 무엇을 보나 ───────────────────────────────────────────────
 * 아래 목록은 **「이게 없으면 명단이 깨진 것」**인 이름들이다. 순위와 아무 상관이 없다.
 * 인기 있는 팀을 골라 넣는 것이 아니라, **빠지면 규칙이 잘못됐다는 신호**로 쓸 이름들이다.
 *
 * ⛔ 이 목록으로 지면을 만들지 않는다. 지면 명단은 규칙으로만 뽑는다.
 *    여기 있는 이름은 **규칙이 살아 있는지 보는 온도계**일 뿐이다.
 * ⛔ 이 검사를 통과시키려고 명단에 이름을 손으로 넣지 않는다. 그러면 검사가 죽는다.
 *
 * 쓰는 법: node scripts/check-kpop-roster.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'archive/raw/star-pageviews';

/**
 * 없으면 규칙이 깨진 것 — 성격이 다른 것을 일부러 섞었다.
 * 걸그룹 · 보이그룹 · 오래된 팀 · 솔로. 한 갈래만 넣으면 그 갈래만 지킨다.
 */
const 있어야한다 = [
  { name: 'Blackpink', why: '걸그룹. 위키데이터에 girl group 으로만 달려 있다 — 하위 유형을 안 훑으면 빠진다' },
  { name: 'Twice', why: '걸그룹' },
  { name: 'BTS', why: '보이그룹' },
  { name: 'NewJeans', why: '최근 걸그룹 — 새로 생긴 팀이 들어오는지' },
  { name: "Girls' Generation", why: '오래된 걸그룹 — 활동이 뜸한 팀도 남는지' },
  { name: 'Stray Kids', why: '보이그룹' },
  { name: 'IU (singer)', why: '솔로 — 사람 쪽 규칙이 사는지' },
  { name: 'Psy', why: '솔로' },
];

/**
 * 🔴 2026-08-22 — 이 자가 **터졌다**(ENOENT, scandir archive/raw/star-pageviews).
 *   까닭: 서버를 옮기면서 `archive/`(원자료)가 안 따라왔고, 그건 git 이 물고 오지 않는 자리다.
 *   ⛔ 터지면 묶음 자가 **첫 실패에서 멈춰** 뒤의 검사가 전부 안 돈다. 그게 더 큰 손해다.
 *   ⭐ 우리 규칙 — **재 보고 안 되면 안 된다고 적는 것도 결과다.**
 *     원자료가 없는 것은 「명단이 깨졌다」와 **다른 말**이다. 다른 말은 다르게 적는다.
 */
if (!fs.existsSync(DIR)) {
  console.log(`⚠ 못 쟀다 — 원자료 자리가 없다(${DIR}).`);
  console.log('   이 자리는 git 이 물고 오지 않는다. 재려면 collect-kpop-pageviews.mjs 를 먼저 돌린다.');
  console.log('   ⛔ 「명단이 깨졌다」고 말하지 않는다 — 못 잰 것과 깨진 것은 다른 말이다.');
  process.exit(0);
}

const files = fs.readdirSync(DIR).filter((f) => /^kpop-\d+\.json$/.test(f)).sort();
if (!files.length) {
  console.log('⚠ 못 쟀다 — kpop-*.json 이 하나도 없다. collect-kpop-pageviews.mjs 를 먼저 돌린다');
  process.exit(0);
}
const 파일 = files[files.length - 1];
const j = JSON.parse(fs.readFileSync(path.join(DIR, 파일), 'utf8'));
const 이름 = new Set(j.사람.map((p) => p.이름));

/* 위키 문서 제목이 살짝 다를 수 있다(구분자). 앞부분이 같으면 있는 것으로 본다. */
const 있나 = (n) => 이름.has(n) || [...이름].some((x) => x.toLowerCase().startsWith(n.toLowerCase().replace(/ \(.*\)$/, '')));

const 빠진것 = 있어야한다.filter((x) => !있나(x.name));

console.log(`K팝 명단 검사 — ${파일} · ${j.사람.length}명·팀 (그룹 ${j.사람.filter((p) => p.갈래 === 'group').length})`);
if (빠진것.length) {
  console.log(`❌ 있어야 할 이름 ${빠진것.length}개가 없다 — **명단 규칙이 깨졌다**`);
  빠진것.forEach((x) => console.log(`   ${x.name} — ${x.why}`));
  console.log('   ⛔ 명단에 이름을 손으로 넣어 통과시키지 않는다. 규칙을 고친다.');
  process.exit(1);
}
console.log(`✅ 온도계 ${있어야한다.length}개 전부 명단에 있다 — 규칙이 살아 있다`);
