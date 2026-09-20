#!/usr/bin/env node
/**
 * check-남의것섞였나.mjs — **한 커밋에 서로 다른 사이트의 파일이 섞였나.**
 *
 * ── 🔴 왜 (2026-09-20 12:2x · 오늘 또 났다) ──────────────────────────────
 * 내가(5번) SeoulMarkets 파일 여덟 개를 스테이지에 담아 두고 커밋 문구를 쓰는 사이,
 * 1번이 KCW 카드뉴스를 커밋했다. 그 커밋(9905cccec)이 **내 스테이징을 통째로 가져갔다** —
 * 「1번: KCW 오늘 첫 카드뉴스」라는 메시지 아래에 `src/pages/data/consensus.astro` 가 들어갔다.
 *
 * ⛔ 지운 것이 아니라 «가져간» 것이라 표가 안 난다. 2026-09-01 에도 같은 일이 있었고
 *   (`check-kcw-my-files-only.mjs`), 그때 「앞으로 `git add -A` 안 쓴다」로 끝냈더니 또 났다.
 * ⭐ 우리 규칙은 이것이다 — **규칙은 문장이 아니라 검사로 둔다.**
 *
 * ── 무엇을 재나 ─────────────────────────────────────────────────────
 * 사이트가 «다른» 파일이 한 커밋에 같이 담겼는지만 본다. 그 조합은 거의 언제나
 * 「누가 남의 스테이징을 쓸어 담았다」는 뜻이다.
 *   SeoulMarkets(금융) · WikiTip/KCW(K컬처) · 백년지도(교육)
 * ⛔ 「누구 것인가」를 사람으로 가리지 않는다 — 분장이 자주 바뀌어 틀린 판정이 난다.
 *   사이트로만 가른다. 사이트는 안 바뀐다.
 * ⛔ 공용 파일(docs/·package.json·scripts/lib 등)은 어느 사이트도 아니다 — 세지 않는다.
 * ⚠ 막지 않고 «세워서 보여 준다». 정말 두 사이트를 함께 고쳐야 할 때가 있다
 *   (공용 부품을 고치고 두 지면을 함께 손보는 경우). 그때는 아래 낱말을 메시지에 넣는다.
 *
 * 빠져나가는 길 — 커밋 메시지에 [두사이트] 를 적는다. 또는 git commit --no-verify.
 *
 * 쓰는 법
 *   node scripts/check-남의것섞였나.mjs                 스테이지에 담긴 것을 본다
 *   node scripts/check-남의것섞였나.mjs --메시지=<파일>   그 파일의 글에서 빠져나갈 낱말을 찾는다
 *   node scripts/check-남의것섞였나.mjs --자가시험
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

/** 사이트를 가르는 무늬. ⛔ 사람(유닛)으로 가르지 않는다 — 분장은 바뀌고 사이트는 안 바뀐다 */
export const 사이트무늬 = {
  'K컬처(WikiTip·KCW)': [
    /^content\/kculturewire\//,
    /^src\/pages\/wikitip\//,
    /^public\/wikitip\//,
    /^src\/data\/(kcw|wikitip)-/,
  ],
  '백년지도': [
    /^src\/pages\/100y\//,
    /^public\/100y\//,
    /^src\/data\/(100y|kess|neis|nps)-/,
  ],
  'SeoulMarkets': [
    /^src\/pages\/data\//,
    /^src\/pages\/v1\//,
    /^src\/data\/(seoulmarkets|korea|uae|india|japan)-/,
    /^src\/lib\/institutions\.mjs$/,
    /^content\/articles\//,
  ],
};

/** 어느 사이트도 아닌 것 — 여섯이 같이 쓴다. 섞였다고 세지 않는다 */
export const 공용무늬 = [
  /^docs\//,
  /^tests\//,
  /^tools\//,
  /^scripts\/lib\//,
  /^package(-lock)?\.json$/,
  /^CLAUDE\.md$/,
  /^\.github\//,
  /^archive\//,
];

/** 길 하나가 어느 사이트인가. 모르면 null — 모르는 것으로 판정하지 않는다 */
export function 어느사이트(길) {
  const p = String(길 || '').replace(/\\/g, '/');
  for (const 무늬 of 공용무늬) if (무늬.test(p)) return null;
  for (const [이름, 무늬들] of Object.entries(사이트무늬)) {
    for (const 무늬 of 무늬들) if (무늬.test(p)) return 이름;
  }
  return null;
}

/** 담긴 길들을 사이트별로 모은다 */
export function 갈라세기(길들) {
  const 통 = {};
  for (const 길 of 길들) {
    const s = 어느사이트(길);
    if (!s) continue;
    (통[s] = 통[s] || []).push(길);
  }
  return 통;
}

export function 스테이지길들() {
  const out = execFileSync('git', ['diff', '--cached', '--name-only'], { encoding: 'utf8' });
  return out.split('\n').map((x) => x.trim()).filter(Boolean);
}

/* ── 자가시험 — 「규칙은 문장이 아니라 검사로 둔다」 ───────────────────── */
export function 자가시험() {
  const 흠 = [];
  const 재다 = (이름, 참) => { if (!참) 흠.push(이름); };

  재다('서울마켓츠 지면', 어느사이트('src/pages/data/consensus.astro') === 'SeoulMarkets');
  재다('서울마켓츠 사전', 어느사이트('src/lib/institutions.mjs') === 'SeoulMarkets');
  재다('K컬처 카드뉴스', 어느사이트('public/wikitip/cardnews/x/1.png') === 'K컬처(WikiTip·KCW)');
  재다('백년지도 지면', 어느사이트('src/pages/100y/major/index.astro') === '백년지도');
  재다('공용 docs 는 안 센다', 어느사이트('docs/세션간-메모.md') === null);
  재다('공용 검사는 안 센다', 어느사이트('tests/a.test.js') === null);
  재다('모르는 길은 안 센다', 어느사이트('README.md') === null);
  /* ⚠ 공용이 사이트보다 «먼저» 걸러져야 한다 — 안 그러면 docs 가 사이트로 잡힌다 */
  재다('공용이 먼저다', 어느사이트('scripts/lib/kcw-x.mjs') === null);

  const 통 = 갈라세기(['src/pages/data/a.astro', 'public/wikitip/b.png', 'docs/c.md']);
  재다('두 사이트로 갈린다', Object.keys(통).length === 2);
  재다('공용은 안 담긴다', !JSON.stringify(통).includes('docs/c.md'));
  재다('한 사이트만이면 하나', Object.keys(갈라세기(['src/pages/data/a.astro'])).length === 1);
  재다('빈 것은 빈 것', Object.keys(갈라세기([])).length === 0);

  return 흠;
}

if (process.argv[1] && process.argv[1].endsWith('check-남의것섞였나.mjs')) {
  const 흠 = 자가시험();
  if (흠.length) { console.log('🔴 자가시험 실패:\n  - ' + 흠.join('\n  - ')); process.exit(1); }
  if (process.argv.includes('--자가시험')) { console.log('✅ 자가시험 12/12'); process.exit(0); }

  /* 빠져나갈 낱말이 메시지에 있으면 통과시킨다 */
  const 메시지인자 = (process.argv.find((x) => x.startsWith('--메시지=')) || '').slice('--메시지='.length);
  let 메시지 = '';
  if (메시지인자 && fs.existsSync(메시지인자)) 메시지 = fs.readFileSync(메시지인자, 'utf8');
  if (메시지.includes('[두사이트]')) {
    console.log('⬜ [두사이트] 라 적혀 있어 통과시킨다 — 일부러 함께 담은 것으로 본다.');
    process.exit(0);
  }

  const 통 = 갈라세기(스테이지길들());
  const 이름들 = Object.keys(통);
  if (이름들.length < 2) process.exit(0);

  console.log('');
  console.log('🔴 한 커밋에 **서로 다른 사이트**의 파일이 담겼습니다 — ' + 이름들.join(' · '));
  for (const 이름 of 이름들) {
    console.log('   [' + 이름 + ']');
    for (const 길 of 통[이름].slice(0, 12)) console.log('     · ' + 길);
    if (통[이름].length > 12) console.log('     … 그 밖 ' + (통[이름].length - 12) + '개');
  }
  console.log('');
  console.log('⛔ 이 조합은 거의 언제나 «남의 스테이징을 쓸어 담은 것»입니다.');
  console.log('   여섯 자리가 한 작업 트리를 씁니다 — `git add -A` · `git commit -a` 가 남의 것을 가져갑니다.');
  console.log('   2026-09-01 에 한 번, 2026-09-20 에 또 났습니다.');
  console.log('');
  console.log('✅ 고치는 길 — 내 것이 아닌 줄을 뺍니다. 지우지 않습니다.');
  console.log('     git restore --staged <그 길>');
  console.log('✅ 정말 두 사이트를 함께 고친 것이라면 커밋 메시지에 [두사이트] 를 적습니다.');
  process.exit(1);
}
