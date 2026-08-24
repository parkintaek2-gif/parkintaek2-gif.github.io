/**
 * build-kcw-upload-kit.mjs — **채널이 열리면 «바로» 올릴 수 있게 문안을 미리 만든다.**
 *
 * ── 🔴 왜 (2026-08-24 밤) ─────────────────────────────────────
 * 사장님 「방문자 늘리는 데 올인하라 · 26일 01시까지」.
 * 재 보니 오늘 밤 수를 바꿀 수 있는 길은 **밖에 올리는 것 하나**뿐이다 —
 * ```
 *   3번 유튜브 쇼츠  2편   → 조회 459회  (1편당 230회 · 사람이 «본» 수)
 *   3번 웹 지면   4,796장  → 클릭  96회  (28일)
 * ```
 * 그런데 올릴 채널이 없다. 사장님께 「1분이면 되는 것」으로 여쭀다.
 *
 * ⭐ **그 1분이 헛되지 않게, 그 뒤에 필요한 것을 «전부» 미리 만들어 둔다.**
 *   채널이 열린 뒤에 문안을 쓰기 시작하면 그만큼 늦다.
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔ **제목·설명을 지어내지 않는다.** 사이트맵 `videoSets` 에 이미 쓴 것을 그대로 쓴다 —
 *   그것은 라이브 지면 제목에서 가져온 것이다. 두 곳이 갈라지면 어느 쪽이 참인지 모르게 된다.
 * ⛔ **유튜브 한도를 넘기지 않는다.** 제목 100자 · 설명 5,000자 · 태그 500자.
 *   넘기면 업로드가 조용히 잘린다. 여기서 «미리» 잡는다.
 * ⛔ 낚시 제목을 쓰지 않는다. 우리가 가진 것은 센 수이고, 그 수가 제목이다.
 * ⚠ 설명 첫 줄에 **우리 지면 주소**를 넣는다 — 그것이 조회를 방문으로 바꾸는 유일한 길이다.
 *   유튜브는 첫 두 줄만 접지 않고 보여 준다. 주소가 세 번째 줄에 있으면 아무도 안 누른다.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 집 = 'https://www.kculturewire.com';

/** 유튜브 한도. ⛔ 여기서 안 잡으면 업로드 때 «조용히» 잘린다 */
export const 한도 = { 제목: 100, 설명: 5000, 태그: 500 };

/**
 * 제목을 한도 안으로. ⛔ 글자 수만 세지 않는다 — **낱말 가운데를 자르지 않는다.**
 * 자르면 「… and 87 fil」 같은 것이 채널에 남는다.
 */
export function 제목다듬기(글, 최대 = 한도.제목) {
  const s = String(글 ?? '').replace(/\s+/g, ' ').trim();
  if (!s) return null;
  if (s.length <= 최대) return s;
  const 잘린 = s.slice(0, 최대);
  const 마지막빈칸 = 잘린.lastIndexOf(' ');
  /* 빈칸이 아예 없으면(한 낱말이 100자) 그냥 자른다 — 그런 제목은 없지만 안전하게 */
  const 끝 = 마지막빈칸 > 최대 * 0.6 ? 마지막빈칸 : 최대;
  return s.slice(0, 끝).replace(/[,;:\-–—]$/, '').trim();
}

/**
 * 설명. **첫 줄이 지면 주소**다 — 유튜브가 접지 않고 보여 주는 것이 첫 두 줄뿐이다.
 * ⛔ 해시태그를 스무 개 쌓지 않는다. 세 개까지만 — 유튜브는 그 위를 무시하고,
 *   많이 붙이면 스팸으로 읽힌다.
 */
export function 설명만들기(지면, 설명, 해시 = []) {
  if (!지면 || !설명) return null;
  const 태그 = (해시 ?? []).slice(0, 3).map((t) => `#${String(t).replace(/[^A-Za-z0-9가-힣]/g, '')}`)
    .filter((t) => t.length > 1);
  const 글 = [
    `Full numbers and sources: ${집}${지면}`,
    '',
    설명,
    '',
    'K Culture Wire counts what Netflix and Wikipedia publish, names every source, and says what '
    + 'it left out. No rumours, no reprints.',
    '',
    'This is a count, not a ranking. A chart place shows a title was on Netflix in that country '
    + 'that week; it does not show how many people watched.',
    태그.length ? `\n${태그.join(' ')}` : '',
  ].join('\n').trim();
  return 글.length <= 한도.설명 ? 글 : `${글.slice(0, 한도.설명 - 1)}…`;
}

/** 태그 줄. ⛔ 한도를 넘으면 뒤에서부터 버린다 — 앞엣것이 더 가깝다 */
export function 태그줄(태그들, 최대 = 한도.태그) {
  const a = (태그들 ?? []).map((t) => String(t).trim()).filter(Boolean);
  const 남은 = [];
  let 길이 = 0;
  for (const t of a) {
    const 더할 = 남은.length ? t.length + 1 : t.length;
    if (길이 + 더할 > 최대) break;
    남은.push(t); 길이 += 더할;
  }
  return 남은;
}

if (process.argv.includes('--자가시험')) {
  const 실패 = [];
  const 검 = (이름, 참) => { if (!참) 실패.push(이름); };

  검('짧은 제목은 그대로', 제목다듬기('Short one') === 'Short one');
  검('빈 것은 null', 제목다듬기('') === null && 제목다듬기(null) === null);
  검('여러 빈칸을 하나로', 제목다듬기('a   b') === 'a b');
  const 긴것 = 제목다듬기('x'.repeat(40) + ' ' + 'y'.repeat(40) + ' ' + 'z'.repeat(40));
  검('한도 안으로 줄인다', 긴것.length <= 한도.제목);
  /* 🔴 낱말 가운데를 자르면 「… and 87 fil」 같은 것이 채널에 남는다 */
  검('⭐ 낱말 가운데를 안 자른다', !/[xyz]{1,39}$/.test(긴것) || 긴것.endsWith('x'.repeat(40)) || 긴것.endsWith('y'.repeat(40)));
  검('꼬리 쉼표를 지운다', 제목다듬기(`${'a '.repeat(49)}bb,`.slice(0, 105)).endsWith(',') === false);

  const d = 설명만들기('/places', '14 seconds on Korean places.', ['KDrama', 'Korea', 'Netflix', '넷째']);
  검('설명을 만든다', typeof d === 'string' && d.length > 50);
  /* ⭐ 유튜브는 첫 두 줄만 접지 않고 보여 준다 — 주소가 첫 줄이어야 눌린다 */
  검('⭐ 첫 줄이 지면 주소다', d.split('\n')[0].startsWith(`Full numbers and sources: ${집}/places`));
  검('⛔ 해시태그를 셋까지만 쓴다', (d.match(/#/g) ?? []).length === 3);
  검('한도를 안 넘는다', d.length <= 한도.설명);
  검('지면이나 설명이 없으면 null', 설명만들기(null, 'x') === null && 설명만들기('/x', '') === null);
  검('⛔ 좋음을 말하지 않는다', !/best|greatest|amazing|must.watch/i.test(d));
  검('한계를 반드시 담는다', /does not show how many people watched/.test(d));

  검('태그를 그대로', 태그줄(['a', 'b']).join(',') === 'a,b');
  검('⭐ 한도를 넘으면 뒤에서부터 버린다', 태그줄(['a'.repeat(300), 'b'.repeat(300)]).length === 1);
  검('빈 것을 넣어도 안 터진다', 태그줄(null).length === 0);

  if (실패.length) {
    console.error(`❌ 자가시험 ${실패.length}건 실패\n` + 실패.map((s) => `   · ${s}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ build-kcw-upload-kit 자가시험 통과 (16)');
  process.exit(0);
}

/* 사이트맵이 이미 갖고 있는 제목·설명을 그대로 쓴다 — 두 곳이 갈라지지 않게 */
const 맵소스 = path.join(뿌리, 'src/pages/wikitip/sitemap.xml.ts');
if (!existsSync(맵소스)) { console.error('⛔ sitemap.xml.ts 가 없다'); process.exit(1); }
const s = readFileSync(맵소스, 'utf8').replace(/\r\n/g, '\n');
const i = s.indexOf('const videoSets = [');
const j = s.indexOf('\n];', i);
const blk = s.slice(i, j);

const 벌들 = [];
for (const m of blk.matchAll(/\{\s*set:\s*'([a-z0-9-]+)',\s*page:\s*'([^']+)',\s*title:\s*([\s\S]*?),\s*description:\s*([\s\S]*?),\s*\}/g)) {
  const 풀기 = (x) => {
    try { return eval(x.trim()); } catch { return null; }   // 이 파일 안의 문자열 리터럴만 푼다
  };
  벌들.push({ set: m[1], page: m[2], title: 풀기(m[3]), description: 풀기(m[4]) });
}

if (!벌들.length) { console.error('⛔ videoSets 를 못 읽었다 — 꼴이 바뀌었다. 「0편」으로 적지 않는다'); process.exit(1); }

const 기본태그 = ['Korean drama', 'K-drama', 'Netflix', 'Korea', 'data', 'K-pop', 'Hallyu',
  'Korean series', 'Wikipedia', 'statistics'];

const 짐 = 벌들.map((v) => {
  const 제목 = 제목다듬기(v.title);
  const 설명 = 설명만들기(v.page, v.description, ['KDrama', 'Korea', 'Shorts']);
  return {
    set: v.set,
    file: `public/wikitip/video/${v.set}.mp4`,
    thumbnail: `public/wikitip/video/thumb/${v.set}.jpg`,
    page: `${집}${v.page}`,
    youtubeTitle: 제목,
    youtubeDescription: 설명,
    tags: 태그줄(기본태그),
    /* ⚠ 쇼츠로 잡히려면 세로이고 60초 아래여야 한다. 우리 것은 14초 세로다 */
    isShort: true,
    ready: Boolean(제목 && 설명 && existsSync(path.join(뿌리, `public/wikitip/video/${v.set}.mp4`))),
  };
});

const 낼길 = path.join(뿌리, 'archive/kcw-upload-kit.json');
writeFileSync(낼길, `${JSON.stringify({
  generated: new Date().toISOString(),
  whatThisIs: 'Everything needed to upload the 21 shorts the moment a channel exists. '
    + 'Titles and descriptions come from the sitemap, which took them from the live page titles.',
  whatThisIsNot: 'This is not proof anyone will watch. It removes the delay, not the uncertainty.',
  platform: 'YouTube Shorts (vertical, under 60 seconds)',
  videos: 짐,
}, null, 2)}\n`);

const 준비된것 = 짐.filter((x) => x.ready);
console.log('■ 올릴 준비 — 채널이 열리면 바로 쓴다\n');
console.log(`영상 ${짐.length}편 · 준비된 것 ${준비된것.length}편 · 못 된 것 ${짐.length - 준비된것.length}편`);
console.log(`제목 가장 긴 것 ${Math.max(...짐.map((x) => (x.youtubeTitle ?? '').length))}자 (한도 ${한도.제목})`);
console.log(`설명 가장 긴 것 ${Math.max(...짐.map((x) => (x.youtubeDescription ?? '').length))}자 (한도 ${한도.설명})`);
console.log();
for (const x of 준비된것.slice(0, 3)) {
  console.log(`  [${x.set}] ${x.youtubeTitle}`);
  console.log(`      ${x.youtubeDescription.split('\n')[0]}`);
}
console.log(`  … 그리고 ${Math.max(0, 준비된것.length - 3)}편 더`);
console.log(`\n냈다 — ${path.relative(뿌리, 낼길)}`);
console.log('⚠ 이것은 아무도 볼 것이라는 증거가 아니다. **늦어지는 것을 없앨 뿐**이다.');
