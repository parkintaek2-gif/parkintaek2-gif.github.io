#!/usr/bin/env node
/**
 * check-kcw-daily-quota.mjs — **오늘 몫(텍스트 6 · 영상 1 · 기타 1)을 «라이브로» 센다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [사장님이 정하신 하루 몫]
 *   텍스트 6 · 영상 1 · 기타(카드뉴스) 1. **셋을 따로 센다.**
 *   그중 텍스트 6은 다시 갈린다 — 롱테일 2(자료 수집→가공) · 이슈+롱테일 4.
 *
 * [🔴 왜 만드나 — 2026-09-06 에 두 번 틀리게 셌다]
 *   1) 「파일이 6개 있다」로 「텍스트 6/6 ✅」이라고 보고했다. 손님에게 갔는지는 안 봤다
 *   2) 그래서 라이브를 재 봤더니 **여섯 편 다 404** 였다. 놀라서 사고로 적을 뻔했다
 *      ⛔ 그것도 틀렸다 — **주소 꼴을 내가 «유추»했기 때문**이다.
 *         내가 잰 것    https://www.kculturewire.com/{slug}        → 404
 *         진짜 주소     https://www.kculturewire.com/article/{slug} → 200
 *   ⭐ 사장님이 못박으신 것과 정확히 같은 잘못이다 —
 *     「그새 확인하는 거 잊니? 한 100번 넘게 너희들한테 말했겠다」
 *     「주소를 유추해 넣지 않는다. 화면에 보이는 링크를 눌러서 간다」
 *
 * [그래서 이 자가 하는 일]
 *   · 주소 꼴을 **여기 한 곳에** 박아 둔다. 다음 사람이 다시 유추하지 않게
 *   · 파일이 아니라 **라이브 응답**으로 센다
 *   · 못 잰 것은 「0」이 아니라 **「못 쟀다」**로 낸다
 *
 * [쓰는 법]
 *   node scripts/check-kcw-daily-quota.mjs --자가시험
 *   node scripts/check-kcw-daily-quota.mjs              오늘치
 *   node scripts/check-kcw-daily-quota.mjs --날 2026-09-05
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * ⭐ 주소 꼴 — **여기가 정본이다. 다른 곳에서 짐작하지 않는다.**
 * 2026-09-06 에 라이브로 재서 확인했다(/{slug} 는 404, /article/{slug} 는 200).
 */
export const 주소꼴 = {
  밑: 'https://www.kculturewire.com',
  기사: (슬러그) => `https://www.kculturewire.com/article/${슬러그}`,
  영상: (벌) => `https://www.kculturewire.com/video/${벌}.mp4`,
  카드: (벌, n) => `https://www.kculturewire.com/cardnews/${벌}-sq-${n}.png`,
};

/** 하루 몫 — 사장님이 정하신 수 */
export const 하루몫 = { 텍스트: 6, 영상: 1, 기타: 1 };

/** frontmatter 에서 그 글의 발행일을 읽는다 */
export function 발행일(글) {
  const m = String(글 ?? '').match(/^pubDate:\s*(\d{4}-\d{2}-\d{2})/m);
  return m ? m[1] : null;
}

/** 오늘 KST — ⛔ toISOString() 을 쓰지 않는다(UTC 라 새벽에 하루가 어긋난다) */
export function 오늘KST(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 몇 개 찼나 — 「0」과 「못 쟀다」를 가른다 */
export function 셈(찬것, 목표, 못잼 = 0) {
  return { 찬것, 목표, 못잼, 됐나: 찬것 >= 목표,
           표: `${찬것}/${목표}${못잼 ? ` (⬜ 못 잰 것 ${못잼})` : ''}` };
}

/* ── 자가시험 ─────────────────────────────────────────────────────────── */
const 내가직접돌았나 = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (내가직접돌았나 && process.argv.includes('--자가시험')) {
  let 통과 = 0; let 실패 = 0;
  const 참 = (이름, 값) => { if (값) 통과++; else { 실패++; console.log('  🔴', 이름); } };

  /* 🔴 오늘 실제로 틀렸던 그 자리 — 이 시험이 그것을 다시 막는다 */
  참('기사 주소에 /article 이 든다', 주소꼴.기사('x').includes('/article/x'));
  참('기사 주소를 /{slug} 로 만들지 않는다', !/kculturewire\.com\/x$/.test(주소꼴.기사('x')));
  참('영상 주소 꼴', 주소꼴.영상('shelf-voiced').endsWith('/video/shelf-voiced.mp4'));
  참('카드 주소 꼴', 주소꼴.카드('abc', 2).endsWith('/cardnews/abc-sq-2.png'));

  참('하루 몫이 6·1·1', 하루몫.텍스트 === 6 && 하루몫.영상 === 1 && 하루몫.기타 === 1);

  참('발행일을 읽는다', 발행일('---\ntitle: x\npubDate: 2026-09-06\n---') === '2026-09-06');
  참('없으면 null', 발행일('---\ntitle: x\n---') === null);
  참('빈 글을 견딘다', 발행일('') === null);
  참('null 을 견딘다', 발행일(null) === null);

  /* ⛔ toISOString() 은 UTC 라 새벽에 하루가 어긋난다 — KST 를 그대로 쓴다 */
  참('오늘KST 가 KST 로 나온다', 오늘KST(new Date(2026, 8, 6, 1, 30)) === '2026-09-06');
  참('자정 직후에도 그날이다', 오늘KST(new Date(2026, 8, 6, 0, 5)) === '2026-09-06');
  참('한 자리 달·날에 0을 채운다', 오늘KST(new Date(2026, 0, 3)) === '2026-01-03');

  참('다 차면 됐다', 셈(6, 6).됐나 === true);
  참('모자라면 안 됐다', 셈(5, 6).됐나 === false);
  참('넘쳐도 됐다', 셈(8, 6).됐나 === true);
  /* ⭐ 「0」과 「못 쟀다」를 가른다 — 강령③ */
  참('못 잰 것을 표에 적는다', 셈(3, 6, 2).표.includes('못 잰 것 2'));
  참('못 잰 것이 없으면 안 적는다', 셈(6, 6, 0).표 === '6/6');

  /* 🔴 실측 회귀 — 인자 없이 돌렸을 때 argv[0](node 경로)을 날짜로 집던 흠 */
  const 날뽑기 = (argv) => {
    const 붙은것 = argv.find((a) => a.startsWith('--날='));
    if (붙은것) return 붙은것.split('=')[1];
    const i = argv.indexOf('--날');
    if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
    return null;
  };
  참('인자가 없으면 null 을 낸다', 날뽑기(['node', 'x.mjs']) === null);
  참('--날=값 을 읽는다', 날뽑기(['node', 'x.mjs', '--날=2026-09-05']) === '2026-09-05');
  참('--날 값 도 읽는다', 날뽑기(['node', 'x.mjs', '--날', '2026-09-05']) === '2026-09-05');
  참('--날 뒤에 다른 인자면 안 집는다', 날뽑기(['node', 'x.mjs', '--날', '--자가시험']) === null);

  console.log(`\n하루 몫 검사 — 자가시험 ${통과} 통과 · ${실패} 실패`);
  process.exit(실패 ? 1 : 0);
}

if (내가직접돌았나) {
  /* 🔴 [고쳐 적음] 처음엔 이렇게 썼다 —
       process.argv[process.argv.indexOf("--날") + 1]
     인자가 «없으면» indexOf 가 -1 이라 argv[0](node 실행파일 경로)을 집었다.
     그래서 제목 줄에 node 경로가 찍히고 셈이 다 0/6 으로 나왔다.
     ⛔ 그 0 을 보고 「아무것도 안 냈다」로 읽을 뻔했다 — 실은 «날짜를 잘못 집은» 것이었다.
     ⭐ 없을 때를 «먼저» 가른다. -1 을 그대로 자리로 쓰지 않는다.
     ⭐ 그리고 집어 온 값이 날짜 «꼴»인지 본다 — 아니면 세지 말고 멈춘다.
        틀린 날짜로 0 을 내면, 그 0 이 「오늘 아무것도 안 했다」는 거짓 보고가 된다. */
  const 날인자 = (() => {
    const 붙은것 = process.argv.find((a) => a.startsWith("--날="));
    if (붙은것) return 붙은것.split("=")[1];
    const i = process.argv.indexOf("--날");
    if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")) return process.argv[i + 1];
    return null;
  })();
  const 날 = 날인자 || 오늘KST();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(날)) { console.log(`⛔ 날짜 꼴이 아니다: 「${날}」`); process.exit(1); }

  const 방 = path.join(뿌리, 'content', 'kculturewire');

  /* 텍스트 — 그날 발행일인 글을 «라이브로» 두드린다 */
  const 글들 = fs.readdirSync(방).filter((f) => f.endsWith('.md'))
    .filter((f) => 발행일(fs.readFileSync(path.join(방, f), 'utf8')) === 날)
    .map((f) => f.replace(/\.md$/, ''));

  console.log(`■ ${날} 하루 몫 — «라이브로» 센다 (파일이 아니라 손님이 여는 주소로)\n`);

  let 산것 = 0; let 못잼 = 0;
  for (const s of 글들) {
    let c = 0;
    try {
      const r = await fetch(주소꼴.기사(s), { redirect: 'follow', signal: AbortSignal.timeout(25000) });
      c = r.status;
    } catch (e) { c = 0; }
    if (c === 200) 산것++; else if (c === 0) 못잼++;
    console.log(`   ${c === 200 ? '✅' : c === 0 ? '⬜' : '🔴'} ${String(c || '못 쟀다').padStart(7)}  ${s}`);
  }
  const 텍스트 = 셈(산것, 하루몫.텍스트, 못잼);

  /* 영상 — 그날 목록에 든 것 */
  let 영상 = 셈(0, 하루몫.영상);
  try {
    const j = JSON.parse(fs.readFileSync(path.join(뿌리, 'src', 'data', 'wikitip-video.json'), 'utf8'));
    const 그날 = (j.videos || []).filter((v) => v.uploadDate === 날);
    let 산영상 = 0; let 못잰영상 = 0;
    for (const v of 그날) {
      let c = 0;
      try { c = (await fetch(주소꼴.영상(v.set), { method: 'HEAD', signal: AbortSignal.timeout(25000) })).status; } catch (e) { c = 0; }
      if (c === 200) 산영상++; else if (c === 0) 못잰영상++;
      console.log(`   ${c === 200 ? '✅' : c === 0 ? '⬜' : '🔴'} ${String(c || '못 쟀다').padStart(7)}  영상 ${v.set}`);
    }
    영상 = 셈(산영상, 하루몫.영상, 못잰영상);
  } catch (e) { console.log(`   ⬜ 영상 목록을 못 읽었다: ${String(e.message).slice(0, 50)}`); }

  /* 기타(카드뉴스) — 그날 «새로 낸» 카드 벌
   *
   * 🔴 [2026-09-07 고침] 여기가 **파일 시각(mtime)으로 셌다.** 그래서 그날 옛 카드를
   *   «다시 구우면» 그것까지 「오늘 만든 것」으로 셌다. 실제로 오늘 OG 딱지 겹침을
   *   고치려고 166벌을 다시 구웠더니 이 자가 **「기타 166/1 ✅」**을 냈고,
   *   나는 그 수를 그대로 보고에 옮겼다. **다시 구운 것은 발행이 아니다.**
   *
   * ⚠ birthtime 으로도 못 가른다 — 다시 구울 때 파일을 «지우고 새로» 쓰므로
   *   생성시각도 오늘이 된다. 2026-09-07 에 재 봤다: 새로 1,624 · 다시 0 (틀린 답).
   * ✅ 그래서 **git 에 묻는다.** 오늘 커밋이 «더한(A)» 것이 새로 낸 것이고,
   *   «고친(M)» 것은 다시 구운 것이다. 그날 실측: 새로 20벌 · 다시 161벌.
   * ⛔ 커밋 전이라 git 이 모르는 벌은 「새로」에 안 든다 — 그것이 맞다.
   *   커밋도 안 된 것은 손님에게 못 간다(라이브 200 도 안 뜬다).
   */
  const 카드방 = path.join(뿌리, 'public', 'wikitip', 'cardnews');
  let 기타 = 셈(0, 하루몫.기타);
  try {
    const { execFileSync } = await import('node:child_process');
    const 벌뽑기 = (걸러) => {
      let 글 = '';
      try {
        글 = execFileSync('git', ['log', `--since=${날} 00:00`, `--diff-filter=${걸러}`,
          '--name-only', '--pretty=format:', '--', 'public/wikitip/cardnews'],
        { cwd: 뿌리, encoding: 'utf8', timeout: 60000 });
      } catch (e) { return null; }          // 못 물었으면 null — 0 으로 안 채운다
      const 벌 = new Set();
      for (const 줄 of 글.split('\n')) {
        const 이름 = 줄.trim().split('/').pop();
        if (!이름 || !/\.png$/.test(이름)) continue;
        벌.add(이름.replace(/-(sq|v)-\d+\.png$/, ''));
      }
      return 벌;
    };
    const 새벌 = 벌뽑기('A');
    const 다시벌 = 벌뽑기('M');
    if (새벌 === null) {
      console.log('   ⬜ git 에 못 물었다 — 기타를 «못 쟀다»로 둔다(파일 시각으로 되돌리지 않는다)');
    } else {
      /* 다시 구운 것은 새로 낸 것에서 뺀다 — 한 벌이 같은 날 더해지고 고쳐질 수 있다 */
      const 다시만 = new Set([...(다시벌 || [])].filter((v) => !새벌.has(v)));
      console.log(`   ⭐ 오늘 «새로» 낸 벌 ${새벌.size}개 · «다시 구운» 벌 ${다시만.size}개`);
      console.log('   ⛔ 다시 구운 것은 발행으로 안 셉니다 (2026-09-07 에 166벌을 그렇게 셌습니다)');
      let 산카드 = 0; let 못잰카드 = 0;
      for (const v of 새벌) {
        let c = 0;
        try { c = (await fetch(주소꼴.카드(v, 1), { method: 'HEAD', signal: AbortSignal.timeout(25000) })).status; } catch (e) { c = 0; }
        if (c === 200) 산카드++; else if (c === 0) 못잰카드++;
        console.log(`   ${c === 200 ? '✅' : c === 0 ? '⬜' : '🔴'} ${String(c || '못 쟀다').padStart(7)}  카드 ${v}`);
      }
      기타 = 셈(산카드, 하루몫.기타, 못잰카드);
    }
  } catch (e) { console.log(`   ⬜ 카드 방을 못 읽었다: ${String(e.message).slice(0, 50)}`); }

  console.log(`\n■ ${날} 셈`);
  console.log(`   텍스트  ${텍스트.표.padEnd(20)} ${텍스트.됐나 ? '✅' : '🔴'}`);
  console.log(`   영상    ${영상.표.padEnd(20)} ${영상.됐나 ? '✅' : '🔴'}`);
  console.log(`   기타    ${기타.표.padEnd(20)} ${기타.됐나 ? '✅' : '🔴'}`);

  console.log('\n⛔ 이 자는 «주소가 200을 낸다»까지만 봅니다.');
  console.log('   그 지면이 «읽을 만한가»는 사람이 열어 봐야 압니다 — 200 은 「서버가 답했다」일 뿐입니다.');
  const 다됐나 = 텍스트.됐나 && 영상.됐나 && 기타.됐나;
  process.exit(다됐나 ? 0 : 1);
}
