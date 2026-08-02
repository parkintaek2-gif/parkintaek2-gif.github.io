/**
 * crisis.mjs — 위기 신호 감지와 안내. **KLifeMap 과 공유한다.**
 * ─────────────────────────────────────────────────────────────────────────
 * [왜 이 파일이 먼저인가]
 * 상담을 표방하는 1:1 대화는 **반드시** 위기 신호를 만난다. 확률이 아니라 시간의 문제다.
 * - 사주 상담은 대개 **삶이 잘 안 풀릴 때** 온다. 모집단이 이미 그쪽으로 치우쳐 있다.
 * - 교육 상담은 **입시 압박을 받는 청소년**을 다룬다.
 *
 * 그리고 규제가 오고 있다 — 여성가족부·과기정통부가 **청소년 위기징후 탐지 AI** 를
 * 시범운영 중이고, **「AI 에 고민 상담은 위험」** 청소년 가이드라인이 준비되고 있다.
 * **나오고 나서 붙이면 늦다.**
 *
 * [설계 원칙 — 다른 AI 층과 정반대다]
 * 판정·설명·대화층은 전부 「LLM 이 판단하지 않는다」인데, 이 모듈은 한발 더 간다.
 * **감지도 LLM 에 맡기지 않는다.** 규칙으로 먼저 걸러 낸다.
 *   - LLM 은 같은 문장을 다르게 읽을 수 있다. 위기 감지에서 그 변동은 사람이 다친다
 *   - 규칙은 재현 가능하고 감사 가능하다. 「왜 못 걸렀나」를 되짚을 수 있다
 *   - 규칙이 먼저 걸러도 LLM 이 추가로 의심하면 그것도 받는다(합집합).
 *     **놓치는 쪽이 잘못 잡는 쪽보다 훨씬 나쁘다.**
 *
 * [가장 위험한 실패 — 위로로 넘기기]
 * 「괜찮아질 거예요」는 대화를 이어가게 만들고, 그 순간 안내가 늦어진다.
 * 이 모듈이 걸리면 **상담을 이어가지 않는다.** 그게 규칙이다.
 *
 * 사용
 *   import { detect, guidance } from './crisis.mjs';
 *   const hit = detect(userText);
 *   if (hit.level !== 'none') return guidance(hit, { locale: 'ko', minor: true });
 */

/* ── 지역별 연락처 ────────────────────────────────────────────────────────
 * 한·중·일 화교권으로 나가므로 나라마다 다르다. **모르는 지역에 한국 번호를 주지 않는다.**
 * 확인한 것만 넣고, 없으면 지역 응급번호로 안내한다.
 */
export const HOTLINES = {
  KR: [
    { name: '자살예방상담전화', tel: '109', note: '24시간' },
    { name: '청소년전화', tel: '1388', note: '24시간 · 청소년' },
    { name: '정신건강상담전화', tel: '1577-0199', note: '24시간' },
  ],
  JP: [
    { name: 'こころの健康相談統一ダイヤル', tel: '0570-064-556', note: '' },
    { name: 'いのちの電話', tel: '0570-783-556', note: '' },
  ],
  // ⚠ 아래 지역은 아직 확인하지 못했다. 확인 전에는 지역 응급번호로만 안내한다.
  TW: [],
  HK: [],
  SG: [],
};

/** 확인된 번호가 없을 때. 그 나라 응급번호를 모르므로 「가까운 응급실·112/119」로 돌린다. */
const FALLBACK = {
  ko: '지금 바로 도움을 받으실 수 있습니다. 가까운 응급실로 가시거나 긴급전화(119)로 연락해 주십시오.',
  ja: '今すぐ助けを求めてください。最寄りの救急医療機関、または緊急通報(119)にご連絡ください。',
  zh: '請立即尋求協助。請前往最近的急診室，或撥打當地緊急電話。',
  en: 'Please reach out for help right now — go to the nearest emergency room or call your local emergency number.',
};

/* ── 감지 규칙 ────────────────────────────────────────────────────────────
 *
 * 두 단계로 나눈다. **직접 표현**은 즉시 최고 단계로 올린다.
 * **간접 표현**은 혼자서는 약하고, 다른 신호와 겹칠 때 올린다 —
 * 「죽겠다」는 한국어에서 관용구로도 쓰이기 때문이다(「배고파 죽겠다」).
 * 그 구분을 안 하면 오탐이 너무 많아 아무도 이 모듈을 안 켜게 된다.
 */

/** 즉시 전환. 문맥을 더 볼 것 없이 상담을 멈춘다. */
const ACUTE = [
  // 한국어
  /자살|목[을 ]*매|목숨을 끊|죽어\s*버리|없어지고\s*싶|사라지고\s*싶|살고\s*싶지\s*않/,
  // ⚠ 활용형을 빠뜨리면 못 잡는다. 「긋다」는 ㅅ불규칙이라 「그었/그어」가 된다.
  //   2026-08-02 시험에서 「손목을 그었어요」가 안 걸려서 알았다. 이런 게 사람이 다치는 지점이다.
  /자해|손목을?\s*(긋|그어|그었|긁)|약을?\s*(모으|모았)|유서/,
  // 일본어
  /自殺|死にたい|消えたい|自傷|リストカット|遺書/,
  // 중국어(번체·간체)
  /自殺|自杀|想死|不想活|自殘|自残|割腕|遺書|遗书/,
  // 영어
  /\b(kill myself|suicid|end my life|self[- ]?harm|cut myself)\w*/i,
];

/** 혼자서는 약한 신호. 둘 이상 겹치거나 ACUTE 와 함께면 올린다. */
const SOFT = [
  /힘들어서\s*못|버틸\s*수\s*없|아무\s*의미\s*없|다\s*소용없|혼자\s*견디/,
  /아무도\s*모르|말할\s*사람이\s*없|짐이?\s*되는\s*것\s*같/,
  /もう限界|誰も分かってくれない|生きる意味/,
  /撐不下去|沒有意義|没有意义|活著好累|活着好累/,
  /\b(hopeless|can'?t go on|no reason to live|burden to)\b/i,
];

/** 관용구 오탐을 줄인다. 「배고파 죽겠다」류는 위기가 아니다. */
const IDIOM = /(배고파|배불러|더워|추워|웃겨|좋아|귀여워|보고\s*싶어|피곤해|졸려)[^.\n]{0,4}죽겠/;

/**
 * 위기 신호를 감지한다.
 * @param {string} text 사용자가 쓴 원문
 * @returns {{level:'none'|'watch'|'acute', matched:string[]}}
 */
export function detect(text) {
  const t = String(text ?? '');
  if (!t.trim()) return { level: 'none', matched: [] };

  // 관용구만 있고 다른 신호가 없으면 위기가 아니다
  const idiomOnly = IDIOM.test(t);

  const acute = ACUTE.filter((re) => re.test(t)).map((re) => re.source);
  if (acute.length && !(idiomOnly && acute.length === 1 && /죽어/.test(t))) {
    return { level: 'acute', matched: acute };
  }

  const soft = SOFT.filter((re) => re.test(t)).map((re) => re.source);
  // 약한 신호는 **둘 이상**일 때만 올린다. 하나는 그냥 힘든 날일 수 있다.
  if (soft.length >= 2) return { level: 'acute', matched: soft };
  if (soft.length === 1) return { level: 'watch', matched: soft };

  return { level: 'none', matched: [] };
}

/* ── 안내문 ───────────────────────────────────────────────────────────────
 *
 * ⚠ **여기서 상담을 이어가지 않는다.** 「그런데 진로 얘기로 돌아가면」이 없다.
 * 그리고 「괜찮아질 거예요」를 쓰지 않는다 — 위로는 안내를 늦춘다.
 */

const OPENING = {
  ko: {
    acute: '지금 많이 힘드신 것 같습니다. 이 이야기는 저와만 나누기에는 너무 중요합니다.',
    watch: '지금 많이 지쳐 계신 것 같습니다. 혼자 두고 싶지 않습니다.',
  },
  ja: {
    acute: '今とてもつらい状況にあるようです。この話は私だけで受け止めるには重すぎます。',
    watch: '今とても疲れていらっしゃるようです。おひとりにしたくありません。',
  },
  zh: {
    acute: '您現在似乎非常辛苦。這件事不該只由我來承接。',
    watch: '您現在似乎很疲憊。我不想讓您一個人面對。',
  },
  en: {
    acute: 'It sounds like you are going through something very hard. This is too important for me alone.',
    watch: 'It sounds like you are very worn down right now. I do not want to leave you with this alone.',
  },
};

const ASK = {
  ko: '지금 **사람에게** 연락해 주십시오. 아래는 24시간 열려 있습니다.',
  ja: '今すぐ**人に**連絡してください。以下は24時間対応です。',
  zh: '請現在就**聯絡真人**。以下服務全天候開放。',
  en: 'Please reach a **person** right now. These lines are open around the clock.',
};

/** 보호자가 함께 있는 세션이면 한 줄 더 붙인다. 교육 서비스는 보호자 동석이 기본이다. */
const TO_GUARDIAN = {
  ko: '보호자께 — 지금 아이 곁에 있어 주시고, 위 번호로 함께 연락해 주십시오.',
  ja: '保護者の方へ — 今そばにいてあげてください。上記へ一緒にご連絡ください。',
  zh: '致家長 — 請現在陪在孩子身邊，並一起撥打上述電話。',
  en: 'To the guardian — please stay with your child now and call one of the numbers together.',
};

/**
 * 안내문을 만든다. **이 응답 뒤로 상담을 이어가지 않는다.**
 * @param {{level:string}} hit  detect() 결과
 * @param {{locale?:string, region?:string, withGuardian?:boolean}} opt
 */
export function guidance(hit, opt = {}) {
  const locale = opt.locale ?? 'ko';
  const region = opt.region ?? (locale === 'ja' ? 'JP' : locale === 'ko' ? 'KR' : '');
  const L = (m) => m[locale] ?? m.ko ?? m.en;

  const lines = [L(OPENING)[hit.level === 'watch' ? 'watch' : 'acute'], '', L(ASK)];

  const list = HOTLINES[region] ?? [];
  if (list.length) {
    for (const h of list) lines.push(`- **${h.name} ${h.tel}**${h.note ? ` (${h.note})` : ''}`);
  } else {
    // 확인된 번호가 없는 지역에 남의 나라 번호를 주지 않는다. 그건 도움이 안 된다.
    lines.push(`- ${FALLBACK[locale] ?? FALLBACK.en}`);
  }

  if (opt.withGuardian) lines.push('', L(TO_GUARDIAN));

  return {
    /** 이 문구를 그대로 낸다. LLM 에 다시 쓰게 하지 않는다 — 문구가 흔들리면 안 된다. */
    text: lines.join('\n'),
    /** 호출부는 이 값을 보고 대화를 종료해야 한다. */
    stopConversation: true,
    /** 로그에 표시해 남긴다. 사후에 확인할 수 있어야 한다. */
    flag: { kind: 'crisis', level: hit.level, matched: hit.matched, at: null },
  };
}

/**
 * 호출부가 쓰기 쉬운 한 줄짜리.
 * @returns {null | ReturnType<typeof guidance>}  null 이면 평소대로 진행한다
 */
export function screen(text, opt) {
  const hit = detect(text);
  return hit.level === 'none' ? null : guidance(hit, opt);
}
