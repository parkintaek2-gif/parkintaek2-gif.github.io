/**
 * mail-guard.mjs — **절대 닿지 않는 주소로는 편지를 안 보낸다.**
 * ────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 [2026-09-17] 왜 만들었나
 *
 *   사장님 편지함에 반송 둘이 들어왔다. 둘 다 «우리가 보낸» 주문 확인 편지다.
 *   ```
 *   6ubon-test@klifedesign.net       우리 시험 계정 — 도메인은 있으나 그 편지함이 없다
 *   sb-c347qc52559502@personal.example.com   페이팔 «샌드박스» 구매자 — 도메인이 없다
 *   ```
 *   결제 점검을 매시 돌리니 **반송도 매시 쌓인다.** 사장님은 진짜 주문 편지와
 *   구분하실 수 없고, 그러면 **진짜 첫 주문이 왔을 때 그 속에 묻혀 못 보신다.**
 *   회사에 아직 매출이 0 인 지금, 첫 주문 편지를 못 보시는 것이 가장 나쁜 결과다.
 *
 * ── ⛔ 이 자가 지키는 것 ─────────────────────────────────────────
 * ⛔ 「시험이니까 괜찮다」로 넘기지 않는다 — 보내는 순간 바깥으로 나가고 되돌릴 수 없다
 * ⛔ 주소를 로그·저장소에 적지 않는다. **왜 안 보냈는지**만 적는다
 *   (사장님 지시 — 실제 사람의 사적인 내용은 공용 저장소에 안 적는다)
 * ⛔ 막는 범위를 넓히지 않는다. 진짜 손님 한 명을 막는 것이 시험 편지 백 통보다 나쁘다.
 *   **표준이 「닿지 않는다」고 못박은 도메인**과 우리가 만든 시험 주소만 막는다
 * ✅ 막아도 결제는 그대로 성공한다. 편지만 안 나간다
 */

/**
 * RFC 2606 · RFC 6761 이 「실제로 쓰이지 않는다」고 예약해 둔 이름들.
 * 여기로 보낸 편지는 **반드시** 반송된다 — 우리가 판단하는 것이 아니라 표준이 정한 것이다.
 */
const 예약도메인 = /(^|\.)(example\.(com|net|org)|test|invalid|localhost|example)$/i;

/** 페이팔 샌드박스 구매자는 `sb-xxxx@…` 꼴이다 */
const 샌드박스 = /^sb-[a-z0-9]+@/i;

/** 우리가 만든 시험 계정 — 편지함이 없다. 늘어나면 여기에 더한다 */
const 우리시험주소 = /^(6ubon-test|seoulmarkets-healthcheck|u\d-test|klm-test)@/i;

/**
 * 이 주소로 보내면 반송되나. **판정만 떼어 낸다** — 안에 박으면 죽어도 모른다.
 * @returns {null | string} 못 닿으면 «왜»(주소는 안 담는다), 닿을 수 있으면 null
 */
export function 못닿는주소인가(주소) {
  const e = String(주소 ?? '').trim();
  if (!e) return '빈 주소';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return '주소 꼴이 아니다';
  const 도메인 = e.slice(e.lastIndexOf('@') + 1).toLowerCase();
  if (예약도메인.test(도메인)) return '표준이 예약한 도메인이라 반드시 반송된다';
  if (샌드박스.test(e)) return '페이팔 샌드박스 구매자 주소다';
  if (우리시험주소.test(e)) return '우리가 만든 시험 주소다';
  return null;
}

/* ── 자가시험 ───────────────────────────────────────────────────────────── */
if (process.argv.includes('--자가시험')) {
  const 것들 = [];
  const 다 = (이름, 참) => 것들.push({ 이름, 참: !!참 });

  /* 🔴 그날 실제로 반송된 둘 */
  다('우리 시험 계정을 막는다', !!못닿는주소인가('6ubon-test@klifedesign.net'));
  다('페이팔 샌드박스를 막는다', !!못닿는주소인가('sb-c347qc52559502@personal.example.com'));

  /* 표준이 예약한 것들 */
  다('example.com 을 막는다', !!못닿는주소인가('seoulmarkets-healthcheck@example.com'));
  다('buyer@example.com 을 막는다', !!못닿는주소인가('buyer@example.com'));
  다('아랫도메인도 막는다', !!못닿는주소인가('a@mail.example.com'));
  다('.test 를 막는다', !!못닿는주소인가('a@foo.test'));
  다('.invalid 를 막는다', !!못닿는주소인가('a@foo.invalid'));
  다('localhost 를 막는다', !!못닿는주소인가('a@localhost'));

  /* 꼴이 아닌 것 */
  다('빈 것을 막는다', 못닿는주소인가('') === '빈 주소');
  다('null 을 막는다', 못닿는주소인가(null) === '빈 주소');
  다('@ 없는 것을 막는다', !!못닿는주소인가('abc'));

  /* ⛔⛔ 여기가 더 중요하다 — **진짜 손님을 막으면 안 된다** */
  다('보통 주소는 보낸다', 못닿는주소인가('jane@gmail.com') === null);
  다('네이버도 보낸다', 못닿는주소인가('parkintaek@naver.com') === null);
  다('우리 진짜 주소는 보낸다', 못닿는주소인가('admin@klifedesign.net') === null);
  다('u5 도 보낸다', 못닿는주소인가('u5@klifedesign.net') === null);
  다('이름에 test 가 들어가도 보낸다', 못닿는주소인가('testuser@gmail.com') === null);
  다('도메인에 example 이 «들어만» 가면 보낸다', 못닿는주소인가('a@exampleshop.co.kr') === null);
  다('sb 로 시작하는 보통 주소는 보낸다', 못닿는주소인가('sbkim@gmail.com') === null);
  다('대학 주소도 보낸다', 못닿는주소인가('prof@snu.ac.kr') === null);

  /* 왜 안 보냈는지는 말하되 «주소»는 안 담는다 */
  다('왜에 주소를 담지 않는다', !String(못닿는주소인가('6ubon-test@klifedesign.net')).includes('6ubon'));

  const 진 = 것들.filter((x) => !x.참);
  console.log(`못 닿는 주소 거르기 — 자가시험 ${것들.length - 진.length}/${것들.length}`);
  for (const x of 진) console.log('   🔴 ' + x.이름);
  process.exit(진.length ? 1 : 0);
}
