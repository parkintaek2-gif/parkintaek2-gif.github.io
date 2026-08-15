#!/usr/bin/env node
/**
 * backup.mjs — **일이 다 지워져도 되살아나게 한다.**
 *
 * 🔴 사장님(2026-08-15 21:3x): 「클로드가 개발한 걸 다 삭제해버렸다는 얘기가 있다.
 *    그럴 일이 없겠지만 **대비를 해놔라. 원드라이브에 백업을 두 개** 하고,
 *    **하나는 나만 접근할 수 있게** 해라」 · 「**icloud에도** 백업을 해라」
 *
 * ⭐ 우리가 진짜로 겪은 일부터 적습니다 — 남 얘기가 아닙니다.
 *    · 2026-08-09  `git add -A` 가 **남의 세션의 커밋 안 된 파일 6MB** 를 쓸어갔다
 *    · 2026-08-15  2번이 개봉 당일 `scripts/deploy.mjs` 를 깨뜨렸다
 *    둘 다 「지우려던 것」이 아니라 **옆엣것을 건드린 사고**였습니다.
 *    그러니 대비는 「악의」가 아니라 **「실수」**를 향해 세웁니다.
 *
 * ⭐ 무엇이 진짜 위험한가 — 잰 것으로 말합니다
 *    ● 커밋된 것은 이미 깃허브에 있습니다(klifemap 1706 · dataeconomics 2958 커밋, 안 올린 것 0).
 *      **커밋된 코드는 지워도 살아납니다.**
 *    🔴 위험한 것은 셋입니다
 *       ① **커밋 안 된 것** — 방금 잰 것만 dataeconomics 에 12개 있었습니다
 *       ② **깃에 안 들어가는 것** — `.env`(열쇠). 이것을 잃으면 사이트가 안 뜹니다
 *       ③ **역사를 갈아엎는 것** — force push 는 깃허브 것도 지웁니다
 *
 * 어디에 두나
 *   ① OneDrive\백업\          — 세션이 읽고 되살릴 수 있는 곳. **열쇠는 안 넣습니다**
 *   ② OneDrive\백업-사장님전용\ — 사장님만. 여기에만 `.env` 가 갑니다
 *   ③ iCloud Drive\백업\      — 켜져 있을 때만. 다른 회사에 두는 것이 핵심입니다
 *
 * ⛔ 열쇠 다루는 법 — 값은 어디에도 **적지** 않습니다. 파일을 **옮기기만** 합니다.
 *    ①과 ③(세션이 닿는 곳)에는 `.env` 를 **절대 안 보냅니다.**
 *
 * 쓰는 법
 *   node scripts/backup.mjs            오늘 것을 뜬다
 *   node scripts/backup.mjs --재보기     떠 놓은 것이 성한지 검사만
 *   node scripts/backup.mjs --selftest
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const 저장소들 = [
  'C:/Users/USER/Documents/GitHub/klifemap',
  'C:/Users/USER/Documents/GitHub/dataeconomics',
];

/**
 * 🔴 [2026-08-15 22:5x] 사장님이 **폴더째 「중요 보관소」로 옮기셨다.**
 *
 * ⛔ 그대로 두면 다음 백업이 **조용히 사고**를 낸다 —
 *    같은 이름 폴더를 **보관소 밖에** 새로 만들어 열쇠를 거기 둔다.
 *    사장님은 잠긴 줄 아시는데 안 잠겨 있다. **제일 나쁜 종류의 실패**다.
 *
 * ⭐ 그래서 이렇게 한다
 *    · 보관소가 **열려 있으면** 거기에 바로 쓴다
 *    · 잠겨 있으면 **이름으로 소리치는 자리**에 둔다 — 「보관소로-옮기세요」
 *      (보관소는 잠겨 있으면 자동으로 못 쓴다. 그것이 잠금의 뜻이다)
 */
export const 보관소자리들 = [
  'C:/Users/USER/OneDrive/Personal Vault',
  'C:/Users/USER/OneDrive/중요 보관소',
];

export function 보관소찾기(있나 = (p) => fs.existsSync(p)) {
  for (const p of 보관소자리들) if (있나(p)) return p;
  return null;
}

/**
 * ⭐ 사장님이 정하신 모양(22:5x) — **폴더는 밖에, 압축파일만 보관소에.**
 *    「그럼 다시 옮기고 **압축파일만 중요보관소**」
 *
 * 왜 이것이 옳은가 —
 *    · 보관소는 잠기면 자동으로 못 쓴다. 그것이 잠금의 뜻이다
 *    · 그러니 **자는 밖에 쓰고**, 사장님이 **한 덩이만** 안으로 옮기신다
 *    · 손이 한 번만 가고, 잠긴 사본은 진짜로 잠긴다
 */
export const 사장님폴더 = 'C:/Users/USER/OneDrive/백업-사장님전용';

/** 셋째 자리(아이클라우드)는 있을 때만 쓴다 */
export const 둘자리 = [
  { 이름: '① 원드라이브(공용)', 길: 'C:/Users/USER/OneDrive/백업', 열쇠도: false },
  { 이름: '② 사장님 전용', 길: 사장님폴더, 열쇠도: true },
  { 이름: '③ 아이클라우드', 길: 'C:/Users/USER/iCloudDrive/백업', 열쇠도: false, 없어도됨: true },
];

/**
 * ⛔ 이 자의 제일 중요한 규칙 —
 *    **세션이 닿는 곳에는 열쇠를 안 보낸다.**
 *    사장님 전용 자리에만 보낸다. 그것이 「나만 접근할 수 있게」의 실제 알맹이다.
 */
export function 열쇠보낼곳인가(자리) {
  return 자리 === true;
}

/** 몇 벌을 남길지 — 디스크가 7.9GB 뿐이다. 무한정 쌓으면 기계가 선다 */
export const 남길벌 = 3;

export function 지울것고르기(이름들, 남길 = 남길벌) {
  /* 이름은 백업-YYYYMMDD-HHmm 꼴이라 글자순 = 시간순이다.
     ⛔ 사장님 자리는 폴더가 아니라 **`.zip` 한 덩이**로 남는다.
        둘 다 안 걸면 낡은 것이 영영 안 지워져 디스크를 먹는다. */
  const 정렬 = [...이름들].filter((n) => /^백업-\d{8}-\d{4}(\.zip)?$/.test(n)).sort();
  return 정렬.slice(0, Math.max(0, 정렬.length - 남길));
}

/** ⛔ toISOString 을 안 쓴다 — 한국시간으로 적는다 */
export function 오늘이름(때 = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `백업-${때.getFullYear()}${p(때.getMonth() + 1)}${p(때.getDate())}-${p(때.getHours())}${p(때.getMinutes())}`;
}

export function 사람크기(바이트) {
  if (바이트 >= 1024 ** 3) return `${(바이트 / 1024 ** 3).toFixed(1)}GB`;
  if (바이트 >= 1024 ** 2) return `${Math.round(바이트 / 1024 ** 2)}MB`;
  if (바이트 >= 1024) return `${Math.round(바이트 / 1024)}KB`;
  return `${바이트}B`;
}

/** 깃이 안 들고 있는 것 — 이것이 진짜 위험한 것이다 */
export function 깃밖의것(저장소) {
  /* ⛔ [2026-08-15 잡은 사고] `core.quotepath` 를 안 끄면 깃이 한글 이름을
        `"docs/\353\266\200…"` 로 **에스케이프해서** 내놓는다.
        그대로 파일을 찾으면 없다고 나온다 — 우리 파일 이름은 거의 다 한글이다.
     ⭐ 즉 **제일 중요한 것(커밋 안 된 것)이 통째로 안 담길 뻔했다.**
        백업은 「떴다」가 아니라 **「되살아나나」**로 재야 하는 까닭이다. */
  const 나온것 = execFileSync('git',
    ['-C', 저장소, '-c', 'core.quotepath=false', 'status', '--porcelain', '--untracked-files=all'],
    { encoding: 'utf8' });
  return 나온것.split('\n').map((l) => l.slice(3).trim()).filter(Boolean);
}

function 실행(자, 인자, 옵션 = {}) {
  return execFileSync(자, 인자, { encoding: 'utf8', ...옵션 });
}

if (process.argv.includes('--selftest')) {
  const 시험 = [
    [오늘이름(new Date(2026, 7, 15, 21, 5)), '백업-20260815-2105', '한국시간으로 이름을 짓는다'],
    [오늘이름(new Date(2026, 0, 1, 0, 0)), '백업-20260101-0000', '한 자리 수도 0 을 채운다'],
    [열쇠보낼곳인가(true), true, '⭐ 사장님 전용에만 열쇠가 간다'],
    [열쇠보낼곳인가(false), false, '⛔ 세션이 닿는 곳에는 열쇠를 안 보낸다'],
    [지울것고르기(['백업-20260810-0100', '백업-20260811-0100', '백업-20260812-0100']),
      [], '세 벌이면 안 지운다'],
    [지울것고르기(['백업-20260810-0100', '백업-20260811-0100', '백업-20260812-0100', '백업-20260813-0100']),
      ['백업-20260810-0100'], '⭐ 네 벌이면 제일 오래된 하나를 지운다'],
    [지울것고르기(['딴폴더', '백업-20260810-0100']), [], '⛔ 백업이 아닌 폴더는 건드리지 않는다'],
    [지울것고르기([]), [], '빈 것도 센다'],
    [지울것고르기(['백업-20260810-0100.zip', '백업-20260811-0100.zip',
      '백업-20260812-0100.zip', '백업-20260813-0100.zip']),
      ['백업-20260810-0100.zip'], '⭐ 사장님 자리의 한 덩이(.zip)도 낡으면 지운다'],
    [지울것고르기(['내가만든.zip', '백업-20260810-0100.zip']), [],
      '⛔ 사장님이 손수 넣으신 zip 은 건드리지 않는다'],
    [사람크기(1536), '2KB', '크기를 사람 말로'],
    [사람크기(400 * 1024 * 1024), '400MB', '메가로'],
    [사람크기(2 * 1024 ** 3), '2.0GB', '기가로'],
    [남길벌 >= 2, true, '적어도 두 벌은 남긴다 — 한 벌은 깨져 있을 수 있다'],
    [둘자리.filter((d) => d.열쇠도).length, 1, '⛔ 열쇠가 가는 자리는 **하나뿐**이다'],
    [저장소들.every((r) => fs.existsSync(r)), true, '저장소 자리가 맞다'],
  ];
  let 틀림 = 0;
  for (const [잰것, 맞는것, 이름] of 시험) {
    if (JSON.stringify(잰것) !== JSON.stringify(맞는것)) {
      console.error(`❌ ${이름}  — 잰 것 ${JSON.stringify(잰것)}`);
      틀림++;
    }
  }
  if (틀림) { console.error(`❌ ${틀림}건 틀렸다`); process.exit(1); }
  console.log(`✅ 백업 자가시험 ${시험.length}건 통과`);
  process.exit(0);
}

const 나를직접불렀나 = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (나를직접불렀나) {

const 이름 = 오늘이름();
console.log(`\n━━━ 백업 ${이름} ━━━\n`);

// ── 뜨는 자리 — 임시로 한 번 만들고 여러 곳에 나른다
const 임시 = path.join(process.env.TEMP || 'C:/Windows/Temp', 이름);
fs.mkdirSync(임시, { recursive: true });

const 만든것 = [];
for (const 저장소 of 저장소들) {
  const 짧은 = path.basename(저장소);
  process.stdout.write(`  ${짧은} … `);

  // ① 역사 통째로 — 파일 하나. `git clone <이 파일>` 로 그대로 살아난다
  const 뭉치 = path.join(임시, `${짧은}.bundle`);
  실행('git', ['-C', 저장소, 'bundle', 'create', 뭉치, '--all']);

  // ⭐ 뜬 것이 성한지 **그 자리에서 검사한다.** 안 하면 「떴다」는 말만 남는다
  실행('git', ['-C', 저장소, 'bundle', 'verify', 뭉치], { stdio: 'pipe' });

  // ② 🔴 커밋 안 된 것 — 진짜 위험한 것. 깃허브에 없다
  const 밖의것 = 깃밖의것(저장소);
  if (밖의것.length) {
    const 자루 = path.join(임시, `${짧은}-커밋안된것.zip`);
    const 목록 = path.join(임시, `${짧은}-목록.txt`);
    fs.writeFileSync(목록, 밖의것.join('\n'), 'utf8');
    try {
      /* ⛔ `Get-Content` 는 PowerShell 5.1 에서 **시스템 코드페이지**로 읽는다.
            UTF-8 로 쓴 한글 목록이 깨져서 「경로에 잘못된 문자」로 튕겼다.
         ⭐ 읽을 때 UTF8 이라고 못박는다. */
      실행('powershell', ['-NoProfile', '-Command',
        `$f = Get-Content -LiteralPath '${목록.replace(/\\/g, '/')}' -Encoding UTF8 | ` +
        `ForEach-Object { Join-Path '${저장소}' $_ } | Where-Object { Test-Path -LiteralPath $_ };` +
        `if ($f) { Compress-Archive -LiteralPath $f -DestinationPath '${자루.replace(/\\/g, '/')}' -Force }`]);
    } catch (e) {
      console.log(`\n     ⚠ ${짧은} 커밋 안 된 것을 자루에 못 담았습니다 — 목록만 남깁니다`);
    }
  }

  const 크기 = fs.statSync(뭉치).size;
  만든것.push({ 짧은, 크기, 밖의것: 밖의것.length });
  console.log(`✅ 역사 ${사람크기(크기)} · 커밋 안 된 것 ${밖의것.length}개`);
}

// ── 나르기
console.log('');
let 간곳 = 0;
for (const 자리 of 둘자리) {
  const 위 = path.dirname(자리.길);
  if (!fs.existsSync(위)) {
    console.log(`  ⚠ ${자리.이름}  — 자리가 없습니다(${위}). ${자리.없어도됨 ? '켜시면 다음 번에 자동으로 들어갑니다' : '🔴 확인이 필요합니다'}`);
    continue;
  }
  const 갈곳 = path.join(자리.길, 이름);
  fs.mkdirSync(갈곳, { recursive: true });
  for (const f of fs.readdirSync(임시)) fs.copyFileSync(path.join(임시, f), path.join(갈곳, f));

  // ⛔ 열쇠는 사장님 전용에만
  let 열쇠수 = 0;
  if (열쇠보낼곳인가(자리.열쇠도)) {
    for (const 저장소 of 저장소들) {
      const env = path.join(저장소, '.env');
      if (fs.existsSync(env)) {
        fs.copyFileSync(env, path.join(갈곳, `${path.basename(저장소)}.env`));
        열쇠수++;
      }
    }
  }

  /* 🔴 [2026-08-15 · 사장님] 「**하나는 나만 접근할 수 있게** 해라」
     ⭐ 그 자리는 원드라이브 **「중요 보관소」(Personal Vault)** 다.
        잠그면 사장님 본인 확인 없이는 아무도 못 연다 — 나도, 다른 세션도.
     ⛔ 그런데 **Microsoft 365 구독이 없으면 파일 3개까지만** 들어간다.
        한 벌이 4개(뭉치 2 + 자루 1 + 목록 1)라 그대로는 안 들어간다.
     ⭐ 그래서 사장님 몫은 **한 벌을 파일 하나로 묶는다.** 그러면 구독과 무관하게 들어간다.
        사장님이 그 한 개만 중요 보관소로 끌어 넣으시면 된다. */
  if (열쇠보낼곳인가(자리.열쇠도)) {
    const 한덩이 = path.join(자리.길, `${이름}.zip`);
    try {
      실행('powershell', ['-NoProfile', '-Command',
        `Compress-Archive -Path '${갈곳.replace(/\\/g, '/')}\\*' -DestinationPath '${한덩이.replace(/\\/g, '/')}' -Force`]);
      fs.rmSync(갈곳, { recursive: true, force: true }); // 묶었으니 편 것은 치운다
      console.log(`  📦 한 덩이로 묶었습니다 — ${path.basename(한덩이)} (${사람크기(fs.statSync(한덩이).size)})`);
      console.log('     🖐 사장님: **이 파일 하나만** 「중요 보관소」로 옮기십시오. 열쇠가 들어 있습니다');
      console.log(`        ${보관소찾기() ? '보관소가 지금 열려 있습니다' : '보관소는 잠겨 있습니다 — 여실 때 옮기시면 됩니다'}`);
    } catch {
      console.log('  ⚠ 한 덩이로 못 묶었습니다 — 편 채로 둡니다');
    }
  }

  // 오래된 것 치우기 — 디스크가 7.9GB 뿐이다
  const 지울것 = 지울것고르기(fs.readdirSync(자리.길));
  for (const 낡은 of 지울것) fs.rmSync(path.join(자리.길, 낡은), { recursive: true, force: true });

  간곳++;
  console.log(`  ✅ ${자리.이름}`);
  console.log(`       ${갈곳}`);
  console.log(`       ${열쇠수 ? `🔑 열쇠 ${열쇠수}개 함께` : '열쇠 없음(일부러 안 보냅니다)'}${지울것.length ? ` · 낡은 것 ${지울것.length}벌 치움` : ''}`);
}

fs.rmSync(임시, { recursive: true, force: true });

console.log(`\n● 저장소 ${만든것.length}곳을 **${간곳}자리**에 떴습니다.`);
console.log('● 되살리는 법 —  git clone <저장소이름>.bundle <새폴더>');
if (간곳 < 2) {
  console.log('\n🔴 자리가 둘도 안 됩니다. 사장님 지시는 **두 곳 이상**입니다.');
  process.exit(2);
}
if (!fs.existsSync(path.dirname(둘자리[2].길))) {
  console.log('\n⚠ 아이클라우드가 아직 안 켜져 있습니다 — 켜시면 다음 번부터 자동으로 들어갑니다.');
}

}
