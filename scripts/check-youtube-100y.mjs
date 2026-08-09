/**
 * check-youtube-100y.mjs — **@100yearmap 조회수를 잰다** (2번 지시 2026-08-09 05:2x)
 *
 *   node scripts/check-youtube-100y.mjs            잰다
 *   node scripts/check-youtube-100y.mjs --자가시험   자가시험 8건만 (그물 안 씀)
 *
 * ## 🔴 왜 만드나 — **우리 지표가 전부 「우리가 한 일」이었다**
 *
 *   2번 — *「지면 4,967장 · 카드 369벌 · 영상 1편 … 전부 **우리 노동량**입니다.
 *   그래서 하루 종일 일해도 「팔렸나」를 못 봅니다. 3번은 유튜브 문을 가진 유일한 자리입니다」*
 *
 *   ⭐ 조회수는 **손님이 한 것**이다. 우리가 만든 수가 아니다.
 *
 * ## ⛔ 계정에 안 들어간다
 *
 *   ```
 *   ⛔ 로그인·API 키·스튜디오        업로드 계정은 사장님 것이다. 손대지 않는다
 *   ✅ 공개 채널 지면만 읽는다        누구나 보는 수다
 *   ⛔ robots 로 막힌 곳은 안 쓴다    youtube.com/robots.txt 가 막는 것 —
 *      /feeds/videos.xml · /youtubei/ · /results · /api/ · /comment
 *      ⭐ 채널 지면(/channel/…/shorts)과 /watch 는 **안 막혀 있다.** 거기만 읽는다
 *   ```
 *
 * ⚠ 이 수는 **공개 조회수**다. 어디서 온 조회인지(유입 경로)는 스튜디오 안에서만 보인다.
 *   그건 계정 몫이다. 「못 쟀다」로 두지 말고 **무엇까지 쟀는지**를 적는다.
 */
const 채널 = 'UCsChInkpGTfa88vP07TKYUQ'; // @100yearmap
const 머리 = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
};

/**
 * 채널 지면 글자에서 쇼츠 목록을 캐낸다.
 * ⚠ `overlayMetadata` 는 화면에 **보이는 글자**다. 안 보이는 칸을 세지 않는다.
 */
export function 캐기(글) {
  /**
   * 🔴 **따옴표 앞의 역슬래시를 먼저 푼다.**
   *   유튜브는 같은 덩어리를 두 벌로 싣는다 — 하나는 그냥, 하나는 `\"` 로 감싼 것.
   *   안 풀었더니 **id 는 잡히고 조회수만 안 잡혀 「0회」가 나왔다.**
   *   ⛔ 그건 0 이 아니라 못 잰 것이다. 하마터면 0 을 지표로 적을 뻔했다.
   */
  const 푼글 = String(글).replace(/\\"/g, '"');
  const 것들 = [];
  const 조각 = /"shortsLockupViewModel":\{"entityId":"shorts-shelf-item-([\w-]{11})"/g;
  const 본것 = new Set();
  for (const m of 푼글.matchAll(조각)) {
    if (본것.has(m[1])) continue;
    본것.add(m[1]);
    /**
     * ⚠ **`accessibilityText` 를 먼저 본다.** 제목과 조회수가 **한 칸에 같이** 들어 있고
     *   entityId 바로 뒤(백여 자)에 붙어 있다.
     *   ⛔ `overlayMetadata` 는 4,300자쯤 뒤에 있어서 창을 4,000자로 잡았다가 **못 찾았다**
     *     — 그리고 그게 「0회」로 나왔다. 창 크기가 지표를 0 으로 만들 뻔했다.
     */
    const 뒤 = 푼글.slice(m.index, m.index + 9000);
    const 읽는말 = 뒤.match(/"accessibilityText":"(.*?)"/)?.[1] ?? '';
    const 제목 = 읽는말.match(/^(.*?), 조회수/)?.[1] ?? 뒤.match(/"primaryText":\{"content":"(.*?)"\}/)?.[1];
    const 조회글 = 읽는말.match(/조회수 ([\d,.]+)(만|천)?회/)
      ?? 뒤.match(/"secondaryText":\{"content":"조회수 ([\d,.]+)(만|천)?회"\}/);
    let 조회 = null;
    if (조회글) {
      const n = Number(조회글[1].replace(/,/g, ''));
      조회 = 조회글[2] === '만' ? Math.round(n * 10000) : 조회글[2] === '천' ? Math.round(n * 1000) : n;
    }
    것들.push({ id: m[1], 제목, 조회, 어림: !!조회글?.[2] });
  }
  return 것들;
}

/** ⚠ 「1.2만회」는 어림이다. 어림인 것을 정확한 수처럼 적지 않는다 */
export const 조회말 = (v) => (v.조회 == null ? '?' : `${v.조회.toLocaleString()}회${v.어림 ? ' (어림)' : ''}`);

if (process.argv.includes('--자가시험')) {
  let 통과 = 0, 실패 = 0;
  const 본다 = (이름, 됐나) => { if (됐나) 통과 += 1; else { 실패 += 1; console.error(`  ⛔ ${이름}`); } };
  /** 라이브에서 실제로 오는 꼴 그대로다 — ⚠ overlayMetadata 는 **4,300자쯤 뒤**에 온다 */
  const 본보기 = (id, 제목, 조회글) =>
    `"shortsLockupViewModel":{"entityId":"shorts-shelf-item-${id}",` +
    `"accessibilityText":"${제목}, 조회수 ${조회글}회 - Shorts 동영상 재생"` +
    `,"onTap":{${'x'.repeat(4300)}}` +
    `,"overlayMetadata":{"primaryText":{"content":"${제목}"},"secondaryText":{"content":"조회수 ${조회글}회"}}`;

  const 하나 = 캐기(본보기('WlVJOninNGA', '종로구', '227'));
  본다('① 하나를 캔다', 하나.length === 1 && 하나[0].id === 'WlVJOninNGA');
  본다('② 조회수를 수로 캔다', 하나[0].조회 === 227 && 하나[0].어림 === false);
  본다('③ 제목을 캔다', 하나[0].제목 === '종로구');
  본다('④ 「1.2만회」를 12,000 으로 편다', 캐기(본보기('AAAAAAAAAAA', 'ㄱ', '1.2만'))[0].조회 === 12000);
  본다('⑤ 어림인 것을 어림이라 적는다', 캐기(본보기('AAAAAAAAAAA', 'ㄱ', '1.2만'))[0].어림 === true);
  본다('⑥ 쉼표를 푼다', 캐기(본보기('AAAAAAAAAAA', 'ㄱ', '1,234'))[0].조회 === 1234);
  본다('⑦ 둘이면 둘을 캔다', 캐기(본보기('AAAAAAAAAAA', 'ㄱ', '1') + 본보기('BBBBBBBBBBB', 'ㄴ', '2')).length === 2);
  /** 🔴 빈 글에서 0건이 나오는 것과 **그물이 끊긴 것**은 다르다. 부르는 쪽이 갈라야 한다 */
  본다('⑧ 빈 글이면 빈 목록이다', 캐기('아무것도 없다').length === 0);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 자가시험 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

const r = await fetch(`https://www.youtube.com/channel/${채널}/shorts`, { headers: 머리 });
if (!r.ok) { console.log(`⬜ 못 쟀다 — 채널 지면이 ${r.status}`); process.exit(1); }
const 글 = await r.text();

/** ⛔ **0 과 「못 쟀다」를 가른다.** 지면은 왔는데 아무것도 안 잡히면 그물이 낡은 것이다 */
if (!글.includes('shortsLockupViewModel') && !글.includes('videoRenderer')) {
  console.log('⬜ 못 쟀다 — 지면은 왔는데 영상 칸이 하나도 없다. 유튜브가 꼴을 바꿨거나 채널이 비었다');
  console.log(`   (글 ${글.length.toLocaleString()}자 · 채널 ${채널})`);
  process.exit(1);
}

const 것들 = 캐기(글);
/** ⛔ **못 잰 것을 0 으로 안 더한다.** 하나라도 못 재면 합은 합이 아니다 */
const 못잰것 = 것들.filter((v) => v.조회 == null);
if (못잰것.length) {
  console.log(`⬜ 못 쟀다 — 영상 ${것들.length}편은 찾았는데 그중 ${못잰것.length}편의 조회수를 못 캤다.`);
  console.log('   유튜브가 글자 꼴을 바꾼 것이다. 0 으로 적지 않는다.');
  process.exit(1);
}
const 합 = 것들.reduce((s, v) => s + v.조회, 0);
console.log(`■ @100yearmap — 쇼츠 ${것들.length}편 · 조회수 합 ${합.toLocaleString()}회`);
for (const v of 것들) console.log(`   ${조회말(v).padStart(12)}  ${v.제목 ?? '?'}  https://youtu.be/${v.id}`);
console.log('\n⚠ 공개 조회수다. **어디서 온 조회인지는 스튜디오 안에서만 보인다** — 그건 계정 몫이다');
console.log('⛔ 로그인하지 않았다. robots 가 막은 /feeds/videos.xml · /youtubei/ 를 쓰지 않았다');
