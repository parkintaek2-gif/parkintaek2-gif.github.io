/**
 * **고쳐 놓고 어딘가에 남은 옛 수**를 잡는다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 2026-08-08 02:4x. 2번이 라이브에서 잡아 주셨다 — `/titles` 한 화면에 **397 과 405 가 같이** 있었다.
 * 그날 오전 내가 스스로 쓴 문장이 그대로 걸렸다: 「자료를 고치고 글을 안 고치면 글이 옛 수를 말한다」.
 * 기사 일곱 편은 쓸었는데 여덟째 기사가 지면 옆칸에 딸려 나오는 것을 못 봤다.
 *
 * 2번 제안: 「**지면 글에 자료에서 안 온 숫자가 박혀 있으면 잡는다.**
 *   『세어 놓고 안 보여 준 것』을 잡던 검사의 짝이다 —
 *   그건 「자료에 있는데 지면이 안 쓴다」를, 이건 「지면이 쓰는데 자료에서 안 왔다」를 잡는다.」
 *
 * ── 어떻게 ────────────────────────────────────────────────────
 * 「자료에서 안 왔다」를 통째로 판정하는 것은 못 한다(글에는 연도도 있고 순위도 있다).
 * 대신 **우리가 이미 아는 옛 수**가 있다. 정정 기록의 `from` 칸이다.
 * 우리가 「이 수에서 저 수로 바꿨다」고 적어 둔 그 옛 수가 아직 글에 살아 있으면 — 그것이 옛 수다.
 *
 * ⛔ 정정 문단 자체는 옛 수를 **일부러** 인용한다. 그 자리는 뺀다.
 * ⛔ 값이 아니라 **수**만 본다. 사람이 다시 읽는다.
 *
 * 쓰는 법: node scripts/check-stale-numbers.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const 정정길 = 'src/data/wikitip-page-corrections.json';
const 볼곳 = ['content/kculturewire', 'src/pages/wikitip'];

/** 정정의 `from` 문장에서 **수**만 뽑는다. 천 단위 쉼표를 함께 받는다. */
export function 옛수뽑기(from) {
  return [...String(from).matchAll(/\b\d[\d,]*(?:\.\d+)?\b/g)]
    .map((m) => m[0])
    .filter((s) => {
      const n = Number(s.replace(/,/g, ''));
      /* 한 자리·두 자리는 흔해서 아무 데나 걸린다. 연도(1900~2100)도 뺀다. */
      return n >= 100 && !(n >= 1900 && n <= 2100);
    });
}

/** 정정 문단·주석은 옛 수를 일부러 적는 자리다. 지우고 본다. */
export function 볼본문(글, 파일) {
  let s = 글;
  /* 주석은 지면에 안 나간다. `/* *​/` 와 `<!-- -->` 만 지우다가 **`//` 한 줄 주석**을 놓쳐
     titles.astro 의 주석 속 448 에서 헛울었다. 셋 다 지운다.
     ⚠ `//` 는 URL 의 `https://` 와 겹친다 — 줄 첫머리 쪽 `//` 만 지운다. */
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
  if (파일.endsWith('.md')) {
    /* 앞말의 corrections 묶음을 통째로 뺀다 — 옛 수가 여기 사는 것이 정상이다. */
    s = s.replace(/^corrections:\n(?:\s{2}- date:[\s\S]*?)(?=^\w|^---$)/m, ' ');
  }
  /* 지면의 「Corrected …」 문단도 뺀다. */
  s = s.replace(/Corrected \d{4}-\d{2}-\d{2}[\s\S]{0,900}?<\/p>/g, ' ');
  s = s.replace(/<b>🔴 Corrected[\s\S]{0,900}?<\/p>/g, ' ');
  return s;
}

if (process.argv[1] && process.argv[1].endsWith('check-stale-numbers.mjs')) {
  let 시험 = 0; let 통과 = 0;
  const 자가 = (이름, 참) => { 시험++; if (참) 통과++; else console.log(`  ⛔ 자가시험 실패 — ${이름}`); };
  자가('세 자리 이상만 뽑는다', JSON.stringify(옛수뽑기('from 42 titles to 405')) === '["405"]');
  자가('쉼표를 붙여 뽑는다', 옛수뽑기('3,415 casting slots').includes('3,415'));
  자가('연도는 안 뽑는다', 옛수뽑기('in 2021 we had 448 titles').join() === '448');
  자가('소수도 뽑는다', 옛수뽑기('rises from 443.3% ').join() === '443.3');
  자가('주석은 본문에서 뺀다', !볼본문('a /* 405 */ b', 'x.astro').includes('405'));
  자가('앞말 corrections 묶음을 뺀다',
    !볼본문('---\ncorrections:\n  - date: 2026-08-07\n    note: "was 405"\n---\nbody 397', 'x.md').includes('405'));
  console.log(`옛 수 검사 — 자가시험 ${시험}건 중 ${통과}건 통과`);
  if (통과 !== 시험) process.exit(1);

  const 정정 = JSON.parse(fs.readFileSync(정정길, 'utf8'));
  /* 옛 수 → 어느 정정에서 왔나. 같은 수가 여러 정정에 있으면 첫 것만 적는다. */
  const 옛 = new Map();
  for (const r of 정정.rows) for (const n of 옛수뽑기(r.from)) if (!옛.has(n)) 옛.set(n, `${r.date} ${r.where}`);
  /* 기사 앞말의 정정도 같은 자다 — 「from … to …」 꼴 문장에서 뽑는다. */
  for (const a of 정정.articleCauses ?? []) {
    const p = path.join('content/kculturewire', `${a.slug}.md`);
    if (!fs.existsSync(p)) continue;
    const m = fs.readFileSync(p, 'utf8').match(/falls from ([\d,]+) titles to ([\d,]+)/);
    if (m && !옛.has(m[1])) 옛.set(m[1], `${a.date} ${a.slug}`);
  }

  /* 지금 자료가 그 수를 **여전히** 쓰고 있으면 옛 수가 아니다 — 지운다.
     (예: 정정 전후가 같은 값인 열이 있을 수 있다) */
  /* ⛔ 처음엔 자료 파일 **전체 글**에서 세 자리 수를 긁었다. 그러면 표 안 어딘가에
     405 든 204 든 반드시 있어서 **아무것도 안 걸린다** — 실제로 세 군데를 깨뜨려 셋 다 안 섰다.
     지면이 인용하는 것은 **꼭대기 칸(요약값)**이다. 거기만 「아직 살아 있는 값」으로 본다. */
  const 지금 = new Set();
  const 담기 = (v) => {
    if (typeof v === 'number') 지금.add(String(v));
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const x of Object.values(v)) if (typeof x === 'number') 지금.add(String(x));
    } else if (Array.isArray(v)) {
      지금.add(String(v.length));
      /* 🔴 2026-08-09 06:0x — **배열 속 객체까지는 안 들어갔다.**
         그래서 54편째가 인용한 `bands[1].actors = 204` 를 「옛 수」라고 울었다.
         지면과 기사가 인용하는 자리가 바로 거기다(띠 표 한 줄씩).
         ⛔ 그렇다고 파일 전체를 긁으면 아무것도 안 걸린다 — 위 주석이 그 실패를 적어 뒀다.
         ⭐ 그래서 **한 겹만** 더 들어간다. 배열 → 객체 → 숫자까지. 그 아래는 안 본다.
         고친 뒤 세 군데를 다시 깨뜨려 서는 것을 봤다. */
      for (const e of v) {
        if (e && typeof e === 'object' && !Array.isArray(e)) {
          for (const x of Object.values(e)) if (typeof x === 'number') 지금.add(String(x));
        }
      }
    }
  };
  for (const f of fs.readdirSync('src/data').filter((x) => /^wikitip-.*\.json$/.test(x))) {
    const j = JSON.parse(fs.readFileSync(path.join('src/data', f), 'utf8'));
    for (const v of Object.values(j)) 담기(v);
  }

  /**
   * 면제 — **옛 수를 일부러 적는 자리.** 까닭 없이 못 들어온다.
   * 확인문: 그 글이 아직 「기록이다」라고 말하고 있나. 말이 사라지면 면제도 사라진다.
   */
  const 면제 = [{
    파일: 'content/kculturewire/one-flaw-twelve-corrections.md',
    수: ['448', '405', '294'],
    까닭: '이 표는 8월 7일 하루의 기록이다. 그날 448 에서 405 로 바뀐 것을 적는 자리라 두 옛 수가 다 있어야 한다. 표 아래 각주가 8일에 397 로 또 바뀐 것을 알린다. '
      + '294 도 같은 자리다 — 이 기사의 주어가 「294 였고 236 이 되었다」라서, 294 를 지우면 기사가 말할 것이 없어진다',
    확인문: 'it is a record of one day',
  }, {
    /* 🔴 2026-08-09 09:4x — 아래 둘은 새로 넣는다. 옛 수를 **일부러** 인용하는 자리다 */
    파일: 'content/kculturewire/netflix-does-not-say-where-a-show-is-from.md',
    수: ['294'],
    까닭: '이 기사는 「우리가 먼저 틀렸다」를 적는 문단에서 옛 값 294 를 인용한다. '
      + '그 문장이 바로 뒤에 236 으로 고쳤다고 이어 적으므로, 옛 수가 남아 있는 것이 아니라 **기록으로 서 있는** 것이다',
    확인문: 'We found this because we got it wrong first',
  }, {
    파일: 'content/kculturewire/eight-ways-we-have-been-wrong.md',
    수: ['37,962'],
    까닭: '아홉째 까닭을 적은 절이 「37,962 에서 37,750 으로 옮겼다」고 두 값을 나란히 적는다. '
      + '옛 값을 지우면 무엇이 얼마나 움직였는지 못 읽는다. ⛔ 이 절이 사라지면 면제도 사라져야 한다',
    확인문: 'moved from 37,962 places to 37,750',
  }];
  for (const e of 면제) {
    if (!fs.existsSync(e.파일)) { console.log(`   ⚠ 면제표가 없는 파일 ${e.파일} 을 가리킨다`); continue; }
    if (!fs.readFileSync(e.파일, 'utf8').includes(e.확인문)) {
      console.log(`   ⛔ ${e.파일} 이 더는 「기록이다」라고 말하지 않는다. 면제가 낡았다`);
      process.exit(1);
    }
  }
  const 면제인가 = (파일, 수) => 면제.some((e) => e.파일.endsWith(path.basename(파일)) && e.수.includes(수));

  const 넘음 = [];
  for (const 디렉 of 볼곳) {
    for (const f of fs.readdirSync(디렉).filter((x) => x.endsWith('.md') || x.endsWith('.astro'))) {
      const 글 = fs.readFileSync(path.join(디렉, f), 'utf8');
      const 본문 = 볼본문(글, f);
      for (const [수, 어디] of 옛) {
        if (지금.has(수.replace(/,/g, ''))) continue;
        if (면제인가(f, 수)) continue;                            // 일부러 적은 옛 수다          // 아직 살아 있는 값이다
        const re = new RegExp(`(^|[^\\d.,])${수.replace('.', '\\.').replace(',', ',')}([^\\d.,%]|%|$)`);
        if (re.test(본문)) 넘음.push(`${디렉}/${f} 에 옛 수 «${수}» 가 남아 있다 (${어디} 에서 바꾼 값)`);
      }
    }
  }

  if (넘음.length) {
    console.log(`\n⛔ 옛 수 검사 — ${넘음.length}건`);
    for (const s of 넘음) console.log(`   · ${s}`);
    console.log('\n   ⚠ 정정 문단에서 일부러 인용한 것이면 이 검사가 틀린 것이다. 그 자리를 빼는 규칙을 고친다.');
    process.exit(1);
  }
  console.log(`✅ 옛 수 검사 — 정정 ${정정.rows.length}건이 남긴 옛 수 ${옛.size}가지가 글에 안 남아 있다`);
}
