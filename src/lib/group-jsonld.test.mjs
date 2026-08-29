/**
 * group-jsonld.test.mjs — `group-jsonld.ts` 자가시험.
 * 쓰는 법  node src/lib/group-jsonld.test.mjs
 *
 * ⛔ 지키는 것은 「구조화 데이터가 있나」가 아니라
 *   **「지면에 없는 말을 구조화 데이터가 하지 않나」**다.
 */
import { 그룹주소, 태어난날, 멤버들, 그룹구조화 } from './group-jsonld.ts';

let 셈 = 0; let 실패 = 0;
const 검 = (말, 참) => { 셈 += 1; if (!참) { 실패 += 1; console.log('🔴', 말); } };

검('① 그룹 주소를 만든다', 그룹주소('nct') === 'https://www.kculturewire.com/group/nct');
검('② 온전한 날짜만 낸다', 태어난날('1994-06-14') === '1994-06-14');
검('③ 🔴 해만 있으면 안 낸다', 태어난날('1994') === null);
검('④ 🔴 없으면 null', 태어난날(null) === null);

const g = {
  name: 'NCT',
  slug: 'nct',
  members: [
    { name: 'Moon Tae-il', born: '1994-06-14' },
    { name: 'No Birthday', born: null },
    { name: '  ', born: '1990-01-01' },
  ],
};
const 사람문 = new Map([['moon tae-il', 'moon-tae-il']]);
const 다 = 멤버들(g, 사람문);

검('⑤ 이름 있는 멤버만 센다 — 빈 이름은 뺀다', 다.length === 2);
검('⑥ 멤버는 Person 이다', 다[0]['@type'] === 'Person');
검('⑦ 생일을 아는 멤버만 birthDate 를 넣는다',
  다[0].birthDate === '1994-06-14' && !('birthDate' in 다[1]));
검('⑧ 🔴 사람 지면이 있는 멤버만 url 을 붙인다',
  다[0].url === 'https://www.kculturewire.com/person/moon-tae-il' && !('url' in 다[1]));
검('⑨ 표가 없으면 아무에게도 안 붙인다 — 지어내지 않는다',
  멤버들(g, null).every((m) => !('url' in m)));

const j = 그룹구조화(g, 사람문);
검('⑩ ProfilePage 로 감싼다', j['@type'] === 'ProfilePage');
검('⑪ 알맹이는 MusicGroup 이다', j.mainEntity['@type'] === 'MusicGroup');
검('⑫ 멤버가 붙는다', j.mainEntity.member.length === 2);
검('⑬ 출처를 밝힌다', Array.isArray(j.isBasedOn) && j.isBasedOn[0].includes('wikidata'));

const 빈 = 그룹구조화({ name: 'Nobody', slug: 'nobody', members: [] });
검('⑭ 🔴 멤버가 없으면 member 를 «안 넣는다»', !('member' in 빈.mainEntity));
검('⑮ 그래도 이름과 주소는 있다',
  빈.mainEntity.name === 'Nobody' && 빈.mainEntity.url.endsWith('/group/nobody'));

/* ⛔ 우리가 판정하지 않는 것 */
검('⑯ ⛔ genre 를 안 쓴다 — 무슨 갈래 음악인지 우리가 정하지 않는다',
  !JSON.stringify(j).includes('genre'));
검('⑰ ⛔ 「인기」류 낱말이 없다',
  !/popular|famous|best|top group|leading/i.test(JSON.stringify(j)));
검('⑱ ⚠ 「현재 멤버」라고 말하지 않는다 — 자료는 위키데이터가 적어 둔 것이다',
  !/current|currentMember/i.test(JSON.stringify(j)));

검('⑲ JSON 으로 나간다', (() => { try { JSON.parse(JSON.stringify(j)); return true; } catch { return false; } })());

console.log(실패 ? `❌ group-jsonld 자가시험 ${실패}개 실패 (${셈})` : `✅ group-jsonld 자가시험 통과 (${셈})`);
process.exitCode = 실패 ? 1 : 0;
