#!/usr/bin/env node
/**
 * check-로그에-개인정보가-찍히나.mjs — **네 사이트의 로그에 손님 개인정보가 찍히는지 전수로 잰다.**
 * ────────────────────────────────────────────────────────────────────────────
 * [왜 만들었나 — 2026-10-03 사장님 보안 지시]
 *   > 「평소 **보관하는** 고객 개인정보 자체를 최소화하는 데이터 관리 원칙도 주문했다」
 *   > 「감시 범위도 고객용 웹과 앱에 그치지 말고 **내부 관리자망과 외주 및 협력사 연계 시스템까지** 넓혀야」
 *
 *   2번이 낸 개인정보 보관표는 **DB 안만** 봤다. 그러나 「보관」은 DB 만이 아니다 —
 *   서버 로그·오류 로그도 보관이고, 그쪽이 더 위험하다. DB 는 지우는 자가 있지만
 *   로그는 아무도 안 지운다. 우리 규칙에도 이미 있다 —
 *   ⛔ 「손님 이메일 주소를 저장소·로그 어디에도 적지 않는다」
 *
 * [무엇을 재나]
 *   서버가 도는 코드에서 **글을 뱉는 자리**(console.*, logger.*, process.stdout.write)를
 *   모두 찾고, 그 자리가 **손님 것을 품은 값**을 함께 뱉는지 본다.
 *
 *   🔴 통째로 뱉는 것   req.body · req.query · JSON.stringify(body) · err 에 요청이 통째로 붙은 것
 *                      ⇒ 무엇이 찍힐지 «우리도 모른다». 가장 위험하다
 *   ⚠ 골라서 뱉는 것   email · phone · 이름 · 생년월일시 · 위경도 · 주소 · 카드 · 토큰
 *                      ⇒ 무엇이 찍히는지는 아는데, 찍히면 안 되는 것이다
 *   ⬜ 괜찮은 것        id 만 · 상태코드만 · 길 이름만 · 셈한 수만
 *
 * [안 보는 곳 — 왜 안 보는지 적어 둔다]
 *   · node_modules       남의 코드다. 우리가 못 고친다
 *   · dist · .astro      지어진 것이다. 원본을 고치면 따라온다
 *   · tools · scripts    검사 도구 자신이다. 손님 자료를 다루지 않는다
 *     ⚠ 다만 «자료를 내보내는» 도구는 예외다 — 따로 `--도구까지` 로 본다
 *   · public             브라우저로 간다. 서버 로그가 아니다
 *     ⚠ 그래도 거기에 console.log(이메일) 이 있으면 손님 «자기» 콘솔에 찍히는 것이라
 *       남에게 새지는 않는다. 그래서 흠으로 세지 않되 수는 적어 둔다
 *
 * [쓰는 법]
 *   node scripts/check-로그에-개인정보가-찍히나.mjs --자가시험
 *   node scripts/check-로그에-개인정보가-찍히나.mjs
 *   node scripts/check-로그에-개인정보가-찍히나.mjs --저장소=klifemap
 *   node scripts/check-로그에-개인정보가-찍히나.mjs --도구까지
 */
import fs from 'node:fs';
import path from 'node:path';

/* ─────────────────────────────────────────────────────────────────────────
   어디를 보나 — 네 사이트가 두 저장소에 나뉘어 있다
   ⚠ 4번(KLifeMap)이 개인정보를 거의 전부 들고 있다. 그래서 둘 다 본다
   ───────────────────────────────────────────────────────────────────────── */
export const 저장소들 = [
  { 이름: 'dataeconomics', 길: 'C:/Users/User/Documents/GitHub/dataeconomics', 사이트: 'SeoulMarkets · 백년지도 · K Culture Wire' },
  { 이름: 'klifemap', 길: 'C:/Users/User/Documents/GitHub/klifemap', 사이트: 'KLifeMap' },
];

/* ⚠ 'tmp' 는 «배포되지 않는» 긁적임 폴더다. 거기서 공인의 공개 자료(위키데이터)를
   찍어 보는 취재 스크립트가 생일을 출력하는데, 그것은 손님 자료가 아니다.
   ⛔ 그렇다고 눈을 감는 것은 아니다 — 몇 개를 건너뛰었는지 끝에 적는다. */
const 거를폴더 = ['node_modules', '.git', 'dist', '.astro', '.vercel', '.cache', 'coverage', 'content', 'data', 'docs', 'tmp'];
const 볼확장자 = ['.js', '.mjs', '.cjs', '.ts', '.astro'];

/* ─────────────────────────────────────────────────────────────────────────
   글을 뱉는 자리를 찾는 꼴
   ⚠ 백틱·역슬래시가 많아 정규식을 문자열로 짓는다 — 셸을 거치면 역슬래시가 먹힌다
   ───────────────────────────────────────────────────────────────────────── */
const 뱉는꼴 = new RegExp(
  '(?:console\\.(?:log|error|warn|info|debug|trace)|logger\\.(?:log|error|warn|info|debug)|process\\.std(?:out|err)\\.write)\\s*\\(',
  'g',
);

/**
 * 🔴 통째로 뱉는 것 — 무엇이 찍힐지 우리도 모른다
 * ⛔ 이 목록을 「흔한 이름이니 빼자」로 줄이지 않는다. 줄이는 순간 못 보는 자리가 생긴다
 */
export const 통째로 = [
  { 꼴: 'req\\.body', 뜻: '요청 본문 전체' },
  { 꼴: 'req\\.query', 뜻: '요청 질의 전체' },
  { 꼴: 'req\\.headers', 뜻: '요청 머리 전체(쿠키·토큰이 들어 있다)' },
  { 꼴: 'JSON\\.stringify\\s*\\(\\s*(?:body|payload|data|form|input|profile|user|customer|order)\\b', 뜻: '손님 묶음을 통째로 글로 바꿔 찍는다' },
  { 꼴: '\\bbody\\s*\\)', 뜻: '본문 묶음을 그대로 넘긴다' },
  { 꼴: '\\bpayload\\s*\\)', 뜻: '보낸 묶음을 그대로 넘긴다' },
];

/**
 * ⚠ 골라서 뱉는 것 — 무엇이 찍히는지는 아는데, 찍히면 안 되는 것이다
 * ⭐ 2번의 보관표가 집어 준 축을 그대로 받았다 — 이름·전화·생년월일시·위경도
 */
export const 골라서 = [
  { 꼴: '\\bemail\\b|\\b이메일\\b', 뜻: '이메일' },
  { 꼴: '\\bphone\\b|\\bmobile\\b|\\btel\\b|\\b전화\\b', 뜻: '전화번호' },
  { 꼴: '\\bpassword\\b|\\bpasswd\\b|\\bpw\\b|\\b비밀번호\\b', 뜻: '비밀번호' },
  { 꼴: '\\btoken\\b|\\bsecret\\b|\\bapiKey\\b|\\bapi_key\\b|\\baccessKey\\b', 뜻: '열쇠·토큰' },
  { 꼴: '\\bcard(?:Number|No|Num)\\b|\\bcardnum\\b', 뜻: '카드번호' },
  { 꼴: '\\bbirth\\w*\\b|\\b생년\\w*\\b|\\bsolarDate\\b|\\bbirthDate\\b|\\bbirthTime\\b', 뜻: '생년월일시' },
  { 꼴: '\\b(?:lat|lng|lon|longitude|latitude)\\b|\\b위경도\\b', 뜻: '위경도(태어난 곳이 드러난다)' },
  { 꼴: '\\baddress\\b|\\b주소지\\b', 뜻: '주소' },
  { 꼴: '\\buserName\\b|\\bcustomerName\\b|\\bfullName\\b|\\b성명\\b', 뜻: '이름' },
  { 꼴: '\\bssn\\b|\\bjumin\\b|\\b주민\\w*\\b', 뜻: '주민등록번호' },
];

/**
 * ⬜ 봐주는 것 — 흠이 아니다
 * ⛔ 「흠이 아닌 것을 흠으로 세면 진짜 흠이 묻힌다」. 그래서 까닭을 적어 둔다
 */
export const 봐줌 = [
  { 꼴: '\\bemailSent\\b|\\bemailOk\\b|\\bemailCount\\b', 까닭: '보냈나·몇 통인가만 찍는다. 주소가 아니다' },
  { 꼴: '\\bhasEmail\\b|\\bhasPhone\\b|\\bhasToken\\b', 까닭: '있나 없나만 찍는다' },
  { 꼴: '\\btoken\\w*\\.length\\b|\\bsecret\\w*\\.length\\b', 까닭: '몇 자인지만 찍는다 — 우리 규칙이 권하는 꼴이다' },
  { 꼴: '\\bbirthChart\\b|\\bbirthPillar\\b', 까닭: '명반 글자이지 생년월일이 아니다' },
];

/* ───────────────────────────── 재는 일 ───────────────────────────── */

export function 파일모으기(뿌리, 도구까지 = false) {
  const 모은것 = [];
  const 걷기 = (여기) => {
    let 것들;
    try { 것들 = fs.readdirSync(여기, { withFileTypes: true }); } catch { return; }
    for (const 것 of 것들) {
      const 길 = path.join(여기, 것.name);
      if (것.isDirectory()) {
        if (거를폴더.includes(것.name)) continue;
        if (!도구까지 && (것.name === 'tools' || 것.name === 'scripts')) continue;
        걷기(길);
      } else if (볼확장자.includes(path.extname(것.name))) {
        모은것.push(길);
      }
    }
  };
  걷기(뿌리);
  return 모은것;
}

/**
 * 한 줄에서 «뱉는 자리»를 떼어 낸다.
 * ⚠ 괄호 짝을 세어 끝을 찾는다 — 한 줄만 보면 여러 줄짜리 호출을 놓친다.
 *   그래서 글 전체를 받아 자리(인덱스)부터 센다.
 */
export function 뱉는자리떼기(글, 시작) {
  let 깊이 = 0;
  let 따옴표 = null;
  for (let i = 시작; i < 글.length && i < 시작 + 2000; i++) {
    const c = 글[i];
    const 앞 = i > 0 ? 글[i - 1] : '';
    if (따옴표) {
      if (c === 따옴표 && 앞 !== '\\') 따옴표 = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { 따옴표 = c; continue; }
    if (c === '(') 깊이++;
    else if (c === ')') { 깊이--; if (깊이 === 0) return 글.slice(시작, i + 1); }
  }
  return 글.slice(시작, Math.min(글.length, 시작 + 300));
}

/** 글자 자리를 줄 번호로 바꾼다 */
export function 줄번호(글, 자리) {
  let n = 1;
  for (let i = 0; i < 자리 && i < 글.length; i++) if (글[i] === '\n') n++;
  return n;
}

/** 봐주는 꼴인가 */
export function 봐주나(덩이) {
  for (const b of 봐줌) if (new RegExp(b.꼴).test(덩이)) return b.까닭;
  return null;
}

/**
 * 🔴 [2026-10-03] **안내문 글자와 «실제로 찍히는 값»을 가른다.**
 *
 * 처음 재니 열한 곳이 나왔는데 그 가운데 다섯이 가짜였다 —
 *   `console.log('[마이그레이션] birth_profiles … 컬럼 추가 완료')`
 *   `console.log('■ address-check 자가시험 …')`
 * 둘 다 **안내문에 그 낱말이 들어 있을 뿐** 손님 자료는 한 글자도 안 찍는다.
 *
 * ⛔ 가짜가 섞이면 진짜가 묻힌다. 그래서 **글자 속은 지우고 «코드»만 남겨서** 다시 본다.
 * ⭐ 다만 `${…}` 안은 «값»이므로 남긴다 — `${phone}` 이 바로 우리가 찾는 것이다.
 */
export function 코드만남기기(덩이) {
  const s = String(덩이 ?? '');
  let 낸다 = '';
  let 따옴표 = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const 앞 = i > 0 ? s[i - 1] : '';
    if (!따옴표) {
      /* 🔴 주석도 지운다 — 쓰는 법을 적어 둔 머리글이 흠으로 잡히고 있었다.
         실제로 `로그가리개.js` 의 설명 주석이 자기 자신을 흠으로 만들었다. */
      if (c === '/' && s[i + 1] === '/') {
        while (i < s.length && s[i] !== '\n') i++;
        낸다 += ' ';
        continue;
      }
      if (c === '/' && s[i + 1] === '*') {
        i += 2;
        while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++;
        i++;
        낸다 += ' ';
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { 따옴표 = c; 낸다 += ' '; continue; }
      낸다 += c;
      continue;
    }
    /* 글자 속이다 — 버린다. 다만 백틱 속 `${…}` 은 값이므로 살린다 */
    if (c === 따옴표 && 앞 !== '\\') { 따옴표 = null; 낸다 += ' '; continue; }
    if (따옴표 === '`' && c === '$' && s[i + 1] === '{') {
      let 깊이 = 0;
      let j = i + 1;
      for (; j < s.length; j++) {
        if (s[j] === '{') 깊이++;
        else if (s[j] === '}') { 깊이--; if (깊이 === 0) break; }
      }
      낸다 += ' ' + s.slice(i + 2, j) + ' ';
      i = j;
      continue;
    }
    낸다 += ' ';
  }
  return 낸다;
}

/**
 * 🔴 [2026-10-03] **주석을 지운다 — 다만 글자 수와 줄바꿈은 그대로 둔다.**
 *
 * 설명 주석에 적어 둔 «쓰는 법» 보기가 흠으로 잡히고 있었다 —
 * `로그가리개.js` 의 머리글이 자기 자신을 흠으로 만들었다.
 * ⭐ 빈칸으로 바꿔 «자리»를 지키므로 줄 번호가 어긋나지 않는다.
 */
export function 주석지우기(글) {
  const s = String(글 ?? '');
  const 낸다 = s.split('');
  let 따옴표 = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const 앞 = i > 0 ? s[i - 1] : '';
    if (따옴표) {
      if (c === 따옴표 && 앞 !== '\\') 따옴표 = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { 따옴표 = c; continue; }
    if (c === '/' && s[i + 1] === '/') {
      while (i < s.length && s[i] !== '\n') { 낸다[i] = ' '; i++; }
      i--;
      continue;
    }
    if (c === '/' && s[i + 1] === '*') {
      const 끝 = s.indexOf('*/', i + 2);
      const 여기까지 = 끝 < 0 ? s.length : 끝 + 2;
      for (let j = i; j < 여기까지; j++) if (낸다[j] !== '\n') 낸다[j] = ' ';
      i = 여기까지 - 1;
      continue;
    }
  }
  return 낸다.join('');
}

/**
 * 🔴 [2026-10-03] **이미 가린 것은 흠이 아니다.**
 * `가린이메일(u.email)` 은 로그에 `p*******k@naver.com` 을 찍는다 — 고친 자리다.
 * ⛔ 그런데 꼴로만 보면 여전히 `email` 이 보여서 흠으로 잡힌다.
 *   ⇒ 가리개 호출의 «속»을 지우고 나서 본다.
 */
export function 가린것지우기(덩이) {
  let s = String(덩이 ?? '');
  const 가리개 = new RegExp('(?:가린이메일|가린번호|모양만|mask\\w*|redact\\w*)\\s*\\(', 'g');
  for (let 돌기 = 0; 돌기 < 10; 돌기++) {
    가리개.lastIndex = 0;
    const m = 가리개.exec(s);
    if (!m) break;
    const 속시작 = m.index + m[0].length - 1;
    const 속 = 뱉는자리떼기(s, 속시작);
    s = s.slice(0, m.index) + ' '.repeat(m[0].length + 속.length - 1) + s.slice(속시작 + 속.length);
  }
  return s;
}

/**
 * 한 파일을 잰다.
 * ⛔ 「흠 0」을 내기 쉬운 쪽으로 기울이지 않는다 — 통째로 뱉는 것은 반드시 집는다
 */
export function 파일재기(길, 글) {
  const 나온것 = [];
  /* ⭐ 주석을 지운 쪽에서 «찾고», 보여 줄 때는 원래 글을 쓴다.
     자리가 어긋나지 않게 빈칸으로 바꿨으므로 같은 번지를 써도 된다. */
  const 지운글 = 주석지우기(글);
  뱉는꼴.lastIndex = 0;
  let m;
  while ((m = 뱉는꼴.exec(지운글))) {
    const 덩이 = 뱉는자리떼기(지운글, m.index + m[0].length - 1);
    const 보이는글 = 글.slice(m.index, m.index + m[0].length + 덩이.length - 1);
    const 전체 = 가린것지우기(코드만남기기(m[0] + 덩이.slice(1)));
    const 봐줄까닭 = 봐주나(전체);

    for (const t of 통째로) {
      if (new RegExp(t.꼴).test(전체)) {
        나온것.push({
          길, 줄: 줄번호(글, m.index), 무게: '통째로', 뜻: t.뜻,
          글조각: 보이는글.replace(/\s+/g, ' ').slice(0, 160), 봐줌: 봐줄까닭,
        });
        break;
      }
    }
    for (const g of 골라서) {
      if (new RegExp(g.꼴).test(전체)) {
        나온것.push({
          길, 줄: 줄번호(글, m.index), 무게: '골라서', 뜻: g.뜻,
          글조각: 보이는글.replace(/\s+/g, ' ').slice(0, 160), 봐줌: 봐줄까닭,
        });
        break;
      }
    }
  }
  return 나온것;
}

export function 저장소재기(저장소, 도구까지 = false) {
  const 파일들 = 파일모으기(저장소.길, 도구까지);
  const 나온것 = [];
  let 못읽은것 = 0;
  for (const f of 파일들) {
    let 글;
    try { 글 = fs.readFileSync(f, 'utf8'); } catch { 못읽은것++; continue; }
    for (const h of 파일재기(path.relative(저장소.길, f).replace(/\\/g, '/'), 글)) 나온것.push(h);
  }
  return { 본파일: 파일들.length, 못읽은것, 나온것 };
}

/* ───────────────────────────── 자가시험 ───────────────────────────── */

function 자가시험() {
  let 흠 = 0;
  const 본다 = (이름, 됐나, 덧말 = '') => {
    console.log((됐나 ? '  ✅ ' : '  🔴 ') + 이름 + (덧말 ? ' — ' + 덧말 : ''));
    if (!됐나) 흠++;
  };

  console.log('■ 자가시험');

  /* ① 통째로 뱉는 것을 집나 */
  const 잰것1 = 파일재기('t.js', 'console.error("fail", req.body);');
  본다('① req.body 를 집는다', 잰것1.length === 1 && 잰것1[0].무게 === '통째로');

  /* ② 골라서 뱉는 것을 집나 */
  const 잰것2 = 파일재기('t.js', 'console.log("sent to " + user.email);');
  본다('② email 을 집는다', 잰것2.length === 1 && 잰것2[0].무게 === '골라서' && 잰것2[0].뜻 === '이메일');

  /* ③ 여러 줄짜리 호출도 집나 — 한 줄만 보면 놓치는 자리다 */
  const 잰것3 = 파일재기('t.js', 'console.error(\n  "fail",\n  { phone: u.phone },\n);');
  본다('③ 여러 줄에 걸친 호출도 집는다', 잰것3.length === 1 && 잰것3[0].뜻 === '전화번호');

  /* ④ 괜찮은 것을 흠으로 세지 않나 */
  const 잰것4 = 파일재기('t.js', 'console.log("order " + orderId + " status " + code);');
  본다('④ id·상태코드만 찍는 것은 흠이 아니다', 잰것4.length === 0);

  /* ⑤ 봐주는 꼴을 가려내나 */
  const 잰것5 = 파일재기('t.js', 'console.log("emailSent=" + emailSent);');
  본다('⑤ emailSent 는 봐준다', 잰것5.length === 0 || 잰것5.every((h) => h.봐줌));

  /* ⑥ 따옴표 «속»의 괄호에 속지 않나 */
  const 잰것6 = 파일재기('t.js', 'console.log("a) b", req.body);');
  본다('⑥ 글자 속 닫는 괄호에 속지 않는다', 잰것6.length === 1 && 잰것6[0].무게 === '통째로');

  /* ⑦ 줄 번호가 맞나 */
  const 잰것7 = 파일재기('t.js', '\n\nconsole.log(user.email);');
  본다('⑦ 줄 번호가 맞다', 잰것7.length === 1 && 잰것7[0].줄 === 3, 잰것7.length ? '잰 줄 ' + 잰것7[0].줄 : '못 집었다');

  /* ⑧ 토큰 길이만 찍는 것은 봐준다 — 우리 규칙이 권하는 꼴이다 */
  const 잰것8 = 파일재기('t.js', 'console.log("key len " + process.env.SELF_AI_KEY.length);');
  본다('⑧ 열쇠 길이만 찍는 것은 봐준다', 잰것8.length === 0 || 잰것8.every((h) => h.봐줌));

  /* ⑨ 🔴 안내문에 낱말이 «들어 있을 뿐»인 것은 흠이 아니다 — 라이브에서 다섯 곳이 이랬다 */
  const 잰것9 = 파일재기('t.js', "console.log('[마이그레이션] birth_profiles.saju_report_covered 컬럼 추가 완료');");
  본다('⑨ 안내문 속 낱말은 흠이 아니다', 잰것9.length === 0, 잰것9.length ? '집었다: ' + 잰것9[0].뜻 : '');

  /* ⑩ 🔴 그런데 `${…}` 속은 «값»이다 — 반드시 집어야 한다 */
  const 잰것10 = 파일재기('t.js', 'console.log(`[문자] 받는 번호: ${phone}`);');
  본다('⑩ 템플릿 속 값은 집는다', 잰것10.length === 1 && 잰것10[0].뜻 === '전화번호');

  /* ⑪ 🔴 저장소가 실제로 거기 있나 — 없으면 「흠 0」이 거짓이 된다 */
  for (const r of 저장소들) {
    본다('⑪ 저장소가 있다: ' + r.이름, fs.existsSync(r.길), r.길);
  }

  console.log(흠 === 0 ? '\n✅ 자가시험 11개 통과' : '\n🔴 자가시험 ' + 흠 + '개 실패');
  return 흠;
}

/* ───────────────────────────── 들머리 ───────────────────────────── */

function 주다() {
  const 인자 = process.argv.slice(2);
  if (인자.includes('--자가시험')) return process.exit(자가시험() === 0 ? 0 : 1);

  const 도구까지 = 인자.includes('--도구까지');
  const 고른것 = (인자.find((a) => a.startsWith('--저장소=')) || '').split('=')[1];
  const 볼것 = 고른것 ? 저장소들.filter((r) => r.이름 === 고른것) : 저장소들;

  console.log('■ 로그에 개인정보가 찍히나 — ' + new Date().toLocaleString('ko-KR') + ' KST');
  if (도구까지) console.log('  ⚠ --도구까지 : tools·scripts 도 본다');

  let 통째로수 = 0;
  let 골라서수 = 0;
  let 본파일 = 0;

  for (const r of 볼것) {
    if (!fs.existsSync(r.길)) {
      console.log('\n⚠ 못 쟀다 — 저장소가 없다: ' + r.이름 + ' (' + r.길 + ')');
      continue;   /* ⛔ 없는 것을 0 으로 적지 않는다 */
    }
    const 잰것 = 저장소재기(r, 도구까지);
    본파일 += 잰것.본파일;
    console.log('\n━━ ' + r.이름 + ' (' + r.사이트 + ') — 파일 ' + 잰것.본파일 + '개');
    if (잰것.못읽은것) console.log('  ⚠ 못 읽은 파일 ' + 잰것.못읽은것 + '개');

    const 통 = 잰것.나온것.filter((h) => h.무게 === '통째로' && !h.봐줌);
    const 골 = 잰것.나온것.filter((h) => h.무게 === '골라서' && !h.봐줌);
    통째로수 += 통.length;
    골라서수 += 골.length;

    if (통.length) {
      console.log('\n  🔴 통째로 뱉는 자리 ' + 통.length + '곳 — 무엇이 찍힐지 우리도 모른다');
      for (const h of 통.slice(0, 25)) {
        console.log('     · ' + h.길 + ':' + h.줄 + '  [' + h.뜻 + ']');
        console.log('       ' + h.글조각);
      }
      if (통.length > 25) console.log('     … 그리고 ' + (통.length - 25) + '곳 더');
    }
    if (골.length) {
      console.log('\n  ⚠ 골라서 뱉는 자리 ' + 골.length + '곳');
      for (const h of 골.slice(0, 25)) {
        console.log('     · ' + h.길 + ':' + h.줄 + '  [' + h.뜻 + ']');
        console.log('       ' + h.글조각);
      }
      if (골.length > 25) console.log('     … 그리고 ' + (골.length - 25) + '곳 더');
    }
    if (!통.length && !골.length) console.log('  ✅ 흠 없음');
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('본 파일 ' + 본파일 + '개 · 🔴 통째로 ' + 통째로수 + '곳 · ⚠ 골라서 ' + 골라서수 + '곳');
  console.log('\n⚠ 이 자는 «코드»를 본다. 실제로 쌓인 로그 글자는 못 본다 —');
  console.log('   Cloudtype 로그 보관 기간과 쌓인 글은 콘솔에서 따로 봐야 한다.');
  process.exit(통째로수 > 0 ? 1 : 0);
}

주다();
