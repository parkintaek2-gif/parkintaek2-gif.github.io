/**
 * 아주 작은 xlsx 읽기. 의존성을 붙이지 않으려고 직접 푼다.
 *
 * xlsx 는 zip 안에 XML 이 든 것이다. 우리가 받는 표는
 * 「머리줄 한 줄 + 문자열 칸」뿐이라 서식·수식·날짜를 해석할 일이 없다.
 * ⛔ 그래서 이것은 **범용 파서가 아니다.** 숫자는 있는 그대로, 날짜는 일련번호로 나온다.
 *   범용이 필요해지면 그때 라이브러리를 붙인다. 지금 붙이면 안 쓰는 코드를 지고 간다.
 */
import zlib from 'node:zlib';

/** zip 중앙 디렉터리를 읽어 {이름: 버퍼} 로 편다. deflate 와 무압축만 푼다. */
export function 집풀기(buf) {
  const 끝 = 중앙끝찾기(buf);
  if (끝 < 0) throw new Error('zip 이 아니다 — 중앙 디렉터리 끝(EOCD)이 없다');
  const 개수 = buf.readUInt16LE(끝 + 10);
  let p = buf.readUInt32LE(끝 + 16);

  const 나온것 = new Map();
  for (let i = 0; i < 개수; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`중앙 디렉터리 ${i}번째가 깨졌다`);
    const 압축법 = buf.readUInt16LE(p + 10);
    const 이름길이 = buf.readUInt16LE(p + 28);
    const 여분길이 = buf.readUInt16LE(p + 30);
    const 주석길이 = buf.readUInt16LE(p + 32);
    const 압축크기 = buf.readUInt32LE(p + 20);
    const 시작 = buf.readUInt32LE(p + 42);
    const 이름 = buf.toString('utf8', p + 46, p + 46 + 이름길이);

    // 로컬 헤더는 길이가 중앙 것과 다를 수 있어 여기서 다시 읽는다
    const 로컬이름길이 = buf.readUInt16LE(시작 + 26);
    const 로컬여분길이 = buf.readUInt16LE(시작 + 28);
    const 자료시작 = 시작 + 30 + 로컬이름길이 + 로컬여분길이;
    const 몸통 = buf.subarray(자료시작, 자료시작 + 압축크기);

    if (압축법 === 0) 나온것.set(이름, Buffer.from(몸통));
    else if (압축법 === 8) 나온것.set(이름, zlib.inflateRawSync(몸통));
    else throw new Error(`${이름}: 모르는 압축법 ${압축법}`);

    p += 46 + 이름길이 + 여분길이 + 주석길이;
  }
  return 나온것;
}

function 중앙끝찾기(buf) {
  // EOCD 는 뒤에서 찾는다. 주석이 붙어 있을 수 있어 66KB 까지 훑는다.
  const 바닥 = Math.max(0, buf.length - 66000);
  for (let i = buf.length - 22; i >= 바닥; i--) if (buf.readUInt32LE(i) === 0x06054b50) return i;
  return -1;
}

const 되돌림 = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
export function 엔티티풀기(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&(lt|gt|amp|quot|apos);/g, (_, n) => 되돌림[n]);
}

/** <t> 조각을 모아 한 칸의 글자로 만든다. 서식이 나뉘어 여러 <t> 로 쪼개져 있을 수 있다. */
function 글자모으기(xml) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => 엔티티풀기(m[1])).join('');
}

/** A1 → 0, B1 → 1, AA1 → 26 */
export function 칸번호(주소) {
  const m = 주소.match(/^([A-Z]+)/);
  if (!m) return 0;
  let n = 0;
  for (const c of m[1]) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/**
 * 첫 시트를 줄 배열로 읽는다. 각 줄은 글자 배열이다.
 * 빈 칸은 '' 로 채워 **자리가 밀리지 않게** 한다 — 밀리면 열이 통째로 어긋난다.
 */
export function 시트읽기(zipBuf) {
  const 파일 = 집풀기(zipBuf);

  const ss = 파일.get('xl/sharedStrings.xml');
  const 공용글자 = ss
    ? [...ss.toString('utf8').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => 글자모으기(m[1]))
    : [];

  const 시트이름 =
    [...파일.keys()].filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort()[0];
  if (!시트이름) throw new Error('시트가 없다');
  const xml = 파일.get(시트이름).toString('utf8');

  const 줄들 = [];
  for (const r of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const 줄 = [];
    for (const c of r[1].matchAll(/<c\s([^>]*?)\/?>([\s\S]*?)(?:<\/c>|$)/g)) {
      const 속성 = c[1];
      const 몸 = c[2];
      const 주소 = (속성.match(/r="([A-Z]+\d+)"/) || [, ''])[1];
      const 형 = (속성.match(/t="([^"]+)"/) || [, ''])[1];
      let 값;
      if (형 === 's') {
        const i = Number((몸.match(/<v>(\d+)<\/v>/) || [, '-1'])[1]);
        값 = 공용글자[i] ?? '';
      } else if (형 === 'inlineStr') {
        값 = 글자모으기(몸);
      } else {
        값 = 엔티티풀기((몸.match(/<v>([\s\S]*?)<\/v>/) || [, ''])[1]);
      }
      const i = 주소 ? 칸번호(주소) : 줄.length;
      while (줄.length < i) 줄.push('');
      줄[i] = String(값).trim();
    }
    줄들.push(줄);
  }
  return 줄들;
}

/* ── 스스로 검사 ───────────────────────────────────────────────────────
   규칙은 문장이 아니라 검사로 둔다. `node scripts/lib/xlsx-read.mjs --selftest`  */
// ⚠ **직접 실행했을 때만 잰다.** 이 걸이가 없으면 이 파일을 불러다 쓰는 쪽이
//   `--selftest` 로 돌 때 여기가 먼저 튀어나와 process.exit 로 남의 검사를 끊는다. 한 번 당했다.
const 직접돌린다 =
  process.argv[1] && (await import('node:url')).pathToFileURL(process.argv[1]).href === import.meta.url;

if (직접돌린다 && process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 재기 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `\n   본 것 ${JSON.stringify(본것)}\n   바란 것 ${JSON.stringify(바란것)}`}`);
  };

  재기('칸번호 A → 0', 칸번호('A1'), 0);
  재기('칸번호 B → 1', 칸번호('B12'), 1);
  재기('칸번호 Z → 25', 칸번호('Z3'), 25);
  재기('칸번호 AA → 26', 칸번호('AA7'), 26);
  재기('칸번호 AB → 27', 칸번호('AB7'), 27);
  재기('엔티티 &amp; 를 되돌린다', 엔티티풀기('AT&amp;T'), 'AT&T');
  재기('엔티티 숫자꼴을 되돌린다', 엔티티풀기('&#54620;&#44397;'), '한국');

  // 실제 xlsx 하나로 끝까지 재 본다 — 손으로 만든 가짜 zip 은 진짜를 못 잡는다
  const 표본 = process.argv[process.argv.indexOf('--selftest') + 1];
  if (표본) {
    const fs = await import('node:fs');
    const 줄 = 시트읽기(fs.readFileSync(표본));
    재기('줄이 하나 이상 나온다', 줄.length > 0, true);
    console.log(`   ⤷ ${표본}\n   ⤷ ${줄.length}줄 · 머리줄 ${JSON.stringify(줄[0])}`);
    console.log(`   ⤷ 둘째줄 ${JSON.stringify(줄[1])}`);
  } else {
    console.log('⬜ xlsx 표본을 안 줬다 — `--selftest <파일.xlsx>` 로 주면 끝까지 잰다');
  }

  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}
