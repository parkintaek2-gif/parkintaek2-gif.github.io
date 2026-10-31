/* dataeconomics — 서버를 실제로 띄워서 봇 거르기가 도는지 본다.
   ⚠ 지난번에 실제로 띄워 보지 않았으면 「한 건도 안 세어지는」 결함을 못 잡았을 것이다. */
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const 암호 = 'sihum-' + crypto.randomBytes(4).toString('hex');
const 소금 = crypto.randomBytes(16).toString('hex');
const 해시 = 소금 + ':' + crypto.scryptSync(암호, 소금, 64).toString('hex');
const 포트 = 4731;

const 아이 = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, PORT: String(포트), ADMIN_USER: 'sihum@local', ADMIN_HASH: 해시, VISIT_SALT: '시험소금' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let 말 = '';
아이.stdout.on('data', (d) => { 말 += d; });
아이.stderr.on('data', (d) => { 말 += d; });

const 기다린다 = async () => {
  for (let i = 0; i < 60; i++) {
    try { await fetch(`http://127.0.0.1:${포트}/`, { signal: AbortSignal.timeout(2000) }); return true; }
    catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  return false;
};

const 끝낸다 = (코드) => { try { 아이.kill(); } catch { } process.exit(코드); };

if (!await 기다린다()) { console.log('🔴 서버가 안 떴다\n' + 말.slice(-1500)); 끝낸다(1); }

const 사람UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const 연다 = (ua, ip) => fetch(`http://127.0.0.1:${포트}/`, {
  headers: { 'user-agent': ua, 'x-forwarded-for': ip }, signal: AbortSignal.timeout(10000),
}).then((r) => r.text());

await 연다(사람UA, '1.1.1.1');
await 연다(사람UA, '1.1.1.1');
await 연다(사람UA, '2.2.2.2');
await 연다('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', '9.9.9.9');
await 연다('Mozilla/5.0 (compatible; GPTBot/1.2)', '9.9.9.8');
await 연다('curl/8.4.0', '7.7.7.7');
/* 스타일 파일은 세면 안 된다 */
await fetch(`http://127.0.0.1:${포트}/favicon.ico`, { headers: { 'user-agent': 사람UA, 'x-forwarded-for': '3.3.3.3' } }).catch(() => { });

const 머리 = { Authorization: 'Basic ' + Buffer.from('sihum@local:' + 암호).toString('base64') };
const 없이 = await fetch(`http://127.0.0.1:${포트}/admin/visitors?json=1`);
const 답 = await fetch(`http://127.0.0.1:${포트}/admin/visitors?json=1`, { headers: 머리 }).then((r) => r.json());
const 화면 = await fetch(`http://127.0.0.1:${포트}/admin/visitors`, { headers: 머리 }).then((r) => r.text());

const 것 = Object.values(답.사이트 ?? {})[0] ?? {};
console.log('■ 잰 것 : ' + JSON.stringify({ 방문자: 것.방문자, 조회수: 것.조회수, 자동: 것.자동, 자동조회수: 것.자동조회수 }));
console.log('■ 들어온 것들 : ' + JSON.stringify((것.이름표 ?? []).map((x) => x[0].slice(0, 26) + '×' + x[1])));

const T = [
  ['🔴 사람만 방문자로 센다 (1.1.1.1 · 2.2.2.2)', 것.방문자 === 2],
  ['사람 조회수는 사람이 연 횟수다', 것.조회수 === 3],
  /* ⚠ 내 시험 도구가 서버가 떴는지 보려고 연 요청(브라우저 이름 'node')도 자동으로 세어진다.
       그것이 맞는 동작이다 — 그래서 「셋 이상」으로 잰다. 자의 결함이지 지면의 결함이 아니다 */
  ['🔴 자동을 버리지 않고 따로 센다', 것.자동 >= 3 && 것.자동조회수 >= 3],
  ['자동 셋이 이름으로 다 남는다',
    ['Googlebot', 'GPTBot', 'curl'].every((n) => (것.이름표 ?? []).some((x) => x[0].includes(n)))],
  ['누가 긁어 가는지 이름이 남는다', (것.이름표 ?? []).some((x) => x[0].includes('Googlebot'))],
  ['⛔ 로그인 없이는 못 본다', 없이.status === 401],
  ['화면에 「자동」 칸이 나온다', 화면.includes('자동 조회')],
  ['화면에 「들어온 것들」이 나온다', 화면.includes('들어온 것들')],
];
T.forEach(([이름, 참]) => console.log((참 ? '  ✅ ' : '  ❌ ') + 이름));
const 깨짐 = T.filter((x) => !x[1]).length;
console.log(깨짐 ? '\n■ ' + 깨짐 + '건 실패' : '\n■ 모두 통과');
끝낸다(깨짐 ? 1 : 0);
