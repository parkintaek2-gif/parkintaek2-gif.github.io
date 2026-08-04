/**
 * 대학알리미 원자료 → 백년지도 대학 페이지 데이터
 *
 *   archive/raw/alimi/*.json   (gitignore · 원자료)
 *      ↓
 *   src/data/100yearmap/pages-university.json   (커밋 · 빌드가 읽는 것)
 *
 * ⛔ archive/ 를 src/ 에서 직접 import 하지 않는다. 그러면 컨테이너 빌드가 죽는다.
 *    (2026-08-04 에 이걸 어겨 배포를 3시간 막았다)
 *
 * ⚠ 비교 기준을 **우리가 직접 계산한다.** 이유 —
 *   대학알리미 지역별 표(getRegional*)의 중도탈락 값이 0.3~0.5% 로 오는데,
 *   학교별로 받은 실제 값은 중앙값 7.4% 다. **그 표가 무슨 단위인지 아직 못 쟀다.**
 *   모르는 숫자를 화면에 올리느니, 우리가 받은 335개교 값으로 직접 재고
 *   「우리가 계산했다」고 밝히는 쪽을 택했다.
 *
 * ⛔ 순위를 만들지 않는다. 「몇 위」도, 「상위 몇 %」도 쓰지 않는다.
 *    쓰는 것은 **가운데값과의 차이**뿐이다 — 그건 등수가 아니라 위치다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'archive', 'raw', 'alimi');
const OUT = path.join(ROOT, 'src', 'data', '100yearmap');

const readJson = (p) => {
  const t = fs.readFileSync(p, 'utf8');
  return JSON.parse(t.charCodeAt(0) === 0xfeff ? t.slice(1) : t); // BOM
};

const { svyYr, list: 대학 } = readJson(path.join(RAW, 'universities.json'));

/** 학교별 파일에서 지표값 하나를 꺼낸다. 값이 없으면 null */
const 지표읽기 = (파일, indctId) => {
  const m = new Map();
  for (const r of readJson(path.join(RAW, 파일)).rows) {
    const it = (r.items || []).find((x) => x.indctId === indctId);
    const v = it ? Number(it.indctVal1) : NaN;
    if (!Number.isNaN(v)) m.set(r.schlId, v);
  }
  return m;
};

const 중도탈락 = 지표읽기('school-dropout.json', '23'); // 중도탈락학생비율 (%)
const 재적학생 = 지표읽기('school-enrolled.json', '9'); // 재적학생 (명)

const 중앙값 = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** 같은 종류(대학교/교육대학/전문대학)끼리 비교한다. 전문대와 4년제를 섞으면 거짓말이 된다 */
const 종류별값 = new Map();
for (const u of 대학) {
  const v = 중도탈락.get(u.schlId);
  if (v == null) continue;
  const k = u.schlKndNm;
  if (!종류별값.has(k)) 종류별값.set(k, []);
  종류별값.get(k).push(v);
}
const 종류기준 = Object.fromEntries(
  [...종류별값].map(([k, arr]) => [k, { 중앙값: 중앙값(arr), 표본: arr.length, 최저: Math.min(...arr), 최고: Math.max(...arr) }]),
);

const 한자리 = (n) => (n == null ? null : Math.round(n * 10) / 10);

const pages = 대학.map((u) => {
  const 탈락 = 중도탈락.get(u.schlId) ?? null;
  const 재적 = 재적학생.get(u.schlId) ?? null;
  const 기준 = 종류기준[u.schlKndNm] ?? null;
  const 차이 = 탈락 != null && 기준?.중앙값 != null ? 한자리(탈락 - 기준.중앙값) : null;

  // ⚠ 캠퍼스가 따로 잡힌다 — 「강원대학교」가 본교·제2캠퍼스로 두 줄, 「경동대학교」는 세 줄이다.
  //    목록에 `title` 만 쓰면 같은 이름이 여러 번 나와 고장난 것처럼 보인다(실제로 그랬다).
  //    ⛔ 합치지 않는다. 캠퍼스마다 중도탈락률이 다르므로 합치면 숫자가 거짓말이 된다.
  //    대신 **화면에 쓸 이름(표시명)**을 여기서 한 번 만들어 두고 모든 지면이 그것만 쓴다.
  const 캠퍼스 = u.clgcpDivNm ?? null;
  const 표시명 = 캠퍼스 && 캠퍼스 !== '본교' ? `${u.schlKrnNm} ${캠퍼스}` : u.schlKrnNm;

  return {
    url: `/university/${u.schlId}`,
    title: u.schlKrnNm,
    표시명,
    schlId: u.schlId,
    캠퍼스,
    전체이름: u.schlFullNm ?? null,
    종류: u.schlKndNm, // 대학교 · 교육대학 · 전문대학
    구분: u.schlDivNm, // 대학 · 전문대학
    설립: u.estbDivNm, // 국립 · 사립 · 공립 …
    지역: u.znNm,
    공시연도: svyYr,
    재적학생: 재적,
    중도탈락률: 한자리(탈락),
    같은종류_가운데값: 한자리(기준?.중앙값 ?? null),
    같은종류_표본: 기준?.표본 ?? null,
    가운데값과의차이: 차이,
    // 100명 중 몇 명이 떠났나 — 백분율보다 이 말이 먼저 읽힌다
    떠난사람_100명중: 탈락 != null ? Math.round(탈락) : null,
    출처: '한국대학교육협의회 대학정보공시(대학알리미)',
  };
});

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pages-university.json'), JSON.stringify(pages, null, 1));

const 값있음 = pages.filter((p) => p.중도탈락률 != null).length;
console.log(`대학 페이지 ${pages.length}장 (${svyYr} 공시) — 중도탈락 값 있는 곳 ${값있음}`);
console.log('종류별 가운데값:');
for (const [k, v] of Object.entries(종류기준)) {
  console.log(`  ${k.padEnd(6)} 표본 ${String(v.표본).padStart(3)} · 가운데값 ${한자리(v.중앙값)}% · ${한자리(v.최저)}~${한자리(v.최고)}%`);
}
console.log('→', path.relative(ROOT, path.join(OUT, 'pages-university.json')));
