#!/usr/bin/env node
/**
 * K Culture Wire 배포 퀴즈 — **낸 기사가 밖으로 나갔나.**
 *
 * 사장님 지시(2026-08-09):
 *   「콘텐츠를 한 유형으로만 만들지 마 … 그걸 퀴즈로 만들어. 통과되면 그날 일이 시작해」
 *   「콘텐츠 생산 **목적**을 잘 살펴서 전략을 짜야 돼 … 광고수입인 거는 동영상은 그렇게
 *    많이 만들지 않아도 되잖아」
 *
 * ⛔ 6번 퀴즈는 「다섯 형식 다」를 강제한다. 이 자는 그러지 않는다 —
 *    **목적을 먼저 적고, 그 목적에 걸린 칸만 100% 를 요구한다.**
 * ⛔ 우리 손님은 해외다. 영어권 채널에 **한국어 문안**을 올리고 통과시키지 않는다.
 * ⛔ 「0」과 「?」를 가른다. 0 = 재 봤는데 없다 · ? = 못 쟀다(계정이 없다·자가 깨졌다)
 * ⛔ 계정이 걸린 칸은 「못 함」이 아니라 「준비됨 — 계정 열면 오늘 올라간다」로 적는다.
 * ⛔ Riot Production(App 866800) 승인 전이라 **광고 자리 칸은 아예 묻지 않는다.**
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const 기사방 = 'content/kculturewire';
export const 지음방 = 'dist/wikitip';
export const 문안방 = 'docs/소셜-문안-5번';

/** 앞말만 떼어 읽는다. ⛔ CRLF 에서 안 깨진다(8/8 에 두 번 물린 자리다) */
export function 앞말(원문) {
  const 눌린 = String(원문).replace(/\r\n/g, '\n');
  const m = 눌린.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}

export function 앞말값(원문, 열쇠) {
  const m = 앞말(원문).match(new RegExp(`^${열쇠}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}

/**
 * 한글이 섞였나. ⛔ 영어권 채널에 한국어를 올리는 것을 막는 칸이다.
 * ⚠ 작품 제목에 한글이 들어갈 수 있으므로 **몫**으로 본다 — 한두 글자는 통과시킨다.
 */
/**
 * ⛔ 이 문턱은 **우리가 골랐다.** 자료에서 나온 수가 아니다.
 * 20% 로 잡았더니 「Watch 오징어 게임 on Netflix now」가 22.7% 로 걸렸다 —
 * 짧은 문안에서는 **제목 하나가 몫을 밀어 올린다.** 통째 한국어 문안은 50% 를 훌쩍 넘는다.
 * 그 사이인 40% 로 둔다. 자가시험이 양쪽 끝을 다 붙들고 있다.
 */
export const 한국어문턱 = 40;

export function 한글몫(글) {
  const s = String(글);
  const 낱 = s.replace(/\s/g, '').length;
  if (!낱) return 0;
  const 한 = (s.match(/[가-힣]/g) || []).length;
  return +((100 * 한) / 낱).toFixed(1);
}

/** 목적. ⛔ 기사가 스스로 적는다 — 자가 짐작하지 않는다 */
export function 목적(원문) {
  const v = 앞말값(원문, 'purpose');
  if (v === 'reach' || v === 'ads' || v === 'both') return v;
  return null;
}

const 내가실행됐다 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가실행됐다 && process.argv.includes('--selftest')) {
  let 통 = 0; let 실 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    if (JSON.stringify(실제) === JSON.stringify(바람)) 통 += 1;
    else { 실 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  재본다('앞말을 뗀다', 앞말('---\na: 1\n---\n본문'), 'a: 1');
  재본다('CRLF 에서도 뗀다', 앞말('---\r\na: 1\r\n---\r\n본문'), 'a: 1');
  재본다('앞말값', 앞말값('---\ntitle: "가"\n---\n', 'title'), '가');
  재본다('본문의 열쇠는 안 읽는다', 앞말값('---\na: 1\n---\ntitle: 속임', 'title'), null);
  /* ⛔ 이 두 줄이 이 자의 요점이다 — 제목 한 낱말과 통째 한국어를 가른다 */
  재본다('영어 문안에 제목만 한글이면 통과',
    한글몫('Watch 오징어 게임 on Netflix now') < 한국어문턱, true);
  재본다('제목 둘이 섞여도 통과',
    한글몫('Squid Game 오징어 게임 and 더 글로리 held 445 places across ten Arab markets')
      < 한국어문턱, true);
  재본다('통째 한국어는 잡는다',
    한글몫('넷플릭스 차트에서 한국 작품이 차지한 자리는 7.7% 였다') > 한국어문턱, true);
  재본다('빈 글은 0', 한글몫(''), 0);
  재본다('목적을 안 적으면 null', 목적('---\ntitle: x\n---\n'), null);
  재본다('목적 reach', 목적('---\npurpose: reach\n---\n'), 'reach');
  재본다('엉뚱한 목적은 null', 목적('---\npurpose: 아무거나\n---\n'), null);
  console.log(`배포 퀴즈 — 자가시험 ${통} 통과 · ${실} 실패`);
  process.exit(실 ? 1 : 0);
}

if (내가실행됐다) {
  if (!fs.existsSync(기사방)) { console.log(`⛔ 기사방이 없다 — ${기사방}`); process.exit(1); }
  const 사이트맵 = fs.existsSync(`${지음방}/sitemap.xml`)
    ? fs.readFileSync(`${지음방}/sitemap.xml`, 'utf8') : null;

  const 글들 = fs.readdirSync(기사방).filter((f) => f.endsWith('.md')).sort();
  const 판 = [];
  for (const f of 글들) {
    const 원 = fs.readFileSync(`${기사방}/${f}`, 'utf8');
    const s = f.replace(/\.md$/, '');
    const 문안길 = `${문안방}/${s}.md`;
    const 문안 = fs.existsSync(문안길) ? fs.readFileSync(문안길, 'utf8') : null;
    판.push({
      슬러그: s,
      목적: 목적(원),
      냄: 앞말값(원, 'draft') !== 'true',
      섬: fs.existsSync(`${지음방}/article/${s}.html`),
      맵: 사이트맵 === null ? null : 사이트맵.includes(`/article/${s}`),
      카드: fs.existsSync(`${지음방}/og/${s}.png`),
      문안: !!문안,
      /* ⛔ 문안이 없으면 「한국어다」가 아니라 못 쟀다(null) */
      영어: 문안 ? 한글몫(문안) < 한국어문턱 : null,
      /*
       * B2B 207곳으로 가는 길.
       * ⛔ 마크다운에서 재지 않는다 — 60편에 손으로 붙이면 그게 「복사해 붙이기」다.
       *    길은 **틀**에 한 번 두고, 손님이 실제로 보는 **지어진 지면**에서 잰다.
       * ⚠ 지면이 안 서 있으면 「없다」가 아니라 **못 쟀다(null)** 다.
       */
      길: fs.existsSync(`${지음방}/article/${s}.html`)
        ? fs.readFileSync(`${지음방}/article/${s}.html`, 'utf8').includes('/for-industry')
        : null,
      /* ⛔ 계정이 없어 못 재는 칸 */
      올림: null,
    });
  }

  const 셈 = (열쇠, 거른 = 판) => 거른.filter((x) => x[열쇠] === true).length;
  const 못쟨 = (열쇠, 거른 = 판) => 거른.filter((x) => x[열쇠] === null).length;

  console.log(`\n# K Culture Wire 배포 퀴즈 — 기사 ${판.length}편\n`);
  console.log('## 자동으로 재는 칸');
  const 칸 = [
    ['Q1 냈나(draft 아님)', '냄'],
    ['Q2 우리 지면에 섰나', '섬'],
    ['Q3 사이트맵에 있나', '맵'],
    ['Q4 공유 카드가 있나', '카드'],
    ['Q5 채널 문안이 있나', '문안'],
    ['Q6 그 문안이 영어인가', '영어'],
    ['Q7 B2B(/for-industry)로 가는 길이 있나', '길'],
  ];
  for (const [이름, k] of 칸) {
    const n = 셈(k); const q = 못쟨(k);
    const 몫 = 판.length ? Math.round((100 * n) / 판.length) : 0;
    const 표 = q ? `${n}/${판.length} (${몫}%) · 못 잼 ${q}` : `${n}/${판.length} (${몫}%)`;
    console.log(`  ${n === 판.length ? '✅' : '🔴'} ${이름.padEnd(34)} ${표}`);
  }

  console.log('\n## ⛔ 계정이 없어 못 재는 칸 — 「0」이 아니라 「?」다');
  console.log('  ? Q8 스레드·X·인스타그램·유튜브에 올렸나 — 업로드가 사장님 계정이다');
  console.log('    ⭐ 자산을 먼저 만들어 둔다. 계정이 열리는 날 하루 만에 다 나간다');

  console.log('\n## 목적을 적었나 — ⛔ 자가 짐작하지 않는다');
  const 목적없음 = 판.filter((x) => x.목적 === null).length;
  console.log(`  ${목적없음 ? '🔴' : '✅'} 목적(purpose: reach|ads|both)을 안 적은 기사 ${목적없음}편`);
  if (목적없음 === 판.length) {
    console.log('    ⚠ 한 편도 안 적었다 — 목적별 관문은 아직 못 연다. 그것이 첫 구멍이다');
  }

  /* ── 오늘의 관문 ── */
  const 구멍 = 칸.filter(([, k]) => 셈(k) < 판.length).map(([이름]) => 이름);
  console.log('\n## 오늘 관문');
  if (!구멍.length && !목적없음) {
    console.log('  ✅ 통과 — 새 기사를 시작한다');
  } else {
    console.log('  ⛔ 미달 — 새 기사를 쓰기 전에 아래 구멍부터 채운다');
    for (const c of 구멍) console.log(`     · ${c}`);
    if (목적없음) console.log(`     · 목적을 안 적은 기사 ${목적없음}편`);
  }
  console.log('\n⛔ Riot Production(App 866800) 승인 전이라 광고 자리 칸은 묻지 않는다.');
  process.exit(0);
}
