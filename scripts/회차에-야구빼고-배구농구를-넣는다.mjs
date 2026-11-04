#!/usr/bin/env node
/**
 * 회차에-야구빼고-배구농구를-넣는다.mjs
 *   — **예약 회차에서 프로야구(KBO)를 빼고 여자 프로배구·남자 프로농구를 넣는다.**
 *
 * 🔴 사장님 (2026-11-04)
 *   「**KBO 예약기사만 잔뜩 걸려있던데, 여자프로배구, 남자프로농구로 예약을 바꿔...
 *     야구는 한국시리즈 기간에 실시간 기사로, 시즌이 시작되는 내년에 다시 예약을 걸어야 함**」
 *   「**한국시리즈 기사를 낸 시간에 어제 열린 농구, 배구 등 경기 결과로 기사를 쓰도록 조치해**」
 *   「**중부매일계정이 어제 끝난 한국시리즈 기사를 썼다. 한국시리즈는 경기 종료후 바로
 *     기사를 쓰게 조치해**」
 *
 * ⚠ 왜 «맨 앞에» 끼워 넣나
 *   회차 지침은 한 편에 37,000~40,000자다. 그 안에 「프로야구를 앞에 둔다」가
 *   열 곳 넘게 흩어져 있고, 지난 시즌에 쓴 것이라 지금은 전부 틀렸다.
 *   열 곳을 하나씩 고치면 ① 한 곳을 빠뜨리고 ② 고친 자리끼리 어긋난다.
 *   ⇒ 「아래 어떤 글보다 이것이 먼저다」를 맨 앞에 못박는 쪽이 안전하다.
 *   ⛔ 아래 본문을 지우지 않는다 — 2027년 시즌이 열리면 이 머리절만 걷으면 된다.
 *
 * ✅ 두 번 돌려도 안전하다. ⛔ 사장님 크롬 창을 닫지 않는다 — disconnect() 만.
 *
 * 쓰는 법
 *   node scripts/회차에-야구빼고-배구농구를-넣는다.mjs            무엇이 바뀌는지만 본다
 *   node scripts/회차에-야구빼고-배구농구를-넣는다.mjs --적는다   실제로 써넣는다
 *   node scripts/회차에-야구빼고-배구농구를-넣는다.mjs --자가시험
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

export const 조직 = '953d4e54-f96e-4d6d-b33e-33311fbd09ad';

/** 🔴 2026-11-04 라이브에서 직접 읽은 «켜져 있는» 스포츠 회차 다섯.
 *  ⛔ 날씨 10시(trig_01QLALBiamUfmxWngeTULv12)와 로또는 손대지 않는다 — 종목과 무관하다.
 *  ⚠ 앞선 자(회차에-사장님이고치신꼴을-넣는다.mjs)에 적힌 11시 id 는 옛 것이다.
 *    그 자를 베끼지 말고 «잰다-회차목록.mjs» 가 찍어 준 것을 쓴다. */
export const 회차 = [
  ['09', 'trig_01GeyrdjqmGjtu3cCt6ynZHm'], // 전날 종합 · 매일 08:25
  ['11', 'trig_01UW2RtJac77hBVz1tkgCQxN'], // 국내 프로스포츠 · 평일 10:25
  ['14', 'trig_01RgAwm6L1q4nBhanUgz3s8N'], // 해외스포츠 · 평일 13:25
  ['15', 'trig_01EwjhZx3AKXuEyHK82N9DEn'], // 그날 남은 것 · 평일 14:25
  ['16', 'trig_01ErSZQm2VhuNYMRBi3MCufF'], // 기사가 많을 때만 · 평일 15:25
];

/** 들어갔는지 알아보는 자국 — 새 머리절에만 있는 글이어야 한다 */
export const 자국 = '[사장님 2026-11-04] 프로야구를 빼고 배구·농구를 넣는다';

/** 머리절이 어디서 끝나는지 알리는 못.
 *  🔴 [2026-11-04] 처음에는 끝을 «---» 로 삼았다. 그런데 머리절은 «---\n» 으로 끝나는데
 *    찾을 때는 «---\n\n» 을 찾아 다섯 회차 모두 「끝을 못 찾았다」로 멈췄다.
 *    ⛔ 본문에도 «---» 가 얼마든지 있을 수 있으니 흔한 글자를 못으로 쓰지 않는다.
 *  ⇒ 다른 데 안 나올 글을 못으로 박는다. */
export const 끝표 = '<!-- ⬆ 여기까지가 2026-11-04 머리절이다. 2027 시즌에 이 위를 통째로 걷는다 ⬇ -->';

export const 머리절 = [
  '# 🔴🔴 [사장님 2026-11-04] 프로야구를 빼고 배구·농구를 넣는다 — 아래 어떤 글보다 먼저다',
  '',
  '사장님 원문 —',
  '「**KBO 예약기사만 잔뜩 걸려있던데, 여자프로배구, 남자프로농구로 예약을 바꿔...',
  '  야구는 한국시리즈 기간에 실시간 기사로, 시즌이 시작되는 내년에 다시 예약을 걸어야 함**」',
  '「**한국시리즈 기사를 낸 시간에 어제 열린 농구, 배구 등 경기 결과로 기사를 쓰도록 조치해**」',
  '「**중부매일계정이 어제 끝난 한국시리즈 기사를 썼다. 한국시리즈는 경기 종료후 바로 기사를 쓰게 조치해**」',
  '「**왜 농구와 배구가 종목이 다른데 한 개의 기사로 묶어 쓰나?',
  '  남자프로농구팀 이름 앞에는 반드시 지역명을 넣어. 제목에 기업은행을 넣을 때는 IBK로 수정 해**」',
  '',
  '## ⛔ 종목이 다르면 기사를 «따로» 쓴다',
  '',
  '- 배구와 농구를 한 편에 묶지 않는다. **종목마다 기사 한 편**이다.',
  '  제목도 부제목도 사진도 따로 단다. 두 종목을 한 제목에 걸치지 않는다.',
  '  ⚠ 2026-11-04 에 한 편으로 묶어 냈다가 사장님께 바로 지적받았다.',
  '  그날 제목은 배구인데 부제목이 통째로 농구였다 — 묶으면 반드시 이렇게 된다.',
  '- 어제 두 종목 다 경기가 있었으면 **두 편을 쓴다.** 배구를 먼저 준다.',
  '',
  '## ⛔ 이름 표기 — 두 가지는 예외가 없다',
  '',
  '```',
  '남자 프로농구(KBL)   팀 이름 앞에 «반드시» 지역명을 넣는다',
  '                     삼성(X) → 서울 삼성(O)   ·   KCC(X) → 부산 KCC(O)',
  '                     소노(X) → 고양 소노(O)   ·   SK(X)  → 서울 SK(O)',
  '                     ⭐ 서울 연고가 둘이라 「삼성」만 쓰면 어느 팀인지 모른다',
  'IBK기업은행          «제목»에서는 「IBK」로 쓴다 — 「기업은행, 현대건설 완파」(X)',
  '                     「IBK, 현대건설 완파」(O). 본문은 첫머리에 IBK기업은행,',
  '                     그 뒤로는 IBK 로 줄여 쓴다',
  '```',
  '',
  '## ⛔ 이 회차에서 프로야구(KBO)를 쓰지 않는다',
  '',
  '- **한국시리즈도 이 회차에서 쓰지 않는다.** 한국시리즈는 경기가 끝난 그 자리에서',
  '  따로 쓰는 것으로 바뀌었다. 아침에 어제 경기를 쓰면 **하루 지난 기사**가 된다 —',
  '  2026-11-04 아침에 실제로 그렇게 나가서 사장님께 지적받았다.',
  '- 아래 본문에 「프로야구를 제일 앞에 둔다」·「KBO 를 맡은 회차」·「프로야구 포스트시즌 일정」',
  '  같은 대목이 여러 곳 남아 있다. 그것은 **프로야구 시즌 중에 쓴 지난 지시**다.',
  '  지금은 정규시즌이 끝났다. 그 대목을 근거로 야구를 쓰지 않는다.',
  '- 2027년 프로야구 정규시즌이 열리면 그때 이 머리절을 걷고 되살린다.',
  '',
  '## ✅ 그 자리를 받는 종목 — 차례가 정해져 있다',
  '',
  '```',
  '첫째  여자 프로배구 — V-리그 여자부      KOVO 공식 일정·기록에서 확인한다',
  '둘째  남자 프로농구 — KBL                KBL 공식 일정·기록에서 확인한다',
  '셋째  남자 프로배구 — V-리그 남자부      위 둘이 어제 경기가 없을 때만',
  '넷째  여자 프로농구 — WKBL              위 셋이 어제 경기가 없을 때만',
  '```',
  '',
  '- ⛔ **일정을 외워서 쓰지 않는다.** 그날 아침에 KOVO · KBL 공식 일정을 열어 확인한다.',
  '- 충청 연고 구단이 걸려 있으면 그것을 앞에 놓는다. 다만 억지로 끌어오지 않는다.',
  '  (대전 정관장 레드스파크스 — 여자배구 · 대전 삼성화재, 천안 현대캐피탈 — 남자배구 ·',
  '   청주 KB스타즈 — 여자농구 · 남자농구 KBL 에는 충청 연고 구단이 **없다**)',
  '- 네 종목 모두 어제 경기가 없으면 **「어제 경기가 없었다」고 적고 빈손으로 끝낸다.**',
  '  빈칸을 메우려고 프로야구로 돌아가지 않는다.',
  '',
  '## ⚠ 아래 본문과 어긋날 때',
  '',
  '아래 본문이 이 머리절과 어긋나면 **이 머리절이 이긴다.** 그리고 기사 끝에',
  '「이 회차 몫이 아래 지침과 달라진 까닭」을 한 줄 적는다 — 데스크가 알아야 한다.',
  '',
  끝표,
  '',
].join('\n');

/** 옛 머리절을 걷고 새것을 맨 앞에 붙인다.
 *  ⛔ 두 번 돌려도 머리절이 두 벌 쌓이지 않게 «있으면 걷고 다시 붙인다». */
export function 고치기(옛글) {
  if (typeof 옛글 !== 'string' || !옛글) return { 바뀌었나: false, 까닭: '지침이 비어 있다', 글: 옛글 };
  let 본문 = 옛글;
  const 머리 = '# 🔴🔴 [사장님 2026-11-04] 프로야구를 빼고 배구·농구를 넣는다';
  const i = 본문.indexOf(머리);
  if (i === 0) {
    /* 이미 붙어 있다 — 끝표까지 걷어 내고 새것으로 갈아 끼운다 */
    let 끝 = 본문.indexOf(끝표);
    let 길이 = 끝표.length;
    if (끝 < 0) {
      /* ⚠ 2026-11-04 오전에 «---» 로 끝나게 붙인 머리절이 라이브에 있다.
         그 한 벌만 걷어 내려고 둔 길이다 — 새로 붙는 것은 늘 끝표를 쓴다. */
      끝 = 본문.indexOf('\n---\n');
      길이 = '\n---\n'.length;
    }
    if (끝 < 0) return { 바뀌었나: false, 까닭: '앞서 붙인 머리절의 끝을 못 찾았다 — 손으로 본다', 글: 옛글 };
    본문 = 본문.slice(끝 + 길이).replace(/^\n+/, '');
    if (머리절 + 본문 === 옛글) return { 바뀌었나: false, 까닭: '이미 같은 머리절이 들어 있다', 글: 옛글 };
    return { 바뀌었나: true, 까닭: '머리절을 갈아 끼웠다', 글: 머리절 + 본문 };
  }
  if (i > 0) return { 바뀌었나: false, 까닭: '머리절이 맨 앞이 아닌 곳에 있다 — 손으로 본다', 글: 옛글 };
  return { 바뀌었나: true, 까닭: '머리절을 맨 앞에 붙였다', 글: 머리절 + 본문 };
}

const 이파일이진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

/* ── 자가시험 ────────────────────────────────────────────── */
if (이파일이진입점 && process.argv.includes('--자가시험')) {
  let 탈 = 0;
  const 재본다 = (이름, 참인가) => { if (참인가) console.log('  ✅ ' + 이름); else { console.log('  🔴 ' + 이름); 탈 += 1; } };

  console.log('■ 자가시험');
  const 원래 = '## 스포츠 회차 지침\n프로야구를 제일 앞에 둔다.\n';
  const a = 고치기(원래);
  재본다('처음 붙이면 바뀐다', a.바뀌었나);
  재본다('맨 앞에 머리절이 온다', a.글.startsWith('# 🔴🔴 [사장님 2026-11-04]'));
  재본다('옛 본문을 지우지 않는다', a.글.includes('프로야구를 제일 앞에 둔다.'));
  재본다('자국이 들어 있다', a.글.includes(자국));

  const b = 고치기(a.글);
  재본다('두 번 돌려도 안 바뀐다', !b.바뀌었나);
  재본다('두 번 돌려도 머리절이 한 벌이다',
    (a.글.match(/# 🔴🔴 \[사장님 2026-11-04\]/g) || []).length === 1);

  /* 🔴 머리절을 고친 뒤 다시 돌리면 «갈아 끼워»야 한다 — 두 벌이 되면 안 된다 */
  const 낡은머리 = '# 🔴🔴 [사장님 2026-11-04] 프로야구를 빼고 배구·농구를 넣는다 — 옛판\n\n낡은 글\n\n---\n\n';
  const c = 고치기(낡은머리 + 원래);
  재본다('낡은 머리절은 갈아 끼운다', c.바뀌었나 && !c.글.includes('낡은 글'));
  재본다('갈아 끼운 뒤에도 본문은 남는다', c.글.includes('프로야구를 제일 앞에 둔다.'));
  재본다('갈아 끼운 뒤 머리절은 한 벌이다',
    (c.글.match(/# 🔴🔴 \[사장님 2026-11-04\]/g) || []).length === 1);

  재본다('빈 지침은 손대지 않는다', !고치기('').바뀌었나);
  재본다('회차는 다섯이다', 회차.length === 5);
  재본다('날씨 회차는 안 들어 있다', !회차.some(([, t]) => t === 'trig_01QLALBiamUfmxWngeTULv12'));
  재본다('id 가 모두 다르다', new Set(회차.map(([, t]) => t)).size === 5);
  재본다('머리절에 한국시리즈 실시간 지시가 있다', 머리절.includes('경기가 끝난 그 자리에서'));
  /* ⚠ 그냥 「V-리그가 KBL 보다 앞에 나오나」로 재면 안 된다 — 이름 표기 절에
     「남자 프로농구(KBL)」가 먼저 나와서 떨어진다. 재야 할 것은 «차례표 안의 차례»다 */
  재본다('차례표에서 여자배구가 첫째, 농구가 둘째다',
    머리절.indexOf('첫째  여자 프로배구') > 0
    && 머리절.indexOf('첫째  여자 프로배구') < 머리절.indexOf('둘째  남자 프로농구'));
  재본다('머리절이 빈손 허용을 적어 둔다', 머리절.includes('빈손으로 끝낸다'));
  /* 🔴 2026-11-04 사장님이 바로 지적하신 셋 — 하나라도 빠지면 같은 잘못이 되풀이된다 */
  재본다('머리절이 종목을 묶지 말라고 한다', 머리절.includes('한 편에 묶지 않는다'));
  재본다('머리절이 KBL 지역명을 못박는다', 머리절.includes('KCC(X) → 부산 KCC(O)'));
  재본다('머리절이 제목에 IBK 를 쓰라고 한다', 머리절.includes('「IBK, 현대건설 완파」(O)'));

  console.log(탈 ? `\n🔴 ${탈}가지 떨어졌다` : '\n✅ 모두 통과');
  process.exit(탈 ? 1 : 0);
}

/* ── 본체 ────────────────────────────────────────────────── */
if (이파일이진입점 && !process.argv.includes('--자가시험')) {
  const 적는다 = process.argv.includes('--적는다');
  const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
  const puppeteer = require('puppeteer-core');
  const 포트 = process.env.KLM_CHROME_PORT || '9222';
  const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:' + 포트, defaultViewport: null, protocolTimeout: 240000 });
  const page = await b.newPage();
  let 탈 = 0;
  try {
    await page.goto('https://claude.ai/scheduled-task/' + 회차[0][1], { waitUntil: 'domcontentloaded', timeout: 90000 });
    await new Promise((r) => setTimeout(r, 4000));

    for (const [시, trig] of 회차) {
      const 받은 = await page.evaluate(async (o, t) => {
        const res = await fetch('/api/organizations/' + o + '/cowork/scheduled_tasks/' + t, { headers: { accept: 'application/json' } });
        return { 상태: res.status, 글: await res.text() };
      }, 조직, trig);
      if (받은.상태 !== 200) { console.log('🔴 ' + 시 + '시 — 못 읽었다 (' + 받은.상태 + ')'); 탈 += 1; continue; }

      const tr = JSON.parse(받은.글).trigger;
      const 옛글 = tr.derived_state?.prompt;
      if (typeof 옛글 !== 'string' || !옛글) { console.log('🔴 ' + 시 + '시 — 지침 자리를 못 찾았다'); 탈 += 1; continue; }

      const r = 고치기(옛글);
      if (!r.바뀌었나) { console.log('⬜ ' + 시 + '시 — ' + r.까닭); continue; }
      if (!적는다) { console.log('🟡 ' + 시 + '시 — ' + 옛글.length + ' → ' + r.글.length + '자 · ' + r.까닭); continue; }

      const 답 = await page.evaluate(async (o, t, prompt) => {
        const res = await fetch('/api/organizations/' + o + '/cowork/scheduled_tasks/' + t, {
          method: 'PATCH',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        return { 상태: res.status, 글: (await res.text()).slice(0, 300) };
      }, 조직, trig, r.글);
      if (답.상태 !== 200) { console.log('🔴 ' + 시 + '시 — 못 썼다 (' + 답.상태 + ') ' + 답.글.replace(/\s+/g, ' ')); 탈 += 1; continue; }

      /* ⭐ 「썼다(200)」를 「들어갔다」로 읽지 않는다 — 세 자리를 다시 읽는다 */
      const 다시 = await page.evaluate(async (o, t) => {
        const res = await fetch('/api/organizations/' + o + '/cowork/scheduled_tasks/' + t, { headers: { accept: 'application/json' } });
        return await res.text();
      }, 조직, trig);
      const t2 = JSON.parse(다시).trigger;
      const 모은글 = [
        t2.derived_state?.prompt,
        ...(t2.session_request?.events || []).map((e) => e?.payload?.internal_anthropic_catchall?.message?.content),
        ...(t2.job_config?.ccr?.events || []).map((e) => e?.data?.message?.content),
      ].map((x) => String(x || '')).filter(Boolean);
      const 든곳 = 모은글.filter((x) => x.includes(자국)).length;
      const 됐나 = 모은글.length > 0 && 든곳 === 모은글.length;
      console.log((됐나 ? '✅ ' : '🔴 ') + 시 + '시 — ' + 옛글.length + ' → ' + r.글.length + '자 · '
        + '세 자리 ' + 모은글.length + '곳 가운데 ' + 든곳 + '곳에 들었다');
      if (!됐나) 탈 += 1;
    }
  } finally { await page.close().catch(() => {}); b.disconnect(); }
  if (!적는다) console.log('\n   --적는다 로 실제로 써넣는다');
  process.exitCode = 탈 ? 1 : 0;
}

export default { 고치기, 회차, 자국, 머리절, 조직 };
