/**
 * collect-kcw-name-typed.mjs — **사람들이 한국 스타를 찾을 때 «어떤 이름»을 치나.**
 *
 * ── 어디서 나왔나 ────────────────────────────────────────────
 * 2026-09-05 새벽에 `/streak-vs-read` 를 만들다 겪은 것에서 나왔다.
 * 위키백과 지면 하나에는 «넘겨주기»가 여럿 달려 있고, 열람수 API 는 넘겨주기 제목에 온
 * 조회를 **그 제목 아래 따로** 센다. 그래서 본 지면만 세면 그 사람 독자를 놓친다.
 * ⭐ 그때 눈에 띈 것 — **Jung Kook 은 본 지면보다 넘겨주기(`Jungkook`)로 더 많이 들어온다.**
 *   그것은 결함이 아니라 «사실»이다. 사람들이 치는 이름과 백과사전이 고른 이름이 다르다.
 *
 * ── 아무도 답하지 않는 물음 ──────────────────────────────────
 * 「한국 스타를 찾는 사람은 백과사전이 정한 이름을 치나, 아니면 자기가 아는 이름을 치나?」
 * ⛔ 우리가 아는 한 이것을 세어 낸 곳이 없다. 넘겨주기 열람수는 보통 «버려지는» 값이다.
 *
 * ── ⛔ 이 자가 말하지 않는 것 ────────────────────────────────
 * ⛔ 「어느 이름이 옳다」를 말하지 않는다. 백과사전의 제목 규칙은 우리 소관이 아니다.
 * ⛔ 「인기」를 말하지 않는다. 이것은 «어느 철자로 들어오나»이지 몇 명이 좋아하나가 아니다.
 * ⬜ 검색창에 무엇을 쳤는지는 «모른다». 우리가 아는 것은 «어느 지면 이름으로 도착했나»다.
 *   구글이 다른 철자를 본 지면으로 보내면 그것은 본 지면으로 잡힌다 — 그만큼 덜 세어진다.
 *
 * 쓰는 법  node scripts/collect-kcw-name-typed.mjs --자가시험
 *          node scripts/collect-kcw-name-typed.mjs --잰다 --몇명=40
 *          node scripts/collect-kcw-name-typed.mjs --잰다 --몇명=40 --적는다
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');

/** 넘겨주기 몫. 본 지면 + 넘겨주기 전부 중 «넘겨주기»로 들어온 몫 */
export function 넘겨주기몫(본지면조회, 넘겨주기조회들) {
  const 넘 = (넘겨주기조회들 ?? []).reduce((a, b) => a + (Number(b) || 0), 0);
  const 합 = (Number(본지면조회) || 0) + 넘;
  if (!(합 > 0)) return null;                     // ⛔ 0 으로 나누지 않는다. 못 쟀다로 둔다
  return Math.round((넘 / 합) * 1000) / 10;
}

/** 가장 많이 들어온 이름. 본 지면일 수도 있고 넘겨주기일 수도 있다 */
export function 가장많이들어온이름(줄들) {
  const 쓸것 = (줄들 ?? []).filter((x) => Number.isFinite(x?.조회));
  if (!쓸것.length) return null;
  return 쓸것.reduce((a, b) => (b.조회 > a.조회 ? b : a));
}

/** 밑줄을 빈칸으로 — 손님에게 보이는 꼴 */
export function 읽는이름(제목) {
  return String(제목 ?? '').replace(/_/g, ' ');
}

/* ── 우물 ────────────────────────────────────────────────── */
export async function 본지면과넘겨주기(씨앗, 가져오기 = fetch) {
  const 부르기 = async (질의) => {
    const r = await 가져오기(`https://en.wikipedia.org/w/api.php?${질의}&format=json`,
      { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
    if (!r.ok) return null;
    return r.json();
  };
  const 첫 = await 부르기(`action=query&redirects=1&titles=${encodeURIComponent(씨앗)}`);
  const 쪽들 = Object.values(첫?.query?.pages ?? {});
  const 본 = 쪽들[0];
  if (!본?.title || 본.missing !== undefined) return { 본지면: null, 넘겨주기: [] };
  const 둘 = await 부르기(`action=query&prop=redirects&rdlimit=max&titles=${encodeURIComponent(본.title)}`);
  const 쪽 = Object.values(둘?.query?.pages ?? {})[0];
  return {
    본지면: String(본.title).replace(/ /g, '_'),
    넘겨주기: (쪽?.redirects ?? []).filter((x) => x.ns === 0)
      .map((x) => String(x.title).replace(/ /g, '_')),
  };
}

/**
 * 그 제목이 «언제» 다른 이름으로 옮겨졌나. 위키백과 옮김 기록을 그대로 읽는다.
 * ⛔ 짐작으로 「최근에 바뀌었다」고 적지 않는다. 날짜를 우물에서 받아 적는다.
 * ⬜ 옮긴 기록이 없으면 null — 「안 바뀌었다」가 아니라 «기록이 없다»는 뜻이다.
 */
export async function 이름바뀐때(제목, 가져오기 = fetch) {
  const u = 'https://en.wikipedia.org/w/api.php?action=query&list=logevents&letype=move'
    + `&letitle=${encodeURIComponent(제목)}&lelimit=5&format=json`;
  const r = await 가져오기(u, { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  if (!r.ok) return null;
  const j = await r.json();
  const 것 = (j?.query?.logevents ?? [])[0];
  if (!것?.timestamp) return null;
  return { 날: String(것.timestamp).slice(0, 10), 에서: 것.title ?? null, 로: 것.params?.target_title ?? null };
}

export async function 달조회(제목, 시작, 끝, 가져오기 = fetch) {
  const u = 'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia'
    + `/all-access/user/${encodeURIComponent(제목)}/monthly/${시작}/${끝}`;
  const r = await 가져오기(u, { headers: { 'User-Agent': 'KCultureWire/1.0 (u5@klifedesign.net)' } });
  if (!r.ok) return { 상태: r.status, 조회: null };
  const j = await r.json();
  return { 상태: 200, 조회: (j.items ?? []).reduce((a, b) => a + (b.views ?? 0), 0) };
}

/* ── 자가시험 ────────────────────────────────────────────── */
async function 자가시험() {
  let 든것 = 0, 깬것 = 0;
  const 재 = (무엇, 실제, 바람) => {
    const a = JSON.stringify(실제), b = JSON.stringify(바람);
    if (a === b) { 든것 += 1; } else { 깬것 += 1; console.log(`🔴 ${무엇}\n   나온것 ${a}\n   바람   ${b}`); }
  };

  재('넘겨주기 몫', 넘겨주기몫(100, [100]), 50);
  재('넘겨주기가 더 많으면 50 을 넘는다', 넘겨주기몫(100, [300]), 75);
  재('넘겨주기가 없으면 0', 넘겨주기몫(100, []), 0);
  재('⛔ 둘 다 0 이면 못 쟀다 — 0 으로 나누지 않는다', 넘겨주기몫(0, [0]), null);
  재('null 은 0 으로 세지 않고 그냥 빠진다', 넘겨주기몫(100, [null, 100]), 50);
  재('여럿을 더한다', 넘겨주기몫(200, [50, 50]), Math.round((100 / 300) * 1000) / 10);

  재('가장 많이 들어온 이름',
    가장많이들어온이름([{ 제목: 'A', 조회: 5 }, { 제목: 'B', 조회: 9 }]), { 제목: 'B', 조회: 9 });
  재('못 잰 줄은 빼고 고른다',
    가장많이들어온이름([{ 제목: 'A', 조회: null }, { 제목: 'B', 조회: 1 }]), { 제목: 'B', 조회: 1 });
  재('다 못 쟀으면 null', 가장많이들어온이름([{ 제목: 'A', 조회: null }]), null);
  재('빈 목록', 가장많이들어온이름([]), null);

  재('밑줄을 빈칸으로', 읽는이름('Jung_Kook'), 'Jung Kook');
  재('빈 값', 읽는이름(null), '');

  /* 우물 — 가짜로 부르는 꼴만 잰다 */
  const 가짜 = async (u) => {
    if (u.includes('redirects=1')) {
      return { ok: true, json: async () => ({ query: { pages: { 1: { title: 'Jung Kook' } } } }) };
    }
    if (u.includes('prop=redirects')) {
      return { ok: true, json: async () => ({ query: { pages: { 1: { redirects: [
        { ns: 0, title: 'Jungkook' }, { ns: 1, title: 'Talk:Jung Kook' },
      ] } } } }) };
    }
    return { ok: true, json: async () => ({ items: [{ views: 7 }, { views: 3 }] }) };
  };
  const 받은것 = await 본지면과넘겨주기('Jungkook', 가짜);
  재('본 지면과 넘겨주기를 우물에서 받는다', 받은것, { 본지면: 'Jung_Kook', 넘겨주기: ['Jungkook'] });
  const 조 = await 달조회('X', '1', '2', 가짜);
  재('달 조회를 더한다', 조, { 상태: 200, 조회: 10 });
  const 막 = await 달조회('X', '1', '2', async () => ({ ok: false, status: 429 }));
  재('막히면 조회가 null 이다 — 0 이 아니다', 막, { 상태: 429, 조회: null });

  console.log(`\n자가시험 ${든것}가지 통과${깬것 ? ` · 🔴 ${깬것}가지 깨짐` : ''}`);
  return 깬것 === 0;
}

/* ── 본 일 ──────────────────────────────────────────────── */
async function 본일(몇명, 적나) {
  const 시작 = '20230601', 끝 = '20260901';
  const 자료 = JSON.parse(fs.readFileSync(path.join(뿌리, 'src/data/wikitip-star-demand.json'), 'utf8'));
  const 명단 = (Object.values(자료).filter(Array.isArray).sort((a, b) => b.length - a.length)[0] ?? [])
    .filter((x) => x?.enTitle)
    .sort((a, b) => (b.reads ?? 0) - (a.reads ?? 0))
    .slice(0, 몇명);

  console.log(`# 사람들이 치는 이름 — 가장 많이 읽히는 한국 스타 ${명단.length}명\n`);
  console.log('⛔ 「어느 이름이 옳다」를 말하지 않는다. 「어느 이름으로 도착하나」만 센다.\n');

  const 낸것 = [];
  const 막힌사람 = [];
  for (const 사람 of 명단) {
    const { 본지면, 넘겨주기 } = await 본지면과넘겨주기(사람.enTitle);
    if (!본지면) { 막힌사람.push(사람.enTitle); continue; }
    const 줄들 = [];
    let 막힌제목 = 0;
    for (const t of [본지면, ...넘겨주기]) {
      let 것 = await 달조회(t, 시작, 끝);
      if (것.상태 !== 200) {
        await new Promise((r) => setTimeout(r, 1200));
        것 = await 달조회(t, 시작, 끝);
      }
      if (것.상태 !== 200) { 막힌제목 += 1; continue; }
      줄들.push({ 제목: t, 조회: 것.조회, 본지면인가: t === 본지면 });
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!줄들.length) { 막힌사람.push(사람.enTitle); continue; }
    const 본조회 = 줄들.find((x) => x.본지면인가)?.조회 ?? 0;
    const 으뜸 = 가장많이들어온이름(줄들);
    낸것.push({
      이름: 사람.name,
      본지면: 읽는이름(본지면),
      제목수: 줄들.length,
      막힌제목,
      합계: 줄들.reduce((a, b) => a + (b.조회 ?? 0), 0),
      본지면조회: 본조회,
      넘겨주기몫: 넘겨주기몫(본조회, 줄들.filter((x) => !x.본지면인가).map((x) => x.조회)),
      가장많이들어온이름: 읽는이름(으뜸?.제목),
      으뜸이본지면인가: !!으뜸?.본지면인가,
      으뜸조회: 으뜸?.조회 ?? null,
    });
    const x = 낸것[낸것.length - 1];
    console.log(`  ${x.이름.padEnd(18)} 제목 ${String(x.제목수).padStart(2)}개 · 넘겨주기 몫 `
      + `${String(x.넘겨주기몫 ?? '못 쟀다').padStart(5)}%`
      + `${x.으뜸이본지면인가 ? '' : `  🔴 으뜸이 넘겨주기다 — 「${x.가장많이들어온이름}」`}`);
  }

  const 뒤집힌 = 낸것.filter((x) => !x.으뜸이본지면인가);
  console.log(`\n## 잰 것 — ${낸것.length}명\n`);
  console.log(`  본 지면보다 «넘겨주기»로 더 많이 들어오는 사람  **${뒤집힌.length}명**`);
  const 몫들 = 낸것.map((x) => x.넘겨주기몫).filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const 가운데 = 몫들.length ? 몫들[Math.floor(몫들.length / 2)] : null;
  console.log(`  넘겨주기 몫 가운데값  ${가운데 ?? '못 쟀다'}%`);
  if (막힌사람.length) console.log(`  ⬜ 못 잰 사람 ${막힌사람.length}명 — ${막힌사람.join(', ')} (0 으로 안 채운다)`);

  if (적나) {
    const 길 = path.join(뿌리, 'src/data/kcw-name-typed.json');
    fs.writeFileSync(길, `${JSON.stringify({
      잰때: new Date().toLocaleString('ko-KR'),
      무엇인가: '한국 스타를 찾는 사람이 «어느 지면 이름으로» 도착하나',
      '⛔아닌것': '어느 이름이 옳은지, 누가 인기 있는지를 말하지 않는다',
      출처: 'Wikimedia pageviews API (monthly) + en.wikipedia MediaWiki API (redirects)',
      기간: { 시작, 끝 },
      셈: { 잰사람: 낸것.length, 뒤집힌사람: 뒤집힌.length, 넘겨주기몫가운데: 가운데, 못잰사람: 막힌사람 },
      사람들: 낸것,
      못재는것: [
        '검색창에 무엇을 쳤는지는 모른다 — 어느 지면 이름으로 도착했나까지다',
        '다른 철자를 검색엔진이 본 지면으로 보내면 그것은 본 지면으로 잡힌다',
        '영문 위키백과만 셌다',
      ],
    }, null, 1)}\n`);
    console.log(`\n✅ 적었다 — ${path.relative(뿌리, 길).replace(/\\/g, '/')}`);
  } else console.log('\n⚠ 아직 안 적었다. 적으려면 --적는다');
  return true;
}

const 인 = process.argv.slice(2);
const 이파일이시작인가 = process.argv[1]
  && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
if (이파일이시작인가) {
  if (인.includes('--자가시험')) 자가시험().then((ok) => process.exit(ok ? 0 : 1));
  else if (인.includes('--잰다')) {
    const 몇 = Number((인.find((x) => x.startsWith('--몇명=')) ?? '').split('=')[1]) || 40;
    본일(몇, 인.includes('--적는다')).then((ok) => process.exit(ok ? 0 : 1));
  } else { console.log('⛔ --자가시험 이나 --잰다 를 준다'); process.exit(1); }
}
