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
 * ⭐ 2026-08-05 — **평균을 우리가 계산하지 않는다.**
 *   처음엔 `getComparison*` 만 써서 335개교 값으로 **중앙값을 직접 냈다.**
 *   그런데 `getNotice*` 계열이 **공식 평균(`indctAvg`)을 같이 준다**는 걸 나중에 알았다.
 *   발표된 평균이 있는데 우리가 만든 값을 화면에 올릴 이유가 없다. 전부 공식값으로 바꿨다.
 *
 * ⚠ `indctVal*` 의 뜻은 지표마다 다르다. 원자료 파일의 `뜻` 필드에 적혀 있다.
 *   숫자만 보고 짐작하지 않는다 — 그러면 화면에서 거짓말이 된다.
 *
 * ⛔ 순위를 만들지 않는다. 「몇 위」도 「상위 몇 %」도 쓰지 않는다.
 *    쓰는 것은 **전국 평균과의 차이**뿐이다 — 등수가 아니라 위치다.
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

/** getNotice* 파일 하나를 학교ID → item 으로 만든다 */
const 지표읽기 = (파일) => {
  const m = new Map();
  const f = path.join(RAW, 파일);
  if (!fs.existsSync(f)) {
    console.log(`  ⚠ ${파일} 이 없다 — 그 지표는 비워 둔다`);
    return m;
  }
  for (const r of readJson(f).rows ?? []) {
    const it = (r.items || [])[0];
    if (it) m.set(r.schlId, it);
  }
  return m;
};

const 취업 = 지표읽기('notice-employment.json');
const 탈락 = 지표읽기('notice-wastage.json');
const 신입 = 지표읽기('notice-freshman.json');
const 재학 = 지표읽기('notice-enrolled.json');
const 교원 = 지표읽기('notice-faculty.json');

const 수 = (v) => {
  const n = Number(v);
  return v == null || v === '' || Number.isNaN(n) ? null : n;
};
const 한자리 = (n) => (n == null ? null : Math.round(n * 10) / 10);

/** 값 + 전국평균 + 차이를 한 덩이로 묶는다. 셋을 따로 두면 지면에서 어긋난다 */
const 지표덩이 = (it, { 값 = 'indctVal4' } = {}) => {
  if (!it) return null;
  const v = 한자리(수(it[값]));
  const avg = 한자리(수(it.indctAvg));
  if (v == null) return null;
  return { 값: v, 전국평균: avg, 차이: avg == null ? null : 한자리(v - avg) };
};

const pages = 대학.map((u) => {
  // ⚠ 캠퍼스가 따로 잡힌다 — 「강원대학교」가 본교·제2캠퍼스로 두 줄, 「경동대학교」는 세 줄이다.
  //    목록에 `title` 만 쓰면 같은 이름이 여러 번 나와 고장난 것처럼 보인다(실제로 그랬다).
  //    ⛔ 합치지 않는다. 캠퍼스마다 수치가 다르므로 합치면 숫자가 거짓말이 된다.
  const 캠퍼스 = u.clgcpDivNm ?? null;
  const 표시명 = 캠퍼스 && 캠퍼스 !== '본교' ? `${u.schlKrnNm} ${캠퍼스}` : u.schlKrnNm;

  const e = 취업.get(u.schlId);
  const w = 탈락.get(u.schlId);

  return {
    url: `/university/${u.schlId}`,
    title: u.schlKrnNm,
    표시명,
    schlId: u.schlId,
    캠퍼스,
    전체이름: u.schlFullNm ?? null,
    종류: u.schlKndNm, // 대학교 · 교육대학 · 전문대학
    구분: u.schlDivNm,
    설립: u.estbDivNm,
    지역: u.znNm,
    공시연도: svyYr,

    // ⭐ 이 지면의 첫 숫자 — 「그 길로 가면 졸업하고 어떻게 되나」
    취업률: 지표덩이(e),
    졸업자: 수(e?.indctVal1),
    취업자: 수(e?.indctVal2),
    취업대상자: 수(e?.indctVal3),

    중도탈락률: 지표덩이(w),
    재적학생: 수(w?.indctVal1),
    중도탈락자: 수(w?.indctVal2),

    신입생충원율: 지표덩이(신입.get(u.schlId)),
    재학생충원율: 지표덩이(재학.get(u.schlId)),
    전임교원확보율: 지표덩이(교원.get(u.schlId)),

    출처: '한국대학교육협의회 대학정보공시(대학알리미)',
  };
});

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pages-university.json'), JSON.stringify(pages, null, 1));

const 셈 = (k) => pages.filter((p) => p[k]).length;
console.log(`대학 페이지 ${pages.length}장 (${svyYr} 공시)`);
for (const k of ['취업률', '중도탈락률', '신입생충원율', '재학생충원율', '전임교원확보율'])
  console.log(`  ${k.padEnd(8)} 값 있는 곳 ${셈(k)}`);
const 표본 = pages.find((p) => p.취업률 && p.중도탈락률);
console.log('  표본:', 표본.표시명, JSON.stringify({ 취업률: 표본.취업률, 중도탈락률: 표본.중도탈락률 }));
console.log('→', path.relative(ROOT, path.join(OUT, 'pages-university.json')));
