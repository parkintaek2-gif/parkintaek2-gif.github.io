/**
 * person-link.test.mjs — **이름에 문을 다는 규칙**을 검사로 굳힌다.
 *
 * ⛔ 여기서 지키는 것은 「링크가 많아지는가」가 아니라 **「틀린 곳으로 보내지 않는가」**다.
 *   틀린 문은 없는 문보다 나쁘다 — 손님이 다른 사람의 지면을 보고 우리를 의심한다.
 *
 * 쓰는 법  node src/lib/person-link.test.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 이름키, 이름표만들기, 이지면의문, 문 } from './person-link.ts';

let 통과 = 0;
const 실패 = [];
const 검 = (이름, 참, 덧 = '') => { if (참) 통과++; else 실패.push(이름 + (덧 ? ' — ' + 덧 : '')); };

export function 검사() {
  /* ── 이름키 ── */
  검('대소문자를 맞춘다', 이름키('IU') === 'iu');
  검('여백을 하나로 줄인다', 이름키('Wi  Ha-jun') === 'wi ha-jun');
  검('앞뒤 여백을 뗀다', 이름키('  IU  ') === 'iu');
  검('⛔ 붙임표를 지우지 않는다', 이름키('Lee Min-ho') !== 이름키('Lee Minho'));
  검('빈 것도 안 죽는다', 이름키(null) === '' && 이름키(undefined) === '');

  /* ── 이름표 ── */
  const 명단 = [
    { name: 'IU', wikiPage: 'IU (singer)', slug: 'iu' },
    { name: 'Lee You-mi', wikiPage: 'Lee Yoo-mi', slug: 'lee-you-mi' },
    { name: 'Kim Min-ju', wikiPage: 'Kim Min-ju (actress)', slug: 'kim-min-ju' },
    { name: 'Kim Min-ju', wikiPage: 'Kim Min-ju (singer)', slug: 'kim-min-ju-2' },
    { name: '슬러그없음', wikiPage: 'No Slug' },   // slug 가 없다 — 넣지 않는다
  ];
  const { 표, 겹친수 } = 이름표만들기(명단);

  검('이름으로 찾는다', 표.get('iu') === 'iu');
  검('위키 문서 이름으로도 찾는다', 표.get('lee yoo-mi') === 'lee-you-mi');
  검('⭐ 겹친 이름은 아예 뺀다', !표.has('kim min-ju'));
  검('겹친 수를 센다', 겹친수 === 1, String(겹친수));
  검('겹치지 않은 쪽(괄호 붙은 것)은 남는다', 표.get('kim min-ju (actress)') === 'kim-min-ju');
  검('⛔ 슬러그 없는 줄은 안 넣는다', !표.has('no slug'));
  검('빈 명단에도 안 죽는다', 이름표만들기([]).표.size === 0 && 이름표만들기().표.size === 0);

  /* 같은 사람이 두 번 들어와도 «겹친 것»으로 세지 않는다 — 슬러그가 같기 때문이다 */
  const 두번 = 이름표만들기([
    { name: 'IU', wikiPage: 'IU', slug: 'iu' },
    { name: 'IU', wikiPage: 'IU (singer)', slug: 'iu' },
  ]);
  검('같은 사람이 두 번 와도 겹침이 아니다', 두번.겹친수 === 0 && 두번.표.get('iu') === 'iu');

  /* ── 이 지면의 문 ── */
  const 문들 = 이지면의문(['IU', 'Kim Min-ju', 'Nobody Here', 'Lee Yoo-mi'], 표);
  검('있는 것만 담는다', Object.keys(문들).length === 2, JSON.stringify(문들));
  검('겹친 이름은 안 담는다', !('kim min-ju' in 문들));
  검('없는 이름은 안 담는다', !('nobody here' in 문들));

  /* ── 문 ── */
  검('문이 주소가 된다', 문('IU', 문들) === '/person/iu');
  검('⛔ 없으면 null 이다 — 지어내지 않는다', 문('Nobody Here', 문들) === null);
  검('⛔ 겹친 이름도 null 이다', 문('Kim Min-ju', 문들) === null);
  검('문들이 아예 없어도 안 죽는다', 문('IU', null) === null && 문('IU', undefined) === null);

  return { 통과, 실패 };
}

const 내가불렸나 = path.resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
if (내가불렸나) {
  const r = 검사();
  r.실패.forEach((x) => console.log('  ⛔ ' + x));
  console.log(`${r.실패.length ? '⛔' : '✅'} person-link 검사 ${r.실패.length ? '실패 ' + r.실패.length + '개' : '통과'} (${r.통과}개)`);
  process.exit(r.실패.length ? 1 : 0);
}
