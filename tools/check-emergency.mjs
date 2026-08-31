#!/usr/bin/env node
/**
 * check-emergency.mjs — SeoulMarkets 비상벨 (1번 docs/비상벨.md 프로토콜을 이 사이트에 맞춰 복사)
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * 사장님 지시(2026-08-31): "버그가 생길 때 바로 조치할 수 있는 비상벨을 만들고, 모든
 * 유닛이 쓰게 하라." 1번이 klifemap 몫으로 원형을 만들었고, 각 유닛이 BASE·검사목록만
 * 바꿔 복사한다. 이 파일은 seoulmarkets.com 판.
 *
 * ── 무엇을 재나 (돈/신뢰가 바로 걸린 자리만 — 전부 재면 느려지고, 느리면 안 돌린다) ──
 *  ① 가용성: 홈·기사 한 편·/data·llms.txt 가 200 으로 살아 있나.
 *  ② 투자AI 노출 0 가드: 투자AI가 «공개 페이지로 새 나가지 않았나»(새 나가면 모두의창업
 *     상용화 저촉 = 사업 사고). 후보 경로가 404 이고, 홈에 노출 신호가 없어야 정상.
 *  ⛔ 방문자/실적 경보는 넣지 않는다 — 그건 GA4(2번)가 정확히 푼다. 6번은 못 판단한다.
 *
 * ── 알림 창구 ──────────────────────────────────────────────────
 * 새 채널을 안 만든다. 공용 창구(klifemap /api/owner/notify, 사장님 메일로 즉시)를 부른다.
 * 키는 env 로만 읽는다(코드/로그에 값 안 남긴다): OWNER_NOTIFY_URL · OWNER_NOTIFY_KEY
 * (없으면 SAJU_ADMIN_KEY). 키가 없으면 «메일은 못 보내지만» 빨간불을 stderr+로그로 크게
 * 남기고 exit 2 로 죽는다 — 조용히 넘어가지 않는다(신조3: 못 하면 못 한다고 적는다).
 *
 * 쓰는 법
 *   node tools/check-emergency.mjs            # 한 번 재고 끝낸다
 *   node tools/check-emergency.mjs --조용히   # 정상이면 조용히(크론용)
 *   node tools/check-emergency.mjs --자가시험 # 일부러 깨서 빨간불이 실제로 뜨는지 본다(로그 안 남김)
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 로그 = path.join(뿌리, 'docs', '비상벨.md');
const BASE = process.env.SEOULMARKETS_BASE || 'https://seoulmarkets.com';
const 조용히 = process.argv.includes('--조용히');
const 자가시험 = process.argv.includes('--자가시험') || process.argv.includes('--selftest');

// 돈/신뢰가 바로 걸린 자리 — 죽으면 손님이 못 읽거나 못 찾는 곳만.
const 검사목록 = [
  { 이름: '홈', 경로: '/', 기대: 200 },
  { 이름: '기사(집중도)', 경로: '/article/korea-everything-comes-down-to-four', 기대: 200 },
  { 이름: '데이터 허브', 경로: '/data', 기대: 200 },
  { 이름: 'llms.txt(AI 인용 관문)', 경로: '/llms.txt', 기대: 200 },
];

// 투자AI 노출 0 가드 — 이 경로들이 «있으면» 사고. 404(또는 미존재)여야 정상.
const 투자AI_노출후보 = ['/invest-ai', '/invest', '/invest-ai/', '/trading-ai', '/투자ai'];

async function 재기(경로) {
  const url = BASE.replace(/\/$/, '') + 경로;
  try {
    const r = await fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'seoulmarkets-emergency-bell' } });
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
    // 키가 없다 — 메일은 못 보낸다. 조용히 넘기지 않는다.
    console.error('⛔ 알림 키(OWNER_NOTIFY_KEY/SAJU_ADMIN_KEY)가 env 에 없다 — 메일 못 보냄. 로그로만 남긴다.');
    return { 보냄: false, 이유: '키 없음' };
  }
  try {
    const r = await fetch(notifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
      body: JSON.stringify({ title: 제목, text: 내용, from: 'seoulmarkets(6번)' }), // 영문 필드명(한글은 셸 인코딩 깨진 전례)
    });
    return { 보냄: r.ok, code: r.status };
  } catch (e) {
    console.error('⛔ 알림 창구 호출 실패:', String(e?.message ?? e));
    return { 보냄: false, 이유: String(e?.message ?? e) };
  }
}

function 로그남겨(줄들) {
  const 이제 = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const 덩이 = `\n## 🔴 seoulmarkets — ${이제}\n` + 줄들.map((l) => `- ${l}`).join('\n') + '\n';
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
  }

  // 투자AI 노출 0 가드
  for (const p of 투자AI_노출후보) {
    const r = await 재기(p);
    const 노출됨 = r.code === 200; // 200 이면 공개돼 있다 = 사고
    if (노출됨) {
      빨강.push(`⛔ 투자AI 공개노출 의심 — ${r.url} 가 200 이다(모두의창업 상용화 저촉). 즉시 내려야 한다`);
      console.log(`🔴 투자AI 노출 가드 — ${p} 가 200`);
    }
  }

  if (빨강.length === 0) {
    if (!조용히) console.log('\n✅ 초록 — 돈/신뢰 걸린 자리 다 살아 있고, 투자AI 노출 0.');
    return 0;
  }

  console.error(`\n🔴 빨강 ${빨강.length}건:`);
  빨강.forEach((l) => console.error('   ' + l));

  if (자가시험) {
    console.log('\n(자가시험 — 로그·알림 안 남긴다. 빨간불이 실제로 떴다는 것만 확인.)');
    return 빨강.length ? 0 : 1; // 자가시험은 "빨강이 떠야" 통과
  }

  로그남겨(빨강);
  const 결과 = await 알림보내라(`🔴 seoulmarkets 비상 ${빨강.length}건`, 빨강.join(' / '));
  console.error(결과.보냄 ? '📮 사장님 메일 창구로 알림 보냄' : `⚠ 알림 못 보냄(${결과.이유 || 결과.code}) — 로그엔 남겼다`);
  return 2;
}

본다().then((코드) => process.exit(코드));
