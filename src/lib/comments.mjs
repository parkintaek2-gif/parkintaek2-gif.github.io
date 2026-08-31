/**
 * comments.mjs — **자체 댓글(논쟁) 기능.** 사장님 지시(2026-08-31):
 * 「우리 자체 댓글 서비스를 만들어라... 만든 다음에 모든 유닛이 이용하도록 해라.
 *   논쟁꺼리를 우리가 만든다. 거기에 댓글을 붙일 수 있는 기능을 붙인다」
 *
 * ── 왜 Giscus·Disqus 같은 3자 위젯이 아닌가 ──────────────────────
 * 그 위젯들은 쿠키·방문자 IP를 자기 서버에 남긴다. 우리 사이트 정책(2026-08-05,
 * 「쿠키·IP를 우리가 따로 남기지 않는다」)과 정면으로 부딪힌다. 그래서 자체로 짠다 —
 * **저장하는 값에 IP·쿠키·세션ID가 한 글자도 안 들어간다.**
 *
 * ── 어떻게 스팸을 막나 (IP 없이) ─────────────────────────────────
 * ① 벌집(honeypot) — 화면엔 안 보이는 입력칸을 하나 두고, 그게 채워져 오면 봇으로 본다.
 * ② 최소 체류시간 — 폼을 연 시각(clientOpenedAt, 손님 시계값을 그대로 믿지 않고
 *    서버 시각과의 격차만 본다)에서 3초 안에 온 요청은 막는다. 사람은 그렇게 못 친다.
 * ③ 길이 제한 — 이름 40자·본문 2,000자.
 * ④ 세 사이트 전체에 걸린 **분당 전체 한도**(IP별이 아니라 서버 전체 카운터) —
 *    IP를 안 쓰므로 개인별로는 못 가르고, 대신 초당 폭주 자체를 막는다.
 *
 * ── 저장 ─────────────────────────────────────────────────────
 * 페이지 하나당 파일 하나(`raw/comments/<page>.json`, 이미 있는 store.mjs 를 그대로 씀).
 * 읽고-더하고-쓰는 방식이라 아주 드물게 동시 요청이 겹치면 하나가 씹힐 수 있다 —
 * subscriber 명단(klifemap)과 같은 자리에서 같은 값을 치른 것과 같은 결이다.
 * 댓글 몇 개가 아주 드물게 늦게 반영되는 것이, 그걸 막으려 IP·세션을 쥐는 것보다 낫다.
 *
 * 저장하는 칸 — 시각(서버시각) · 이름(손님이 적은 것, 없으면 "손님") · 본문 · id.
 * **그게 전부다.** IP·쿠키·User-Agent·이메일 어느 것도 안 남는다.
 *
 * node src/lib/comments.mjs --selftest
 */
'use strict';
import { randomUUID, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { put, get } from './store.mjs';

const 이름최대 = 40;
const 본문최대 = 2000;
const 최소체류밀리초 = 3000;
const 분당전체한도 = 30; /* IP별로 못 가르니 서버 전체로 거칠게 막는다. 늘려야 하면 여기만 고친다 */

/* ⚠ 페이지 키를 그대로 파일 경로에 쓰지 않는다 — 손님이 페이지 이름에 `../`를 넣어
 *   보낼 수 있다. 해시로 한 번 접어 폴더 탈출을 원천 차단한다. */
function 페이지열쇠(page) {
  const 정리 = String(page ?? '').slice(0, 300);
  const 해시 = createHash('sha256').update(정리).digest('hex').slice(0, 24);
  return `raw/comments/${해시}.json`;
}

/* ⚠ 못 잰 건 못 쟀다고 — 배열이 아니거나 깨진 파일이면 빈 배열로 접고, 던지지 않는다.
 *   댓글 하나 못 읽는다고 페이지 전체가 죽으면 안 된다. */
async function 읽기(page) {
  const raw = await get(페이지열쇠(page)).catch(() => null);
  if (!raw) return [];
  try {
    const j = JSON.parse(raw.toString('utf8'));
    return Array.isArray(j) ? j : [];
  } catch {
    return [];
  }
}

/** 서버 전체 분당 한도 — IP가 없어 사람별로 못 가르니 거칠게라도 막는다 */
let 최근분 = null;
let 최근분횟수 = 0;
function 한도넘었나() {
  const 지금분 = Math.floor(Date.now() / 60000);
  if (최근분 !== 지금분) { 최근분 = 지금분; 최근분횟수 = 0; }
  최근분횟수 += 1;
  return 최근분횟수 > 분당전체한도;
}

/** 아주 뻔한 스팸 낱말만 거른다 — 판정하지 않는다는 원칙과 별개로, 광고성 링크
 *  도배는 「논쟁」이 아니라 잡음이라 최소한만 막는다. */
const 뻔한스팸 = /viagra|https?:\/\/[^\s]+\.(ru|cn|tk)\b|(카지노|토토사이트)/i;

/**
 * 댓글 하나를 등록한다.
 * @param {{page:string, name?:string, body:string, honeypot?:string, openedAt?:number}} 입력
 * @returns {{ok:boolean, code?:number, why?:string, comment?:object}}
 */
export async function 등록({ page, name, body, honeypot, openedAt } = {}) {
  if (honeypot) return { ok: false, code: 400, why: '봇으로 판정됨' };
  if (!page || typeof page !== 'string') return { ok: false, code: 400, why: 'page가 없습니다' };
  const 본문 = String(body ?? '').trim();
  if (!본문) return { ok: false, code: 400, why: '본문이 비어 있습니다' };
  if (본문.length > 본문최대) return { ok: false, code: 400, why: `본문은 ${본문최대}자를 넘을 수 없습니다` };

  /* 폼을 연 시각(손님 브라우저 값)이 있으면, 서버 시각과 견줘 너무 빠른 제출을 막는다.
     ⚠ 손님 시계를 믿는 게 아니라 "그 값이 있는데도 격차가 음수거나 지나치게 크면" 무시하고
        넘어간다 — 시계가 안 맞는 손님을 억울하게 막지 않는다. */
  if (typeof openedAt === 'number') {
    const 격차 = Date.now() - openedAt;
    if (격차 >= 0 && 격차 < 최소체류밀리초) return { ok: false, code: 429, why: '너무 빠른 제출' };
  }

  if (한도넘었나()) return { ok: false, code: 429, why: '지금 댓글이 몰리고 있습니다. 잠시 후 다시 시도해 주세요' };

  const 이름 = String(name ?? '').trim().slice(0, 이름최대) || '손님';
  if (뻔한스팸.test(이름) || 뻔한스팸.test(본문)) return { ok: false, code: 400, why: '스팸으로 판정됨' };

  const 댓글 = {
    id: randomUUID(),
    name: 이름,
    body: 본문,
    at: new Date().toISOString(),
  };

  const 목록 = await 읽기(page);
  목록.push(댓글);
  /* ⚠ 무한정 안 쌓는다 — 한 페이지당 2,000개로 자른다(오래된 것부터 버림).
     그 이상은 「논쟁」이 아니라 다른 문제(도배)다. */
  const 자른것 = 목록.length > 2000 ? 목록.slice(목록.length - 2000) : 목록;
  await put(페이지열쇠(page), Buffer.from(JSON.stringify(자른것), 'utf8'), 'application/json');

  return { ok: true, comment: 댓글 };
}

/** 한 페이지의 댓글 목록. 오래된 것부터(등록 순). 없으면 빈 배열 — 없는 것도 정상이다 */
export async function 목록(page, { limit = 500 } = {}) {
  const 것들 = await 읽기(page);
  return 것들.slice(-limit);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--selftest')) {
    const 시험 = [];
    const push = (잰것, 맞는것, 이름) => 시험.push([JSON.stringify(잰것), JSON.stringify(맞는것), 이름]);

    push(페이지열쇠('/community/a') === 페이지열쇠('/community/a'), true, '같은 페이지는 같은 열쇠');
    push(페이지열쇠('/a') === 페이지열쇠('/b'), false, '다른 페이지는 다른 열쇠');
    push(페이지열쇠('../../etc/passwd').includes('/'), true, '경로탈출 문자가 그대로 파일경로에 안 실린다(해시라 슬래시가 raw/comments/ 뒤 하나뿐)');
    push(페이지열쇠('../../etc/passwd').split('/').length, 3, '해시 뒤에 슬래시가 안 늘어난다');

    (async () => {
      const r1 = await 등록({ page: '__selftest__', body: '' });
      push(r1.ok, false, '빈 본문은 거부');

      const r2 = await 등록({ page: '__selftest__', body: '안녕', honeypot: 'x' });
      push(r2.ok, false, '벌집 채워지면 거부');

      const r3 = await 등록({ page: '__selftest__', body: '안녕', openedAt: Date.now() });
      push(r3.ok, false, '연 지 3초 안 된 제출은 거부');

      const r4 = await 등록({ page: '__selftest__', body: 'go visit http://spam.ru now' });
      push(r4.ok, false, '뻔한 스팸 도메인 거부');

      const r5 = await 등록({ page: '__selftest__', body: 'a'.repeat(2001) });
      push(r5.ok, false, '2000자 넘으면 거부');

      const r6 = await 등록({ page: '__selftest__', name: '홍길동', body: '실제 댓글입니다' });
      push(r6.ok, true, '정상 댓글은 등록됨');
      push(Object.keys(r6.comment ?? {}).sort(), ['at', 'body', 'id', 'name'], '저장 칸이 딱 넷뿐 — IP·쿠키 없음');

      const 리스트 = await 목록('__selftest__');
      push(리스트.some((c) => c.body === '실제 댓글입니다'), true, '등록한 댓글이 목록에 있다');
      push(리스트.some((c) => c.body === '안녕'), false, '거부된 것은 목록에 없다');

      let 틀림 = 0;
      for (const [잰것, 맞는것, 이름] of 시험) {
        if (잰것 !== 맞는것) { console.error('❌ ' + 이름 + ' — 잰 것 ' + 잰것); 틀림++; }
      }
      if (틀림) { console.error('❌ ' + 틀림 + '건 틀렸다'); process.exit(1); }
      console.log('✅ comments 자가시험 ' + 시험.length + '건 통과');
    })();
  }
}
