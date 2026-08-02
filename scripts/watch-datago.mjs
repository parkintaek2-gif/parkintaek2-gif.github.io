/**
 * 공공데이터포털 회원가입 재개 감시.
 *
 * 2026-07-31 현재 포털이 "전환 작업"으로 로그인·회원가입을 막아놨다.
 * 그래서 API 키를 못 받고 있고, 키가 없으면 자동 수집이 안 된다.
 *
 *   node scripts/watch-datago.mjs          # 한 번 확인
 *   node scripts/watch-datago.mjs --watch  # 열릴 때까지 계속 확인(기본 10분 간격)
 *
 * 판별 방법 — 점검 중에는 auth 페이지가 439바이트짜리 <title>안내</title> 안내문만
 * 돌려준다. 정상화되면 실제 가입 폼(수천 바이트)이 온다. 크기와 문구를 함께 본다.
 * 어느 한쪽만 보면 오탐이 난다.
 */

const URL_SIGNUP = 'https://auth.data.go.kr/sso/common-signup';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

/* ⚠ 2026-08-02 21:16 KST 오탐. 가입 페이지가 337B → 21KB 로 커져서 「열렸다」고 알렸는데
 *   실제로는 사장님이 가입을 못 하셨다. **HTML 이 뜨는 것과 절차가 도는 것은 다르다.**
 *   메인 페이지에는 그때도 「일시 정지」·「중단」·「제한이 있습니다」가 남아 있었다.
 *
 *   그래서 판정을 좁혔다 — 크기만으로 열렸다고 하지 않고, **메인 페이지의 차단 문구까지**
 *   함께 본다. 둘 다 깨끗해야 알린다.
 *   **틀린 신호로 「열렸다」고 알리는 것이 안 알리는 것보다 나쁘다.** */
const BLOCK_WORDS = ['전환 작업', '이용이 제한', '점검', '일시 정지', '중단', '제한이 있습니다'];
const URL_MAIN = 'https://www.data.go.kr/';

export async function checkOnce() {
  const res = await fetch(URL_SIGNUP, { headers: { 'User-Agent': UA } });
  const html = await res.text();
  const blocked = BLOCK_WORDS.some((w) => html.includes(w));
  const tiny = html.length < 1500; // 안내문만 오면 400바이트대다

  return {
    at: new Date().toISOString(),
    status: res.status,
    bytes: html.length,
    blocked,
    tiny,
    open: res.ok && !blocked && !tiny,
  };
}

function line(r) {
  return `${r.at.slice(0, 19).replace('T', ' ')}  HTTP ${r.status}  ${String(r.bytes).padStart(6)}B  ${
    r.open ? '✅ 가입 가능' : '⛔ 점검 중'
  }`;
}

const watch = process.argv.includes('--watch');
const everyMin = Number(process.argv.find((a) => /^--every=\d+$/.test(a))?.split('=')[1] ?? 10);

const first = await checkOnce();
console.log(line(first));

if (first.open) {
  console.log('\n🔔 회원가입이 열렸습니다. 지금 키를 발급받으십시오.');
  console.log('   https://www.data.go.kr → 회원가입 → 아래 6종 활용신청(자동승인)');
  console.log('   15059649 공시정보 · 15043459 기업재무 · 15060622 다중회사주요계정');
  console.log('   15043184 기업기본 · 15094792 펀드상품 · 15094795 금융투자회사공시');
  process.exit(0);
}

if (!watch) {
  console.log('\n아직 막혀 있습니다. --watch 를 붙이면 열릴 때까지 지켜봅니다.');
  process.exit(1);
}

console.log(`\n${everyMin}분 간격으로 지켜봅니다. Ctrl+C 로 중단.`);
for (;;) {
  await new Promise((r) => setTimeout(r, everyMin * 60_000));
  let r;
  try {
    r = await checkOnce();
  } catch (e) {
    console.log(`${new Date().toISOString().slice(0, 19)}  조회 실패: ${e.message}`);
    continue;
  }
  console.log(line(r));
  if (r.open) {
    console.log('\n🔔🔔🔔 회원가입이 열렸습니다. 지금 키를 발급받으십시오.');
    process.exit(0);
  }
}
