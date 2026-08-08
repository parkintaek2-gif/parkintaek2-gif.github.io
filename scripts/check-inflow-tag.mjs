#!/usr/bin/env node
/**
 * check-inflow-tag.mjs — **백년지도에서 넘어온 것을 도착지가 알 수 있나**를 잰다.
 *
 * 왜 (2026-08-07 23:0x · 2번)
 * ─────────────────────────────────────────────────────────────────────────
 * 값을 정하면서 내가 「백년지도에서 넘어온 손님에게 29,000 은 셀 것이다」라고 **짐작**했다.
 * 사장님이 되물으셨다 — **「백년지도에서 넘어오는지 아는 법을 만들면 되는 거 아니야?」**
 *
 * ⭐ 짐작으로 값을 정하지 않는다. **재고 정한다.**
 *
 * ⛔ 사람을 따라다니지 않는다. 붙는 것은 둘뿐이다 — `from=100y` 와 `at=<갈래>`.
 *    누구인지·무엇을 봤는지는 안 붙인다.
 *
 * 쓰는 법
 *   node scripts/check-inflow-tag.mjs             빌드 결과(dist)에 표가 붙었나
 *   node scripts/check-inflow-tag.mjs --라이브     라이브 지면에 붙었나
 *   node scripts/check-inflow-tag.mjs --selftest
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 나가는 링크에서 표를 뽑는다. 없으면 null.
 *
 * ⚠ 2026-08-08 03:1x — **주석 안의 「klifemap」을 링크로 셌다.**
 *   `/about` 지면에 나가는 길이 없는데 제 자는 「있다」고 했다. 1번이 실측으로 잡아 줬다.
 *   ⛔ 주석을 먼저 걷는다. 소스에서든 빌드 결과에서든 **손님이 못 누르는 것은 링크가 아니다.**
 */
export function 표뽑기(html) {
  const 걷은 = String(html ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')      // HTML 주석
    .replace(/\/\*[\s\S]*?\*\//g, ' ');    // 소스 주석(.astro 앞머리)
  const m = 걷은.match(/klifemap\.ai\/child-career\.html\?([^"'\s<]*)/);
  if (!m) return null;
  const q = new URLSearchParams(m[1].replace(/&amp;/g, '&'));
  return { from: q.get('from'), at: q.get('at') };
}

/**
 * 붙어도 되는 갈래인가. **모르는 갈래가 주소에 실리면 그게 사고다**
 *
 * 🔴 2026-08-08 05:3x — **이 목록을 손으로 베껴 뒀던 것이 사고였다.**
 *
 *   3번이 팔 지면 두 곳에 길을 내면서 `src/lib/klifemap.ts` 에 `report`·`report-area`
 *   를 늘렸다. **이쪽 사본은 안 늘었다.** 그래서 자가 「표가 안 붙었다」고 했는데
 *   표는 멀쩡히 붙어 있었다. 손으로 재 보니 있었다 — **자가 틀린 것이다.**
 *
 *   ⛔ 주소를 한 곳에만 두려고 `klifemap.ts` 를 만들어 놓고, **갈래 목록은 두 곳에 뒀다.**
 *      같은 것을 두 곳에 적으면 한 쪽만 고쳐진다. 그게 이번에 그대로 났다.
 *   ✅ 이제 **그 파일에서 읽는다.** 못 읽으면 짐작하지 않고 터진다 —
 *      낡은 사본으로 조용히 통과하느니 시끄럽게 멎는 편이 낫다.
 */
export function 갈래목록읽기(소스) {
  const m = String(소스 ?? '').match(/붙일수있는갈래\s*=\s*\[([\s\S]*?)\]\s*as const/);
  if (!m) throw new Error('src/lib/klifemap.ts 에서 붙일수있는갈래 를 못 찾았다 — 짐작하지 않는다');
  const 걷은 = m[1].replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
  const 목록 = [...걷은.matchAll(/['"]([^'"]+)['"]/g)].map((x) => x[1]);
  if (!목록.length) throw new Error('붙일수있는갈래 가 비어 보인다 — 짐작하지 않는다');
  return 목록;
}

export const 갈래목록 = 갈래목록읽기(
  fs.readFileSync(path.join(뿌리, 'src', 'lib', 'klifemap.ts'), 'utf8'),
);

export function 제대로붙었나(표) {
  if (!표) return { 된다: false, 왜: '표가 아예 없다 — 넘어온 것을 도착지가 못 안다' };
  if (표.from !== '100y') return { 된다: false, 왜: `from 이 100y 가 아니다 (${표.from})` };
  if (!갈래목록.includes(표.at)) return { 된다: false, 왜: `모르는 갈래가 실렸다 (${표.at})` };
  return { 된다: true, 왜: `from=100y · at=${표.at}` };
}

/** ⛔ 주소에 사람을 가리키는 것이 실리지 않았나 — 이게 더 중요하다 */
export function 붙으면안되는것(표들) {
  const 나쁜 = [];
  for (const t of 표들) {
    if (!t) continue;
    for (const [k, v] of Object.entries(t)) {
      if (k === 'from' || k === 'at') continue;
      나쁜.push(`${k}=${v}`);
    }
  }
  return 나쁜;
}

/* ⚠ 301 을 따라간다. 안 따라가면 지면을 못 읽고 「나가는 링크가 없다」로 잘못 읽는다.
 *   2026-08-07 23:2x 에 실제로 그렇게 읽었다 — 표는 멀쩡히 붙어 있었다. */
function 받기(u, 남은 = 4) {
  return new Promise((r) => {
    https.get(u, { timeout: 25000 }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && 남은 > 0) {
        res.resume();
        return 받기(new URL(res.headers.location, u).href, 남은 - 1).then(r);
      }
      let b = '';
      res.on('data', (c) => (b += c));
      res.on('end', () => r({ 코드: res.statusCode, 글: b }));
    }).on('error', (e) => r({ 코드: '오류:' + (e.code || e.message), 글: '' }));
  });
}

function 셀프테스트() {
  const 검사 = [];
  const 확인 = (이름, 실제, 기대) => 검사.push({ 이름, 통과: JSON.stringify(실제) === JSON.stringify(기대), 실제 });

  확인('표를 뽑는다', 표뽑기('<a href="https://klifemap.ai/child-career.html?from=100y&at=major">'), { from: '100y', at: 'major' });
  확인('&amp; 로 적혀 있어도 뽑는다', 표뽑기('<a href="https://klifemap.ai/child-career.html?from=100y&amp;at=school">'), { from: '100y', at: 'school' });
  확인('⭐ 표가 없으면 null', 표뽑기('<a href="https://klifemap.ai/child-career.html">'), null);
  확인('링크가 아예 없으면 null', 표뽑기('<p>아무 글</p>'), null);
  확인('⭐ HTML 주석 안의 것은 링크가 아니다',
    표뽑기('<!-- https://klifemap.ai/child-career.html?from=100y&at=major -->'), null);
  확인('⭐ 소스 주석 안의 것도 링크가 아니다',
    표뽑기('/* klifemap.ai/child-career.html?from=100y&at=major 로 간다 */'), null);
  확인('주석과 진짜가 같이 있으면 진짜를 뽑는다',
    표뽑기('<!-- klifemap.ai/child-career.html?from=100y&at=school -->' +
           '<a href="https://klifemap.ai/child-career.html?from=100y&at=major">'), { from: '100y', at: 'major' });

  확인('제대로 붙은 것', 제대로붙었나({ from: '100y', at: 'major' }).된다, true);
  확인('⭐ 표가 없으면 거짓', 제대로붙었나(null).된다, false);
  확인('from 이 다르면 거짓', 제대로붙었나({ from: '남의곳', at: 'major' }).된다, false);
  확인('⭐ 모르는 갈래는 거짓 — 주소에 아무거나 싣지 않는다', 제대로붙었나({ from: '100y', at: '학교이름' }).된다, false);
  확인('기타는 된다', 제대로붙었나({ from: '100y', at: '기타' }).된다, true);

  /* 🔴 자가 낡아서 대상을 틀렸다고 한 그 사고를 못 되풀이하게 박아 둔다 */
  확인('⭐ 갈래 목록을 소스에서 읽는다',
    갈래목록읽기(`export const 붙일수있는갈래 = [\n  'major', 'school',\n  '기타',\n] as const;`),
    ['major', 'school', '기타']);
  확인('⭐ 목록 안 주석은 갈래가 아니다',
    갈래목록읽기(`붙일수있는갈래 = [\n  'major',\n  /* '옛것' 은 뺐다 */\n  // '이것도'\n  '기타',\n] as const`),
    ['major', '기타']);
  확인('⭐ 못 찾으면 짐작하지 않고 터진다',
    (() => { try { 갈래목록읽기('아무 글도 없다'); return '안 터졌다'; } catch { return '터졌다'; } })(), '터졌다');
  확인('⭐ 비어 있어도 터진다',
    (() => { try { 갈래목록읽기('붙일수있는갈래 = [\n] as const'); return '안 터졌다'; } catch { return '터졌다'; } })(), '터졌다');
  확인('🔴 진짜 파일에 report 가 있다 — 3번이 늘린 것이 여기 닿나', 갈래목록.includes('report'), true);
  확인('🔴 진짜 파일에 report-area 가 있다', 갈래목록.includes('report-area'), true);
  확인('⭐ 팔 지면 표가 통과한다', 제대로붙었나({ from: '100y', at: 'report-area' }).된다, true);

  확인('⭐ 사람을 가리키는 것이 실리면 집어낸다', 붙으면안되는것([{ from: '100y', at: 'major', code: '1371661' }]), ['code=1371661']);
  확인('둘뿐이면 깨끗하다', 붙으면안되는것([{ from: '100y', at: 'major' }]), []);
  확인('null 은 건너뛴다', 붙으면안되는것([null]), []);

  for (const c of 검사) console.log(`${c.통과 ? '✅' : '⛔'} ${c.이름}${c.통과 ? '' : `\n     받은 것 ${JSON.stringify(c.실제)}`}`);
  const 실패 = 검사.filter((c) => !c.통과).length;
  console.log(`\n검사 ${검사.length}개 · 실패 ${실패}개`);
  process.exit(실패 ? 1 : 0);
}

async function 라이브() {
  /* 갈래마다 한 장씩 본다. 한 장만 보면 그 갈래만 맞는 것을 전체로 착각한다 */
  /* ⚠ 목록 지면이 아니라 **실제 낱장**을 본다. 목록에는 나가는 링크가 없다 */
  const 볼것 = [
    ['major', 'https://100yearmap.com/major/3D건축인테리어과'],
    ['school', 'https://100yearmap.com/school/7531602'],
  ];
  const 표들 = [];
  let 나쁨 = 0;
  for (const [갈래, 주소] of 볼것) {
    const r = await 받기(주소);
    const 표 = 표뽑기(r.글);
    표들.push(표);
    const p = 제대로붙었나(표);
    if (!p.된다 && 표 === null && !/klifemap/.test(r.글)) {
      console.log(`  ⚪ ${갈래.padEnd(8)} 이 지면에는 나가는 링크 자체가 없다 (${r.코드})`);
      continue;
    }
    if (!p.된다) 나쁨++;
    console.log(`  ${p.된다 ? '✅' : '⛔'} ${갈래.padEnd(8)} ${p.왜}`);
  }
  const 나쁜값 = 붙으면안되는것(표들);
  if (나쁜값.length) { console.log(`\n⛔ 주소에 실리면 안 되는 것이 실렸다: ${나쁜값.join(', ')}`); 나쁨++; }
  process.exit(나쁨 ? 1 : 0);
}

function 빌드결과() {
  const dist = path.join(뿌리, 'dist', '100y');
  if (!fs.existsSync(dist)) { console.log('⛔ dist/100y 가 없다. 먼저 빌드한다.'); process.exit(1); }

  /* ⚠ 처음엔 400장에서 그냥 끊었더니 **알파벳으로 앞선 한 폴더만** 봤다.
   *   그 폴더가 우연히 `기타` 로 떨어져서 「전부 기타」로 읽혔다 — 자가 좁았던 것이다.
   *   갈래마다 골고루 뽑는다. 한 갈래만 보고 전체를 말하지 않는다. */
  const 갈래폴더 = fs
    .readdirSync(dist, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const 한갈래당 = 40;
  const 모으기 = (d, 남은) => {
    const 모음 = [];
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (모음.length >= 남은) break;
      const p = path.join(d, e.name);
      if (e.isDirectory()) 모음.push(...모으기(p, 남은 - 모음.length));
      else if (e.name.endsWith('.html')) 모음.push(p);
    }
    return 모음;
  };

  const 지면 = [
    ...fs.readdirSync(dist).filter((n) => n.endsWith('.html')).map((n) => path.join(dist, n)),
    ...갈래폴더.flatMap((g) => 모으기(path.join(dist, g), 한갈래당)),
  ];
  console.log(`갈래 폴더 ${갈래폴더.length}개에서 골고루 뽑았다 — ${갈래폴더.join(', ')}`);
  const 링크있는곳 = [];
  for (const f of 지면) {
    const html = fs.readFileSync(f, 'utf8');
    if (!html.includes('klifemap.ai/child-career')) continue;
    링크있는곳.push({ f, 표: 표뽑기(html) });
  }

  console.log(`본 지면 ${지면.length}장 · 나가는 링크가 있는 곳 ${링크있는곳.length}장`);
  if (!링크있는곳.length) { console.log('⚠ 표본에 링크가 없다. 더 넓게 보거나 빌드를 확인한다.'); process.exit(1); }

  const 못붙은 = 링크있는곳.filter((x) => !제대로붙었나(x.표).된다);
  const 갈래별 = {};
  for (const x of 링크있는곳) 갈래별[x.표?.at ?? '(없음)'] = (갈래별[x.표?.at ?? '(없음)'] ?? 0) + 1;
  console.log('갈래별:', Object.entries(갈래별).map(([k, v]) => `${k} ${v}장`).join(' · '));

  const 나쁜값 = 붙으면안되는것(링크있는곳.map((x) => x.표));
  if (나쁜값.length) console.log(`⛔ 주소에 실리면 안 되는 것: ${[...new Set(나쁜값)].slice(0, 5).join(', ')}`);

  /**
   * 🔴 **`기타` 가 있으면 운다** (2026-08-09 06:2x 신설).
   *
   *   이 자는 여태 「표가 붙었나」만 보고 **무엇이 붙었는지는 안 봤다.**
   *   그래서 어제 낸 층 대문 두 장이 `at=기타` 로 나가는 동안 ✅ 를 냈다.
   *   전수로 세다가 손으로 찾았다 — 자가 찾았어야 할 것이다.
   *
   *   ⚠ `기타` 는 「모르는 갈래」다. 새 폴더를 내고 `붙일수있는갈래` 에 넣는 것을 잊으면
   *     여기로 떨어진다. `region`·`age`·`university` 가 그렇게 뭉뚱그려진 적이 있다.
   *   ⛔ **기타로 쌓이면 소급이 안 된다.** 오늘 온 손님을 내일 다시 가를 수 없다(1번).
   */
  const 기타장 = 링크있는곳.filter((x) => x.표?.at === '기타');
  if (기타장.length) {
    console.log(`\n⛔ 갈래를 못 가른 지면 ${기타장.length}장 — \`at=기타\` 로 나간다`);
    for (const x of 기타장.slice(0, 5)) console.log(`   ${path.relative(뿌리, x.f)}`);
    console.log('   → src/lib/klifemap.ts 의 `붙일수있는갈래` 에 그 폴더 이름을 넣는다');
  }

  if (못붙은.length) {
    /* ⚠ **왜 안 됐는지를 그대로 적는다.** 전에는 무슨 이유든 「표가 안 붙었다」로 적었다.
     *   실제 이유는 「모르는 갈래」였는데 그 말이 화면에서 버려져, 자가 낡은 것을
     *   대상이 틀린 것으로 읽게 만들었다. 고친 사람을 엉뚱한 데로 보낸다. */
    console.log(`\n⛔ 제대로 안 붙은 지면 ${못붙은.length}장`);
    for (const x of 못붙은.slice(0, 3)) {
      console.log(`   ${path.relative(뿌리, x.f)}\n     → ${제대로붙었나(x.표).왜}`);
    }
    process.exit(1);
  }
  if (기타장.length === 0) console.log('\n✅ 링크가 있는 곳은 전부 표가 붙었고, 갈래를 다 갈랐다.');
  process.exit(나쁜값.length || 기타장.length ? 1 : 0);
}

if (process.argv.includes('--selftest')) 셀프테스트();
else if (process.argv.includes('--라이브')) await 라이브();
else 빌드결과();
