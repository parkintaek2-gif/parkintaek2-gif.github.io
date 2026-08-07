/**
 * 금융투자협회(KOFIA) 「증권사별 국내주식 소수점 매매 가능 종목 목록」을 받아 하나로 붙인다.
 *
 * 출처   https://www.kofia.or.kr/brd/m_52/list.do  (자료실 · 첨부 zip)
 *        zip 안에 증권사별 xlsx 가 여덟 장 들어 있다.
 *
 * 왜 이 자료인가
 *   소수점(fractional) 매매는 증권사마다 **되는 종목이 다르다.** 그런데 그 목록을
 *   한 자리에 모아 견줘 놓은 곳이 없다. 협회가 여덟 장을 따로 올려 둘 뿐이다.
 *   영어로는 아예 없다. 붙이는 순간이 우리 지면의 값이다.
 *
 * ⚠ 목록에 있다고 **살 수 있는 것이 아니다.** 「매도만 가능」·「매매불가」가 섞여 있다.
 *   그래서 종목 수만 세면 틀린 그림이 나온다. 살 수 있는 것과 아닌 것을 갈라 센다.
 *
 * 쓰는 법
 *   node scripts/collect-kofia-fractional.mjs            받아서 src/data/kofia/ 에 넣는다
 *   node scripts/collect-kofia-fractional.mjs --selftest 규칙만 잰다 (내려받지 않는다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
const 뿌리 = path.resolve(여기, '..');
const { 시트읽기 } = await import(pathToFileURL(path.join(여기, 'lib', 'xlsx-read.mjs')).href);

export const 자료판 = {
  게시판: 'https://www.kofia.or.kr/brd/m_52/list.do',
  첨부: 'https://www.kofia.or.kr/brd/m_52/down.do?brd_id=www_default&seq=263&data_tp=A&file_seq=1',
  기준일: '2026-02-27', // 게시판 작성일. 협회가 이 날짜 기준이라고 밝혀 둔 것이다
  제목: '증권사별 국내주식 소수점 매매 가능 종목 목록',
};

/** 파일 이름에서 증권사를 뽑는다. `…목록(KB증권).xlsx` → `KB증권` */
export function 증권사이름(파일명) {
  const m = 파일명.match(/\(([^()]+)\)\s*\.xlsx$/i);
  return m ? m[1].trim() : null;
}

/**
 * `A005930` → `005930`. 여섯 자리가 아니면 null 을 준다 — 조용히 넘기지 않는다.
 *
 * ⚠ **한국 종목코드는 숫자만이 아니다.** `00088K`(한화3우B) · `0126Z0`(신주인수권증서)처럼
 *   글자가 섞인다. 처음에 `\d{6}` 으로 잡았다가 KB증권 목록에서 걸렸다 — 검사가 잡아 줬다.
 *   첫 자리는 늘 숫자라 그것만 붙들어 「합계」 같은 말줄과 가른다.
 */
export function 종목코드(칸) {
  const s = String(칸 ?? '').trim().toUpperCase();
  const m = s.match(/^A?(\d[0-9A-Z]{5})$/);
  return m ? m[1] : null;
}

/**
 * 증권사마다 「비고」에 적는 말이 다르다. 세 갈래로 모은다.
 * ⛔ 모르는 말이 나오면 **정상으로 밀어 넣지 않는다.** 그대로 들고 나가 사람이 보게 한다.
 */
export function 매매상태(비고) {
  const s = String(비고 ?? '').replace(/\s+/g, '').trim();
  if (!s || s === '정상' || s === '매매가능') return '정상';
  if (s.includes('매도만')) return '매도만';
  if (s.includes('매매불가') || s.includes('불가')) return '불가';
  return `기타:${s}`;
}

/** NH·신한은 종목명 뒤에 「보통주」를 붙여 둔다. 견주려면 떼야 한다. */
export function 종목명다듬기(이름) {
  return String(이름 ?? '')
    .trim()
    .replace(/보통주$/, '')
    .trim();
}

/** 한 증권사 시트를 {코드, 이름, 상태} 줄로 편다. */
export function 시트풀기(줄들, 증권사) {
  const 머리 = 줄들.findIndex((r) => r[0] === '구분' && r[1] === '종목번호');
  if (머리 < 0) throw new Error(`${증권사}: 머리줄(구분·종목번호)을 못 찾았다 — 서식이 바뀌었다`);

  const 나온것 = [];
  const 못읽은것 = [];
  for (const r of 줄들.slice(머리 + 1)) {
    if (!r || !r[1]) continue;
    const 코드 = 종목코드(r[1]);
    if (!코드) {
      못읽은것.push(r[1]);
      continue;
    }
    나온것.push({ 코드, 이름: 종목명다듬기(r[2]), 상태: 매매상태(r[3]) });
  }
  if (!나온것.length) throw new Error(`${증권사}: 한 줄도 못 읽었다`);
  if (못읽은것.length) throw new Error(`${증권사}: 종목번호가 아닌 칸 ${못읽은것.length}개 — ${못읽은것.slice(0, 5).join(', ')}`);
  return 나온것;
}

/**
 * 여덟 장을 한 표로 붙인다.
 * 열쇠는 **종목코드**다. 이름은 증권사마다 달라서(「CJ대한통운」·「씨제이대한통운보통주」)
 * 이름으로 붙이면 같은 종목이 둘로 갈라진다.
 */
export function 붙이기(증권사별) {
  const 종목 = new Map();
  for (const [증권사, 줄들] of Object.entries(증권사별)) {
    for (const { 코드, 이름, 상태 } of 줄들) {
      if (!종목.has(코드)) 종목.set(코드, { 코드, 이름들: new Map(), 증권사: {} });
      const t = 종목.get(코드);
      t.증권사[증권사] = 상태;
      if (이름) t.이름들.set(이름, (t.이름들.get(이름) ?? 0) + 1);
    }
  }

  const 목록 = [...종목.values()]
    .map((t) => {
      // 가장 여러 증권사가 같이 쓰는 이름을 대표로 삼는다. 같으면 짧은 쪽 — 군더더기가 적다
      const 이름 = [...t.이름들.entries()].sort(
        (a, b) => b[1] - a[1] || a[0].length - b[0].length
      )[0]?.[0] ?? '';
      const 곳 = Object.keys(t.증권사);
      return {
        코드: t.코드,
        이름,
        증권사수: 곳.length,
        살수있는곳: 곳.filter((c) => t.증권사[c] === '정상').length,
        증권사: t.증권사,
      };
    })
    .sort((a, b) => b.증권사수 - a.증권사수 || a.코드.localeCompare(b.코드));

  return 목록;
}

/** 요약. 지면에 그대로 쓰는 숫자라 여기서 한 번만 센다. */
export function 요약(목록, 증권사별) {
  const 이름들 = Object.keys(증권사별).sort();
  return {
    증권사수: 이름들.length,
    종목수: 목록.length,
    모두가되는종목: 목록.filter((t) => t.증권사수 === 이름들.length).length,
    한곳만되는종목: 목록.filter((t) => t.증권사수 === 1).length,
    증권사별: Object.fromEntries(
      이름들.map((c) => {
        const 줄 = 증권사별[c];
        const 셈 = { 정상: 0, 매도만: 0, 불가: 0, 기타: 0 };
        for (const r of 줄) 셈[r.상태.startsWith('기타') ? '기타' : r.상태]++;
        return [c, { 올린종목: 줄.length, ...셈 }];
      })
    ),
  };
}

/* ── 받아 오기 ─────────────────────────────────────────────────────── */

async function 받기() {
  const r = await fetch(자료판.첨부, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
      Referer: 자료판.게시판,
    },
  });
  if (!r.ok) throw new Error(`협회 첨부를 못 받았다 — HTTP ${r.status}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.readUInt32LE(0) !== 0x04034b50) throw new Error('받은 것이 zip 이 아니다 — 게시판 서식이 바뀌었을 수 있다');
  return buf;
}

async function 하기() {
  const { 집풀기 } = await import(pathToFileURL(path.join(여기, 'lib', 'xlsx-read.mjs')).href);
  console.log(`협회 자료실에서 「${자료판.제목}」을 받는다 (기준일 ${자료판.기준일})`);
  const zip = await 받기();
  const 안에것 = 집풀기(zip);

  const 증권사별 = {};
  for (const [이름, 몸통] of 안에것) {
    if (!이름.toLowerCase().endsWith('.xlsx')) continue;
    const 증권사 = 증권사이름(이름);
    if (!증권사) throw new Error(`파일 이름에서 증권사를 못 뽑았다 — ${이름}`);
    증권사별[증권사] = 시트풀기(시트읽기(몸통), 증권사);
    console.log(`  ${증권사.padEnd(10)} ${String(증권사별[증권사].length).padStart(5)}종목`);
  }
  if (Object.keys(증권사별).length < 2) throw new Error('증권사가 둘도 안 나왔다 — zip 안이 바뀌었다');

  const 목록 = 붙이기(증권사별);
  const 셈 = 요약(목록, 증권사별);

  const 낼것 = {
    출처: { ...자료판, 받은날: new Date().toISOString().slice(0, 10) },
    조심할것: '목록에 있다고 살 수 있는 것이 아니다. 「매도만 가능」·「매매불가」가 섞여 있다.',
    요약: 셈,
    종목: 목록,
  };

  const 낼곳 = path.join(뿌리, 'src', 'data', 'kofia');
  fs.mkdirSync(낼곳, { recursive: true });
  const 파일 = path.join(낼곳, 'fractional-shares.json');
  fs.writeFileSync(파일, JSON.stringify(낼것, null, 2) + '\n', 'utf8');

  console.log(`\n증권사 ${셈.증권사수}곳 · 종목 ${셈.종목수}개`);
  console.log(`  여덟 곳 다 되는 종목   ${셈.모두가되는종목}개`);
  console.log(`  한 곳에서만 되는 종목  ${셈.한곳만되는종목}개`);
  console.log(`→ ${path.relative(뿌리, 파일)}`);
}

/* ── 스스로 검사 ───────────────────────────────────────────────────── */

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 재기 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(
      `${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `\n   본 것 ${JSON.stringify(본것)}\n   바란 것 ${JSON.stringify(바란것)}`}`
    );
  };

  재기('증권사이름', 증권사이름('국내주식 소수점 매매 가능 종목 목록(KB증권).xlsx'), 'KB증권');
  재기('증권사이름 — 괄호 없으면 null', 증권사이름('아무거나.xlsx'), null);
  재기('종목코드 A 를 뗀다', 종목코드('A005930'), '005930');
  재기('종목코드 A 없어도 된다', 종목코드('005930'), '005930');
  재기('종목코드 아니면 null', 종목코드('합계'), null);
  재기('종목코드 — 글자가 섞인 것도 받는다', 종목코드('A00088K'), '00088K');
  재기('종목코드 — 신주인수권증서도 받는다', 종목코드('A0126Z0'), '0126Z0');
  재기('종목코드 — 첫 자리가 글자면 아니다', 종목코드('AAPL12'), null);
  재기('매매상태 빈칸은 정상', 매매상태(''), '정상');
  재기('매매상태 정상', 매매상태('정상'), '정상');
  재기('매매상태 매도만', 매매상태('매도만 가능'), '매도만');
  재기('매매상태 불가', 매매상태('매매불가'), '불가');
  재기('⛔ 모르는 말은 정상으로 밀지 않는다', 매매상태('신규상장'), '기타:신규상장');
  재기('종목명 보통주를 뗀다', 종목명다듬기('씨제이대한통운보통주'), '씨제이대한통운');
  재기('종목명 보통주가 없으면 그대로', 종목명다듬기('CJ대한통운'), 'CJ대한통운');

  // 시트풀기 — 머리줄을 못 찾으면 던진다
  let 던졌나 = false;
  try {
    시트풀기([['아무말'], ['도', '없다']], '가짜증권');
  } catch {
    던졌나 = true;
  }
  재기('⛔ 머리줄이 없으면 던진다', 던졌나, true);

  // 종목번호가 아닌 칸이 있으면 던진다 — 조용히 버리면 종목 수가 줄어든 걸 아무도 모른다
  던졌나 = false;
  try {
    시트풀기(
      [
        ['구분', '종목번호', '종목명', '비고'],
        ['1', 'A005930', '삼성전자', ''],
        ['2', '합계', '', ''],
      ],
      '가짜증권'
    );
  } catch {
    던졌나 = true;
  }
  재기('⛔ 종목번호가 아닌 칸이 있으면 던진다', 던졌나, true);

  const 가짜 = {
    가증권: [
      { 코드: '005930', 이름: '삼성전자', 상태: '정상' },
      { 코드: '000660', 이름: 'SK하이닉스', 상태: '매도만' },
    ],
    나증권: [
      { 코드: '005930', 이름: '삼성전자보통주'.replace('보통주', ''), 상태: '정상' },
      { 코드: '005380', 이름: '현대차', 상태: '불가' },
    ],
  };
  const 붙인것 = 붙이기(가짜);
  재기('붙이기 — 종목 셋', 붙인것.length, 3);
  재기('붙이기 — 둘 다 있는 것이 맨 앞', 붙인것[0].코드, '005930');
  재기('붙이기 — 증권사수', 붙인것[0].증권사수, 2);
  재기('붙이기 — 살 수 있는 곳만 센다', 붙인것.find((t) => t.코드 === '000660').살수있는곳, 0);

  const 셈 = 요약(붙인것, 가짜);
  재기('요약 — 모두가 되는 종목 하나', 셈.모두가되는종목, 1);
  재기('요약 — 한 곳만 되는 종목 둘', 셈.한곳만되는종목, 2);
  재기('요약 — 증권사별 매도만 하나', 셈.증권사별.가증권.매도만, 1);

  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

if (!process.argv.includes('--selftest')) await 하기();
