/**
 * school-jsonld.test.mjs — `school-jsonld.ts` 자가시험.
 * 쓰는 법  node src/lib/school-jsonld.test.mjs
 *
 * ⛔ 여기서 가장 값이 나가는 것은 ⑫⑬ 이다 — 학교 지면이 «순위»로 읽히면 안 된다.
 *   자료 파일이 스스로 「이 학교에 가면 멀리 간다는 뜻이 아니다」라고 적어 두었다.
 */
import { 학교주소, 같은곳주소들, 동문들, 학교구조화 } from './school-jsonld.ts';

let 셈 = 0; let 실패 = 0;
const 검 = (말, 참) => { 셈 += 1; if (!참) { 실패 += 1; console.log('🔴', 말); } };

검('① 학교 주소를 만든다',
  학교주소('ewha-womans-university') === 'https://www.kculturewire.com/school/ewha-womans-university');
검('② 위키데이터 Q번호를 잇는다',
  같은곳주소들({ q: 'Q482649' })[0] === 'https://www.wikidata.org/wiki/Q482649');
검('③ 🔴 Q번호 꼴이 아니면 안 넣는다', 같은곳주소들({ q: '없음' }).length === 0);
검('④ 🔴 없으면 빈 목록', 같은곳주소들({}).length === 0);

const s = {
  name: 'Seoul Institute of the Arts',
  slug: 'seoul-institute-of-the-arts',
  q: 'Q482649',
  top: [{ name: 'Lee You-mi' }, { name: 'No Page Person' }, { name: '   ' }],
};
const 사람문 = new Map([['lee you-mi', 'lee-you-mi']]);
const 다 = 동문들(s, 사람문);

검('⑤ 이름 있는 사람만 센다', 다.length === 2);
검('⑥ 동문은 Person 이다', 다[0]['@type'] === 'Person');
검('⑦ 🔴 사람 지면이 있는 사람만 url 을 붙인다',
  다[0].url === 'https://www.kculturewire.com/person/lee-you-mi' && !('url' in 다[1]));
검('⑧ ⚠ 지면이 없어도 이름은 낸다', 다[1].name === 'No Page Person');
검('⑨ 표가 없으면 아무에게도 안 붙인다', 동문들(s, null).every((p) => !('url' in p)));

const j = 학교구조화(s, 사람문);
검('⑩ ProfilePage 로 감싼다', j['@type'] === 'ProfilePage');
검('⑪ 알맹이는 EducationalOrganization 이다',
  j.mainEntity['@type'] === 'EducationalOrganization');
검('⑫ 동문을 alumni 로 낸다 — 「지금 다닌다」가 아니다',
  Array.isArray(j.mainEntity.alumni) && j.mainEntity.alumni.length === 2);

/* 🔴🔴 이 지면이 «순위»로 읽히면 안 된다 — 자료가 스스로 적어 둔 한계다 */
검('⑬ 🔴 별점·평가류가 없다',
  !/aggregateRating|ratingValue|reviewCount|award/i.test(JSON.stringify(j)));
검('⑭ 🔴 「최고」·「명문」류 낱말이 없다',
  !/best|top school|elite|prestigious|ranking|leading/i.test(JSON.stringify(j)));

const 빈 = 학교구조화({ name: 'Nowhere', slug: 'nowhere' });
검('⑮ 🔴 동문이 없으면 alumni 를 «안 넣는다»', !('alumni' in 빈.mainEntity));
검('⑯ 🔴 Q번호가 없으면 sameAs 를 «안 넣는다»', !('sameAs' in 빈.mainEntity));
검('⑰ 그래도 이름과 주소는 있다',
  빈.mainEntity.name === 'Nowhere' && 빈.mainEntity.url.endsWith('/school/nowhere'));
검('⑱ 출처를 밝힌다', Array.isArray(j.isBasedOn) && j.isBasedOn.length === 2);
검('⑲ JSON 으로 나간다', (() => { try { JSON.parse(JSON.stringify(j)); return true; } catch { return false; } })());

console.log(실패 ? `❌ school-jsonld 자가시험 ${실패}개 실패 (${셈})` : `✅ school-jsonld 자가시험 통과 (${셈})`);
process.exitCode = 실패 ? 1 : 0;
