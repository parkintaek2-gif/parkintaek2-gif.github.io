#!/usr/bin/env node
/**
 * check-emergency-100yearmap.mjs — 100yearmap 비상벨 (1번 docs/비상벨.md 프로토콜을 이 사이트에 맞춰 복사)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님 지시(2026-08-31 원형, 2026-09-01 전체공지로 재확인 — "모든 세션 잘 작동하는지
 * 확인하라"): "버그가 생길 때 바로 조치할 수 있는 비상벨을 만들고, 모든 유닛이 쓰게
 * 하라." 6번이 seoulmarkets 판(tools/check-emergency.mjs)을 먼저 만들었다 — 그 틀을
 * BASE·검사목록만 바꿔 그대로 복사한다(새로 짓지 않는다).
 *
 * ── 무엇을 재나 (돈/신뢰가 바로 걸린 자리만) ──────────────────────
 *  ① 가용성: 홈·값 지면(/price)·데이터 허브(/data)·llms.txt 가 200 으로 살아 있나.
 *  ② 결제 시작점: /price 화면에 실제 가격 글자(9,900원)가 있나 — 값이 사라지면
 *     "곧 엽니다"로 되돌아간 사고(8/31 실제로 겪음)와 같은 종류다.
 *  ③ 사이트맵 살아 있나 — 죽으면 구글이 새 지면을 못 찾는다(느리게 도는 사고라
 *     비상벨보다는 2시간 체크리스트 몫이지만, 200 인지 정도는 여기서도 가볍게 본다).
 *  ⛔ 방문자/실적 경보는 넣지 않는다 — 그건 GA4가 정확히 푼다. 이 자는 못 잰다.
 *
 * ── 알림 창구 ──────────────────────────────────────────────────
 * 새 채널을 안 만든다. 공용 창구(klifemap /api/owner/notify, 사장님 메일로 즉시)를 부른다.
 * 키는 env 로만 읽는다: OWNER_NOTIFY_URL · OWNER_NOTIFY_KEY(없으면 SAJU_ADMIN_KEY).
 * 키가 없으면 「메일은 못 보내지만」 빨간불을 stderr+로그로 크게 남기고 exit 2 로 죽는다.
 *
 * 쓰는 법
 *   node tools/check-emergency-100yearmap.mjs            # 한 번 재고 끝낸다
 *   node tools/check-emergency-100yearmap.mjs --조용히   # 정상이면 조용히(크론용)
 *   node tools/check-emergency-100yearmap.mjs --자가시험 # 일부러 깨서 빨간불이 실제로 뜨는지 본다(로그 안 남김)
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 로그 = path.join(뿌리, 'docs', '비상벨.md');
const BASE = process.env.HUNDREDYEARMAP_BASE || 'https://100yearmap.com';
const 조용히 = process.argv.includes('--조용히');
const 자가시험 = process.argv.includes('--자가시험') || process.argv.includes('--selftest');

// 돈/신뢰가 바로 걸린 자리 — 죽으면 손님이 못 읽거나 못 사거나 못 찾는 곳만.
const 검사목록 = [
  { 이름: '홈', 경로: '/', 기대: 200 },
  { 이름: '값 지면(/price)', 경로: '/price', 기대: 200 },
  { 이름: '데이터 허브', 경로: '/data', 기대: 200 },
  { 이름: 'llms.txt(AI 인용 관문)', 경로: '/llms.txt', 기대: 200 },
  { 이름: '사이트맵', 경로: '/sitemap.xml', 기대: 200 },
];

// /price 화면에 실제 가격 글자가 있어야 한다. 8/31 "결제금액 0원" 표시 사고와 같은 종류를 잡는다
const 값_지면_지킴글자 = '9,900';

async function 재기(경로) {
  const url = BASE.replace(/\/$/, '') + 경로;
  try {
    const r = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': '100yearmap-emergency-bell' } });
    const 본문 = r.headers.get('content-type')?.includes('text') ? await r.text().catch(() => '') : '';
    return { url, code: r.status, 본문 };
  } catch (e) {
    return { url, code: 0, 오류: String(e?.message ?? e), 본문: '' };
  }
}

async function 알림보내라(제목, 내용) {
  const notifyUrl = process.env.OWNER_NOTIFY_URL || 'https://klifemap.ai/api/owner/notify';
  const key = process.env.OWNER_NOTIFY_KEY || process.env.SAJU_ADMIN_KEY || '';
  if (!key) {
    console.error('⛔ 알림 키(OWNER_NOTIFY_KEY/SAJU_ADMIN_KEY)가 env 에 없다 — 메일 못 보냄. 로그로만 남긴다.');
    return { 보냄: false, 이유: '키 없음' };
  }
  try {
    const r = await fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ title: 제목, text: 내용, from: '100yearmap(3번)' }), // 영문 필드명(한글은 셸 인코딩 깨진 전례)
    });
    return { 보냄: r.ok, code: r.status };
  } catch (e) {
    console.error('⛔ 알림 창구 호출 실패:', String(e?.message ?? e));
    return { 보냄: false, 이유: String(e?.message ?? e) };
  }
}

function 로그남겨(줄들) {
  const 이제 = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const 덩이 = `\n## 🔴 100yearmap — ${이제}\n` + 줄들.map((l) => `- ${l}`).join('\n') + '\n';
  fs.appendFileSync(로그, 덩이);
}

async function 본다() {
  const 빨강 = [];

  for (const c of 검사목록) {
    const 경로 = 자가시험 && c.이름 === '홈' ? '/__이경로는없다__강제빨강' : c.경로; // 자가시험: 홈을 일부러 깬다
    const r = await 재기(경로);
    const ok = r.code === c.기대;
    if (!조용히 || !ok) console.log(ok ? `✅ ${c.이름} ${r.code}` : `🔴 ${c.이름} ${r.code || r.오류} (기대 ${c.기대})`);
    if (!ok) 빨강.push(`${c.이름} 응답 ${r.code || r.오류} — 기대 ${c.기대} (${r.url})`);

    // 값 지면은 상태코드뿐 아니라 실제 가격 글자도 본다(자가시험이면 홈 자리를 건드리므로 이 지면은 그대로 잰다)
    if (c.이름 === '값 지면(/price)' && ok) {
      const 가격있나 = 자가시험 ? false : r.본문.includes(값_지면_지킴글자);
      if (!조용히 || !가격있나) console.log(가격있나 ? `✅ 값 지면에 가격(${값_지면_지킴글자}) 있음` : `🔴 값 지면에 가격(${값_지면_지킴글자}) 글자가 없다`);
      if (!가격있나) 빨강.push(`/price 에 가격 글자(${값_지면_지킴글자})가 없다 — "0원"류 표시 사고 의심 (${r.url})`);
    }
  }

  if (빨강.length === 0) {
    if (!조용히) console.log('\n✅ 초록 — 돈/신뢰 걸린 자리 다 살아 있고, 값 지면에 가격도 정상 표시.');
    return 0;
  }

  console.error(`\n🔴 빨강 ${빨강.length}건:`);
  빨강.forEach((l) => console.error('   ' + l));

  if (자가시험) {
    console.log('\n(자가시험 — 로그·알림 안 남긴다. 빨간불이 실제로 떴다는 것만 확인.)');
    return 빨강.length ? 0 : 1; // 자가시험은 "빨강이 떠야" 통과
  }

  로그남겨(빨강);
  const 결과 = await 알림보내라(`🔴 100yearmap 비상 ${빨강.length}건`, 빨강.join(' / '));
  console.error(결과.보냄 ? '📮 사장님 메일 창구로 알림 보냄' : `⚠ 알림 못 보냄(${결과.이유 || 결과.code}) — 로그엔 남겼다`);
  return 2;
}

본다().then((코드) => process.exit(코드));
