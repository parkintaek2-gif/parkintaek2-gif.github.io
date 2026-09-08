/**
 * 백업(원드라이브)에는 있는데 «로컬 아카이브에는 없는» 파일을 되살린다.
 *
 * ── 🔴 왜 만들었나 (2026-09-09 04:0x · 5번) ─────────────────────────────────
 *
 * `npm test` 가 「원본 DT_118N_PAYM41.json 이 아카이브에 없다」로 계속 빨갰다.
 * 나는 그것을 「8번이 수집을 안 했다」로 읽고 메모로 넘겼다. **틀렸다.**
 *
 * 우리 자료 파일(`occupation-names.json`)이 스스로 이렇게 적고 있었다 —
 *   「원본: archive/raw/kosis/DT_118N_PAYM41.json · 받은때 2026-08-10 09:0x」
 * ⇒ **받은 적이 있었다.** 로컬에서 «사라진» 것이었다.
 *
 * 백업을 열어 보니 이랬다 —
 * ```
 *   OneDrive\서버백업\archive\raw\kosis\   파일 20개
 *   로컬  archive\raw\kosis\               파일  8개
 * ```
 * ⭐ **백업이 살려 준 것이다.** 그 백업은 일부러 «지우지 않게»(robocopy /MIR 를 쓰지 않게)
 *   만들어 두었다 — 「백업이 원본의 삭제를 따라가면 백업이 아니다」(backup-archive-onedrive.ps1).
 *   그 한 줄의 결정이 오늘 12개를 되살렸다.
 *
 * ⛔ 그러니 「아카이브에 없다」를 「받은 적이 없다」로 읽지 않는다. **백업을 먼저 본다.**
 *
 * ── 이 자가 지키는 것 ──────────────────────────────────────────────────────
 * ```
 * ⛔ 있는 파일을 덮어쓰지 않는다 — «없는 것»만 가져온다. 로컬이 새것일 수 있다
 * ⛔ 지우지 않는다
 * ⛔ 무엇을 가져왔는지 이름으로 다 적는다 — 조용히 성공한 척하지 않는다
 * ```
 *
 * 쓰는 법
 * ```
 * node scripts/restore-archive-from-onedrive.mjs            무엇이 빠졌나만 센다
 * node scripts/restore-archive-from-onedrive.mjs --되살린다   실제로 가져온다
 * node scripts/restore-archive-from-onedrive.mjs --자가시험
 * ```
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LF = String.fromCharCode(10);
const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const 로컬방 = path.join(뿌리, 'archive');
export const 백업방 = 'C:/Users/User/OneDrive/서버백업/archive';

/** 한 폴더 밑의 파일을 «상대 길»로 다 낸다. 폴더가 없으면 null — 빈 목록이 아니다 */
export function 파일들(방) {
  if (!fs.existsSync(방)) return null;
  const 낸다 = [];
  const 걷기 = (여기, 앞) => {
    for (const 것 of fs.readdirSync(여기, { withFileTypes: true })) {
      const 온길 = path.join(여기, 것.name);
      const 상대 = 앞 ? `${앞}/${것.name}` : 것.name;
      if (것.isDirectory()) 걷기(온길, 상대);
      else if (것.isFile()) 낸다.push(상대);
    }
  };
  걷기(방, '');
  return 낸다;
}

/**
 * 백업에만 있는 것을 낸다.
 * ⛔ 로컬에도 있는 것은 «건드리지 않는다» — 로컬이 새것일 수 있다.
 */
export function 백업에만있는것(로컬목록, 백업목록) {
  if (로컬목록 === null || 백업목록 === null) return null;
  const 있다 = new Set(로컬목록);
  return 백업목록.filter((f) => !있다.has(f));
}

/** 기록 파일은 되살리지 않는다 — 그것은 백업이 만든 것이지 자료가 아니다 */
export function 되살릴것인가(상대길) {
  const s = String(상대길 ?? '');
  if (!s) return false;
  if (s.startsWith('log/')) return false;
  return true;
}

const 내가 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (내가 && process.argv.includes('--자가시험')) {
  let 통 = 0; const 실 = [];
  const 검 = (n, ok) => { if (ok) 통 += 1; else 실.push(n); };

  검('백업에만 있는 것을 낸다',
    (백업에만있는것(['a.json'], ['a.json', 'b.json']) ?? []).length === 1);
  검('그 이름이 맞다', 백업에만있는것(['a.json'], ['a.json', 'b.json'])[0] === 'b.json');
  검('⛔ 로컬에만 있는 것은 안 건드린다 — 지우지 않는다',
    (백업에만있는것(['a.json', 'z.json'], ['a.json']) ?? []).length === 0);
  검('⛔ 둘이 같으면 할 일이 없다', (백업에만있는것(['a'], ['a']) ?? []).length === 0);
  검('⛔ 목록을 못 읽으면 null — 「빠진 것 0」으로 치지 않는다',
    백업에만있는것(null, ['a']) === null && 백업에만있는것(['a'], null) === null);
  검('깊은 길도 상대 길로 견준다',
    백업에만있는것(['raw/kosis/a.json'], ['raw/kosis/a.json', 'raw/kosis/b.json'])[0] === 'raw/kosis/b.json');

  검('기록 파일은 되살리지 않는다', 되살릴것인가('log/backup-onedrive.log') === false);
  검('자료는 되살린다', 되살릴것인가('raw/kosis/DT_118N_PAYM41.json') === true);
  검('⛔ 빈 길은 아니다', 되살릴것인가('') === false && 되살릴것인가(null) === false);

  검('⛔ 없는 폴더를 걸으면 null — 「파일 0개」가 아니다', 파일들('C:/없는곳') === null);
  검('있는 폴더를 걷는다', (파일들(로컬방) ?? []).length > 0);

  if (실.length) {
    console.error(`❌ 자가시험 실패 ${실.length}${LF}${실.map((s) => `   · ${s}`).join(LF)}`);
    process.exit(1);
  }
  console.log(`✅ 아카이브 되살리기 자가시험 통과 (${통})`);
  process.exit(0);
}

if (내가) {
  const 로컬 = 파일들(로컬방);
  const 백업 = 파일들(백업방);
  if (로컬 === null) { console.log(`🔴 로컬 아카이브가 없다 — ${로컬방}`); process.exit(1); }
  if (백업 === null) { console.log(`🔴 백업을 못 읽었다 — ${백업방}`); process.exit(1); }
  console.log(`■ 로컬 ${로컬.length}개 · 백업 ${백업.length}개`);

  /**
   * ⭐ 갈래를 좁혀 되살린다 — `--갈래=raw/kosis`
   *
   * ⛔ **한꺼번에 다 끌어오지 않는다.** 백업에만 있는 것이 1만 개를 넘는데(시세 자료가
   *   대부분이다), 그것들은 `store.mjs` 가 R2 에도 쓰게 돼 있어 **「잃은 것」이 아닐 수 있다.**
   *   ⬜ R2 에 있는지는 오늘 못 쟀다. 재기 전에 다 끌어오면 디스크만 채우고
   *      「되살렸다」는 착각만 남는다.
   */
  const 좁힘 = (process.argv.find((a) => a.startsWith('--갈래=')) ?? '').slice('--'.length + 3);
  const 빠진것 = (백업에만있는것(로컬, 백업) ?? [])
    .filter(되살릴것인가)
    .filter((f) => !좁힘 || f.startsWith(좁힘));
  if (좁힘) console.log(`   ⭐ 갈래를 「${좁힘}」로 좁혔다`);
  if (!빠진것.length) {
    console.log('✅ 백업에만 있는 자료가 없다 — 되살릴 것이 없다');
    process.exit(0);
  }

  /* 갈래별로 세어 보여 준다 — 어디가 비었나가 한눈에 보이게 */
  const 갈래별 = {};
  for (const f of 빠진것) {
    const k = f.split('/').slice(0, 2).join('/');
    갈래별[k] = (갈래별[k] ?? 0) + 1;
  }
  console.log(`🔴 백업에만 있는 자료 ${빠진것.length}개 — 로컬에서 사라진 것이다`);
  for (const [k, v] of Object.entries(갈래별).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(v).padStart(5)}개  ${k}`);
  }

  if (!process.argv.includes('--되살린다')) {
    console.log('');
    console.log('⭐ 되살리려면 --되살린다 를 붙인다. ⛔ 있는 파일은 덮어쓰지 않는다.');
    process.exit(0);
  }

  let 가져온것 = 0; const 못가져온것 = [];
  for (const f of 빠진것) {
    const 밖 = path.join(백업방, f);
    const 안 = path.join(로컬방, f);
    try {
      fs.mkdirSync(path.dirname(안), { recursive: true });
      /* ⛔ COPYFILE_EXCL — 있으면 «실패»한다. 덮어쓰기를 코드로 막는다 */
      fs.copyFileSync(밖, 안, fs.constants.COPYFILE_EXCL);
      가져온것 += 1;
    } catch (e) { 못가져온것.push(`${f} — ${String(e.message).slice(0, 60)}`); }
  }
  console.log('');
  console.log(`✅ 되살린 파일 ${가져온것}개`);
  if (못가져온것.length) {
    console.log(`🔴 못 가져온 것 ${못가져온것.length}개 —`);
    for (const s of 못가져온것.slice(0, 8)) console.log(`   · ${s}`);
  }
  console.log('⛔ 지운 것 없음 · 덮어쓴 것 없음');
}
