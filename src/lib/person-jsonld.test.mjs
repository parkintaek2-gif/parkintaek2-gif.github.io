/**
 * person-jsonld.test.mjs — `person-jsonld.ts` 자가시험.
 *
 * 쓰는 법  node src/lib/person-jsonld.test.mjs
 *
 * ⛔ 여기서 지키는 것은 「구조화 데이터가 있나」가 아니라
 *   **「지면에 없는 말을 구조화 데이터가 하지 않나」**다. 둘이 다르면 그게 스팸이다.
 */
import { 사람주소, 같은사람주소들, 태어난날, 나온작품들, 사람구조화 } from './person-jsonld.ts';

let 셈 = 0; let 실패 = 0;
const 검 = (말, 참) => { 셈 += 1; if (!참) { 실패 += 1; console.log('🔴', 말); } };

검('① 우리 주소를 만든다', 사람주소('iu') === 'https://www.kculturewire.com/person/iu');

/* ── 밖으로 잇는 주소 — 들고 있는 것만 ── */
검('② 위키데이터 Q번호가 있으면 잇는다',
  같은사람주소들({ q: 'Q99237221' })[0] === 'https://www.wikidata.org/wiki/Q99237221');
검('③ 영문 위키백과 문서 이름이 있으면 잇는다',
  같은사람주소들({ wikiPage: 'Ha Young (actress)' })[0]
  === 'https://en.wikipedia.org/wiki/Ha%20Young%20(actress)'.replace(/%20/g, '_'));
검('④ 🔴 둘 다 없으면 «빈 목록» — 지어내지 않는다', 같은사람주소들({}).length === 0);
검('⑤ Q번호 꼴이 아니면 안 넣는다', 같은사람주소들({ q: '없음' }).length === 0);

/* ── 태어난 날 — 모르면 안 적는다 ── */
검('⑥ 온전한 날짜만 낸다', 태어난날('1993-08-11') === '1993-08-11');
검('⑦ 🔴 해만 있으면 안 낸다', 태어난날('1993') === null);
검('⑧ 🔴 없으면 null — 추정으로 안 채운다', 태어난날(null) === null && 태어난날('') === null);

/* ── 작품 ── */
const 작품p = {
  titles: [
    { title: 'The Trauma Code', slug: 'the-trauma-code', type: 'TV' },
    { title: 'Some Film', slug: 'some-film', type: 'Film' },
    { title: 'No Page Title', slug: 'no-page', type: 'TV' },
  ],
};
const 있는 = new Set(['the-trauma-code', 'some-film']);
const 목록 = 나온작품들(작품p, 있는);
검('⑨ 드라마는 TVSeries 다', 목록[0]['@type'] === 'TVSeries');
검('⑩ 영화는 Movie 다', 목록[1]['@type'] === 'Movie');
검('⑪ 🔴 지면이 있는 작품만 url 을 붙인다',
  목록[0].url === 'https://www.kculturewire.com/title/the-trauma-code' && !('url' in 목록[2]));
검('⑫ ⚠ 지면이 없어도 «이름은» 낸다', 목록[2].name === 'No Page Title');
검('⑬ 표를 안 주면 다 붙인다(못 잰 것으로 본다)',
  나온작품들(작품p, null).every((t) => 'url' in t));
검('⑭ 이름 없는 줄은 뺀다', 나온작품들({ titles: [{ slug: 'x' }] }).length === 0);

/* ── 통째로 ── */
const 온전 = 사람구조화({
  name: 'Ha Young', slug: 'ha-young', q: 'Q99237221',
  wikiPage: 'Ha Young (actress)', born: '1993-08-11',
  titles: [{ title: 'The Trauma Code', slug: 'the-trauma-code', type: 'TV' }],
}, 있는);
검('⑮ ProfilePage 로 감싼다', 온전['@type'] === 'ProfilePage');
검('⑯ 알맹이는 Person 이다', 온전.mainEntity['@type'] === 'Person');
검('⑰ 생일을 넣는다', 온전.mainEntity.birthDate === '1993-08-11');
검('⑱ 밖으로 잇는 주소가 둘이다', 온전.mainEntity.sameAs.length === 2);
검('⑲ 나온 작품이 붙는다', 온전.mainEntity.performerIn.length === 1);
검('⑳ 출처를 밝힌다', Array.isArray(온전.isBasedOn) && 온전.isBasedOn.length === 2);

/* 🔴 생일을 모르는 사람 — 지면에도 안 적는 것을 여기에만 적으면 안 된다 */
const 모름 = 사람구조화({ name: 'Nobody', slug: 'nobody', born: null, titles: [] });
검('㉑ 🔴 생일을 모르면 birthDate 를 «안 넣는다»', !('birthDate' in 모름.mainEntity));
검('㉒ 🔴 밖 주소가 없으면 sameAs 를 «안 넣는다»', !('sameAs' in 모름.mainEntity));
검('㉓ 🔴 작품이 없으면 performerIn 을 «안 넣는다»', !('performerIn' in 모름.mainEntity));
검('㉔ 그래도 이름과 주소는 있다',
  모름.mainEntity.name === 'Nobody' && 모름.mainEntity.url.endsWith('/person/nobody'));

/* ⛔ 우리가 판정하지 않는 것 */
검('㉕ ⛔ jobTitle 을 안 쓴다 — 배우인지 가수인지 우리가 정하지 않는다',
  !JSON.stringify(온전).includes('jobTitle'));
검('㉖ ⛔ 「인기」류 낱말이 없다',
  !/popular|famous|best|top star/i.test(JSON.stringify(온전)));

검('㉗ JSON 으로 나간다', (() => { try { JSON.parse(JSON.stringify(온전)); return true; } catch { return false; } })());

console.log(실패 ? `❌ person-jsonld 자가시험 ${실패}개 실패 (${셈})` : `✅ person-jsonld 자가시험 통과 (${셈})`);
process.exitCode = 실패 ? 1 : 0;
