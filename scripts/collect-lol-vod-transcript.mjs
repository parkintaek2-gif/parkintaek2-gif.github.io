#!/usr/bin/env node
/**
 * collect-lol-vod-transcript.mjs — LoL 경기 «공식 중계 다시보기»의 영어 자막(유튜브 자동 자막)을 글로 받는다.
 *
 * ── 왜 (2026-10-25 · 1번 · 사장님 「라이엇 공식 유튜브 … 스크립트만 보고 쓰면」) ──────────
 * 영상을 화면 단위로 «보면» 토큰이 많이 든다(경기당 25만~30만 어림). 자막 글은 경기 하나에 약 3만8천 자(≈1만 토큰)다.
 * 경기 결과·킬·골드는 라이엇 공식 일정·라이브 통계로 맞추고, 중계진이 짚은 흐름만 자막에서 읽는다.
 *
 * ── 길 ─────────────────────────────────────────────────────────────
 * ① esports-api getEventDetails → games[].vods 에 공식 다시보기(LoL Esports 유튜브)의 영상 id 가 나라말별로 있다
 * ② 유튜브 player API 로 자막 목록을 받아 en «asr»(자동 자막) 을 받는다
 *
 * ⛔ 자동 자막은 이름을 틀리게 적는다(예: Gen.G → «Genji»). 선수·팀 이름과 수는 반드시 공식 통계로 검산한다.
 * ⛔ 자막 문장을 기사에 길게 옮기지 않는다 — 읽고 우리 글로 쓴다(중계는 라이엇의 저작물).
 * ⚠ 방금 끝난 경기는 자막이 아직 안 붙어 있을 수 있다(올라온 뒤 몇 시간). 그때는 «아직 없다»고 적고 멈춘다.
 *
 * 쓰는 법
 *   node scripts/collect-lol-vod-transcript.mjs <경기id> [<경기id> ...]   → archive/raw/lol-vod-transcript/<영상id>.txt
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 방 = path.join(뿌리, 'archive/raw/lol-vod-transcript');
/* lolesports.com 화면이 쓰는 공개 열쇠 — 비밀이 아니다(누구나 브라우저에서 본다) */
const K = { 'x-api-key': '0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z' };
const 풀기 = (x) => [...x.matchAll(/<s[^>]*>([^<]*)<\/s>|<p [^>]*>([^<]+)<\/p>/g)]
  .map((m) => m[1] || m[2] || '').join(' ')
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();

const 경기들 = process.argv.slice(2).filter((s) => /^\d+$/.test(s));
if (!경기들.length) { console.error('⛔ 경기 id 를 준다 (esports-api getSchedule 의 match.id)'); process.exit(1); }
fs.mkdirSync(방, { recursive: true });

for (const id of 경기들) {
  const ev = await (await fetch(`https://esports-api.lolesports.com/persisted/gw/getEventDetails?hl=en-US&id=${id}`, { headers: K })).json();
  const m = ev.data?.event?.match;
  if (!m) { console.log(`⬜ ${id} — 경기를 못 찾았다`); continue; }
  const 이름 = m.teams.map((t) => t.code).join(' vs ');
  for (const g of m.games) {
    const vod = (g.vods ?? []).find((v) => v.provider === 'youtube' && v.locale === 'en-US');
    if (!vod) { console.log(`⬜ ${이름} ${g.number}경기 — 영어 유튜브 다시보기가 아직 없다`); continue; }
    const p = await (await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38', hl: 'en' } }, videoId: vod.parameter }),
    })).json();
    const 자막 = p.captions?.playerCaptionsTracklistRenderer?.captionTracks?.find((t) => t.languageCode === 'en');
    if (!자막) { console.log(`⬜ ${이름} ${g.number}경기 — 영상(${vod.parameter})은 있는데 자막이 아직 안 붙었다`); continue; }
    const 글 = 풀기(await (await fetch(자막.baseUrl)).text());
    const 낼 = path.join(방, `${vod.parameter}.txt`);
    fs.writeFileSync(낼, `# ${p.videoDetails?.title ?? 이름} · youtube ${vod.parameter} · ${자막.kind === 'asr' ? '자동 자막' : '자막'} · 받은때 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}\n${글}\n`);
    console.log(`✅ ${이름} ${g.number}경기 — ${글.length.toLocaleString()}자 → ${path.relative(뿌리, 낼)}`);
  }
}
