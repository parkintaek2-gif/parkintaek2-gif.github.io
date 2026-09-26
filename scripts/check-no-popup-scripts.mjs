#!/usr/bin/env node
/**
 * check-no-popup-scripts.mjs — **사장님 화면에 창을 띄우는 자를 두지 않는다**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴🔴 왜 (2026-09-26 · 사장님)
 *   「**그전에 서버로 쓰던, 너희 작업용으로 쓰던 노트북에서 계속 팝업되는데 지울 수 없나?**」
 *   (공공데이터포털 주소가 계속 떴다)
 *
 * [무엇이었나] 2026-08-01 에 우리가 만든 **1회성 알림**이었다
 *   (`scripts/remind-datago.ps1` — MessageBox 를 띄우고 브라우저로 그 주소를 열었다).
 *   그때의 목적은 진작 끝났는데 **그 노트북에 예약이 남아 두 달 가까이 사장님을 방해했다.**
 *
 * ⭐ 배운 것 둘 —
 *   ① 「1회성」이라고 적어도 **예약은 스스로 사라지지 않는다.** 거는 자가 지우는 길까지 둬야 한다
 *   ② 우리가 만든 자가 **사장님 일을 방해하는 자리에 서면 안 된다.**
 *     알림은 우리가 받는다 — 사장님께는 «보고»로 간다(메일).
 *
 * [무엇을 막나] scripts/ 안에서
 *   · MessageBox 로 창을 띄우는 것
 *   · Start-Process 로 브라우저에 주소를 여는 것 (사람 화면을 가로챈다)
 *   · 토스트 알림을 띄우는 것
 *
 * ⚠ 허락한 것 — 우리가 «읽는» 로그·파일 쓰기, 우리 편지함으로 가는 메일.
 *
 * 쓰는 법
 *   node scripts/check-no-popup-scripts.mjs
 *   node scripts/check-no-popup-scripts.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 여기 = path.dirname(fileURLToPath(import.meta.url));
export const 뿌리 = path.resolve(여기, '..');

/** 이 글이 사람 화면에 무언가를 띄우나 */
export function 창띄우나(글) {
  const 벗긴 = String(글 ?? '')
    .split('\n')
    .filter((l) => !/^\s*(#|\/\/|rem\b)/i.test(l))     /* 주석 줄은 뺀다 */
    .join('\n');
  const 걸리는것 = [];
  if (/\[System\.Windows\.MessageBox\]::Show|MessageBox\]::Show/.test(벗긴)) 걸리는것.push('MessageBox 창');
  if (/Start-Process\s+['"]https?:/i.test(벗긴)) 걸리는것.push('브라우저로 주소 열기');
  if (/New-BurntToastNotification|ToastNotificationManager/.test(벗긴)) 걸리는것.push('토스트 알림');
  if (/msg\s+\*|\bmsg\.exe\b/.test(벗긴)) 걸리는것.push('msg 로 메시지 보내기');
  return 걸리는것;
}

export function 훑기(방 = path.join(뿌리, 'scripts')) {
  const 걸린것 = [];
  let 것들 = [];
  try { 것들 = fs.readdirSync(방); } catch { return 걸린것; }
  for (const f of 것들) {
    if (!/\.(ps1|cmd|bat|mjs|js)$/i.test(f)) continue;
    if (f === 'check-no-popup-scripts.mjs') continue;      /* 제 설명에 제가 걸리지 않는다 */
    let 글 = '';
    try { 글 = fs.readFileSync(path.join(방, f), 'utf8'); } catch { continue; }
    const 것 = 창띄우나(글);
    if (것.length) 걸린것.push({ 파일: f, 까닭: 것 });
  }
  return 걸린것;
}

const 직접돌리나 = process.argv[1] && process.argv[1].endsWith('check-no-popup-scripts.mjs');

if (직접돌리나 && process.argv.includes('--자가시험')) {
  const 잰다 = [];
  const 본다 = (이름, v) => 잰다.push([이름, !!v]);

  본다('🔴 MessageBox 를 잡는다', 창띄우나('[System.Windows.MessageBox]::Show("x")').length === 1);
  본다('🔴 브라우저로 주소 여는 것을 잡는다', 창띄우나("Start-Process 'https://www.data.go.kr/'").length === 1);
  본다('⛔ 주석에 적힌 것은 안 센다 — 이 규칙을 설명한 글이 제 검사에 걸리면 안 된다',
    창띄우나("# Start-Process 'https://example.com'\n# MessageBox]::Show").length === 0);
  본다('⛔ 로그 쓰기는 안 잡는다', 창띄우나('Add-Content $LOG "x"').length === 0);
  본다('⛔ 메일 보내기는 안 잡는다 — 우리 편지함으로 가는 것은 방해가 아니다',
    창띄우나('node scripts/send-mail.mjs --받는곳=a@b.com').length === 0);
  본다('여러 가지가 한 파일에 있으면 다 센다',
    창띄우나('[System.Windows.MessageBox]::Show("x")\nStart-Process \'https://a.b\'').length === 2);

  const 떨 = 잰다.filter(([, v]) => !v);
  for (const [이, v] of 잰다) console.log(`${v ? '✅' : '🔴'} ${이}`);
  console.log(떨.length ? `\n🔴 ${떨.length}/${잰다.length} 떨어졌다` : `\n✅ 자가시험 ${잰다.length} 통과`);
  process.exit(떨.length ? 1 : 0);
}

if (직접돌리나) {
  const 걸린것 = 훑기();
  console.log('■ 사장님 화면에 창을 띄우는 자가 있나 — scripts/ 전수');
  if (!걸린것.length) {
    console.log('✅ 없다');
    process.exit(0);
  }
  for (const x of 걸린것) console.log(`   🔴 ${x.파일} — ${x.까닭.join(' · ')}`);
  console.log('');
  console.log('⛔ 우리가 만든 자가 사장님 일을 방해하는 자리에 서면 안 된다.');
  console.log('   알림은 우리가 받는다 — 사장님께는 «보고»로 간다(메일).');
  console.log('⚠ 「1회성」이라 적어도 예약은 스스로 사라지지 않는다. 거는 자가 지우는 길까지 둔다.');
  process.exit(1);
}
