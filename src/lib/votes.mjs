/**
 * votes.mjs — **자체 투표(VS 뉴스) 기능.** 사장님 지시(2026-09-14):
 * 「케이돌의 인기순위를 참조해서... [VS 뉴스] 코너로... 그러면 투표할 수 있는 걸
 *   만들어줘야지... 집계도 실시간으로 하고」
 *
 * ── 왜 comments.mjs 와 같은 꼴인가 ────────────────────────────────
 * 같은 정책(2026-08-05, 「쿠키·IP를 우리가 따로 남기지 않는다」) 아래서 만든다.
 * 저장 방식·스팸 방지(벌집·최소 체류시간·서버 전체 분당 한도)를 그대로 물려받는다 —
 * comments.mjs 머리글 참고. **다만 한 표는 자유 본문이 아니라 정해진 후보 중 하나다.**
 *
 * ── 중복 투표를 어떻게 보나 (IP·쿠키 없이) ─────────────────────────
 * IP·쿠키가 없으므로 «같은 사람이 두 번 눌렀다»를 서버가 확정할 수 없다. 이것은
 * 결함이 아니라 정책의 결과다 — 댓글 스팸과 같은 자리에서 같은 값을 치른다.
 * 클라이언트(vote-widget.js)가 localStorage 로 「이미 눌렀다」를 표시해 브라우저
 * 하나당 한 표로 부드럽게 막지만, 그것은 손님을 믿는 장치이지 서버가 강제하는
 * 관문이 아니다. **이 투표는 여론조사이지, 공식 인증투표가 아니다** — 그렇게 화면에
 * 적는다(article 쪽에서 「이것은 통계이지 확정된 결과가 아닙니다」와 같은 결).
 *
 * ── 실시간 집계 ───────────────────────────────────────────────
 * 한 표가 들어올 때마다 즉시 저장하고, 그 자리에서 갱신된 집계를 돌려준다
 * (다음 조회를 기다리지 않는다). 위젯은 표를 던진 직후와 일정 주기로 다시
 * 물어 «남이 지금 누른 표»도 반영한다.
 *
 * ── 저장 ─────────────────────────────────────────────────────
 * 투표 하나당 파일 하나(`raw/votes/<hash>.json`, comments.mjs 와 같은 store.mjs).
 * 저장하는 칸 — 후보별 집계(counts) · 총합(total) · 마지막 갱신 시각. **그게 전부다.**
 * 개별 유권자를 식별하는 값은 어느 것도 안 남는다.
 *
 * node src/lib/votes.mjs --selftest
 */
'use strict';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { put, get } from './store.mjs';

const 최소체류밀리초 = 2000; /* 클릭 한 번짜리라 댓글(3초)보다 살짝 짧게 잡는다 */
const 분당전체한도 = 120; /* 클릭 한 번이 댓글 작성보다 훨씬 흔하다 — 한도를 넉넉히 둔다 */

/* ⚠ page 키를 그대로 파일 경로에 쓰지 않는다 — comments.mjs 와 같은 이유(경로 탈출 차단) */
function 투표열쇠(poll) {
  const 정리 = String(poll ?? '').slice(0, 300);
  const 해시 = createHash('sha256').update(정리).digest('hex').slice(0, 24);
  return `raw/votes/${해시}.json`;
}

/** 못 잰 건 못 쟀다고 — 깨진 파일이면 빈 집계로 접는다. 투표 하나 못 읽는다고 페이지가 죽으면 안 된다 */
async function 읽기(poll) {
  const raw = await get(투표열쇠(poll)).catch(() => null);
  if (!raw) return { counts: {}, total: 0, updatedAt: null };
  try {
    const j = JSON.parse(raw.toString('utf8'));
    if (!j || typeof j !== 'object' || typeof j.counts !== 'object') return { counts: {}, total: 0, updatedAt: null };
    return { counts: j.counts ?? {}, total: Number(j.total) || 0, updatedAt: j.updatedAt ?? null };
  } catch {
    return { counts: {}, total: 0, updatedAt: null };
  }
}

/** 서버 전체 분당 한도 — comments.mjs 와 같은 방식(투표는 자기 자리를 따로 센다) */
let 최근분 = null;
let 최근분횟수 = 0;
function 한도넘었나() {
  const 지금분 = Math.floor(Date.now() / 60000);
  if (최근분 !== 지금분) { 최근분 = 지금분; 최근분횟수 = 0; }
  최근분횟수 += 1;
  return 최근분횟수 > 분당전체한도;
}

/**
 * 한 표를 던진다.
 * @param {{poll:string, choices:string[], choice:string, honeypot?:string, openedAt?:number}} 입력
 *   choices — 이 투표의 유효한 후보 id 배열(호출부가 정한다. 서버는 이 목록 밖 값을 거부한다).
 * @returns {{ok:boolean, code?:number, why?:string, tally?:object}}
 */
export async function 던지기({ poll, choices, choice, honeypot, openedAt } = {}) {
  if (honeypot) return { ok: false, code: 400, why: '봇으로 판정됨' };
  if (!poll || typeof poll !== 'string') return { ok: false, code: 400, why: 'poll이 없습니다' };
  if (!Array.isArray(choices) || choices.length < 2) return { ok: false, code: 400, why: 'choices가 없습니다(최소 2개)' };
  const 후보 = String(choice ?? '');
  if (!choices.includes(후보)) return { ok: false, code: 400, why: '알 수 없는 choice입니다' };

  if (typeof openedAt === 'number') {
    const 격차 = Date.now() - openedAt;
    if (격차 >= 0 && 격차 < 최소체류밀리초) return { ok: false, code: 429, why: '너무 빠른 제출' };
  }

  if (한도넘었나()) return { ok: false, code: 429, why: '지금 투표가 몰리고 있습니다. 잠시 후 다시 시도해 주세요' };

  const 현재 = await 읽기(poll);
  const 집계 = { ...현재.counts };
  for (const c of choices) if (!(c in 집계)) 집계[c] = 0; /* 첫 표 전에도 0으로 다 보인다 — 없던 후보를 조용히 빠뜨리지 않는다 */
  집계[후보] = (집계[후보] ?? 0) + 1;
  const 총합 = Object.values(집계).reduce((a, b) => a + (Number(b) || 0), 0);

  const 낼것 = { counts: 집계, total: 총합, updatedAt: new Date().toISOString() };
  await put(투표열쇠(poll), Buffer.from(JSON.stringify(낼것), 'utf8'), 'application/json');

  return { ok: true, tally: 낼것 };
}

/** 지금 집계 — 표를 던지지 않고 조회만 할 때(위젯이 주기적으로 다시 묻는 자리) */
export async function 집계(poll, { choices } = {}) {
  const 것 = await 읽기(poll);
  if (Array.isArray(choices)) {
    const 채운것 = { ...것.counts };
    for (const c of choices) if (!(c in 채운것)) 채운것[c] = 0;
    const 총합 = Object.values(채운것).reduce((a, b) => a + (Number(b) || 0), 0);
    return { counts: 채운것, total: 총합, updatedAt: 것.updatedAt };
  }
  return 것;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--selftest')) {
    const 시험 = [];
    const push = (잰것, 맞는것, 이름) => 시험.push([JSON.stringify(잰것), JSON.stringify(맞는것), 이름]);

    push(투표열쇠('/vs/a') === 투표열쇠('/vs/a'), true, '같은 투표는 같은 열쇠');
    push(투표열쇠('/vs/a') === 투표열쇠('/vs/b'), false, '다른 투표는 다른 열쇠');
    push(투표열쇠('../../etc/passwd').split('/').length, 3, '경로탈출 문자가 해시라 슬래시를 안 늘린다');

    (async () => {
      const 후보들 = ['seonghyeon', 'keonho'];
      const 투표키 = '__selftest_vote_' + Date.now();

      const r1 = await 던지기({ poll: 투표키, choices: 후보들, choice: 'nobody' });
      push(r1.ok, false, 'choices에 없는 후보는 거부');

      const r2 = await 던지기({ poll: 투표키, choices: 후보들, choice: 'seonghyeon', honeypot: 'x' });
      push(r2.ok, false, '벌집 채워지면 거부');

      const r3 = await 던지기({ poll: 투표키, choices: 후보들, choice: 'seonghyeon', openedAt: Date.now() });
      push(r3.ok, false, '연 지 2초 안 된 제출은 거부');

      const r4 = await 던지기({ poll: 투표키, choices: 후보들, choice: 'seonghyeon' });
      push(r4.ok, true, '정상 투표는 등록됨');
      push(r4.tally.counts.seonghyeon, 1, '첫 표가 반영된다');
      push(r4.tally.counts.keonho, 0, '안 찍은 후보도 0으로 같이 보인다(조용히 안 빠뜨림)');
      push(r4.tally.total, 1, '총합이 맞다');

      const r5 = await 던지기({ poll: 투표키, choices: 후보들, choice: 'keonho' });
      push(r5.ok, true, '두 번째 표(다른 후보)도 등록됨');
      push(r5.tally.counts.keonho, 1, '두 번째 표가 반영된다');
      push(r5.tally.total, 2, '총합이 누적된다(실시간 집계)');

      const 조회 = await 집계(투표키, { choices: 후보들 });
      push(조회.total, 2, '조회만 해도 저장된 집계를 그대로 본다(표를 안 던져도 조회 가능)');

      let 틀림 = 0;
      for (const [잰것, 맞는것, 이름] of 시험) {
        if (잰것 !== 맞는것) { console.error('❌ ' + 이름 + ' — 잰 것 ' + 잰것); 틀림++; }
      }
      if (틀림) { console.error('❌ ' + 틀림 + '건 틀렸다'); process.exit(1); }
      console.log('✅ votes 자가시험 ' + 시험.length + '건 통과');
    })();
  }
}
