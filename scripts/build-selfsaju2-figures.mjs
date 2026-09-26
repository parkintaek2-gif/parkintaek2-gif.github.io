#!/usr/bin/env node
/**
 * build-selfsaju2-figures.mjs — **셀프사주 2권 그림. PPT 와 교재가 «같은 것»을 쓴다.**
 *
 * ── 🔴 왜 만드나 (2026-09-26) ────────────────────────────────────────
 * 사장님: 「**9월22일에 만든 건 정말 엉망이잖아. ppt를 먼저 만들고 거기서 활용한
 *          이미지를 교재에도 해당부분에 똑같이 사용하라고 했었다.**」
 *        「**셀프사주 1권-이마트 세종.ppt와 똑같은 스타일, 디자인으로 만들어라**」
 *        「**네 멋대로 만들지 말고 지시한 걸 100% 반영해서 만들어.**」
 *
 * 9/22 에 나는 순서를 «거꾸로» 했다 — 교재를 먼저 내고(14:14) PPT 를 나중에 붙였다(15:13).
 * 그리고 둘이 그림을 나눠 쓰지 않았다. 그래서 두 물건이 따로 놀았다.
 * ⇒ 이 자가 그림을 «한 곳»에서 만든다. PPT 도 교재도 여기서 난 PNG 를 쓴다.
 *
 * ── 1권을 뜯어서 잰 값 그대로 따른다 (2026-09-26 실측) ──────────────────
 * ```
 * 판 크기      33.87 × 19.05 cm (16:9)
 * 글꼴         KoPub돋움체 Medium
 * 글자 크기    22 · 24 · 28 · 32 · 36 · 54 pt  (아주 크다)
 * 바탕         흰색 (표지만 사진)
 * 짜임         왼쪽 위에 제목(한글 위·한자 아래), 나머지는 그림이나 표가 주인공
 * 설명 문장    거의 없다 — 말은 입으로 하신다
 * ```
 * ⭐ 그리고 **색이 규칙이다.** 1권이 오행·십신마다 같은 색을 되풀이해 쓴다.
 *   그 색을 그대로 물려받는다 — 1권을 들은 사람이 2권에서 같은 색을 본다.
 *
 * 쓰는 법
 *   node scripts/build-selfsaju2-figures.mjs --자가시험
 *   node scripts/build-selfsaju2-figures.mjs            무엇을 그릴지만 본다
 *   node scripts/build-selfsaju2-figures.mjs --짓는다    PNG 를 낸다
 *   node scripts/build-selfsaju2-figures.mjs --build     (영문 별칭)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
export const 낼곳 = path.join(뿌리, 'archive', 'out', '셀프사주2-그림');

/* 🔴 1권에서 실측한 색. ⛔ 내 취향으로 바꾸지 않는다 — 1권을 들은 사람이 같은 색을 본다 */
export const 오행색 = {
  목: { 칠: '#0070C0', 글: '#FFFFFF' },
  화: { 칠: '#FF0000', 글: '#FFFFFF' },
  토: { 칠: '#FFC000', 글: '#1C1E21' },
  금: { 칠: '#FFFFFF', 글: '#1C1E21' },
  수: { 칠: '#1C1E21', 글: '#FFFFFF' },
};
/* 1권 200장 「생극제화」 그림의 십신 색 그대로 */
export const 십신색 = {
  '일간·비겁': { 칠: '#A8D18D', 글: '#1C1E21' },
  식상: { 칠: '#FF7C4D', 글: '#FFFFFF' },
  재성: { 칠: '#E0C158', 글: '#1C1E21' },
  관성: { 칠: '#F2F2F2', 글: '#1C1E21' },
  인성: { 칠: '#3B3B3B', 글: '#FFFFFF' },
};
export const 글꼴 = "'KoPub돋움체 Medium','KoPubDotum Medium','Malgun Gothic',sans-serif";
export const 판너비 = 1400;
export const 판높이 = 788;

/** 글자에 든 <&> 를 안전하게 바꾼다 — SVG 는 XML 이라 그냥 넣으면 깨진다 */
export function 안전글(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 원 하나 — 십신 동그라미 */
export function 동그라미(x, y, r, 글, 색, 글자크기 = 44) {
  const c = 색 ?? { 칠: '#FFFFFF', 글: '#1C1E21' };
  const 테 = c.칠 === '#FFFFFF' || c.칠 === '#F2F2F2' ? '#1C1E21' : 'none';
  const 줄들 = String(글 ?? '').split('\n');
  const 첫y = y + (줄들.length === 1 ? 글자크기 * 0.36 : -글자크기 * 0.15);
  const 글월 = 줄들.map((t, i) =>
    `<tspan x="${x}" dy="${i === 0 ? 0 : 글자크기 * 1.12}">${안전글(t)}</tspan>`).join('');
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.칠}" stroke="${테}" stroke-width="3"/>`
    + `<text x="${x}" y="${첫y}" font-family="${글꼴}" font-size="${글자크기}" font-weight="700"`
    + ` fill="${c.글}" text-anchor="middle">${글월}</text>`;
}

/** 왼쪽 위 제목 — 한글 위, 한자 아래 (1권 짜임 그대로) */
export function 제목칸(한글, 한자, { x = 60, y = 96, 크기 = 62, 붉은글 = '' } = {}) {
  const 칠하기 = (t) => {
    const s = 안전글(t);
    if (!붉은글) return s;
    return s.split('').map((c) => (붉은글.includes(c) ? `<tspan fill="#FF0000">${c}</tspan>` : c)).join('');
  };
  let out = `<text x="${x}" y="${y}" font-family="${글꼴}" font-size="${크기}" font-weight="900"`
    + ` fill="#1C1E21">${칠하기(한글)}</text>`;
  if (한자) {
    out += `<text x="${x}" y="${y + 크기 * 1.08}" font-family="${글꼴}" font-size="${크기}"`
      + ` font-weight="900" fill="#1C1E21">${칠하기(한자)}</text>`;
  }
  return out;
}

/** 표 — 1권처럼 검은 테두리에 머리줄이 굵다 */
export function 표(칸들, { x, y, 칸너비, 줄높이 = 62, 글자크기 = 30 } = {}) {
  const 줄들 = Array.isArray(칸들) ? 칸들 : [];
  let out = '';
  줄들.forEach((줄, i) => {
    (Array.isArray(줄) ? 줄 : []).forEach((칸, j) => {
      const cx = x + (칸너비[j] ?? 200) * 0 + 칸너비.slice(0, j).reduce((a, b) => a + b, 0);
      const cy = y + i * 줄높이;
      const 머리 = i === 0;
      const 바탕 = 머리 ? '#EDEDED' : (i % 2 === 0 ? '#FFFFFF' : '#FAFAFA');
      out += `<rect x="${cx}" y="${cy}" width="${칸너비[j] ?? 200}" height="${줄높이}"`
        + ` fill="${바탕}" stroke="#1C1E21" stroke-width="2.5"/>`;
      out += `<text x="${cx + (칸너비[j] ?? 200) / 2}" y="${cy + 줄높이 * 0.66}"`
        + ` font-family="${글꼴}" font-size="${글자크기}" font-weight="${머리 ? 900 : 500}"`
        + ` fill="#1C1E21" text-anchor="middle">${안전글(칸)}</text>`;
    });
  });
  return out;
}

/** SVG 한 장으로 감싼다 */
export function 판(속) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${판너비}" height="${판높이}"`
    + ` viewBox="0 0 ${판너비} ${판높이}">`
    + `<rect width="${판너비}" height="${판높이}" fill="#FFFFFF"/>${속}</svg>`;
}

/* ── 그릴 것들 ────────────────────────────────────────────────────
   ⛔ 원고에 없는 것을 그리지 않는다. 원고가 가르치는 것만 그림으로 옮긴다. */
export const 그림들 = [
  {
    이름: '01-성격과-패격',
    쓸곳: '제6장 1~3절 — 격은 서기도 하고 깨지기도 한다',
    그리기() {
      const 왼 = 420; const 오 = 980; const y = 430; const r = 150;
      return 판(
        제목칸('성격과 패격', '成格과 敗格', { 붉은글: '敗패' })
        + 동그라미(왼, y, r, '성격\n成格', { 칠: '#A8D18D', 글: '#1C1E21' }, 46)
        + 동그라미(오, y, r, '패격\n敗格', { 칠: '#FF7C4D', 글: '#FFFFFF' }, 46)
        + `<text x="${왼}" y="${y + r + 62}" font-family="${글꼴}" font-size="34" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">격이 제대로 선 것</text>`
        + `<text x="${오}" y="${y + r + 62}" font-family="${글꼴}" font-size="34" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">격이 깨진 것</text>`
        + `<text x="700" y="${y + 8}" font-family="${글꼴}" font-size="44" font-weight="900"`
        + ` fill="#1C1E21" text-anchor="middle">vs</text>`
        + `<text x="700" y="740" font-family="${글꼴}" font-size="30" font-weight="700"`
        + ` fill="#FF0000" text-anchor="middle">패격은 「나쁜 사람」이라는 뜻이 아니다</text>`,
      );
    },
  },
  {
    이름: '02-성-안에-패-패-안에-성',
    쓸곳: '제6장 4절 — 가장 중요한 두 문장',
    그리기() {
      const y = 420; const R = 168; const r = 62;
      return 판(
        제목칸('성 안에 패가 있고', '패 안에 성이 있다', { 크기: 56, 붉은글: '패' })
        + 동그라미(420, y, R, '', { 칠: '#A8D18D', 글: '#1C1E21' })
        + 동그라미(420, y, r, '패', { 칠: '#FF7C4D', 글: '#FFFFFF' }, 40)
        + `<text x="420" y="${y + R + 58}" font-family="${글꼴}" font-size="32" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">선 격 안에도 깨질 데가 있다</text>`
        + 동그라미(980, y, R, '', { 칠: '#FF7C4D', 글: '#FFFFFF' })
        + 동그라미(980, y, r, '성', { 칠: '#A8D18D', 글: '#1C1E21' }, 40)
        + `<text x="980" y="${y + R + 58}" font-family="${글꼴}" font-size="32" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">깨진 격 안에도 살릴 데가 있다</text>`,
      );
    },
  },
  {
    이름: '03-상신은-재상이다',
    쓸곳: '제6장 5절 — 상신(相神)',
    그리기() {
      return 판(
        제목칸('상신', '相神', { 붉은글: '相상' })
        + 동그라미(520, 400, 130, '용신\n用神', { 칠: '#FFC000', 글: '#1C1E21' }, 44)
        + 동그라미(900, 400, 130, '상신\n相神', { 칠: '#0070C0', 글: '#FFFFFF' }, 44)
        /* 🔴 화살촉은 «용신 쪽»을 가리킨다 — 상신이 용신을 보좌하는 것이지 그 반대가 아니다.
           2026-09-26 에 그려 놓고 보니 방향이 거꾸로였다. */
        + `<path d="M 762 400 L 682 400" stroke="#1C1E21" stroke-width="7"`
        + ` marker-end="url(#촉)"/>`
        /* ⚠ markerUnits 를 안 적으면 촉이 stroke-width 배로 커져 선을 삼킨다 */
        + `<defs><marker id="촉" markerUnits="userSpaceOnUse" markerWidth="26" markerHeight="26"`
        + ` refX="24" refY="13" orient="auto">`
        + `<path d="M0,3 L24,13 L0,23 z" fill="#1C1E21"/></marker></defs>`
        + `<text x="715" y="330" font-family="${글꼴}" font-size="28" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">보좌한다</text>`
        + `<text x="520" y="590" font-family="${글꼴}" font-size="32" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">임금</text>`
        + `<text x="900" y="590" font-family="${글꼴}" font-size="32" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">재상</text>`
        + `<text x="710" y="700" font-family="${글꼴}" font-size="34" font-weight="900"`
        + ` fill="#FF0000" text-anchor="middle">상신이 곧 희신이다</text>`,
      );
    },
  },
  {
    이름: '04-상신을-다치면',
    쓸곳: '제6장 6절 — 상신을 다치는 것이 용신을 다치는 것보다 나쁘다',
    그리기() {
      return 판(
        제목칸('무엇을 다치는 것이', '더 나쁜가', { 크기: 54 })
        + 표([
          ['다친 것', '어떻게 되나'],
          ['용신을 다침', '격이 흔들린다'],
          ['상신을 다침', '격이 무너진다'],
        ], { x: 420, y: 300, 칸너비: [300, 420], 줄높이: 88, 글자크기: 36 })
        + `<text x="700" y="700" font-family="${글꼴}" font-size="34" font-weight="900"`
        + ` fill="#FF0000" text-anchor="middle">상신을 다치는 쪽이 더 나쁘다</text>`,
      );
    },
  },
  {
    이름: '05-사길격과-사흉격',
    쓸곳: '제8장 3~4절 — 순용과 역용',
    그리기() {
      const 칸 = (x, 제목, 부제, 넷, 색) => {
        let s = `<text x="${x}" y="250" font-family="${글꼴}" font-size="44" font-weight="900"`
          + ` fill="#1C1E21" text-anchor="middle">${안전글(제목)}</text>`;
        s += `<text x="${x}" y="300" font-family="${글꼴}" font-size="30" font-weight="700"`
          + ` fill="#FF0000" text-anchor="middle">${안전글(부제)}</text>`;
        넷.forEach((t, i) => {
          s += 동그라미(x - 165 + (i % 2) * 220, 410 + Math.floor(i / 2) * 180, 82, t, 색, 34);
        });
        return s;
      };
      return 판(
        제목칸('순용과 역용', '順用과 逆用', { 크기: 54, 붉은글: '逆역' })
        + 칸(400, '사길격', '따라 쓴다 — 순용', ['정관', '재성', '인수', '식신'],
          { 칠: '#A8D18D', 글: '#1C1E21' })
        + `<line x1="700" y1="220" x2="700" y2="720" stroke="#1C1E21" stroke-width="3"/>`
        /* 🔴 「양인」이 아니라 «효신(편인)»이다 — 원고가 사흉격을 「살·상·인·겁」으로 적는다
           (2권-원고-08-행운법-순용과-역용.md 152줄). 양인격은 록겁격과 함께 따로 다룬다. */
        + 칸(1000, '사흉격', '거슬러 쓴다 — 역용', ['칠살', '상관', '효신', '겁재'],
          { 칠: '#FF7C4D', 글: '#FFFFFF' }),
      );
    },
  },
  {
    이름: '06-운은-열해를-묶어-본다',
    쓸곳: '제8장 2절 — 운은 열 해를 묶어 본다',
    그리기() {
      /* 🔴 빈 상자 열 개만 그려 놓았다가 2026-09-26 에 교재를 떠서 보고 잡았다 —
         칸이 비어 있으면 「열 해」인지 무엇인지 그림만 봐서는 알 수 없다.
         해마다 번호를 적고, 「앞 오 년·뒤 오 년」으로 끊는 잘못된 읽기를 함께 보인다. */
      let s = 제목칸('운은 열 해를', '묶어 본다', { 크기: 54 });
      for (let i = 0; i < 10; i++) {
        const x = 300 + i * 84;
        /* 앞 오 년은 천간, 뒤 오 년은 지지 — 사람들이 여기서 끊어 읽는다 */
        s += `<rect x="${x}" y="380" width="72" height="120" fill="${i < 5 ? '#F2F2F2' : '#E4E4E4'}"`
          + ` stroke="#1C1E21" stroke-width="2.5"/>`;
        s += `<text x="${x + 36}" y="428" font-family="${글꼴}" font-size="30" font-weight="900"`
          + ` fill="#1C1E21" text-anchor="middle">${i + 1}</text>`;
        s += `<text x="${x + 36}" y="472" font-family="${글꼴}" font-size="22" font-weight="700"`
          + ` fill="#6B6B6B" text-anchor="middle">해</text>`;
      }
      /* 끊어 읽는 자리 — 점선으로만 보인다. 이 선이 «틀린» 것이다 */
      s += `<line x1="718" y1="352" x2="718" y2="528" stroke="#9A9A9A" stroke-width="3"`
        + ` stroke-dasharray="10 8"/>`;
      s += `<text x="508" y="338" font-family="${글꼴}" font-size="26" font-weight="700"`
        + ` fill="#6B6B6B" text-anchor="middle">앞 오 년 — 천간</text>`;
      s += `<text x="928" y="338" font-family="${글꼴}" font-size="26" font-weight="700"`
        + ` fill="#6B6B6B" text-anchor="middle">뒤 오 년 — 지지</text>`;
      /* 빨간 테두리가 열 칸을 통째로 묶는다 — 이것이 맞는 읽기다 */
      s += `<rect x="296" y="376" width="844" height="128" fill="none"`
        + ` stroke="#FF0000" stroke-width="6"/>`;
      s += `<text x="718" y="570" font-family="${글꼴}" font-size="34" font-weight="900"`
        + ` fill="#FF0000" text-anchor="middle">열 해가 한 덩이다</text>`;
      s += `<text x="718" y="650" font-family="${글꼴}" font-size="30" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">점선에서 끊어 「앞은 천간, 뒤는 지지」로 읽으면 틀린다</text>`;
      s += `<text x="718" y="700" font-family="${글꼴}" font-size="30" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">열 해를 아울러 좋고 나쁨을 가린다</text>`;
      return 판(s);
    },
  },
  {
    이름: '07-종격은-월령이-못-맡을-때',
    쓸곳: '제7장 9절 — 종격이 서는 자리',
    그리기() {
      return 판(
        제목칸('종격', '從格', { 붉은글: '從종' })
        + 동그라미(420, 400, 140, '월령이\n맡는다', { 칠: '#A8D18D', 글: '#1C1E21' }, 38)
        + 동그라미(980, 400, 140, '월령이\n못 맡는다', { 칠: '#3B3B3B', 글: '#FFFFFF' }, 38)
        + `<text x="420" y="600" font-family="${글꼴}" font-size="34" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">보통 격 (내격)</text>`
        + `<text x="980" y="600" font-family="${글꼴}" font-size="34" font-weight="700"`
        + ` fill="#FF0000" text-anchor="middle">종격 (외격)</text>`
        + `<text x="700" y="710" font-family="${글꼴}" font-size="32" font-weight="900"`
        + ` fill="#1C1E21" text-anchor="middle">종격은 「예외」가 아니다</text>`,
      );
    },
  },
  {
    이름: '08-진종과-가종',
    쓸곳: '제7장 9절 3항 — 진종과 가종',
    그리기() {
      return 판(
        제목칸('진종과 가종', '眞從과 假從', { 크기: 54, 붉은글: '假가' })
        + 표([
          ['', '대항 세력', '판정'],
          ['진종 眞從', '남아 있지 않다', '온전히 따른다'],
          ['가종 假從', '아직 살아 있다', '따르는 척한다'],
        ], { x: 300, y: 300, 칸너비: [300, 360, 380], 줄높이: 92, 글자크기: 34 })
        + `<text x="700" y="700" font-family="${글꼴}" font-size="32" font-weight="900"`
        + ` fill="#FF0000" text-anchor="middle">갈림길은 「대항 세력이 아직 살아 있나」</text>`,
      );
    },
  },
  {
    이름: '09-희신-기신-구신',
    쓸곳: '제11장 — 억부론의 희신·기신·구신',
    그리기() {
      return 판(
        제목칸('희신 기신 구신', '喜神 忌神 仇神', { 크기: 54, 붉은글: '忌기仇구' })
        + 동그라미(330, 430, 125, '희신\n喜神', { 칠: '#A8D18D', 글: '#1C1E21' }, 40)
        + 동그라미(700, 430, 125, '기신\n忌神', { 칠: '#FF7C4D', 글: '#FFFFFF' }, 40)
        + 동그라미(1070, 430, 125, '구신\n仇神', { 칠: '#3B3B3B', 글: '#FFFFFF' }, 40)
        + `<text x="330" y="620" font-family="${글꼴}" font-size="30" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">용신을 도와주는 것</text>`
        + `<text x="700" y="620" font-family="${글꼴}" font-size="30" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">용신을 막는 것</text>`
        + `<text x="1070" y="620" font-family="${글꼴}" font-size="30" font-weight="700"`
        + ` fill="#1C1E21" text-anchor="middle">기신을 도와주는 것</text>`,
      );
    },
  },
  {
    이름: '10-조후-네-계절',
    쓸곳: '제12장 — 조후론',
    그리기() {
      /* ⚠ 한자만 적어 두면 배우는 사람이 못 읽는다 — 독음을 한 줄 아래에 붙인다.
         교재는 전문용어를 «넣되» 읽을 수 있게 한다(2026-09-22 사장님). */
      const 계절 = [
        ['봄', '寅卯辰', '인묘진', 오행색.목], ['여름', '巳午未', '사오미', 오행색.화],
        ['가을', '申酉戌', '신유술', 오행색.금], ['겨울', '亥子丑', '해자축', 오행색.수],
      ];
      let s = 제목칸('조후', '調候', { 붉은글: '候후' });
      계절.forEach(([한, 한자, 독음, 색], i) => {
        const x = 290 + i * 280;
        s += 동그라미(x, 420, 118, 한, 색, 46);
        s += `<text x="${x}" y="600" font-family="${글꼴}" font-size="40" font-weight="900"`
          + ` fill="#1C1E21" text-anchor="middle">${안전글(한자)}</text>`;
        s += `<text x="${x}" y="642" font-family="${글꼴}" font-size="28" font-weight="700"`
          + ` fill="#6B6B6B" text-anchor="middle">${안전글(독음)}</text>`;
      });
      s += `<text x="710" y="710" font-family="${글꼴}" font-size="32" font-weight="900"`
        + ` fill="#FF0000" text-anchor="middle">추우면 덥히고, 더우면 식힌다</text>`;
      return 판(s);
    },
  },
];

function 자가시험() {
  let 통과 = 0; let 탈 = 0;
  const 검 = (이름, 참) => { if (참) { 통과++; console.log('✅', 이름); } else { 탈++; console.log('🔴', 이름); } };

  검('⛔ XML 이 깨질 글자를 막는다', 안전글('<a & b>') === '&lt;a &amp; b&gt;');
  검('⛔ 빈 것·null 에도 안 터진다', 안전글(null) === '' && 안전글('') === '');

  검('🔴 1권에서 잰 판 크기다 (16:9)', Math.abs(판너비 / 판높이 - 16 / 9) < 0.01);
  검('🔴 1권 글꼴을 쓴다', 글꼴.includes('KoPub'));
  검('🔴 오행 다섯 색이 다 있다', Object.keys(오행색).length === 5);
  검('🔴 십신 다섯 색이 다 있다', Object.keys(십신색).length === 5);
  검('🔴 1권에서 잰 색 그대로다 — 목은 파랑·화는 빨강',
    오행색.목.칠 === '#0070C0' && 오행색.화.칠 === '#FF0000');
  검('흰 칸은 글자를 검게 쓴다 — 안 그러면 안 보인다',
    오행색.금.글 === '#1C1E21' && 십신색.관성.글 === '#1C1E21');

  const 판하나 = 판(동그라미(100, 100, 50, '가', 십신색.재성));
  검('판이 SVG 로 선다', 판하나.startsWith('<svg') && 판하나.endsWith('</svg>'));
  검('바탕이 희다 — 1권이 흰 바탕이다', 판하나.includes('fill="#FFFFFF"'));
  검('동그라미에 글이 들어간다', 판하나.includes('>가<'));
  검('흰 원에는 테두리를 준다', 동그라미(0, 0, 10, 'x', 오행색.금).includes('stroke="#1C1E21"'));
  검('색이 없어도 안 터진다', typeof 동그라미(0, 0, 10, 'x', null) === 'string');
  검('두 줄짜리 글도 그린다', 동그라미(0, 0, 10, '가\n나', 십신색.식상).includes('tspan'));

  const 제 = 제목칸('성격과 패격', '成格과 敗格', { 붉은글: '敗' });
  검('🔴 제목이 한글 위·한자 아래로 선다 — 1권 짜임이다',
    제.indexOf('성격과') < 제.indexOf('成格과'));
  검('🔴 짚는 글자를 빨갛게 — 1권이 그렇게 한다', 제.includes('fill="#FF0000"'));
  검('한자가 없어도 선다', 제목칸('가', '').includes('>가<'));

  const 표하나 = 표([['머리', 'ㄴ'], ['가', '나']], { x: 0, y: 0, 칸너비: [100, 100] });
  검('표가 칸마다 테두리를 갖는다', (표하나.match(/<rect/g) || []).length === 4);
  검('머리줄이 굵다', 표하나.includes('font-weight="900"'));
  검('⛔ 빈 표에도 안 터진다', typeof 표([], { x: 0, y: 0, 칸너비: [] }) === 'string');

  검('그릴 것이 열 장이다', 그림들.length === 10);
  검('그림마다 이름과 «쓸 곳»이 있다 — 교재 어디에 넣을지가 정해져 있어야 한다',
    그림들.every((g) => g.이름 && g.쓸곳 && typeof g.그리기 === 'function'));
  검('이름이 겹치지 않는다', new Set(그림들.map((g) => g.이름)).size === 그림들.length);
  검('🔴 열 장이 다 그려진다', 그림들.every((g) => {
    const s = g.그리기();
    return s.startsWith('<svg') && s.endsWith('</svg>') && s.length > 300;
  }));
  검('⛔ 그린 것에 깨진 XML 이 없다', 그림들.every((g) => {
    const s = g.그리기();
    return !/&(?!amp;|lt;|gt;|quot;|#)/.test(s);
  }));

  console.log(탈 ? `\n🔴 자가시험 ${탈}건 탈` : `\n✅ 자가시험 ${통과} 통과`);
  process.exit(탈 ? 1 : 0);
}

const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점) {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--자가시험') || 인자.includes('--selftest')) 자가시험();

  console.log(`■ 셀프사주 2권 그림 — ${그림들.length}장 (1권 스타일 그대로)`);
  for (const g of 그림들) console.log(`   · ${g.이름}  — ${g.쓸곳}`);

  if (!(인자.includes('--짓는다') || 인자.includes('--build'))) {
    console.log('\n⬜ 무엇을 그릴지만 봤다. 내려면 --짓는다 (영문 별칭 --build)');
    process.exit(0);
  }

  fs.mkdirSync(낼곳, { recursive: true });
  /* SVG 를 먼저 적고, 브라우저로 띄워 PNG 로 굽는다 — 글꼴이 그대로 살아난다 */
  for (const g of 그림들) {
    fs.writeFileSync(path.join(낼곳, `${g.이름}.svg`), g.그리기(), 'utf8');
  }
  console.log(`\n✅ SVG ${그림들.length}장 — ${path.relative(뿌리, 낼곳)}`);

  const { createRequire } = await import('node:module');
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
  const page = await b.newPage();
  try {
    await page.setViewport({ width: 판너비, height: 판높이, deviceScaleFactor: 2 });
    for (const g of 그림들) {
      const svg = fs.readFileSync(path.join(낼곳, `${g.이름}.svg`), 'utf8');
      await page.setContent(`<!doctype html><meta charset="utf-8">`
        + `<style>html,body{margin:0;padding:0;background:#fff}svg{display:block}</style>${svg}`,
      { waitUntil: 'domcontentloaded' });
      await new Promise((r) => setTimeout(r, 350));   /* 글꼴이 앉을 틈 */
      await page.screenshot({ path: path.join(낼곳, `${g.이름}.png`), omitBackground: false });
      console.log(`   🖼 ${g.이름}.png`);
    }
  } finally {
    await page.close();
    b.disconnect();                 /* ⛔ b.close() 금지 — 사장님 창이 닫힌다 */
  }
  console.log(`\n✅ PNG ${그림들.length}장 — PPT 와 교재가 «이것»을 함께 쓴다`);
}
