/**
 * list-jsonld.test.mjs — `list-jsonld.ts` 자가시험.
 * 쓰는 법  node src/lib/list-jsonld.test.mjs
 *
 * ⛔ 여기서 가장 값이 나가는 것은 ⑨⑩ 이다 — 목록을 «순위»로 만들면 안 된다.
 *   born-year·from·tag 는 순위가 아니라 묶음이다.
 */
import { 온주소, 칸들, 목록구조화 } from './list-jsonld.ts';

let 셈 = 0; let 실패 = 0;
const 검 = (말, 참) => { 셈 += 1; if (!참) { 실패 += 1; console.log('🔴', 말); } };

검('① 짧은 주소를 온주소로 만든다',
  온주소('/from/ansan') === 'https://www.kculturewire.com/from/ansan');
검('② 빗금이 없어도 붙인다', 온주소('from/ansan') === 'https://www.kculturewire.com/from/ansan');
검('③ 이미 온주소면 그대로', 온주소('https://x.com/a') === 'https://x.com/a');

const 줄들 = [
  { name: 'Lee You-mi', url: '/person/lee-you-mi' },
  { name: 'No Page Person', url: null },
  { name: '   ', url: '/person/x' },
];
const 다 = 칸들(줄들);
검('④ 이름 있는 줄만 센다 — 빈 이름은 뺀다', 다.length === 2);
검('⑤ ListItem 이다', 다[0]['@type'] === 'ListItem');
검('⑥ position 은 1부터다', 다[0].position === 1 && 다[1].position === 2);
검('⑦ 🔴 지면이 있는 사람만 url 을 붙인다',
  다[0].url === 'https://www.kculturewire.com/person/lee-you-mi' && !('url' in 다[1]));
검('⑧ ⚠ 지면이 없어도 이름은 낸다', 다[1].name === 'No Page Person');
검('⑧-1 지면에 «보이는 순서»를 안 바꾼다',
  다[0].name === 'Lee You-mi' && 다[1].name === 'No Page Person');

const j = 목록구조화({
  주소: '/from/ansan',
  이름: 'Korean stars from Ansan',
  설명: 'Everyone in our roster born in Ansan.',
  줄들,
});
검('⑨ 🔴 CollectionPage 다 — ProfilePage 와 섞지 않는다', j['@type'] === 'CollectionPage');
검('⑩ 🔴 순위가 아니다 — ItemListOrderType 을 안 쓴다',
  !/ItemListOrder|itemListOrder/.test(JSON.stringify(j)));
검('⑪ 칸 수를 적는다', j.mainEntity.numberOfItems === 2);
검('⑫ ItemList 다', j.mainEntity['@type'] === 'ItemList');
검('⑬ 설명이 있으면 넣는다', j.description === 'Everyone in our roster born in Ansan.');
검('⑭ 출처를 밝힌다', Array.isArray(j.isBasedOn) && j.isBasedOn[0].includes('wikidata'));

/* ⛔ 못 잰 자리를 0 으로 안 채운다 */
const 빈 = 목록구조화({ 주소: '/tag/x', 이름: 'Nothing here', 줄들: [] });
검('⑮ 🔴 목록이 비면 mainEntity 를 «안 넣는다»', !('mainEntity' in 빈));
검('⑯ 🔴 설명이 없으면 description 을 «안 넣는다»', !('description' in 빈));
검('⑰ 그래도 이름과 주소는 있다',
  빈.name === 'Nothing here' && 빈.url.endsWith('/tag/x'));
검('⑱ 줄이 아예 없어도 안 죽는다', 목록구조화({ 주소: '/a', 이름: 'A' }).name === 'A');

검('⑲ 출처를 갈아 끼울 수 있다',
  목록구조화({ 주소: '/a', 이름: 'A' }, ['https://netflix.com']).isBasedOn[0] === 'https://netflix.com');
검('⑳ 판정하는 말이 없다', !/best|popular|top|ranking/i.test(JSON.stringify(j)));
검('㉑ JSON 으로 나간다', (() => { try { JSON.parse(JSON.stringify(j)); return true; } catch { return false; } })());

console.log(실패 ? `❌ list-jsonld 자가시험 ${실패}개 실패 (${셈})` : `✅ list-jsonld 자가시험 통과 (${셈})`);
process.exitCode = 실패 ? 1 : 0;
