#!/usr/bin/env node
/**
 * youtube-upload.mjs — **우리 쇼츠를 사장님 손 없이 유튜브에 올린다.**
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 왜 만들었나 [2026-09-02]
 *   채널 `@KCultureWire` 가 **개설 25일째 0편**이다. 올릴 것은 24편이 다 되어 있는데
 *   («소리·제목·설명·태그·썸네일» 전부 `archive/kcw-upload-kit.json` 에 있다)
 *   **브라우저로 로그인할 수 있는 유닛이 없어** 한 편도 못 올렸다.
 *   1번은 열세 시간째 조용하고, 6번은 크롬 미연결이라고 답했다.
 *
 * ⭐ 그래서 **사장님 손을 한 번만** 빌리고 그 뒤는 자가 올린다.
 *   사장님 지시 — 「매일·반복되는 일은 사장님 손으로 올리지 않는다. 반복을 없애는 쪽으로 고쳐라」
 *   ⇒ 24편을 손으로 올리게 하면 그것이 24번의 손이다. 동의 한 번이면 «영원히» 자가 올린다.
 *
 * ── ⚠ 두 가지 «못 하는 것»을 먼저 적는다 (0 으로 채우지 않는다) ──────────────
 * ⛔ **서비스 계정으로는 안 된다.** 유튜브 업로드는 «사람 계정»의 동의를 요구한다.
 *   우리가 이미 쓰는 검색콘솔 서비스계정 키로는 못 올린다. 그래서 OAuth 동의가 필요하다.
 * ⛔ **하루에 여섯 편까지다.** 업로드 한 편이 1,600 units 이고 기본 한도가 10,000/day 다.
 *   ⇒ 24편은 «나흘» 걸린다. 하루에 다 된다고 적지 않는다. 자가 어디까지 올렸는지 기억한다.
 *
 * ── 쓰는 법 ──────────────────────────────────────────────────────────────────
 *   node scripts/youtube-upload.mjs --자가시험
 *   node scripts/youtube-upload.mjs --남은것            (무엇이 남았나만 본다 · 망 안 씀)
 *   node scripts/youtube-upload.mjs --자격만들기         (사장님 동의 한 번 · 아래 설명)
 *   node scripts/youtube-upload.mjs --한편              (한 편만 올리고 멈춘다 — 첫 확인용)
 *   node scripts/youtube-upload.mjs --전부              (한도까지 올린다)
 *
 * ⛔ 토큰은 «저장소 밖»에 둔다 — `C:\Users\User\.klifedesign\youtube-token.json`.
 *   저장소는 여섯 유닛이 함께 쓰고 깃에 올라간다. 자격을 거기 두지 않는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 킷길 = path.join(뿌리, 'archive', 'kcw-upload-kit.json');
const 자격방 = path.join(process.env.USERPROFILE || process.env.HOME || '.', '.klifedesign');
const 토큰길 = path.join(자격방, 'youtube-token.json');
const 올린것길 = path.join(뿌리, 'archive', 'kcw-youtube-uploaded.json');

/** 하루 한도. ⛔ 여기서 안 막으면 403 quotaExceeded 를 맞고 «올린 것/안 올린 것»이 섞인다 */
export const 하루한도 = 6;
const 되돌림주소 = 'http://127.0.0.1:8765/oauth';
const 갈래 = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';

/* ─────────────────────────── 순수한 부분(시험 가능) ─────────────────────────── */

/** 킷에서 «올려도 되는» 것만. ⛔ uploadable 이 아닌 것은 무음이라 사장님 금지에 걸린다 */
export function 올릴것들(킷, 이미올린것 = {}) {
  const 벌 = (킷 &&킷.videos) || [];
  return 벌.filter((v) => v.uploadable && !이미올린것[v.set]);
}

/** 유튜브가 받는 꼴로 다듬는다. ⛔ 제목 100자·설명 5,000자·태그 500자를 여기서 다시 잡는다 */
export function 올릴짐(v) {
  const 태그 = [];
  let 길이 = 0;
  for (const t of v.tags || []) {
    const 더할 = 태그.length ? String(t).length + 1 : String(t).length;
    if (길이 + 더할 > 500) break;
    태그.push(String(t)); 길이 += 더할;
  }
  return {
    snippet: {
      title: String(v.youtubeTitle || '').slice(0, 100),
      description: String(v.youtubeDescription || '').slice(0, 5000),
      tags: 태그,
      categoryId: '24',           /* Entertainment */
      defaultLanguage: 'en',
      defaultAudioLanguage: 'en',
    },
    status: {
      privacyStatus: 'public',    /* ⭐ 목적이 «우리 사이트로 사람이 오는 것»이다. 숨기면 뜻이 없다 */
      selfDeclaredMadeForKids: false,
      embeddable: true,
    },
  };
}

/** PKCE 한 벌 */
export function pkce만들기(씨 = randomBytes(32)) {
  const verifier = Buffer.from(씨).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/** 동의 주소 */
export function 동의주소({ clientId, challenge, state }) {
  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: 되돌림주소,
    response_type: 'code',
    scope: 갈래,
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

/** multipart/related 몸통 — 작은 파일(5MB 아래)은 이 한 번으로 끝난다 */
export function 멀티파트(경계, 메타, 영상바이트) {
  const 머리 = Buffer.from(
    `--${경계}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`
    + `${JSON.stringify(메타)}\r\n--${경계}\r\nContent-Type: video/mp4\r\n\r\n`, 'utf8');
  const 꼬리 = Buffer.from(`\r\n--${경계}--\r\n`, 'utf8');
  return Buffer.concat([머리, 영상바이트, 꼬리]);
}

/* ─────────────────────────── 자격 ─────────────────────────── */

function 읽기(길, 기본 = null) {
  try { return JSON.parse(fs.readFileSync(길, 'utf8')); } catch (e) { return 기본; }
}

function 쓰기(길, 값) {
  fs.mkdirSync(path.dirname(길), { recursive: true });
  fs.writeFileSync(길, `${JSON.stringify(값, null, 1)}\n`);
}

/** 앱 자격(clientId·clientSecret) — 환경값이나 파일에서. ⛔ 저장소에 안 넣는다 */
function 앱자격() {
  const id = process.env.YOUTUBE_CLIENT_ID;
  const secret = process.env.YOUTUBE_CLIENT_SECRET;
  if (id && secret) return { clientId: id, clientSecret: secret };
  const f = 읽기(path.join(자격방, 'youtube-client.json'));
  if (f && (f.installed || f.web)) {
    const c = f.installed || f.web;
    return { clientId: c.client_id, clientSecret: c.client_secret };
  }
  if (f && f.clientId) return f;
  return null;
}

async function 토큰갱신(자격, refresh) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: 자격.clientId, client_secret: 자격.clientSecret,
      refresh_token: refresh, grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`토큰 갱신 실패 ${r.status} — ${JSON.stringify(j).slice(0, 200)}`);
  return j.access_token;
}

async function 접근토큰() {
  const 자격 = 앱자격();
  if (!자격) throw new Error('앱 자격이 없다 — 먼저 --자격만들기 안내를 따르십시오');
  const t = 읽기(토큰길);
  if (!t || !t.refresh_token) throw new Error('동의 기록이 없다 — 먼저 --자격만들기 를 돌리십시오');
  return 토큰갱신(자격, t.refresh_token);
}

/** 사장님 동의 한 번 — 되돌림을 여기서 받는다 */
async function 자격만들기() {
  const 자격 = 앱자격();
  if (!자격) {
    console.log('⛔ 앱 자격(clientId·clientSecret)이 아직 없습니다.\n');
    console.log('사장님께 부탁드릴 것은 «두 가지»뿐입니다 (한 번만):');
    console.log('  ① console.cloud.google.com → 「API 및 서비스」→「라이브러리」→ YouTube Data API v3 → **사용**');
    console.log('  ② 같은 곳 →「사용자 인증 정보」→「+ 사용자 인증 정보 만들기」→「OAuth 클라이언트 ID」');
    console.log('     · 애플리케이션 유형: **데스크톱 앱**');
    console.log('     · 만든 뒤 「JSON 다운로드」를 눌러 아래 자리에 그 파일을 두십시오:');
    console.log(`       ${path.join(자격방, 'youtube-client.json')}`);
    console.log('\n⚠ 이 창은 그 파일이 놓이면 다음부터 스스로 진행합니다.');
    process.exit(1);
  }
  const { verifier, challenge } = pkce만들기();
  const state = randomBytes(8).toString('hex');
  const url = 동의주소({ clientId: 자격.clientId, challenge, state });

  console.log('■ 사장님께 — 아래 주소를 열어 **intelligentsiatv@gmail.com** 으로 로그인하고 허용을 눌러 주십시오.\n');
  console.log(url);
  console.log('\n⚠ 「이 앱은 확인되지 않았습니다」가 뜨면 «고급» → «계속 이동»을 누르십시오 —');
  console.log('   우리가 만든 앱이고, 우리 채널에만 올립니다.');
  console.log('\n(허용을 누르면 이 창이 알아서 이어집니다. 기다리는 중…)');

  const 코드 = await new Promise((풀기, 깨기) => {
    const 서버 = http.createServer((req, res) => {
      const u = new URL(req.url, 되돌림주소);
      if (u.pathname !== '/oauth') { res.writeHead(404).end(); return; }
      const c = u.searchParams.get('code');
      const s = u.searchParams.get('state');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(c && s === state
        ? '<h2>되었습니다. 이 창을 닫으셔도 됩니다.</h2>'
        : '<h2>실패했습니다. 터미널을 봐 주십시오.</h2>');
      서버.close();
      if (!c) 깨기(new Error('코드를 못 받았다'));
      else if (s !== state) 깨기(new Error('state 가 안 맞는다 — 중간에 끼어든 것일 수 있다'));
      else 풀기(c);
    });
    서버.listen(8765, '127.0.0.1');
    setTimeout(() => { 서버.close(); 깨기(new Error('10분 안에 동의가 안 왔다')); }, 10 * 60 * 1000);
  });

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: 자격.clientId, client_secret: 자격.clientSecret,
      code: 코드, code_verifier: verifier,
      grant_type: 'authorization_code', redirect_uri: 되돌림주소,
    }),
  });
  const j = await r.json();
  if (!r.ok || !j.refresh_token) {
    console.error(`🔴 토큰을 못 받았다 ${r.status} — ${JSON.stringify(j).slice(0, 300)}`);
    process.exit(1);
  }
  쓰기(토큰길, { refresh_token: j.refresh_token, 받은날: new Date().toISOString() });
  console.log(`\n✅ 되었습니다. 앞으로는 사장님 손이 필요 없습니다.\n   (토큰을 ${토큰길} 에 두었습니다 — 저장소 밖입니다)`);
}

/* ─────────────────────────── 올리기 ─────────────────────────── */

async function 한편올리기(v, 토큰) {
  const 영상길 = path.join(뿌리, v.file);
  if (!fs.existsSync(영상길)) throw new Error(`영상이 없다 — ${v.file}`);
  const 경계 = `----klife${randomBytes(8).toString('hex')}`;
  const 몸 = 멀티파트(경계, 올릴짐(v), fs.readFileSync(영상길));
  const r = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${토큰}`,
      'content-type': `multipart/related; boundary=${경계}`,
    },
    body: 몸,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`업로드 실패 ${r.status} — ${JSON.stringify(j).slice(0, 300)}`);

  /* 썸네일 — 있으면 얹는다. ⚠ 실패해도 영상은 이미 올라갔다. 「못 얹었다」로 적는다 */
  let 썸 = '못 얹었다';
  const 썸길 = path.join(뿌리, v.thumbnail || '');
  if (v.thumbnail && fs.existsSync(썸길)) {
    const tr = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${j.id}`, {
      method: 'POST',
      headers: { authorization: `Bearer ${토큰}`, 'content-type': 'image/jpeg' },
      body: fs.readFileSync(썸길),
    });
    썸 = tr.ok ? '얹었다' : `못 얹었다(${tr.status})`;
  }
  return { id: j.id, url: `https://youtu.be/${j.id}`, 썸네일: 썸 };
}

function 오늘() { return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 10); }

async function 올리기({ 한편만 }) {
  const 킷 = 읽기(킷길);
  if (!킷) { console.error(`⛔ 킷을 못 읽었다 — ${킷길}`); process.exit(1); }
  const 기록 = 읽기(올린것길, { 올린것: {}, 날마다: {} });
  const 남은 = 올릴것들(킷, 기록.올린것);
  if (!남은.length) { console.log('✅ 올릴 것이 없다 — 소리 있는 것은 다 올라갔다'); return; }

  const 오늘올린수 = (기록.날마다 && 기록.날마다[오늘()]) || 0;
  const 오늘남은 = Math.max(0, 하루한도 - 오늘올린수);
  if (!오늘남은) {
    console.log(`⬜ 오늘 한도(${하루한도}편)를 다 썼다. 남은 ${남은.length}편은 내일 올린다.`);
    console.log('   ⚠ 한도를 넘기면 403 을 맞고 올린 것/안 올린 것이 섞인다. 그래서 여기서 멈춘다.');
    return;
  }

  const 토큰 = await 접근토큰();
  const 몇편 = 한편만 ? 1 : Math.min(오늘남은, 남은.length);
  console.log(`■ 올린다 — 남은 ${남은.length}편 중 이번에 ${몇편}편 (오늘 한도 ${하루한도}편 중 ${오늘올린수}편 씀)\n`);

  for (let i = 0; i < 몇편; i++) {
    const v = 남은[i];
    process.stdout.write(`  · ${v.set} … `);
    try {
      const r = await 한편올리기(v, 토큰);
      기록.올린것[v.set] = { ...r, 올린날: new Date().toISOString(), 제목: v.youtubeTitle };
      기록.날마다[오늘()] = (기록.날마다[오늘()] || 0) + 1;
      쓰기(올린것길, 기록);
      console.log(`✅ ${r.url} (썸네일 ${r.썸네일})`);
    } catch (e) {
      console.log(`🔴 ${String(e.message).slice(0, 160)}`);
      console.log('   ⛔ 여기서 멈춘다 — 같은 잘못을 스물세 번 되풀이하지 않는다.');
      break;
    }
  }
  const 뒤 = 올릴것들(킷, 기록.올린것);
  console.log(`\n남은 것 ${뒤.length}편${뒤.length ? ` — ${뒤.slice(0, 3).map((x) => x.set).join(' · ')}${뒤.length > 3 ? ' …' : ''}` : ''}`);
  if (뒤.length) console.log(`⚠ 하루 ${하루한도}편이 한도라 ${Math.ceil(뒤.length / 하루한도)}일 더 걸린다.`);
}

function 남은것보기() {
  const 킷 = 읽기(킷길);
  if (!킷) { console.error(`⛔ 킷을 못 읽었다 — ${킷길}`); process.exit(1); }
  const 기록 = 읽기(올린것길, { 올린것: {} });
  const 남은 = 올릴것들(킷, 기록.올린것);
  const 올린수 = Object.keys(기록.올린것 || {}).length;
  const 무음 = (킷.videos || []).filter((v) => !v.uploadable).length;
  console.log(`■ 유튜브 올리기 — 올린 것 ${올린수}편 · 남은 것 ${남은.length}편 · 무음이라 안 올릴 것 ${무음}편`);
  console.log(`   자격: ${앱자격() ? '앱 자격 있다' : '🔴 앱 자격 없다'} · ${읽기(토큰길) ? '동의 있다' : '🔴 동의 없다(사장님 한 번 필요)'}`);
  if (남은.length) {
    console.log(`   하루 ${하루한도}편 한도 ⇒ 다 올리는 데 ${Math.ceil(남은.length / 하루한도)}일`);
    for (const v of 남은.slice(0, 5)) console.log(`     · ${v.set}  ${v.youtubeTitle.slice(0, 70)}`);
    if (남은.length > 5) console.log(`     … 그리고 ${남은.length - 5}편`);
  }
}

/* ─────────────────────────── 자가시험 ─────────────────────────── */

function 자가시험() {
  let 흠 = 0;
  const 봐 = (참, 말) => { if (!참) { 흠++; console.log('  🔴 ' + 말); } else console.log('  ✅ ' + 말); };

  /* ⭐ 이 자의 심장 — 무음을 절대 올리지 않는가 */
  const 킷 = { videos: [
    { set: 'a', uploadable: true, youtubeTitle: 'A', youtubeDescription: 'd', tags: ['x'] },
    { set: 'b', uploadable: false, youtubeTitle: 'B', youtubeDescription: 'd', tags: ['x'] },
  ] };
  const 남 = 올릴것들(킷);
  봐(남.length === 1 && 남[0].set === 'a', '⛔ 무음(uploadable:false)은 올릴 목록에 안 넣는다');
  봐(올릴것들(킷, { a: {} }).length === 0, '이미 올린 것은 다시 안 올린다');
  봐(올릴것들(null).length === 0 && 올릴것들({}).length === 0, '빈 것을 넣어도 안 터진다');

  /* 한도 */
  봐(하루한도 === 6, '하루 한도가 6편이다(업로드 1,600 units · 기본 10,000/day)');

  /* 짐 다듬기 */
  const 짐 = 올릴짐({ youtubeTitle: 'x'.repeat(200), youtubeDescription: 'y'.repeat(9000), tags: ['a'.repeat(600), 'b'] });
  봐(짐.snippet.title.length === 100, '제목을 100자로 자른다');
  봐(짐.snippet.description.length === 5000, '설명을 5,000자로 자른다');
  봐(짐.snippet.tags.join(',').length <= 500, '태그를 500자 안으로 줄인다');
  봐(짐.status.privacyStatus === 'public', '공개로 올린다 — 숨기면 유입이 뜻이 없다');
  봐(짐.status.selfDeclaredMadeForKids === false, '어린이용이 아니라고 밝힌다(안 밝히면 업로드가 막힌다)');

  /* PKCE */
  const p1 = pkce만들기(Buffer.alloc(32, 1));
  const p2 = pkce만들기(Buffer.alloc(32, 2));
  봐(p1.challenge !== p2.challenge, '씨가 다르면 challenge 도 다르다');
  봐(p1.verifier.length >= 43, 'verifier 가 43자 이상이다(구글 요건)');
  봐(!/[+/=]/.test(p1.challenge), 'challenge 가 base64url 이다(+ / = 가 없다)');

  /* 동의 주소 */
  const u = 동의주소({ clientId: 'cid', challenge: 'ch', state: 'st' });
  봐(u.includes('youtube.upload'), '올릴 권한을 청한다');
  봐(u.includes('access_type=offline'), '⭐ offline 이다 — 이것이 없으면 refresh_token 이 안 오고 사장님을 또 부른다');
  봐(u.includes('code_challenge_method=S256'), 'PKCE 를 쓴다');
  봐(u.includes(encodeURIComponent(되돌림주소)), '되돌림 주소가 127.0.0.1 이다(바깥으로 안 나간다)');

  /* 멀티파트 */
  const b = 멀티파트('BB', { a: 1 }, Buffer.from('MP4'));
  const s = b.toString('utf8');
  봐(s.startsWith('--BB\r\n'), '경계로 시작한다');
  봐(s.includes('video/mp4'), '영상 조각의 종류를 밝힌다');
  봐(s.endsWith('--BB--\r\n'), '경계로 끝난다');
  봐(s.includes('MP4'), '영상 바이트가 들어 있다');

  /* ⛔ 자격을 저장소 안에 두지 않는가 */
  봐(!토큰길.includes('dataeconomics'), '⛔ 토큰을 저장소 «밖»에 둔다 — 깃에 올라가지 않게');

  console.log(흠 ? `\n🔴 흠 ${흠}개` : '\n✅ 흠 없다 (21)');
  process.exit(흠 ? 1 : 0);
}

/* ─────────────────────────── 입구 ─────────────────────────── */
const 줄 = process.argv.slice(2);
if (줄.includes('--자가시험')) 자가시험();
else if (줄.includes('--남은것')) 남은것보기();
else if (줄.includes('--자격만들기')) 자격만들기().catch((e) => { console.error('🔴 ' + e.message); process.exit(1); });
else if (줄.includes('--한편')) 올리기({ 한편만: true }).catch((e) => { console.error('🔴 ' + e.message); process.exit(1); });
else if (줄.includes('--전부')) 올리기({ 한편만: false }).catch((e) => { console.error('🔴 ' + e.message); process.exit(1); });
else {
  console.log('쓰기: node scripts/youtube-upload.mjs --남은것 | --자격만들기 | --한편 | --전부 | --자가시험');
  남은것보기();
}
