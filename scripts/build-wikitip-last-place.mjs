#!/usr/bin/env node
/**
 * **1등은 바뀌는데 꼴찌는 안 바뀐다.** (`/who-reads-least`)
 *
 * ⭐⭐ 사장님 지시(8/16) — 제목·본문에 **스타 이름과 소속 그룹명**을 넣는다.
 *    그래서 표의 첫 칸이 이름이고, 첫 문단이 BTS·IU·Byeon Woo-seok 로 시작한다.
 *
 * ── 찾은 것 ────────────────────────────────────────────────────
 * ```
 *   네 판 다 문서가 있는 스타 374명
 *   제일 많이 읽는 판   태국 153 · 베트남 123 · 인도네시아 81 · 말레이 17   ← 다툰다
 *   제일 적게 읽는 판   **말레이 310(82.9%)** · 태국 25 · 인도네시아 23 · 베트남 16
 *   많이 읽히는 위 20명은 **20명 전부** 말레이판이 꼴찌다
 * ```
 *
 * ── ⛔ 이 자가 지키는 것 ──────────────────────────────────────
 * ⛔⛔ **겹친 사람을 두 번 세지 않는다.** IU·임윤아·차은우는 음악 자료와 배우 자료에
 *    **둘 다** 있다. 처음에 그대로 세어 위 12명에 IU 가 두 번 나왔다. Q번호로 겹침을 뺀다.
 * ⛔⛔ **「말레이시아가 한국에 관심 없다」로 안 읽는다.** 말레이어와 인도네시아어는 서로 통해서
 *    말레이시아 손님이 **인도네시아어판을 읽을 수** 있다. 이 자료로는 그것을 못 가른다.
 * ⛔ **백만분율이라 판 크기는 이미 나눠져 있다.** 「말레이판이 작아서」는 답이 아니다.
 *    다만 작은 판은 수가 출렁인다 — 그 말을 적는다.
 * ⛔ 네 판 다 문서가 있는 사람만 견준다. 없는 문서를 0 으로 안 센다.
 * ⛔ 광고 자리를 만들지 않는다.
 *
 * 🔴 `--selftest` 를 argv 로만 보면 남의 시험을 가로챈다. 직접 실행됐을 때만 돈다.
 *
 * 쓰는 법
 *   node scripts/build-wikitip-last-place.mjs
 *   node scripts/build-wikitip-last-place.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 근거, 백만분율 as 백만분율자 } from './_evidence-kcw.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 음악길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-musicians.json');
export const 배우길 = path.join(뿌리, 'archive', 'raw', 'wikipedia', 'sea-actors.json');
export const 낼길 = path.join(뿌리, 'src', 'data', 'wikitip-last-place.json');

export const 판들 = ['id', 'vi', 'th', 'ms'];
export const 판이름 = { id: 'Indonesian', vi: 'Vietnamese', th: 'Thai', ms: 'Malay' };
export const 나라이름 = { id: 'Indonesia', vi: 'Vietnam', th: 'Thailand', ms: 'Malaysia' };
/** 표에 세울 사람 수. ⚠ 우리가 정한 것이다 */
export const 위몇명 = 20;

/**
 * ⛔⛔ **겹친 사람을 두 번 세지 않는다.**
 *   IU·임윤아·차은우는 음악 자료와 배우 자료에 둘 다 있다. Q번호로 한 번만 센다.
 *   처음에 이걸 안 해서 위 12명 목록에 IU 가 두 번 나왔다.
 */
export function 겹침빼기(무리들) {
  const 본 = new Set(); const 남 = [];
  for (const 무리 of 무리들) {
    for (const x of 무리) {
      const 키 = x.q ?? x.name;
      if (본.has(키)) continue;
      본.add(키);
      남.push(x);
    }
  }
  return 남;
}

/** 네 판 다 수가 있는 사람만. ⛔ 없는 문서를 0 으로 안 센다 */
export function 넷다있나(사람, 볼판 = 판들) {
  return 볼판.every((p) => typeof 사람?.perMillion?.[p] === 'number');
}

/** 한 사람의 판 차례 — 많이 읽힌 순 */
export function 차례(사람, 볼판 = 판들) {
  return 볼판.map((p) => ({ edition: p, perMillion: 사람.perMillion[p] }))
    .sort((a, b) => b.perMillion - a.perMillion);
}

/** 판마다 몇 번 첫째였나 · 몇 번 꼴찌였나 */
export function 첫째꼴찌(사람들, 볼판 = 판들) {
  const 첫 = Object.fromEntries(볼판.map((p) => [p, 0]));
  const 꼴 = Object.fromEntries(볼판.map((p) => [p, 0]));
  const 차례셈 = new Map();
  for (const x of 사람들) {
    const s = 차례(x, 볼판);
    첫[s[0].edition] += 1;
    꼴[s.at(-1).edition] += 1;
    const k = s.map((z) => z.edition).join('>');
    차례셈.set(k, (차례셈.get(k) ?? 0) + 1);
  }
  return {
    first: 첫,
    last: 꼴,
    orders: [...차례셈].sort((a, b) => b[1] - a[1]).map(([order, count]) => ({ order, count })),
  };
}

/** 위 N명이 전부 같은 판을 꼴찌로 두나 */
export function 위쪽꼴찌(사람들, 몇 = 위몇명, 볼판 = 판들) {
  const 위 = [...사람들].sort((a, b) => b.seaPerMillionTotal - a.seaPerMillionTotal).slice(0, 몇);
  const 셈 = {};
  for (const x of 위) {
    const e = 차례(x, 볼판).at(-1).edition;
    셈[e] = (셈[e] ?? 0) + 1;
  }
  const 한판 = Object.entries(셈).find(([, n]) => n === 위.length);
  return {
    looked: 위.length,
    counts: 셈,
    allSameEdition: 한판 ? 한판[0] : null,
    people: 위.map((x) => ({
      name: x.name,
      isGroup: x.isGroup ?? null,
      total: x.seaPerMillionTotal,
      byEdition: Object.fromEntries(볼판.map((p) => [p, x.perMillion[p]])),
      most: 차례(x, 볼판)[0].edition,
      least: 차례(x, 볼판).at(-1).edition,
      mostOverLeast: +(차례(x, 볼판)[0].perMillion / 차례(x, 볼판).at(-1).perMillion).toFixed(1),
    })),
  };
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (n, v, w) => {
    const ok = typeof w === 'function' ? w(v) : JSON.stringify(v) === JSON.stringify(w);
    if (ok) 통 += 1; else { 실 += 1; console.error(`  ⛔ ${n}\n     받은 것: ${JSON.stringify(v)}`); }
  };

  /* ⛔⛔ 이 시험이 이 자를 만든 까닭이다 — IU 가 두 번 나왔다 */
  재본다('⛔⛔ 같은 Q번호를 두 번 안 센다',
    겹침빼기([[{ q: 'Q1', name: 'IU' }], [{ q: 'Q1', name: 'IU' }]]).length, 1);
  재본다('⭐ 다른 사람은 둘 다 남는다',
    겹침빼기([[{ q: 'Q1' }], [{ q: 'Q2' }]]).length, 2);
  재본다('Q번호가 없으면 이름으로 겹침을 본다',
    겹침빼기([[{ name: 'A' }], [{ name: 'A' }]]).length, 1);

  재본다('네 판 다 있어야 센다', 넷다있나({ perMillion: { id: 1, vi: 2, th: 3, ms: 4 } }), true);
  재본다('⛔ 한 판이라도 없으면 안 센다', 넷다있나({ perMillion: { id: 1, vi: 2, th: 3 } }), false);
  재본다('⛔⛔ 0 은 있는 것이다', 넷다있나({ perMillion: { id: 0, vi: 0, th: 0, ms: 0 } }), true);

  const 사람 = { perMillion: { id: 5, vi: 9, th: 1, ms: 3 }, seaPerMillionTotal: 18 };
  재본다('많이 읽힌 순으로 세운다', 차례(사람).map((x) => x.edition), ['vi', 'id', 'ms', 'th']);

  const ㄱ = 첫째꼴찌([사람, { perMillion: { id: 2, vi: 8, th: 1, ms: 4 } }]);
  재본다('첫째를 센다', ㄱ.first.vi, 2);
  재본다('꼴찌를 센다', ㄱ.last.th, 2);
  재본다('⭐ 가장 흔한 차례를 낸다', ㄱ.orders[0].order, 'vi>id>ms>th');

  const ㄴ = 위쪽꼴찌([사람, { name: 'B', perMillion: { id: 2, vi: 8, th: 1, ms: 4 }, seaPerMillionTotal: 15 }], 2);
  재본다('⭐ 위 둘이 같은 판을 꼴찌로 둔다', ㄴ.allSameEdition, 'th');
  재본다('배수를 낸다', ㄴ.people[0].mostOverLeast, 9);
  재본다('⛔ 갈리면 null', 위쪽꼴찌([사람, { perMillion: { id: 9, vi: 1, th: 5, ms: 3 }, seaPerMillionTotal: 18 }], 2).allSameEdition, null);

  재본다('⭐ 원본 둘이 있다', fs.existsSync(음악길) && fs.existsSync(배우길), true);

  console.log(`꼴찌를 세는 자 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  const 음 = JSON.parse(fs.readFileSync(음악길, 'utf8'));
  const 배 = JSON.parse(fs.readFileSync(배우길, 'utf8'));

  const 모두 = 겹침빼기([음.people, 배.people]);
  const 넷 = 모두.filter((x) => 넷다있나(x) && typeof x.seaPerMillionTotal === 'number');
  const 셈 = 첫째꼴찌(넷);
  const 위 = 위쪽꼴찌(넷);

  const 제일꼴찌 = 판들.reduce((a, b) => (셈.last[b] > 셈.last[a] ? b : a));
  const 제일첫째 = 판들.reduce((a, b) => (셈.first[b] > 셈.first[a] ? b : a));

  const 자료 = {
    generated: 음.generated?.slice(0, 10) ?? null,
    source: 음.source,
    window: 음.window,
    editions: 판들,
    editionNames: 판이름,
    countryNames: 나라이름,
    question: 'Four Southeast Asian Wikipedias read about the same Korean stars. Does the order '
      + 'they come in change from star to star?',
    /* ⛔ 겹침을 뺐다는 것을 밝힌다 — IU 가 두 번 나왔던 자리다 */
    dedupeNote: `The music and actor panels overlap: IU, Im Yoon-ah and Cha Eun-woo appear in `
      + `both. We count each person once by their Wikidata id. Before we did, our own top-twenty `
      + `list had IU in it twice.`,
    peopleInAllFour: 넷.length,
    peopleLooked: 모두.length,
    first: 셈.first,
    last: 셈.last,
    mostOftenFirst: 제일첫째,
    mostOftenLast: 제일꼴찌,
    lastSharePc: +((100 * 셈.last[제일꼴찌]) / 넷.length).toFixed(1),
    commonestOrders: 셈.orders.slice(0, 6).map((o) => ({
      ...o,
      sharePc: +((100 * o.count) / 넷.length).toFixed(1),
    })),
    topOfList: 위,
    theOtherExplanation: 'Malay and Indonesian are close enough to read across. A reader in '
      + 'Malaysia can use the Indonesian article, and if they do, their reading lands in the '
      + 'Indonesian column. Nothing in this data separates that from a Malaysian reader who simply '
      + 'did not look. We are not going to pretend it does.',
    ...근거([백만분율자], {
      방법: 'Only people with an article on all four editions are compared, so a missing article '
        + 'is never read as a low figure. Each person is counted once even when they appear in both '
        + 'the music and the actor panel.',
      한계: 'Per-million already removes the size of each edition, so this is not a statement that '
        + 'the Malay Wikipedia is small. But a smaller edition gives noisier figures, and the '
        + 'Malay and Indonesian languages are close enough that a Malaysian reader may be reading '
        + 'the Indonesian article — which would land in the Indonesian column. This panel is built '
        + 'from Korean titles that reached a Netflix country chart, so anyone outside it is absent.',
    }),
    cannotSay: [
      'Not interest. A reader in Malaysia may be reading the Indonesian article, which is written '
        + 'in a language close to their own.',
      'Not edition size. Reads are already expressed per million reads of that edition.',
      'Not everyone. The panel is the casts and acts behind Korean titles that reached a Netflix '
        + 'country chart.',
    ],
  };

  fs.writeFileSync(낼길, `${JSON.stringify(자료, null, 1)}\n`);

  console.log(`네 판 다 있는 스타 ${넷.length}명 (겹침 뺀 뒤 ${모두.length}명 중)\n`);
  console.log('           첫째   꼴찌');
  for (const p of 판들) {
    console.log(`${판이름[p].padEnd(11)}${String(셈.first[p]).padStart(5)}${String(셈.last[p]).padStart(7)}`);
  }
  console.log(`\n⭐ 제일 자주 꼴찌: ${판이름[제일꼴찌]} ${자료.lastSharePc}%`);
  console.log(`⭐ 위 ${위.looked}명은 ${위.allSameEdition ? `${판이름[위.allSameEdition]} 판이 **전부** 꼴찌` : '갈린다'}`);
  console.log('\n가장 흔한 차례:');
  for (const o of 자료.commonestOrders.slice(0, 4)) console.log(`   ${o.order}  ${o.count} (${o.sharePc}%)`);
  console.log('\n위 다섯:');
  for (const x of 위.people.slice(0, 5)) {
    console.log(`   ${x.name.padEnd(16)} ${String(x.total).padStart(7)}  제일 ${x.most} · 제일적게 ${x.least} · ${x.mostOverLeast}배`);
  }
  console.log(`\n자료 → ${path.relative(뿌리, 낼길)}`);
}
