#!/usr/bin/env node
/**
 * check-asked-boss-before-searching.mjs — **찾아보지 않고 사장님께 물었나**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 [2026-09-08 저녁] 6번이 사장님께 이렇게 여쭈었다 —
 *   「한경컨센서스 623건 … 지금 다시 돌려서 최신화할까요, 아니면 **이걸로 뭘 만들지부터 정할까요?**」
 *
 *   사장님 (원문):
 *     「증권사 애널리스트 리포트로 뭘 하려고 하는 지를 나한테 진정 묻는거니? 어이가 없네」
 *     「몇 달전부터 증권사 애널 리포트 구해달라고 생 난리를 쳐 놓고는 물어」
 *     「투자AI용 데이터 수집을 하기 위해 모두의 창업 지원서에도 네가 써넣었잖아」
 *
 *   ⭐ 쓰임새는 **이미 우리 문서에 적혀 있었다.** 지원서에 「GPU 는 애널리스트 판독층이
 *     뉴스·공시·리포트를 읽어 신호로 만드는 데 쓴다」고 6번이 직접 써 넣었고,
 *     `scripts/invest-ai/signal-store.mjs` 라는 신호저장소도 이미 있었다.
 *   ⛔ 그러니 그 물음은 「모르겠습니다」가 아니라 **「찾아보지 않았습니다」**였다.
 *
 * 🔴 사장님이 저(5번·총괄대행)에게 못박으신 것:
 *     「**이런 일이 어떤 세션에서도, 어떤 유닛에서도 이뤄지지 않게 하라**」
 *
 * ⭐ 강령 넷째 줄이 이 자의 근거다 — 「규칙은 문장이 아니라 검사로 둔다.
 *   말로 하는 규칙은 잊힌다. 사람이 기억해서 지키는 구조를 만들지 않는다.」
 *   ⚠ 실제로 6번의 화면 아래 고정칸에는 「스스로 할 일을 찾아 쉼 없이 만드는 것」이
 *     적혀 있었는데 그날 「뭘 만들까요」를 물었다. 사장님: 「이건 밑에 왜 적어놨는데, 폼이냐?」
 *     ⇒ **적어 두는 것으로는 안 막힌다.** 그래서 자로 만든다.
 *
 * [무엇을 재나]
 *   메모(docs/세션간-메모.md · klifemap/docs/1번-4번-메모.md)의 «오늘 줄»에서
 *   사장님께 던진 «묻는 말»을 찾고, 그 물음의 낱말로 저장소를 훑어
 *   **이미 답이 있는지** 함께 보여 준다.
 *
 * ⛔ 세우지 않는다(exit 0). 물어야 할 것도 있다 — 돈이 오가는 것은 여쭙는 것이 «맞다».
 *   이 자는 「이미 답이 있는데 물었다」를 눈에 띄게 해 주는 것이 일이다.
 *
 * 쓰는 법
 *   node scripts/check-asked-boss-before-searching.mjs
 *   node scripts/check-asked-boss-before-searching.mjs --물음 "애널 리포트로 뭘 만들까"
 *   node scripts/check-asked-boss-before-searching.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(import.meta.dirname, '..');
const 메모들 = [
  path.join(뿌리, 'docs/세션간-메모.md'),
  path.resolve(뿌리, '../klifemap/docs/1번-4번-메모.md'),
];

/**
 * 사장님께 «여쭙는 말»인가.
 * ⛔ 물음표만으로 잡지 않는다 — 유닛끼리 묻는 것은 이 자가 말릴 일이 아니다.
 *   사장님을 가리키거나, 승인·선택을 청하는 꼴일 때만 잡는다.
 */
export function 사장님께여쭌말인가(줄) {
  const s = String(줄 ?? '');
  /* ⚠ 물음표가 «없는» 물음도 잡아야 한다 — 「~해도 되겠습니까」에는 물음표를 안 붙이는 일이 많다.
     🔴 첫 판이 이것을 놓쳤다(자가시험이 잡아 줬다). 관문 낱말에 빠져 있었다. */
  if (!/[?？]/.test(s)
    && !/할까요|하시겠|여쭙|여쭤|받고\s*보내|승인|골라\s*주|정해\s*주|되겠습니까|되나요|되겠나요|괜찮으실|어떨까/.test(s)) return false;
  /* 사장님을 가리키나 — 또는 승인·선택을 청하는 꼴인가 */
  const 사장님가리킴 = /사장님|보스|대표님/.test(s);
  const 승인청함 = /할까요|하시겠어요|하시겠습니까|여쭙|여쭤보|승인받|골라\s*주십|정해\s*주십|괜찮으실|해도\s*되(겠습니까|나요)/.test(s);
  return 사장님가리킴 || 승인청함;
}

/**
 * 「돈이 오가는 것」이라 «여쭙는 것이 맞는» 물음인가.
 * ⭐ 사장님이 정하신 승인 대상은 딱 다섯이다 — 입금·출금·결제·결제취소·환불.
 * ⛔ 이것을 잡으면 「물어도 되는 것」까지 잡는 자가 된다. 그러면 사람이 이 검사를 끈다.
 */
export function 여쭤도되는것인가(줄) {
  return /입금|출금|결제|환불|청구|카드|계좌|송금|지급|요금제|구독료|광고비/.test(String(줄 ?? ''));
}

/** 물음에서 찾을 낱말을 뽑는다. ⛔ 흔한 말은 버린다 — 다 걸리면 아무것도 못 가린다 */
export function 낱말뽑기(물음) {
  const 버릴말 = new Set([
    '뭘', '무엇', '어떤', '어떻게', '지금', '다시', '이걸로', '이것', '그것', '저것', '할까요',
    '하시겠어요', '하시겠습니까', '만들지', '만들까', '정할까요', '아니면', '그리고', '해서',
    '사장님', '보스', '대표님', '입니다', '합니다', '있습니다', '없습니다', '것', '수', '때',
    '먼저', '부터', '까지', '에서', '으로', '하고', '보다', '위해', '대해', '통해',
  ]);
  return [...new Set(
    String(물음 ?? '')
      .replace(/[^0-9A-Za-z가-힣\s]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 2 && !버릴말.has(w))
      .map((w) => w.replace(/(으로|에서|에게|께서|께|을|를|이|가|은|는|의|도|만|와|과|로)$/, ''))
      .filter((w) => w.length >= 2 && !버릴말.has(w)),
  )];
}

/** 저장소에 이미 그 낱말이 적힌 곳이 있나. ⛔ 없으면 「없다」가 아니라 「못 찾았다」다 */
export function 이미적힌곳(낱말들, { 훑기 = 기본훑기 } = {}) {
  const 답 = [];
  for (const w of 낱말들) {
    const 곳들 = 훑기(w);
    if (곳들.length) 답.push({ 낱말: w, 곳: 곳들.slice(0, 3), 몇곳: 곳들.length });
  }
  답.sort((a, b) => b.몇곳 - a.몇곳);
  return 답;
}

function 기본훑기(낱말) {
  const 볼곳 = [path.join(뿌리, 'docs'), path.join(뿌리, 'scripts')];
  const 답 = [];
  const 훑자 = (디렉터리, 깊이 = 0) => {
    if (깊이 > 2 || 답.length > 60) return;
    let 것들;
    try { 것들 = fs.readdirSync(디렉터리, { withFileTypes: true }); } catch { return; }
    for (const e of 것들) {
      if (답.length > 60) return;
      const p = path.join(디렉터리, e.name);
      if (e.isDirectory()) { 훑자(p, 깊이 + 1); continue; }
      if (!/\.(md|mjs|js|json|txt)$/.test(e.name)) continue;
      /* ⭐ 이름에 들어 있으면 그것부터 — 이름이 맞으면 그 문서가 그 주제다 */
      if (e.name.includes(낱말)) { 답.push(path.relative(뿌리, p)); continue; }
      let 글;
      try { 글 = fs.readFileSync(p, 'utf8'); } catch { continue; }
      if (글.includes(낱말)) 답.push(path.relative(뿌리, p));
    }
  };
  for (const d of 볼곳) 훑자(d);
  return 답;
}

/** 오늘 날짜(KST). ⛔ toISOString 은 UTC 라 새벽에 하루 어긋난다 */
export function 오늘KST(때 = new Date()) {
  const y = 때.getFullYear();
  const m = String(때.getMonth() + 1).padStart(2, '0');
  const d = String(때.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 메모에서 «오늘» 덩이만 뽑는다 — 어제 물은 것을 오늘 또 잡지 않는다 */
export function 오늘줄들(글, 오늘 = 오늘KST()) {
  const 줄 = String(글 ?? '').split(/\r?\n/);
  const 짧은날 = `${Number(오늘.slice(5, 7))}/${Number(오늘.slice(8, 10))}`;
  const 답 = [];
  let 오늘안에 = false;
  for (const l of 줄) {
    if (/^##+\s*\[/.test(l) || /^\[진행\]/.test(l)) {
      오늘안에 = l.includes(오늘) || l.includes(짧은날) || l.includes(`(9/${Number(오늘.slice(8, 10))})`);
    }
    if (오늘안에) 답.push(l);
  }
  return 답;
}

const 내가입구인가 = !!process.argv[1]
  && process.argv[1].split(/[\\/]/).pop() === new URL(import.meta.url).pathname.split('/').pop();

if (내가입구인가 && process.argv.includes('--자가시험')) {
  const 시험 = [];
  const 재다 = (이름, 참) => 시험.push([이름, !!참]);

  /* 🔴 6번이 실제로 던진 그 물음 — 시험으로 굳힌다 */
  재다('실제로 나온 물음을 잡는다',
    사장님께여쭌말인가('지금 다시 돌려서 최신화할까요, 아니면 이걸로 뭘 만들지부터 정할까요?'));
  재다('「보내드릴까요」 꼴도 잡는다',
    사장님께여쭌말인가('이메일 본문으로 써서 보내드릴까요, 아니면 사장님이 직접 보내시겠어요?'));
  재다('「해도 되겠습니까」도 잡는다', 사장님께여쭌말인가('제가 직접 확인해도 되겠습니까'));
  /* ⛔ 유닛끼리 묻는 것은 말리지 않는다 */
  재다('유닛끼리 묻는 것은 안 잡는다',
    !사장님께여쭌말인가('6번께 — 18곳 목록을 메모에 적어 주시면 제 12곳과 맞춰 보겠습니다'));
  재다('그냥 서술문은 안 잡는다', !사장님께여쭌말인가('623건을 받았고 폴더를 눈으로 확인했다'));

  /* ⭐ 돈이 오가는 것은 여쭙는 것이 «맞다» */
  재다('결제 물음은 여쭤도 되는 것으로 가른다', 여쭤도되는것인가('구독 결제를 진행해도 될까요'));
  재다('환불 물음도 같다', 여쭤도되는것인가('환불 처리를 해도 되겠습니까'));
  재다('쓰임새 물음은 여쭤도 되는 것이 아니다',
    !여쭤도되는것인가('이 리포트로 뭘 만들지부터 정할까요'));

  const w = 낱말뽑기('증권사 애널리스트 리포트로 뭘 만들까요');
  재다('낱말뽑기 — 뜻 있는 낱말이 남는다', w.includes('증권사') && w.includes('리포트'));
  재다('낱말뽑기 — 「뭘」·「할까요」는 버린다', !w.includes('뭘') && !w.includes('할까요'));
  재다('낱말뽑기 — 조사를 뗀다', 낱말뽑기('리포트를 신호로').includes('리포트'));

  const 가짜훑기 = (w2) => (w2 === '리포트' ? ['docs/지원-모두의창업.md', 'scripts/invest-ai/signal-store.mjs'] : []);
  const r = 이미적힌곳(['리포트', '없는낱말'], { 훑기: 가짜훑기 });
  재다('이미적힌곳 — 있는 것만 낸다', r.length === 1 && r[0].낱말 === '리포트');
  재다('이미적힌곳 — 곳을 함께 낸다', r[0].곳.length === 2);

  재다('오늘KST — 열 글자', 오늘KST(new Date(2026, 8, 8)) === '2026-09-08');
  /* ⚠ toISOString 은 UTC 다 — 새벽 0시 30분에 하루 어긋나는 것을 시험으로 막는다 */
  재다('오늘KST — 새벽 0시 30분에도 그날', 오늘KST(new Date(2026, 8, 8, 0, 30)) === '2026-09-08');

  const 메모보기 = [
    '## [5번] 2026-09-07 어제 것',
    '어제 물음: 이렇게 할까요?',
    '## [6번] 2026-09-08 오늘 것',
    '오늘 물음: 사장님, 이걸로 뭘 만들까요?',
  ].join('\n');
  const 오늘것 = 오늘줄들(메모보기, '2026-09-08');
  재다('오늘줄들 — 어제 덩이는 안 가져온다', !오늘것.some((l) => l.includes('어제 물음')));
  재다('오늘줄들 — 오늘 덩이는 가져온다', 오늘것.some((l) => l.includes('오늘 물음')));

  const 틀린것 = 시험.filter(([, ok]) => !ok);
  for (const [이름, ok] of 시험) console.log(`  ${ok ? '✅' : '⛔'} ${이름}`);
  console.log(`\n자가시험 ${시험.length}건 · 어긋난 것 ${틀린것.length}건`);
  process.exit(틀린것.length ? 1 : 0);
}

if (내가입구인가) {
  const i = process.argv.indexOf('--물음');
  if (i > 0) {
    /* 여쭙기 «전에» 스스로 돌려 보는 길 */
    const 물음 = process.argv.slice(i + 1).join(' ');
    console.log(`물음: ${물음}\n`);
    if (여쭤도되는것인가(물음)) {
      console.log('⭐ 돈이 오가는 것으로 보입니다 — 이것은 «여쭙는 것이 맞습니다».');
      console.log('   사장님이 정하신 승인 대상: 입금 · 출금 · 결제 · 결제취소 · 환불\n');
    }
    const 있는것 = 이미적힌곳(낱말뽑기(물음));
    if (!있는것.length) { console.log('⬜ 저장소에서 관련된 곳을 «못 찾았습니다» (없다는 뜻이 아닙니다)'); process.exit(0); }
    console.log('🔴 저장소가 이미 이것을 말하고 있습니다 — 여쭙기 전에 여기를 보십시오');
    for (const x of 있는것.slice(0, 6)) console.log(`   「${x.낱말}」 ${x.몇곳}곳 — ${x.곳.join(' · ')}`);
    console.log('\n⛔ 「이걸로 뭘 만들까요」를 사장님께 묻지 않습니다. 그 물음 자체가 안 찾아본 증거입니다.');
    process.exit(0);
  }

  const 걸린것 = [];
  for (const p of 메모들) {
    let 글;
    try { 글 = fs.readFileSync(p, 'utf8'); } catch { continue; }
    for (const l of 오늘줄들(글)) {
      const t = l.trim();
      if (!t || t.startsWith('⛔') || t.startsWith('⚠') || t.startsWith('#')) continue;
      if (!사장님께여쭌말인가(t)) continue;
      if (여쭤도되는것인가(t)) continue;
      걸린것.push({ 파일: path.basename(p), 줄: t.slice(0, 110) });
    }
  }

  console.log('찾아보지 않고 사장님께 물었나 — 오늘 메모를 훑는다');
  if (!걸린것.length) {
    console.log('✅ 오늘 메모에 사장님께 던진 «찾아보면 될 물음»이 없다');
    process.exit(0);
  }
  for (const x of 걸린것.slice(0, 12)) {
    console.log(`\n  ⚠ ${x.파일}\n     ${x.줄}`);
    const 있는것 = 이미적힌곳(낱말뽑기(x.줄));
    if (있는것.length) {
      console.log('     🔴 저장소가 이미 말하고 있다 —');
      for (const y of 있는것.slice(0, 3)) console.log(`        「${y.낱말}」 ${y.몇곳}곳 — ${y.곳.slice(0, 2).join(' · ')}`);
    } else {
      console.log('     ⬜ 저장소에서 관련된 곳을 못 찾았다 — 이것은 여쭐 만한 물음일 수 있다');
    }
  }
  console.log(`\n⚠ ${걸린것.length}건. ⛔ 이 자는 세우지 않는다 — 물어야 할 것도 있다.`);
  console.log('   ⭐ 다만 「저장소가 이미 말하고 있다」가 붙은 것은 «찾아보지 않은 것»이다.');
  process.exit(0);
}
