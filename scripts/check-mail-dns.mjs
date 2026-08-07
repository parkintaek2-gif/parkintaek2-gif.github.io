/**
 * 네 도메인에 **메일이 스팸함으로 안 가게 하는 세 가지**가 들어 있는지 잰다.
 *
 * SPF    누가 이 도메인 이름으로 메일을 보내도 되는지 (TXT `v=spf1 …`)
 * DKIM   보낸 메일에 도장을 찍는 열쇠 (TXT `<선택자>._domainkey`)
 * DMARC  위 둘이 어긋났을 때 받는 쪽이 어떻게 할지 (TXT `_dmarc`)
 *
 * ⚠ 셋이 없으면 도메인 메일을 만들어도 **보내는 족족 스팸함**이다.
 *   6번이 8/1 에 재 둔 것을 오늘 다시 잰다 — 재 보지 않고 「없다」고 적지 않는다.
 *
 * ⛔ 이 도구는 **읽기만 한다.** 넣는 것은 등록기관 화면에서 한다.
 *
 * 쓰는 법
 *   node scripts/check-mail-dns.mjs
 *   node scripts/check-mail-dns.mjs --selftest
 */
import dns from 'node:dns/promises';

export const 도메인들 = ['seoulmarkets.com', 'kculturewire.com', '100yearmap.com', 'klifemap.ai'];

/** 흔히 쓰는 DKIM 선택자. 어느 것이 걸릴지 모르니 훑는다. */
export const 도장이름들 = ['default', 'google', 'selector1', 'selector2', 's1', 's2', 'mail', 'k1', 'spaceship'];

export function spf인가(줄들) {
  return 줄들.find((t) => t.toLowerCase().startsWith('v=spf1')) ?? null;
}

export function dmarc인가(줄들) {
  return 줄들.find((t) => t.toLowerCase().startsWith('v=dmarc1')) ?? null;
}

/**
 * DMARC 가 있어도 `p=none` 이면 **아무것도 막지 않는다.** 있다/없다로만 세면 안 된다.
 * 그래서 정책까지 뽑아서 돌려준다.
 */
export function dmarc정책(줄) {
  if (!줄) return null;
  const m = 줄.match(/[;\s]p\s*=\s*(none|quarantine|reject)/i);
  return m ? m[1].toLowerCase() : '없음';
}

async function txt(이름) {
  try {
    return (await dns.resolveTxt(이름)).map((덩이) => 덩이.join(''));
  } catch {
    return [];
  }
}

async function mx(이름) {
  try {
    return (await dns.resolveMx(이름)).map((r) => `${r.exchange}(${r.priority})`);
  } catch {
    return [];
  }
}

export async function 재기(도메인) {
  const [뿌리, dmarc줄, mx목록] = await Promise.all([txt(도메인), txt(`_dmarc.${도메인}`), mx(도메인)]);
  const 도장 = [];
  for (const 이름 of 도장이름들) {
    const t = await txt(`${이름}._domainkey.${도메인}`);
    if (t.length) 도장.push(이름);
  }
  const d = dmarc인가(dmarc줄);
  return {
    도메인,
    spf: spf인가(뿌리),
    dkim: 도장,
    dmarc: d,
    dmarc정책: dmarc정책(d),
    mx: mx목록,
  };
}

if (process.argv.includes('--selftest')) {
  const 잰다 = [];
  const 봄 = (이름, 본것, 바란것) => {
    const 같다 = JSON.stringify(본것) === JSON.stringify(바란것);
    잰다.push(같다);
    console.log(`${같다 ? '✅' : '❌'} ${이름}${같다 ? '' : `\n   본 것 ${JSON.stringify(본것)}\n   바란 것 ${JSON.stringify(바란것)}`}`);
  };
  봄('SPF 를 찾는다', spf인가(['v=spf1 include:x ~all', 'other']), 'v=spf1 include:x ~all');
  봄('SPF 가 없으면 null', spf인가(['google-site-verification=abc']), null);
  봄('DMARC 를 찾는다', dmarc인가(['v=DMARC1; p=reject']), 'v=DMARC1; p=reject');
  봄('⚠ p=none 은 아무것도 막지 않는다 — 정책을 따로 본다', dmarc정책('v=DMARC1; p=none; rua=mailto:a@b'), 'none');
  봄('p=reject 를 읽는다', dmarc정책('v=DMARC1;p=reject'), 'reject');
  봄('p 가 없으면 「없음」', dmarc정책('v=DMARC1; rua=mailto:a@b'), '없음');
  봄('없는 줄이면 null', dmarc정책(null), null);
  const 틀린것 = 잰다.filter((x) => !x).length;
  console.log(틀린것 ? `\n❌ ${틀린것}개 어긋났다` : `\n✅ ${잰다.length}개 다 맞다`);
  process.exit(틀린것 ? 1 : 0);
}

const 잰것 = [];
for (const d of 도메인들) 잰것.push(await 재기(d));

console.log('메일이 스팸함으로 안 가게 하는 세 가지 — 실측\n');
for (const r of 잰것) {
  console.log(`■ ${r.도메인}`);
  console.log(`   SPF    ${r.spf ?? '⛔ 없다'}`);
  console.log(`   DKIM   ${r.dkim.length ? r.dkim.join(', ') : '⛔ 없다 (흔한 선택자 ' + 도장이름들.length + '개를 다 훑음)'}`);
  console.log(`   DMARC  ${r.dmarc ? `${r.dmarc}  → 정책 ${r.dmarc정책}${r.dmarc정책 === 'none' ? ' (⚠ 아무것도 막지 않는다)' : ''}` : '⛔ 없다'}`);
  console.log(`   MX     ${r.mx.length ? r.mx.join(', ') : '⛔ 없다 (받는 메일함이 없다)'}`);
  console.log('');
}

const 빈곳 = 잰것.filter((r) => !r.spf || !r.dkim.length || !r.dmarc);
console.log(빈곳.length ? `⛔ ${빈곳.length}/${잰것.length} 도메인이 아직 비었다 — 지금 도메인 메일을 만들면 스팸함으로 간다`
                        : '✅ 네 도메인 다 갖췄다');
