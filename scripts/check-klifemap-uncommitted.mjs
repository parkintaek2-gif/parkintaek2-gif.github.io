#!/usr/bin/env node
/**
 * check-klifemap-uncommitted.mjs — **형제 저장소(klifemap)에 «고쳐 놓고 안 보낸» 것이 있나.**
 *
 *   node scripts/check-klifemap-uncommitted.mjs
 *   node scripts/check-klifemap-uncommitted.mjs --자가시험
 *
 * ── 🔴 왜 만드나 (2026-09-16 18:3x · 5번) ────────────────────────────────
 *
 * 사장님: 「**왜 아직도 유료서비스로 말을 안 바꿨지 케이라이프맵**」
 *
 * 재 보니 **고칠 것은 이미 다 고쳐져 있었다.** 다만 커밋이 안 된 채 작업트리에만
 * 남아 있어서 저장소에도, 서버에도, 손님 화면에도 영영 안 나갔다.
 *
 * ```
 *   작업트리    유료 서비스       ← 어제 감수로 고쳐 둠
 *   origin/main 값을 받는 감정
 *   라이브      값을 받는 감정    ← 사장님이 보신 것
 * ```
 *
 * ⛔ **「고쳤다」를 「나갔다」로 세지 않는다.** 여섯 자리가 한 작업트리를 쓰는데,
 *   커밋 안 한 고침은 조용히 남고 **아무 데도 빨간불이 안 켜진다.**
 *
 * ── ⚠ 자물쇠가 왜 이것을 못 봤나 — «이 저장소만» 보고 있었다 ──────────────
 *
 * `check-deploy-ready.mjs` 가 같은 것을 재고 있었다. 그런데 그 자는
 * **dataeconomics 한 곳만** 본다. klifemap 은 «형제 저장소»라 밖에 있었다.
 * ⇒ 매출이 나는 서비스 쪽이 감시 밖에 있었던 것이다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────────────
 * ⛔ 남의 파일을 «대신 커밋하지 않는다.** 그러면 남이 일하던 것이 섞여 나간다.
 *   이 자는 말만 한다 — 누가 무엇을 들고 있는지 보이게 한다
 * ⛔ 손님에게 안 나가는 것(docs·archive·메모)으로 빨간불을 켜지 않는다.
 *   늘 빨간 자리는 안 읽히고, 안 읽히면 그 아래 진짜 빨간불까지 같이 건너뛴다
 * ⬜ 형제 저장소가 없으면 「고장」이 아니라 **「못 쟀다」**로 적는다
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

export const 형제뿌리 = path.resolve(process.env.KLM_REPO || 'C:/Users/USER/Documents/GitHub/klifemap');

/* ── 판정만 떼어 낸다 ─────────────────────────────────────────────────── */

/**
 * klifemap 에서 «손님 화면에 닿는» 파일인가.
 * ⚠ 이 저장소(Astro·빌드)와 klifemap(정적 public + 서버)은 꼴이 다르다 —
 *   klifemap 은 `public/` 이 그대로 손님에게 나가고, 서버 파일도 손님 길에 닿는다.
 */
export function 손님에게닿나(길) {
  const p = String(길 ?? '').replace(/^"|"$/g, '').replace(/\\/g, '/');
  if (!p) return false;
  if (p.startsWith('docs/')) return false;
  if (p.startsWith('archive/')) return false;
  if (p.startsWith('tests/')) return false;
  if (p.startsWith('scripts/')) return false;
  if (/^[^/]+\.md$/.test(p)) return false;            /* 뿌리의 메모 파일 */
  if (/\.(tsv|log)$/.test(p)) return false;           /* 우리끼리 보는 대장 */
  if (p.startsWith('public/')) return true;           /* 그대로 손님에게 나간다 */
  if (p.startsWith('auth/') || p.startsWith('src/') || p.startsWith('server/')) return true;
  if (/^(server|app)\.(js|mjs)$/.test(p)) return true;
  if (p.startsWith('.cloudtype/')) return true;       /* 배포 설정 — 틀리면 통이 안 뜬다 */
  return false;
}

/** 포슬린 한 줄에서 길만 뽑는다. `R  옛 -> 새` 는 새 쪽을 본다. */
export function 길뽑기(줄) {
  const 글 = String(줄 ?? '').replace(/\r$/, '');
  const m = /^\s*[MADRCU?!]{1,2}\s+(.*)$/.exec(글);
  const 뒤 = (m ? m[1] : 글).trim();
  const i = 뒤.indexOf(' -> ');
  return i >= 0 ? 뒤.slice(i + 4).trim() : 뒤;
}

/** 포슬린 전체 → 손님에게 닿는데 커밋 안 된 길들 */
export function 안보낸것(포슬린) {
  return String(포슬린 ?? '')
    .split(/\r?\n/)
    .filter((줄) => 줄.trim())
    .map(길뽑기)
    .filter(손님에게닿나);
}

/* ── 실제로 재는 자리 ──────────────────────────────────────────────────── */

function 잰다() {
  if (!existsSync(형제뿌리)) return { 판정: '못잼', 왜: '형제 저장소를 못 찾았다 — ' + 형제뿌리 };
  let 포슬린 = '';
  let 안민것 = 0;
  try {
    포슬린 = execFileSync('git', ['status', '--porcelain'], { cwd: 형제뿌리, encoding: 'utf8' });
    /* 커밋은 했는데 «밀지» 않은 것도 같은 병이다 — 서버는 origin 을 본다 */
    const 밀것 = execFileSync('git', ['log', '--oneline', 'origin/main..HEAD'], { cwd: 형제뿌리, encoding: 'utf8' });
    안민것 = 밀것.split(/\r?\n/).filter((x) => x.trim()).length;
  } catch (e) {
    return { 판정: '못잼', 왜: 'git 을 못 돌렸다: ' + String(e.message).slice(0, 60) };
  }
  const 길들 = 안보낸것(포슬린);
  if (길들.length || 안민것) return { 판정: '막혔다', 길들, 안민것 };
  return { 판정: '깨끗', 길들: [], 안민것: 0 };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */

function 자가시험() {
  const 것들 = [];
  const 다 = (이름, 참) => 것들.push({ 이름, 참: !!참 });

  /* 🔴 오늘 실제로 놓친 두 파일 */
  다('public/index.html 은 손님에게 닿는다', 손님에게닿나('public/index.html'));
  다('public/product-deck.js 도 닿는다', 손님에게닿나('public/product-deck.js'));
  다('server.js 는 닿는다', 손님에게닿나('server.js'));
  다('auth/oauth-providers.js 는 닿는다', 손님에게닿나('auth/oauth-providers.js'));
  다('.cloudtype/app.yaml 은 닿는다', 손님에게닿나('.cloudtype/app.yaml'));

  /* ⛔ 늘 빨간 자리를 만들지 않는다 — 우리끼리 보는 것은 안 센다 */
  다('docs 는 안 닿는다', !손님에게닿나('docs/1번-4번-메모.md'));
  다('archive 는 안 닿는다', !손님에게닿나('archive/raw/x/2026-09-16.json'));
  다('scripts 는 안 닿는다', !손님에게닿나('scripts/check-x.mjs'));
  다('tests 는 안 닿는다', !손님에게닿나('tests/a.test.js'));
  다('뿌리 메모는 안 닿는다', !손님에게닿나('README.md'));
  다('대장(tsv)은 안 닿는다', !손님에게닿나('docs/16시알림-보냄.tsv') && !손님에게닿나('보낸메일.tsv'));
  다('빈 길은 안 닿는다', !손님에게닿나('') && !손님에게닿나(null));

  /* 길뽑기 — ⛔ 세 글자를 잘라내지 않는다(앞 빈칸이 날아가는 사고가 있었다) */
  다('앞 빈칸이 있어도 뽑는다', 길뽑기(' M public/index.html') === 'public/index.html');
  다('앞 빈칸이 없어도 뽑는다', 길뽑기('M public/index.html') === 'public/index.html');
  다('새 파일(??)도 뽑는다', 길뽑기('?? public/new.html') === 'public/new.html');
  다('이름 바뀐 것은 «새» 쪽을 본다', 길뽑기('R  public/a.html -> public/b.html') === 'public/b.html');
  다('따옴표 씌운 한글 길도 본다', 손님에게닿나('"public/\\355\\225\\234.html"') === true);

  /* 안보낸것 — 오늘 꼴 그대로 */
  const 오늘 = ' M "docs/16시알림-보냄.tsv"\n M "docs/배포기준선.json"\n M public/index.html\n M public/product-deck.js';
  다('🔴 오늘 꼴에서 둘만 잡는다', 안보낸것(오늘).length === 2);
  다('그 둘이 지면 파일이다', 안보낸것(오늘).every((p) => p.startsWith('public/')));
  다('빈 포슬린이면 없다', 안보낸것('').length === 0 && 안보낸것(null).length === 0);
  다('빈 줄을 세지 않는다', 안보낸것('\n\n\n').length === 0);

  /* 겨누는 곳이 형제 저장소인가 — 이 저장소를 보면 아무 뜻이 없다 */
  다('형제 저장소를 본다', /klifemap/i.test(형제뿌리));

  const 진 = 것들.filter((x) => !x.참);
  console.log(`자가시험 ${것들.length - 진.length}/${것들.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}

/* ── 들머리 ───────────────────────────────────────────────────────────── */

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--자가시험')) 자가시험();
  else {
    const 것 = 잰다();
    console.log('■ klifemap — 고쳐 놓고 «안 보낸» 것이 있나  (' + new Date().toLocaleString('ko-KR') + ')');
    if (것.판정 === '못잼') { console.log('   ⬜ 못 쟀다 — ' + 것.왜); process.exit(2); }
    if (것.판정 === '깨끗') { console.log('   ✅ 손님에게 나가는 것 중 안 보낸 것 없다'); process.exit(0); }
    if (것.길들.length) {
      console.log('   🔴 커밋 안 된 채 작업트리에만 있는 «손님 지면» ' + 것.길들.length + '개 —');
      for (const p of 것.길들) console.log('      · ' + p);
    }
    if (것.안민것) console.log('   🔴 커밋은 했는데 «안 민» 것 ' + 것.안민것 + '개 — 서버는 origin 을 본다');
    console.log('');
    console.log('   ⛔ 「고쳤다」를 「나갔다」로 세지 않는다. 이 꼴이면 손님은 옛것을 본다.');
    console.log('   ⛔ 남의 파일을 대신 커밋하지 않는다 — 누가 들고 있는지 먼저 묻는다.');
    console.log('   ✅ 내 것이면 길을 «하나씩 적어» 커밋하고 밀고, Cloudtype «대시보드»로 배포한다.');
    console.log('      ⛔ klifemap 에 ctype apply 금지 — 환경변수가 통째로 지워진다.');
    process.exit(1);
  }
}
