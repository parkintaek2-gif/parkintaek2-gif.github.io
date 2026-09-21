#!/usr/bin/env node
/**
 * check-retracted-article-media.mjs — **내린 기사의 그림·영상이 아직 서비스되고 있나.**
 *
 *   node scripts/check-retracted-article-media.mjs
 *   node scripts/check-retracted-article-media.mjs --자가시험
 *
 * ── 🔴 왜 (2026-09-22 · 5번) ────────────────────────────────────────────
 * 무역 기사 넷이 «스케일브레이크» 결함으로 내려갔다(2026-08-2x · 6번). 기사는
 * `draft: true` 가 되어 지면에서 사라졌고, 되돌림표(301)까지 걸렸다. **그런데**
 *
 * ```
 *   /article/korea-us-surplus-doubled                        301 → 고쳐 쓴 기사  ✅
 *   /video/korea-trade-surplus-tripled-five-partners.mp4     200                🔴
 * ```
 *
 * **그 결함 있는 그래프가 영상으로 여전히 열려 있었다.** 지면은 내렸는데 그림은 안 내린 것이다.
 * 기사를 내리는 까닭이 「숫자가 틀렸다」일 때, 그 숫자를 그린 그림이 남아 있으면 내린 것이 아니다.
 * 링크가 없으니 아무도 안 본다고 볼 수도 없다 — 이미 색인되고 공유된 주소다.
 *
 * ⛔ 이 자는 「안 걸린 파일」을 찾는 check-made-but-invisible 과 다르다. 그 자는 «안 쓰이는 것»을
 *   세고, 이 자는 «내린 기사의 것»을 센다. 안 쓰이는 것은 낭비지만, 내린 것은 «틀린 것»이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 앞머리에 `draft: true` 가 있나 — 앞머리 «안»에서만 본다(본문에 그 글자가 있을 수 있다) */
export function 내린기사인가(글) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(String(글 ?? ''));
  return m ? /^draft:\s*true\s*$/m.test(m[1]) : false;
}

/** 그 slug 가 쓰는 공개 파일들 — 있으면 목록으로 준다 */
export function 남은파일(slug, 있나) {
  const 것 = [];
  const 후보 = [`public/video/${slug}.mp4`, `public/og/${slug}.png`];
  for (let n = 1; n <= 12; n++) 후보.push(`public/cardnews/${slug}-${n}.png`);
  for (const f of 후보) if (있나(f)) 것.push(f);
  return 것;
}

/* ── 자가시험 ──────────────────────────────────────────────── */
const 내가진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (내가진입점 && (process.argv.includes('--자가시험') || process.argv.includes('--selftest'))) {
  const 잰다 = [];
  const 검 = (이름, 참) => 잰다.push([이름, !!참]);

  검('앞머리의 draft: true 를 읽는다', 내린기사인가('---\ntitle: x\ndraft: true\n---\n본문') === true);
  검('draft: false 는 살아 있는 기사', 내린기사인가('---\ndraft: false\n---\n') === false);
  검('draft 줄이 없으면 살아 있는 기사', 내린기사인가('---\ntitle: x\n---\n') === false);
  검('⛔ 본문에 있는 「draft: true」 글자에 속지 않는다',
    내린기사인가('---\ntitle: x\n---\n우리는 draft: true 라고 적는다') === false);
  검('앞머리가 없으면 false', 내린기사인가('그냥 글') === false);

  const 있다 = (f) => ['public/video/a.mp4', 'public/cardnews/a-1.png', 'public/cardnews/a-2.png'].includes(f);
  검('영상과 카드뉴스를 찾아낸다', 남은파일('a', 있다).length === 3);
  검('카드뉴스 번호를 이어서 센다', 남은파일('a', 있다).includes('public/cardnews/a-2.png'));
  검('없는 slug 는 빈 목록', 남은파일('z', 있다).length === 0);
  검('og 카드도 본다', 남은파일('b', (f) => f === 'public/og/b.png').length === 1);

  const 진 = 잰다.filter(([, v]) => !v);
  for (const [이름, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이름}`);
  console.log(진.length ? `\n🔴 ${진.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(진.length ? 1 : 0);
}

/* ── 실제로 훑는다 ──────────────────────────────────────────────── */
if (내가진입점) {
  const 글밭 = ['content/articles', 'content/kculturewire'].map((d) => path.join(뿌리, d)).filter((d) => fs.existsSync(d));
  const 있나 = (f) => fs.existsSync(path.join(뿌리, f));

  const 내린것 = [];
  for (const d of 글밭) {
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith('.md')) continue;
      if (!내린기사인가(fs.readFileSync(path.join(d, f), 'utf8'))) continue;
      const slug = f.replace(/\.md$/, '');
      const 남 = 남은파일(slug, 있나);
      if (남.length) 내린것.push({ slug, 남 });
    }
  }

  console.log('■ 내린 기사의 그림·영상이 아직 남아 있나 — ' + new Date().toLocaleString('ko-KR'));
  if (!내린것.length) {
    console.log('✅ 없다 — 내린 기사의 것은 같이 내려갔다');
    process.exit(0);
  }
  for (const x of 내린것) {
    console.log(`\n🔴 ${x.slug} — ${x.남.length}개`);
    for (const f of x.남) console.log('   · ' + f);
  }
  console.log('\n⛔ 기사를 내린 까닭이 「숫자가 틀렸다」면, 그 숫자를 그린 그림이 남아 있는 한 내린 것이 아니다.');
  console.log('✅ 고치는 길 — 그 파일들을 지운다. 되살릴 일이 있으면 git 에 남아 있다.');
  process.exit(1);
}
