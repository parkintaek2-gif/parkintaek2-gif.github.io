#!/usr/bin/env node
/**
 * get-mail-attachment.mjs — **우리가 보낸 메일의 첨부를 도로 꺼낸다.**
 *
 * ── 🔴 왜 (2026-10-01 · 사장님) ─────────────────────────────
 *   사장님: 「**네가 만든 명함 파일 잇다**」 · 「**원드라이브에서 찾아봐...메일로
 *   나한테 보낸 것도 있고**」
 *
 *   9/23 에 내가 만든 명함을 메일로 보냈는데, 만든 파일은 그 세션의 작업 폴더에
 *   있었고 세션이 닫히면서 함께 사라졌다. 저장소에도 원드라이브에도 안 남았다.
 *   남은 곳은 **보낸 편지함의 첨부**뿐이다.
 *
 * ⭐ `docs/보낸메일.tsv` 가 메시지 id 를 적어 두고 있어서 되찾을 수 있었다.
 *   그 대장이 없었으면 다시 만들어야 했다 — 대장을 남기는 까닭이 이것이다.
 *
 * ⛔ 회사 발송 계정(u5@)의 편지함만 본다. 사장님 개인 편지함은 열지 않는다.
 * ⛔ 손님 이메일 주소를 찍지 않는다.
 *
 * 쓰는 법
 *   node scripts/get-mail-attachment.mjs --자가시험
 *   node scripts/get-mail-attachment.mjs --id=1a0cdaf455887085            무엇이 붙어 있나만 본다
 *   node scripts/get-mail-attachment.mjs --id=1a0cdaf455887085 --받는다 --낼곳=<폴더>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 키읽기, 위임토큰받기 } from '../src/lib/gmail-send.mjs';
import { 환경읽기, 줄가르기 } from './lib/env.mjs';

환경읽기();

const 인자 = (이름) => process.argv.find((a) => a.startsWith(`--${이름}=`))?.split('=').slice(1).join('=');

/** base64url → Buffer. ⛔ 보통 base64 와 글자가 다르다 — 그대로 디코드하면 깨진다 */
export function 유알엘디코드(s) {
  const t = String(s ?? '').replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(t + '='.repeat((4 - (t.length % 4)) % 4), 'base64');
}

/** MIME 나무를 훑어 «첨부가 달린 조각»만 모은다 */
export function 첨부찾기(조각, 모은것 = []) {
  if (!조각) return 모은것;
  const 이름 = 조각.filename;
  const id = 조각.body && 조각.body.attachmentId;
  if (이름 && id) 모은것.push({ 이름, id, 크기: 조각.body.size || 0, 종류: 조각.mimeType || '' });
  for (const 아이 of 조각.parts || []) 첨부찾기(아이, 모은것);
  return 모은것;
}

/* ───────────────────────── 자가시험 ───────────────────────── */
if (process.argv.includes('--자가시험')) {
  let 센다 = 0; let 깨짐 = 0;
  const 검 = (무엇, 참) => { 센다++; if (참) console.log(`  ✅ ${무엇}`); else { 깨짐++; console.log(`  🔴 ${무엇}`); } };
  console.log('■ get-mail-attachment 자가시험');

  검('base64url 을 제대로 푼다', 유알엘디코드('aGVsbG8').toString() === 'hello');
  검('- 와 _ 를 바꿔 푼다', 유알엘디코드(Buffer.from([251, 255]).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')).length === 2);
  검('⛔ 빈 것에 안 터진다', 유알엘디코드(null).length === 0 && 유알엘디코드('').length === 0);

  const 나무 = {
    mimeType: 'multipart/mixed',
    parts: [
      { mimeType: 'text/plain', body: { size: 10 } },
      { filename: 'a.pdf', mimeType: 'application/pdf', body: { attachmentId: 'X1', size: 100 } },
      { mimeType: 'multipart/related', parts: [{ filename: 'b.jpg', body: { attachmentId: 'X2', size: 200 } }] },
    ],
  };
  const 찾은것 = 첨부찾기(나무);
  검('나무 속 첨부를 다 찾는다', 찾은것.length === 2);
  검('깊이 든 것도 찾는다', 찾은것.some((x) => x.이름 === 'b.jpg'));
  검('⛔ 첨부 아닌 조각은 안 센다', !찾은것.some((x) => x.종류 === 'text/plain'));
  검('⛔ 빈 것에 안 터진다 — 첨부찾기', 첨부찾기(null).length === 0);
  검('⛔ 이름만 있고 id 가 없으면 첨부가 아니다',
    첨부찾기({ filename: 'c.txt', body: { size: 5 } }).length === 0);

  /* 🔴 .env 읽기는 공용 부품이다 — 세 곳에 복제돼 있던 것을 scripts/lib/env.mjs 로 뺐다 */
  검('환경 줄을 가른다', 줄가르기('A_B=  값  ').이름 === 'A_B' && 줄가르기('A_B=  값  ').값 === '값');
  검('따옴표를 벗긴다', 줄가르기('K="가나"').값 === '가나');
  검('값 안의 = 는 안 가른다', 줄가르기('K=a=b').값 === 'a=b');
  검('⛔ 주석·빈 줄은 안 읽는다', 줄가르기('# 메모') === null && 줄가르기('') === null);
  검('⛔ 소문자로 시작하면 안 읽는다', 줄가르기('abc=1') === null);

  console.log(`\n${깨짐 ? `🔴 ${깨짐}/${센다} 깨졌다` : `✅ ${센다} 다 섰다`}`);
  process.exit(깨짐 ? 1 : 0);
}

/* ───────────────────────── 실제로 꺼낸다 ───────────────────────── */
const 이자 = fileURLToPath(import.meta.url);
if (path.resolve(process.argv[1] ?? '') === path.resolve(이자)) {
  const id = 인자('id');
  if (!id) { console.error('쓰는 법: node scripts/get-mail-attachment.mjs --id=<메시지id> [--받는다 --낼곳=<폴더>]'); process.exit(1); }

  const 키 = 키읽기();
  const 토큰 = await 위임토큰받기(키);
  const 머리 = { Authorization: `Bearer ${토큰}` };

  const 편지 = await (await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: 머리 })).json();
  if (편지.error) { console.error('🔴 못 읽었다 — ' + (편지.error.message || '')); process.exit(1); }

  const 제목 = (편지.payload?.headers || []).find((h) => h.name === 'Subject')?.value || '(제목 없음)';
  console.log('■ ' + 제목);
  const 첨부들 = 첨부찾기(편지.payload);
  if (!첨부들.length) { console.log('  ⬜ 첨부가 없다'); process.exit(0); }
  for (const a of 첨부들) console.log(`  · ${a.이름}  ${(a.크기 / 1024).toFixed(0)}KB  ${a.종류}`);

  if (!process.argv.includes('--받는다')) {
    console.log('\n⭐ 목록만 봤다. 내려받으려면 --받는다 --낼곳=<폴더> 를 붙인다.');
    process.exit(0);
  }
  const 낼곳 = 인자('낼곳');
  if (!낼곳) { console.error('🔴 --낼곳= 이 없다'); process.exit(1); }
  fs.mkdirSync(낼곳, { recursive: true });
  for (const a of 첨부들) {
    const 몸 = await (await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}/attachments/${a.id}`, { headers: 머리 })).json();
    if (!몸.data) { console.log(`  🔴 ${a.이름} — 못 받았다`); continue; }
    const 길 = path.join(낼곳, a.이름);
    fs.writeFileSync(길, 유알엘디코드(몸.data));
    console.log(`  ✅ ${길}  ${(fs.statSync(길).size / 1024).toFixed(0)}KB`);
  }
}
