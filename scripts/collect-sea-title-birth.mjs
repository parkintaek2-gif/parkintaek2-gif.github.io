/**
 * **한 작품이 각 나라 위키피디아에 「적힌 날」을 받는다.**
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 92편이 「파도 앞의 바닥」을 재려다 막혔다 — **신작에는 「전」이 없다.** 문서가 작품과
 * 함께 생기기 때문이다. 서른다섯 중 스물아홉이 그래서 빠졌다.
 *
 * ⭐ 그 빠진 것이 이 자의 자료다. **신작에는 바닥이 없는 대신 생일이 있다.**
 *   물음 — 한국 작품이 나오면, 어느 나라가 그것을 **먼저 적는가.**
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **읽힌 첫 달을 생일로 쓰지 않는다.** 그건 「문서가 생긴 날」이 아니라
 *    「그 달에 누가 읽었다」이다. 첫 판(first revision) 날짜를 **직접 받는다.**
 * ⛔ **없는 문서를 늦은 것으로 세지 않는다.** 안 적힌 것과 늦게 적힌 것은 다른 일이다.
 *    ⚠ 없는 것을 「무한히 늦음」으로 넣으면 중앙값이 거짓말을 한다.
 * ⛔⛔ **못 받은 것을 「안 적힘」으로 세지 않는다.** 이 자를 처음 돌렸을 때 429 에 막혔는데,
 *    그때 코드는 못 받은 판을 그냥 빼서 「그 나라엔 문서가 없다」로 세고 있었다.
 *    ⚠ 내 그물에 안 걸린 것과 세상에 없는 것은 다른 일이다. `못받음` 을 따로 적는다.
 * ⛔ **한국어판을 기준으로 삼되, 한국어판이 더 늦은 경우를 지우지 않는다.**
 *    음수가 나오면 그대로 싣는다. 그것도 사실이다.
 * ⛔ 429 를 만나면 물러섰다 다시 묻는다. 던지지 않는다 — 한 번 막혔다고 전부 버리면 안 된다.
 * ⛔ 남의 자료를 안 건드린다. 내 원본은 `archive/raw/wikipedia/` 안에만 쓴다.
 *
 * 🔴 **`redirects=1` 이 없으면 넘김 문서는 빈 것으로 돌아온다.** 8/14 에 물렸다.
 * 🔴 이 자를 **import 만 해도 돌면 안 된다.** 8/15 에 그 덫에 걸려 위키미디어를 백 번
 *    두드리고 원본 파일까지 덮어썼다. 실행부는 `내가실행됐다` 안에만 둔다.
 *
 * 쓰는 법
 *   node scripts/collect-sea-title-birth.mjs
 *   node scripts/collect-sea-title-birth.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 원본길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-title-birth.json');
export const 파도길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-title-waves.json');

/** ⚠ 한국어판이 기준이다 — 「한국이 적은 뒤 몇 달 만에」를 잰다 */
export const 기준판 = 'ko';
export const 볼판들 = ['id', 'vi', 'th', 'ms'];
export const 판이름 = {
  ko: 'Korean', id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay',
};

/** ⛔ 「못 받았다」의 표. **`null`(문서 없음)과 절대 섞지 않는다** */
export const 못받음 = '못받음';

/** 첫 판 날짜를 묻는 주소. ⛔ `redirects=1` 을 빼면 넘김 문서가 빈 것으로 온다 */
export function 첫판주소(판, 제목) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2',
    prop: 'revisions', rvprop: 'timestamp', rvdir: 'newer', rvlimit: '1',
    redirects: '1', titles: 제목,
  });
  return `https://${판}.wikipedia.org/w/api.php?${q}`;
}

/** ⭐ 답에서 첫 판 날짜만 꺼낸다. 없는 문서면 null — **늦은 것이 아니라 없는 것이다** */
export function 첫판꺼내기(답) {
  const p = 답?.query?.pages?.[0];
  if (!p || p.missing || p.invalid) return null;
  const t = p.revisions?.[0]?.timestamp;
  return typeof t === 'string' && /^\d{4}-\d{2}/.test(t) ? t.slice(0, 7) : null;
}

/** `2021-09` 두 개 사이의 개월 수. ⛔ 날짜 셈을 손으로 하지 않는다 */
export function 달차이(앞, 뒤) {
  if (!앞 || !뒤) return null;
  const [ay, am] = 앞.split('-').map(Number);
  const [by, bm] = 뒤.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

/**
 * ⭐ 한 작품의 생일들을 하나로 묶는다.
 * ⛔ **없는 판을 늦은 것으로 세지 않는다.** `notWritten` 으로 따로 센다.
 */
export function 한작품재기(생일들, 기준 = 기준판, 볼것 = 볼판들) {
  const 밑 = 생일들[기준] === 못받음 ? null : (생일들[기준] ?? null);
  const 잰것 = {}; const 안적힘 = []; const 못받은판 = [];
  for (const p of 볼것) {
    /* ⛔⛔ 못 받은 것을 「안 적힘」에 넣지 않는다 — 그건 세상이 아니라 내 그물 이야기다 */
    if (생일들[p] === 못받음) { 못받은판.push(p); continue; }
    if (!생일들[p]) { 안적힘.push(p); continue; }
    잰것[p] = 밑 ? 달차이(밑, 생일들[p]) : null;
  }
  const 값들 = Object.values(잰것).filter((v) => typeof v === 'number');
  return {
    koreanFirstWritten: 밑,
    monthsAfterKorean: 잰것,
    notWritten: 안적힘,
    couldNotFetch: 못받은판,
    /* ⭐ 「누가 먼저 적었나」 — 값이 있어야만 말한다 */
    firstOfTheFour: 값들.length
      ? Object.entries(잰것).filter(([, v]) => typeof v === 'number')
        .sort((a, b) => a[1] - b[1])[0][0]
      : null,
    measuredEditions: 값들.length,
  };
}

/** 중앙값. ⚠ 표본이 작으면 `build-wikitip-one-out.mjs` 의 하나빼기를 같이 낸다 */
export function 중앙값(값들) {
  const s = [...값들].filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

if (process.argv.includes('--selftest')) {
  const 잼 = []; const 참 = (n, v) => 잼.push([n, !!v]);

  참('🔴 넘김을 따라간다', 첫판주소('id', 'X').includes('redirects=1'));
  참('첫 판부터 하나만 받는다',
    첫판주소('id', 'X').includes('rvdir=newer') && 첫판주소('id', 'X').includes('rvlimit=1'));
  참('⚠ `&` 가 든 제목이 새지 않는다',
    첫판주소('id', 'Johnny & Associates').includes('Johnny+%26+Associates'));
  참('판이 주소에 든다', 첫판주소('th', 'X').startsWith('https://th.wikipedia.org/'));

  참('첫 판 달을 꺼낸다',
    첫판꺼내기({ query: { pages: [{ revisions: [{ timestamp: '2021-09-18T03:00:00Z' }] }] } }) === '2021-09');
  참('⛔ 없는 문서는 null', 첫판꺼내기({ query: { pages: [{ missing: true }] } }) === null);
  참('⛔ 빈 답도 null', 첫판꺼내기({}) === null && 첫판꺼내기(null) === null);
  참('⛔ 판이 비면 null', 첫판꺼내기({ query: { pages: [{ revisions: [] }] } }) === null);

  참('달 차이를 센다', 달차이('2021-09', '2021-10') === 1);
  참('해를 넘어도 센다', 달차이('2020-11', '2021-02') === 3);
  참('⭐ 뒤가 앞서면 음수', 달차이('2021-05', '2021-02') === -3);
  참('같은 달은 0', 달차이('2021-09', '2021-09') === 0);
  참('⛔ 한쪽이 없으면 null', 달차이(null, '2021-09') === null && 달차이('2021-09', null) === null);

  const r = 한작품재기({ ko: '2021-06', id: '2021-09', vi: '2021-07', th: null, ms: '2022-01' });
  참('한국 뒤 몇 달인지 잰다', r.monthsAfterKorean.id === 3 && r.monthsAfterKorean.vi === 1);
  참('⛔ 안 적힌 판을 늦은 것으로 안 센다',
    r.notWritten.includes('th') && !('th' in r.monthsAfterKorean));
  참('⭐ 넷 중 먼저 적은 곳을 짚는다', r.firstOfTheFour === 'vi');
  참('잰 판 수를 센다', r.measuredEditions === 3);

  /* ⚠ 한국어판이 없으면 견줄 밑이 없다 — 「0달」이 아니라 「못 잼」이다 */
  const 밑없음 = 한작품재기({ ko: null, id: '2021-09' });
  참('⛔ 밑이 없으면 값을 지어내지 않는다',
    밑없음.monthsAfterKorean.id === null && 밑없음.measuredEditions === 0);
  참('⛔ 밑이 없으면 먼저도 못 짚는다', 밑없음.firstOfTheFour === null);

  /* 🔴 처음 돌렸을 때 429 에 막혔고, 그때 못 받은 판이 「안 적힘」으로 세어졌다 */
  const 못받은것 = 한작품재기({ ko: '2021-06', id: 못받음, vi: '2021-07', th: null });
  참('⛔⛔ 못 받은 것을 「안 적힘」으로 안 센다',
    !못받은것.notWritten.includes('id') && 못받은것.couldNotFetch.includes('id'));
  참('⭐ 안 적힌 것은 그대로 안 적힘', 못받은것.notWritten.includes('th'));
  참('⛔ 못 받은 판은 값도 안 낸다', !('id' in 못받은것.monthsAfterKorean));
  참('⭐ 못 받은 것이 있어도 받은 것은 잰다', 못받은것.monthsAfterKorean.vi === 1);
  /* ⚠ 밑을 못 받았으면 밑이 없는 것과 같이 다뤄야 한다 — 「0달」이 아니다 */
  참('⛔ 한국어판을 못 받았으면 견주지 않는다',
    한작품재기({ ko: 못받음, id: '2021-09' }).monthsAfterKorean.id === null);

  /* ⭐ 한국어판이 더 늦은 경우를 지우지 않는다 */
  const 늦은한국 = 한작품재기({ ko: '2022-01', id: '2021-09' });
  참('⭐ 한국이 더 늦으면 음수 그대로', 늦은한국.monthsAfterKorean.id === -4);

  참('중앙값 홀수', 중앙값([1, 5, 3]) === 3);
  참('중앙값 짝수', 중앙값([1, 3, 5, 7]) === 4);
  참('⛔ 빈 것은 null', 중앙값([]) === null);
  참('⛔ 수 아닌 것을 안 센다', 중앙값([1, null, 3, undefined]) === 2);

  참('기준판이 볼 판에 안 들어 있다', !볼판들.includes(기준판));
  참('판마다 영어 이름이 있다',
    [기준판, ...볼판들].every((p) => (판이름[p] ?? '').length > 2));
  참('⛔ 판 이름에 한글이 없다',
    !Object.values(판이름).some((v) => /[가-힣]/.test(v)));
  참('⭐ 파도 자료가 있다 (여기서 제목을 가져온다)', fs.existsSync(파도길));

  const 진 = 잼.filter(([, ok]) => !ok);
  console.log(`자가시험 ${잼.length}개 · ${진.length ? `🔴 ${진.length}개 실패` : '✅ 전부 통과'}`);
  for (const [n] of 진) console.log(`   🔴 ${n}`);
  process.exit(진.length ? 1 : 0);
}

/**
 * ⛔ **여기부터는 직접 실행할 때만 돈다.**
 * 🔴 8/15 에 물렸다 — 상수만 가져오려고 import 했는데 수집기가 통째로 돌았다.
 */
const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다) {
  const 잠깐 = (ms) => new Promise((r) => { setTimeout(r, ms); });

  /** ⛔ 429 에 던지지 않는다. 물러섰다 다시 묻고, 끝내 못 받으면 그렇게 적는다 */
  async function 받기(주소, 남은 = 4, 쉼 = 700) {
    try {
      const r = await fetch(주소, { headers: { 'User-Agent': 'KCultureWire/1.0 (kculturewire.com)' } });
      if (r.status === 429 || r.status >= 500) throw new Error(String(r.status));
      if (!r.ok) return 못받음;
      return await r.json();
    } catch (e) {
      if (남은 <= 0) return 못받음;
      await 잠깐(쉼);
      return 받기(주소, 남은 - 1, 쉼 * 2);
    }
  }

  const 파도 = JSON.parse(fs.readFileSync(파도길, 'utf8'));
  console.log(`작품 ${파도.articles.length}편 · 판 ${[기준판, ...볼판들].join(' ')}`);

  /**
   * ⭐ **이미 받은 것은 다시 안 묻는다.** 429 에 한 번 막혀 295 요청을 통째로 버렸다.
   * ⚠ 못받음 은 이어받기에서 **안 받은 것으로 친다** — 그건 답이 아니라 실패다.
   */
  const 이전 = fs.existsSync(원본길)
    ? Object.fromEntries((JSON.parse(fs.readFileSync(원본길, 'utf8')).titles ?? [])
      .map((t) => [t.titleEn, t.births ?? {}]))
    : {};
  if (Object.keys(이전).length) console.log(`⭐ 앞서 받은 ${Object.keys(이전).length}편이 있다 — 빈 것만 묻는다`);

  /** ⭐ 지금까지 받은 것을 그대로 쓴다. 죽어도 여기까지는 남는다 */
  const 저장하기 = (받은것, 못받은수) => {
    fs.mkdirSync(path.dirname(원본길), { recursive: true });
    fs.writeFileSync(원본길, `${JSON.stringify({
      generatedAt: new Date().toISOString().slice(0, 10),
      source: 'Wikipedia API — first revision of each article (action=query&prop=revisions&rvdir=newer)',
      baseEdition: 기준판,
      editions: 볼판들,
      editionNames: 판이름,
      complete: 받은것.length === 파도.articles.length && 못받은수 === 0,
      titles: 받은것,
      couldNotFetch: 못받은수,
    }, null, 1)}\n`);
  };

  const 나온것 = []; let 못받은수 = 0; let 물은수 = 0;
  for (const a of 파도.articles) {
    const 생일들 = {};
    /* ⚠ 한국어판 제목은 파도 자료에 없다 — 영어 제목으로 묻는다.
       ko 위키가 영어 제목을 넘김으로 갖고 있으면 `redirects=1` 이 따라간다 */
    const 제목들 = { [기준판]: a.titleEn, ...a.titles };
    for (const [판, 제목] of Object.entries(제목들)) {
      if (!제목) continue;
      const 앞것 = 이전[a.titleEn]?.[판];
      if (앞것 !== undefined && 앞것 !== 못받음) { 생일들[판] = 앞것; continue; }
      const 답 = await 받기(첫판주소(판, 제목));
      물은수 += 1;
      /* ⛔⛔ 못 받은 것을 「문서 없음(null)」으로 적지 않는다 */
      생일들[판] = 답 === 못받음 ? 못받음 : 첫판꺼내기(답);
      if (답 === 못받음) 못받은수 += 1;
      await 잠깐(1100);   // ⚠ 120ms·600ms 로 돌렸다가 둘 다 429 에 막혔다. 초당 한 번 아래로 둔다
    }
    나온것.push({ titleEn: a.titleEn, titles: 제목들, births: 생일들, ...한작품재기(생일들) });
    process.stdout.write(Object.values(생일들).includes(못받음) ? '!' : '.');
    /**
     * 🔴🔴 **작품마다 저장한다.** 8/15 에 스물한 편을 받고 죽었는데 파일이 없었다 —
     *   이어받기를 만들어 놓고 **중간 저장을 안 해서** 이어받을 것이 없었다.
     *   ⛔ 이어받기는 저장 없이는 아무것도 아니다.
     */
    저장하기(나온것, 못받은수);
  }
  console.log(`\n물은 것 ${물은수}건 · 못 받은 것 ${못받은수}건`);

  저장하기(나온것, 못받은수);

  const 잰것 = 나온것.filter((t) => t.measuredEditions > 0);
  console.log(`\n한국어판 생일을 아는 작품 ${나온것.filter((t) => t.koreanFirstWritten).length}편`);
  console.log(`한 판이라도 견준 작품 ${잰것.length}편 · 못 받은 것 ${못받은수}건`);
  for (const p of 볼판들) {
    const v = 잰것.map((t) => t.monthsAfterKorean[p]).filter((x) => typeof x === 'number');
    const 안적힘 = 나온것.filter((t) => t.notWritten.includes(p)).length;
    const 못받음수 = 나온것.filter((t) => t.couldNotFetch.includes(p)).length;
    console.log(`  ${판이름[p].padEnd(11)} 잰 것 ${String(v.length).padStart(2)}편 · `
      + `중앙 ${String(중앙값(v)).padStart(5)}달 · 안 적힌 것 ${안적힘}편`
      + (못받음수 ? ` · 🔴 못 받은 것 ${못받음수}편` : ''));
  }
  /* ⛔ 못 받은 것이 남았으면 그대로 말한다. 다시 돌리면 그것만 묻는다 */
  if (못받은수) console.log(`\n🔴 ${못받은수}건을 못 받았다 — **다시 돌리면 그것만 묻는다.**`);
  console.log(`\n원본 → ${path.relative(뿌리, 원본길)}`);
}
