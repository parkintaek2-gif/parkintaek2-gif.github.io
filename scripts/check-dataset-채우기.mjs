#!/usr/bin/env node
/**
 * check-dataset-채우기.mjs — `src/lib/dataset-채운다.ts` 의 자가시험.
 *
 * 🔴 `.ts` 는 노드가 바로 못 읽는다. 그래서 **같은 셈을 여기 옮겨 적지 않고**
 *   그 파일의 글을 읽어 타입 표시만 걷고 돌린다 — 두 벌이 되면 한쪽만 고치고 어긋난다.
 *
 * 쓰는 법
 *   node scripts/check-dataset-채우기.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 타입 표시를 걷어 노드가 읽을 수 있게 만든다. ⛔ 셈은 한 글자도 안 고친다 */
function 타입걷기(글) {
  return String(글)
    .replace(/^import .*$/gm, '')                        /* 들여옴은 아래서 손으로 준다 */
    .replace(/export type .*$/gm, '')
    .replace(/:\s*Record<[^>]*>/g, '')
    .replace(/:\s*사이트딱지/g, '')
    .replace(/:\s*unknown(\[\])?/g, '')
    .replace(/:\s*string(\[\])?/g, '')
    .replace(/:\s*boolean/g, '')
    .replace(/:\s*void/g, '')
    .replace(/\?\s*:/g, ':')
    /* 🔴 타입을 걷고 나면 선택 인자 표시(`정본?`)가 남는다 — 그것도 걷는다.
       ⛔ 셈은 한 글자도 안 고친다. 걷는 것은 «타입 표시»뿐이다. */
    .replace(/([(,]\s*[가-힣A-Za-z_$][\w가-힣$]*)\?(?=\s*[,)])/g, '$1')
    .replace(/\bexport\s+/g, '')
    .replace(/\s+as\s+Record<[^>]*>/g, '')
    .replace(/\s+as\s+const/g, '');
}

const 글 = fs.readFileSync(path.join(뿌리, 'src', 'lib', 'dataset-채운다.ts'), 'utf8');
const 약관 = {
  seoulmarkets: 'https://seoulmarkets.com/terms',
  '100y': 'https://100yearmap.com/terms',
  kcw: 'https://www.kculturewire.com/terms',
};
const 만들기 = new Function('약관주소', 타입걷기(글) + '\nreturn { 데이터세트채우기 };');
const { 데이터세트채우기 } = 만들기(약관);

let 통과 = 0; let 깨짐 = 0;
const 본다 = (말, 참) => { if (참) { 통과++; console.log(`  ✅ ${말}`); } else { 깨짐++; console.log(`  🔴 ${말}`); } };

console.log('\n■ Dataset 채우기 — 자가시험\n');

{
  const 앞 = { '@type': 'Dataset', name: 'a', description: 'b' };
  const 뒤 = 데이터세트채우기(앞, '100y', 'https://100yearmap.com/100y/x');
  본다('🔴 한 덩이에 license 가 들어간다', 뒤.license === 'https://100yearmap.com/terms');
  본다('   url 도 들어간다', 뒤.url === 'https://100yearmap.com/100y/x');
  본다('⛔ 원본을 안 고친다 — 같은 상수를 여러 지면이 나눠 쓴다', !('license' in 앞));
}

{
  const 뒤 = 데이터세트채우기(
    { '@context': 'https://schema.org', '@graph': [{ '@type': 'Dataset', name: 'a' }, { '@type': 'FAQPage' }] },
    'seoulmarkets', 'https://seoulmarkets.com/p');
  본다('🔴 @graph 안쪽도 채운다 — 우리 지면 대부분이 이 꼴이다',
    뒤['@graph'][0].license === 'https://seoulmarkets.com/terms');
  본다('⛔ FAQPage 는 안 건드린다', !('license' in 뒤['@graph'][1]));
}

{
  const 뒤 = 데이터세트채우기([{ '@type': 'Dataset', name: 'a' }], 'kcw', 'https://www.kculturewire.com/p');
  본다('배열 그 자체도 받는다', 뒤[0].license === 'https://www.kculturewire.com/terms');
}

{
  const 뒤 = 데이터세트채우기({ '@type': 'Dataset', name: 'a', license: '내가 적은 것', url: '내 주소' }, '100y', 'https://100yearmap.com/x');
  본다('🔴 이미 있는 license 를 안 덮는다 — 지면이 적었으면 그것이 맞다', 뒤.license === '내가 적은 것');
  본다('   url 도 안 덮는다', 뒤.url === '내 주소');
}

{
  const 뒤 = 데이터세트채우기({ '@type': 'Dataset', name: 'a' }, '100y');
  본다('🔴 정본을 안 주면 url 을 «안» 넣는다 — 지어낸 주소는 비어 있는 것보다 나쁘다', !('url' in 뒤));
  본다('   그래도 license 는 넣는다', 뒤.license === 'https://100yearmap.com/terms');
}

본다('⛔ Dataset 이 아니면 안 건드린다',
  !('license' in 데이터세트채우기({ '@type': 'Article', name: 'a' }, '100y', 'u')));
본다('@type 이 배열이어도 Dataset 을 알아본다',
  데이터세트채우기({ '@type': ['Dataset', 'CreativeWork'], name: 'a' }, '100y').license === 'https://100yearmap.com/terms');
본다('⛔ null 에도 안 터진다', 데이터세트채우기(null, '100y') === null);
본다('⛔ 글자에도 안 터진다', 데이터세트채우기('x', '100y') === 'x');

{
  /* 깊이 든 것도 찾는가 */
  const 뒤 = 데이터세트채우기({ a: { b: { '@graph': [{ '@type': 'Dataset', name: 'x' }] } } }, '100y');
  본다('깊이 든 Dataset 도 찾는다', 뒤.a.b['@graph'][0].license === 'https://100yearmap.com/terms');
}

console.log(`\n  통과 ${통과} · 깨짐 ${깨짐}\n`);
process.exit(깨짐 ? 1 : 0);
