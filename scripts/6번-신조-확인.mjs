#!/usr/bin/env node
/**
 * 6번-신조-확인.mjs — 사장님이 화면에 «고정»하라 하신 신조. 하루 두 번 스스로 본다(자물쇠).
 *
 * 사장님(2026-08-22): 「스스로 할 일을 찾아 쉼 없이 만드는 것, 그게 9월 1,000명·2031년 매출로
 *   가는 길이다. 이걸 아예 화면에 고정해. 자물쇠를 채우던지. 하루 2번 확인하게.」
 *
 * 그래서 이 자물쇠는 «읽기»가 아니라 «잰다» — 지난 12시간에 내가 실제로 값을 냈는가.
 *   낸 것이 없으면 🔴 로 못박는다. 「확인만 했습니다」로 시간을 넘기지 말라는 뜻이다.
 *
 * 쓰는 법  node scripts/6번-신조-확인.mjs   (하루 2번 크론이 부른다)
 */
import { execSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const sh = (c) => { try { return execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { return ''; } };

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║  6번 신조 (사장님 2026-08-22 · 화면 고정)                        ║');
console.log('║                                                                 ║');
console.log('║  스스로 할 일을 찾아 쉼 없이 «만드는» 것 —                       ║');
console.log('║  그게 9월 하루 1,000명 · 2031년 매출로 가는 길이다.             ║');
console.log('║  「확인만 했습니다」는 일이 아니다. 나가지 않아도 만들어 쌓는다. ║');
console.log('╚═══════════════════════════════════════════════════════════════╝');

// 지난 12시간, 6번이 «만든» 것(기사·데이터·지면·수집기·차트)을 센다. 메모만 고친 것은 안 센다.
const since = '12 hours ago';
const madeRaw = sh(`git log --since="${since}" --name-only --pretty=format: -- content/articles src/pages src/data src/lib scripts public/charts public/cardnews public/video`);
const made = [...new Set(madeRaw.split('\n').filter((l) => l && !/docs\//.test(l)))];
const articles = made.filter((f) => f.startsWith('content/articles/'));

console.log(`\n지난 12시간 «만든» 파일 ${made.length}개` + (articles.length ? ` (기사 ${articles.length})` : ''));
made.slice(0, 12).forEach((f) => console.log('  ·', f));

if (made.length === 0) {
  console.log('\n🔴🔴 신조 위반 — 12시간 동안 만든 것이 0개다. 지금 하나 만들어라.');
  console.log('   후보: 새 기사(rates/commodities/macro 축이 얇다) · KOSIS 새 표 수집 · 데이터 상품 지면 · 관세청 브리프 갱신');
} else {
  console.log('\n✅ 만들고 있다. 멈추지 마라 — 다음 하나를 이미 고르고 있어야 한다.');
}
console.log('\n다음 자물쇠 확인까지 또 만든다. 배포가 막혀도 커밋으로 쌓는다.');
