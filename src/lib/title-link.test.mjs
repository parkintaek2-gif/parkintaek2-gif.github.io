/**
 * title-link.test.mjs — `title-link.ts` 자가시험.
 *
 * 쓰는 법  node scripts/run-ts-test.mjs src/lib/title-link.test.mjs
 *          (또는 이 파일을 직접 돌리는 자리에서 부른다)
 *
 * ⚠ 이 자는 **라이브에서 겪은 것**을 그대로 다시 재는 시험이다.
 *   2026-08-29 에 /title/breathless 로 가는 링크가 세 장에 걸려 있었는데
 *   그 지면이 없었다. ①②③ 이 그 자리다.
 */
import { 지면있는것들, 있나, 작품주소 } from './title-link.ts';

let 셈 = 0; let 실패 = 0;
const 검 = (말, 참) => { 셈 += 1; if (!참) { 실패 += 1; console.log('🔴', 말); } };

const 자료 = [
  { slug: 'squid-game', hasPage: true },
  { slug: 'breathless', hasPage: false },
  { slug: 'one-more-time', hasPage: false },
  { slug: 'the-glory', hasPage: true },
];
const 표 = 지면있는것들(자료);

검('① 지면 있는 것만 모은다', 표.size === 2 && 표.has('squid-game') && 표.has('the-glory'));
검('② 🔴 지면 없는 작품은 안 건다 — breathless', 작품주소('breathless', 표) === null);
검('③ 🔴 지면 없는 작품은 안 건다 — one-more-time', 작품주소('one-more-time', 표) === null);
검('④ 지면 있는 작품은 건다', 작품주소('squid-game', 표) === '/title/squid-game');
검('⑤ 빈 슬러그는 안 건다', 작품주소('', 표) === null && 작품주소(null, 표) === null);

/* ⚠ 못 잰 자료 — hasPage 가 아예 없으면 «막지 않는다». 0 으로 채우지 않는 것과 같은 뜻이다 */
const 옛자료 = [{ slug: 'squid-game' }, { slug: 'breathless' }];
검('⑥ hasPage 가 없는 옛 자료면 못 잰 것으로 두고 막지 않는다', 지면있는것들(옛자료) === null);
검('⑦ 못 쟀으면 링크를 그대로 낸다', 작품주소('breathless', null) === '/title/breathless');
검('⑧ 빈 목록도 못 잰 것이다', 지면있는것들([]) === null && 지면있는것들() === null);
검('⑨ 있나() 는 못 잰 표에 늘 참', 있나('아무거나', null) === true);

console.log(실패 ? `❌ title-link 자가시험 ${실패}개 실패 (${셈})` : `✅ title-link 자가시험 통과 (${셈})`);
process.exitCode = 실패 ? 1 : 0;
