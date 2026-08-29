/**
 * firm-link.test.mjs — `firm-link.ts` 자가시험.
 *
 * 쓰는 법  node src/lib/firm-link.test.mjs
 *
 * ⚠ 라이브에서 실제로 겪은 것을 다시 재는 시험이다 — 2026-08-29 에 회사 지면 19장 중
 *   11장이 «한 곳»(/firms 목록)에서만 걸리고 있었다. 작품 560장이 회사 이름을
 *   글자로만 내고 있었기 때문이다.
 */
import { 이름키, 이름표만들기, 회사주소 } from './firm-link.ts';

let 셈 = 0; let 실패 = 0;
const 검 = (말, 참) => { 셈 += 1; if (!참) { 실패 += 1; console.log('🔴', 말); } };

검('① 대소문자를 맞춘다', 이름키('Studio Dragon') === 'studio dragon');
검('② 여백을 하나로 줄인다', 이름키('Studio  Dragon ') === 'studio dragon');
검('③ ⛔ 점·쉼표는 지우지 않는다 — 그것이 그 회사 이름이다',
  이름키('SHOWBOX Co., Ltd.') === 'showbox co., ltd.');
검('④ 빈 것은 빈 키다', 이름키(null) === '' && 이름키(undefined) === '');

const { 표, 겹친수 } = 이름표만들기([
  { firm: 'Studio Dragon', slug: 'studio-dragon' },
  { firm: 'tvN', slug: 'tvn' },
  { firm: 'SHOWBOX Co., Ltd.', slug: 'showbox-co-ltd' },
]);
검('⑤ 표를 만든다', 표.size === 3 && 겹친수 === 0);
검('⑥ 지면이 있는 회사는 건다', 회사주소('Studio Dragon', 표) === '/firm/studio-dragon');
검('⑦ 대소문자가 달라도 찾는다', 회사주소('studio dragon', 표) === '/firm/studio-dragon');
검('⑧ 점이 든 이름도 찾는다', 회사주소('SHOWBOX Co., Ltd.', 표) === '/firm/showbox-co-ltd');
검('⑨ 🔴 지면이 없는 회사는 «안 건다»', 회사주소('Some Other Films', 표) === null);
검('⑩ 빈 이름은 안 건다', 회사주소('', 표) === null && 회사주소(null, 표) === null);

/* ⛔ 겹친 이름 — 하나를 골라 걸면 손님이 «다른 회사»를 본다. 그래서 아예 뺀다 */
const 겹친 = 이름표만들기([
  { firm: 'Studio N', slug: 'studio-n' },
  { firm: 'studio n', slug: 'studio-n-2' },
  { firm: 'tvN', slug: 'tvn' },
]);
검('⑪ 🔴 이름이 겹치면 그 이름은 아예 뺀다', 회사주소('Studio N', 겹친.표) === null);
검('⑫ 겹친 수를 센다', 겹친.겹친수 === 1);
검('⑬ 안 겹친 것은 그대로 걸린다', 회사주소('tvN', 겹친.표) === '/firm/tvn');

/* ⚠ 같은 이름이 «같은 슬러그»로 두 번 오는 것은 겹친 것이 아니다 */
const 두번 = 이름표만들기([
  { firm: 'tvN', slug: 'tvn' },
  { firm: 'tvN', slug: 'tvn' },
]);
검('⑭ 같은 이름·같은 슬러그가 두 번 와도 겹친 것이 아니다',
  두번.겹친수 === 0 && 회사주소('tvN', 두번.표) === '/firm/tvn');

검('⑮ 빈 목록도 안 죽는다', 이름표만들기([]).표.size === 0 && 이름표만들기().표.size === 0);
검('⑯ 슬러그가 없는 줄은 건너뛴다', 이름표만들기([{ firm: 'A' }]).표.size === 0);

console.log(실패 ? `❌ firm-link 자가시험 ${실패}개 실패 (${셈})` : `✅ firm-link 자가시험 통과 (${셈})`);
process.exitCode = 실패 ? 1 : 0;
