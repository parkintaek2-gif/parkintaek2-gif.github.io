#!/usr/bin/env node
/**
 * 백년지도 칼럼 자가시험 (2026-10-31 · 1번)
 *
 *   node scripts/check-100y-column.mjs            글자 다루기·주소·홈 칸 + (dist 가 있으면) 서버를 띄워 실제로 본다
 *   node scripts/check-100y-column.mjs --단위만    서버를 안 띄운다
 *
 * 🔴 R2 로 새지 않게 — store.mjs 는 .env 를 스스로 읽어 R2 로 나간다(2026-09-28 사고).
 *   그래서 «불러오기 전에» ARCHIVE_S3_BUCKET·ENDPOINT 를 빈 값으로 덮고 ARCHIVE_DIR 을 임시 폴더로 돌린다.
 *   띄우는 서버에도 같은 값을 넘긴다. 편집국 계정도 시험용으로 따로 만들어 넘긴다(진짜 계정은 안 쓴다).
 */
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { randomBytes, scryptSync } from 'node:crypto';

const 임시 = mkdtempSync(path.join(tmpdir(), 'col-test-'));
process.env.ARCHIVE_S3_BUCKET = '';
process.env.ARCHIVE_S3_ENDPOINT = '';
process.env.ARCHIVE_DIR = 임시;

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = await import('file://' + path.join(뿌리, 'src/lib/column.mjs').replace(/\\/g, '/'));
const Store = await import('file://' + path.join(뿌리, 'src/lib/store.mjs').replace(/\\/g, '/'));

let 실패 = 0;
let 통과 = 0;
const 본다 = (이름, 맞나, 덧 = '') => {
  if (맞나) 통과++;
  else { 실패++; console.log(`⛔ ${이름}${덧 ? ' — ' + 덧 : ''}`); }
};

if (Store.remoteEnabled) {
  console.log('⛔ 원격 저장소가 켜져 있다 — 시험을 멈춘다(R2 로 새면 안 된다)');
  process.exit(1);
}

/* ── 1. 글자 다루기 ── */
{
  const h = C.본문HTML('<script>alert(1)</script>\n\n**굵게** 와 [링크](https://example.com/a?b=1&c=2)');
  본다('스크립트는 글자로', h.includes('&lt;script&gt;') && !h.includes('<script'), h);
  본다('굵게', h.includes('<strong>굵게</strong>'));
  본다('링크', h.includes('<a href="https://example.com/a?b=1&amp;c=2" rel="noopener">링크</a>'), h);
  본다('문단 둘', (h.match(/<p>/g) ?? []).length === 2);

  const 나쁜링크 = C.본문HTML('[눌러](javascript:alert(1)) [밖](//evil.example) [역](/\\evil) [데](data:text/html,x)');
  본다('javascript: 는 링크가 안 된다', !나쁜링크.includes('<a '), 나쁜링크);
  본다('안쪽 주소는 링크', C.본문HTML('[학과](/major)').includes('<a href="/major">학과</a>'));
  const 따옴표 = C.본문HTML('[x](https://a.example/"onmouseover="alert(1))');
  본다('주소 안 따옴표가 속성을 깨지 않는다', !/href="[^"]*"\s*onmouseover/.test(따옴표), 따옴표);
  const 이름속 = C.본문HTML('[<img src=x onerror=alert(1)>](/a)');
  본다('링크 글자 안 태그도 글자로', !이름속.includes('<img'), 이름속);
  본다('소제목', C.본문HTML('## 첫 이야기\n본문').startsWith('<h2>첫 이야기</h2><p>본문</p>'.slice(0, 0)) && C.본문HTML('## 첫 이야기\n본문').includes('<h2>첫 이야기</h2>'));
  본다('줄바꿈', C.본문HTML('가\n나').includes('가<br>나'));
  본다('빈 본문', C.본문HTML('   ') === '');
  본다('esc 따옴표', C.esc(`"'<>&`) === '&quot;&#39;&lt;&gt;&amp;');
  본다('맨글자', C.맨글자('## 제목\n**굵게** [링크](/a)') === '제목 굵게 링크');
  본다('JSON 스크립트 탈출 막음', !C.스크립트안JSON({ a: '</script><script>' }).includes('</script>'));
}

/* ── 2. 주소 ── */
{
  본다('한글 제목 주소', C.주소만들기('서른둘에 결혼한다는 것?!') === '서른둘에-결혼한다는-것');
  본다('영문 소문자', C.주소만들기('Hello World 2026') === 'hello-world-2026');
  본다('빈 제목', C.주소만들기('!!!') === 'column');
  본다('겹치면 -2', C.주소만들기('가나', ['가나']) === '가나-2');
  본다('겹치면 -3', C.주소만들기('가나', ['가나', '가나-2']) === '가나-3');
  본다('주소 검사 통과', C.주소맞나('서른둘-2'));
  본다('주소 검사 막음 — 빗금', !C.주소맞나('a/b'));
  본다('주소 검사 막음 — 대문자', !C.주소맞나('ABC'));
  본다('주소 검사 막음 — 점점', !C.주소맞나('..'));
  본다('길이 50 안쪽', C.주소만들기('가'.repeat(80)).length <= 50);
}

/* ── 3. 입력 검사 ── */
{
  const 빈 = C.검사({});
  본다('빈 입력은 오류', 빈.오류.length >= 3);
  const 긴 = C.검사({ title: '가'.repeat(121), category: 'edu', body: 'x' });
  본다('긴 제목은 자르지 않고 오류', 긴.오류.some((e) => e.includes('제목')) && 긴.값.title.length === 121);
  const 없는칸 = C.검사({ title: 'a', category: 'nope', body: 'x' });
  본다('없는 카테고리는 오류', 없는칸.오류.some((e) => e.includes('카테고리')));
  const 좋은 = C.검사({ title: ' 제목  하나 ', category: 'aging', body: '본문', slug: '' });
  본다('좋은 입력', 좋은.오류.length === 0 && 좋은.값.title === '제목 하나');
}

/* ── 4. 날짜(기계 시간대와 무관하게 한국시간) ── */
{
  const t = C.지금KST(new Date(Date.UTC(2026, 9, 31, 16, 30, 0)));
  본다('KST 날짜 넘김', t === '2026-11-01T01:30:00+09:00', t);
  본다('한글 날짜', C.한글날짜('2026-11-01T01:30:00+09:00') === '2026년 11월 1일');
}

/* ── 5. 홈 칸 ── */
{
  const 홈 = '<main><p>a</p><div data-slot="home-columns" hidden data-astro-cid-x></div><hr></main>';
  const 빈것 = C.홈채우기(홈, []);
  본다('칼럼 0편이면 칸이 사라진다', 빈것 === '<main><p>a</p><hr></main>', 빈것);
  const 글들 = [1, 2, 3, 4].map((i) => ({ id: 'x' + i, slug: `글-${i}`, title: `<b>제목${i}</b>`, category: 'edu', status: 'published', createdAt: `2026-10-2${i}T10:00:00+09:00`, publishedAt: `2026-10-2${i}T10:00:00+09:00` }));
  const 찬것 = C.홈채우기(홈, C.공개만(글들));
  본다('최근 셋만', (찬것.match(/<li>/g) ?? []).length === 3);
  본다('새 글이 먼저', 찬것.indexOf('제목4') < 찬것.indexOf('제목3'));
  본다('제목은 이스케이프', !찬것.includes('<b>제목') && 찬것.includes('&lt;b&gt;제목4'));
  본다('자리 표시가 남지 않는다', !찬것.includes('data-slot'));
  본다('전체 보기 링크', 찬것.includes('href="/column"'));
  본다('초안은 안 나간다', C.공개만([{ status: 'draft' }]).length === 0);
}

/* ── 6. 저장(임시 폴더에서만) ── */
{
  const 가 = await C.저장({ 값: C.검사({ title: '첫 칼럼', category: 'edu', body: '본문' }).값, 공개: true });
  const 나 = await C.저장({ 값: C.검사({ title: '첫 칼럼', category: 'aging', body: '본문2' }).값, 공개: false });
  본다('주소 겹치지 않음', 가.slug === '첫-칼럼' && 나.slug === '첫-칼럼-2', `${가.slug} / ${나.slug}`);
  본다('필자는 백년지도', 가.author === '백년지도');
  const 목록 = await C.목록읽기({ 새로: true });
  본다('목록 둘', 목록.length === 2);
  본다('공개 하나', C.공개만(목록).length === 1);
  본다('목록에 본문 없음', 목록.every((g) => !('body' in g)));
  /* 공개한 글은 주소가 안 바뀐다 */
  const 고침 = await C.저장({ id: 가.id, 값: { ...C.검사({ title: '첫 칼럼 고침', category: 'edu', body: '새 본문', slug: 'other' }).값 }, 공개: true });
  본다('공개한 글 주소 고정', 고침.slug === '첫-칼럼', 고침.slug);
  본다('작성일 유지', 고침.createdAt === 가.createdAt);
  본다('공개 글 찾기', (await C.공개글찾기('첫-칼럼'))?.body === '새 본문');
  본다('초안 글은 공개로 안 찾힘', (await C.공개글찾기('첫-칼럼-2')) === null);
  await C.지우기(가.id);
  await C.지우기(나.id);
  본다('지우면 0편', (await C.목록읽기({ 새로: true })).length === 0);
}

/* ── 7. 서버를 띄워 실제로 본다 ── */
const dist있나 = existsSync(path.join(뿌리, 'dist', '100y.html')) && existsSync(path.join(뿌리, 'dist', '100y', 'column.html'));
if (process.argv.includes('--단위만')) {
  console.log('⬜ 서버 시험은 건너뛴다(--단위만)');
} else if (!dist있나) {
  console.log('⬜ dist/100y.html 또는 dist/100y/column.html 이 없다 — 서버 시험은 «못 쟀다»(빌드 뒤 다시 돌린다)');
} else {
  const 서버폴더 = mkdtempSync(path.join(tmpdir(), 'col-srv-'));
  const 시험비번 = randomBytes(12).toString('hex');
  const 소금 = randomBytes(16).toString('hex');
  const 시험해시 = `${소금}:${scryptSync(시험비번, 소금, 64).toString('hex')}`;
  const 시험계정 = 'column-test@example.invalid';
  const PORT = 39000 + Math.floor(Math.random() * 900);
  const 자식 = spawn(process.execPath, ['server.mjs'], {
    cwd: 뿌리,
    env: { ...process.env, PORT: String(PORT), ARCHIVE_S3_BUCKET: '', ARCHIVE_S3_ENDPOINT: '', ARCHIVE_DIR: 서버폴더, ADMIN_USER: 시험계정, ADMIN_HASH: 시험해시 },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let 로그 = '';
  자식.stdout.on('data', (d) => { 로그 += d; });
  자식.stderr.on('data', (d) => { 로그 += d; });
  const 열쇠 = 'Basic ' + Buffer.from(`${시험계정}:${시험비번}`).toString('base64');

  const 부른다 = (method, p, { host = '100yearmap.com', auth = false, headers = {}, body = null } = {}) =>
    new Promise((resolve, reject) => {
      const r = http.request({ host: '127.0.0.1', port: PORT, method, path: encodeURI(decodeURI(p)), headers: { host, ...(auth ? { authorization: 열쇠 } : {}), ...headers } }, (res) => {
        const 조각 = [];
        res.on('data', (c) => 조각.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(조각).toString('utf8') }));
      });
      r.on('error', reject);
      if (body) r.write(body);
      r.end();
    });
  const 폼 = (o) => new URLSearchParams(o).toString();
  const 폼머리 = (origin = 'http://100yearmap.com') => ({ 'content-type': 'application/x-www-form-urlencoded', ...(origin ? { origin } : {}) });

  try {
    for (let i = 0; i < 60; i++) {
      try { await 부른다('GET', '/deploy-stamp.txt'); break; } catch { await new Promise((r) => setTimeout(r, 250)); }
    }
    const 무인증 = await 부른다('GET', '/admin/column');
    본다('로그인 없이 목록 → 401', 무인증.status === 401, String(무인증.status));
    const 무인증저장 = await 부른다('POST', '/admin/column/save', { headers: 폼머리(), body: 폼({ title: 'x' }) });
    본다('로그인 없이 저장 → 401', 무인증저장.status === 401, String(무인증저장.status));
    const 무인증지움 = await 부른다('POST', '/admin/column/delete', { headers: 폼머리(), body: 폼({ id: 'x' }) });
    본다('로그인 없이 삭제 → 401', 무인증지움.status === 401, String(무인증지움.status));
    const 틀린비번 = await 부른다('GET', '/admin/column', { headers: { authorization: 'Basic ' + Buffer.from(`${시험계정}:wrong`).toString('base64') } });
    본다('틀린 비밀번호 → 401', 틀린비번.status === 401);

    const 빈홈 = await 부른다('GET', '/');
    본다('칼럼 0편 — 홈 200', 빈홈.status === 200);
    본다('칼럼 0편 — 홈에 빈 칸 없음', !빈홈.body.includes('home-columns') && !빈홈.body.includes('data-slot'));
    const 빈목록 = await 부른다('GET', '/column');
    본다('칼럼 0편 — 목록 200·「아직」', 빈목록.status === 200 && 빈목록.body.includes('아직 실린 칼럼이 없습니다'));

    const 목록 = await 부른다('GET', '/admin/column', { auth: true });
    본다('로그인하면 목록 200', 목록.status === 200 && 목록.body.includes('글쓰기'));
    본다('편집국은 색인 안 함', String(목록.headers['x-robots-tag']).includes('noindex'));
    const 새글 = await 부른다('GET', '/admin/column/new', { auth: true });
    const 확인 = (새글.body.match(/name="t" value="([0-9a-f]{64})"/) ?? [])[1];
    본다('쓰기 화면에 확인값', Boolean(확인));
    const 카테고리칸 = (새글.body.match(/<option value="[a-z-]+"/g) ?? []).length;
    본다('카테고리 고르기 칸', 카테고리칸 === C.카테고리.length, String(카테고리칸));

    const 글 = { t: 확인, id: '', title: '<script>alert(1)</script> 서른둘의 결혼', subtitle: '부제', category: 'home-family', slug: '', body: '첫 문단 **굵게**\n\n[학과](/major) [나쁜](javascript:alert(1))', action: 'publish' };
    const 남의곳 = await 부른다('POST', '/admin/column/save', { auth: true, headers: 폼머리('https://evil.example'), body: 폼(글) });
    본다('다른 곳에서 보낸 저장 → 403', 남의곳.status === 403, String(남의곳.status));
    const 보낸곳없음 = await 부른다('POST', '/admin/column/save', { auth: true, headers: 폼머리(null), body: 폼(글) });
    본다('보낸 곳 없는 저장 → 403', 보낸곳없음.status === 403, String(보낸곳없음.status));
    const 틀린확인 = await 부른다('POST', '/admin/column/save', { auth: true, headers: 폼머리(), body: 폼({ ...글, t: 'f'.repeat(64) }) });
    본다('확인값 틀리면 → 403', 틀린확인.status === 403, String(틀린확인.status));
    const 너무큼 = await 부른다('POST', '/admin/column/save', { auth: true, headers: 폼머리(), body: 폼({ ...글, body: 'x'.repeat(300 * 1024) }) });
    본다('너무 큰 글 → 413', 너무큼.status === 413, String(너무큼.status));
    const 미리 = await 부른다('POST', '/admin/column/save', { auth: true, headers: 폼머리(), body: 폼({ ...글, action: 'preview' }) });
    본다('미리보기 200·저장 안 함', 미리.status === 200 && 미리.body.includes('아직 저장하지 않았습니다') && !미리.body.includes('<script>alert'));

    const 저장 = await 부른다('POST', '/admin/column/save', { auth: true, headers: 폼머리(), body: 폼(글) });
    본다('공개 저장 → 303', 저장.status === 303, `${저장.status} ${저장.body.slice(0, 200)}`);
    const 초안 = await 부른다('POST', '/admin/column/save', { auth: true, headers: 폼머리(), body: 폼({ ...글, title: '초안 글', action: 'draft' }) });
    본다('임시저장 → 303', 초안.status === 303);

    const 홈 = await 부른다('GET', '/');
    본다('홈에 칼럼 칸', 홈.body.includes('class="home-columns"') && 홈.body.includes('서른둘의 결혼'));
    본다('홈 칸 이스케이프', !홈.body.includes('<script>alert(1)</script>'));
    본다('홈에 초안 없음', !홈.body.includes('초안 글'));
    /* 1/3 자리 — 「학원을 팔지 않습니다」 표 다음, 「지금 열려 있는 것」 앞 */
    const 자리 = 홈.body.indexOf('class="home-columns"');
    본다('홈 칸 자리', 자리 > 홈.body.indexOf('어제의 나 자신') && 자리 < 홈.body.indexOf('지금 열려 있는 것'));

    const 목록2 = await 부른다('GET', '/column');
    const 주소 = (목록2.body.match(/href="(\/column\/[^"]+)"/) ?? [])[1];
    본다('목록에 글', 목록2.status === 200 && Boolean(주소) && !목록2.body.includes('초안 글'));
    const 걸러 = await 부른다('GET', '/column?c=edu');
    본다('카테고리 거르기', 걸러.status === 200 && !걸러.body.includes('서른둘의 결혼') && 걸러.body.includes('아직 실린 칼럼이 없습니다'));
    본다('카테고리 canonical', 걸러.body.includes('rel="canonical" href="https://100yearmap.com/column?c=edu"'));

    const 본 = await 부른다('GET', 주소);
    본다('글 200', 본.status === 200, String(본.status));
    본다('글 — 칼럼 머리·필자', 본.body.includes('백년지도 칼럼') && 본.body.includes('글 백년지도'));
    본다('글 — Article JSON-LD·단체 필자', /"@type":"Article"/.test(본.body) && /"author":\{"@type":"Organization","name":"백년지도"/.test(본.body));
    본다('글 — canonical 은 글 주소', 본.body.includes(`rel="canonical" href="https://100yearmap.com${주소}"`));
    본다('글 — og:type article', 본.body.includes('og:type" content="article"'));
    본다('글 — 제목 이스케이프', !본.body.includes('<script>alert(1)</script>'));
    본다('글 — javascript 링크 없음', !본.body.includes('href="javascript'));
    본다('글 — 안쪽 링크', 본.body.includes('<a href="/major">학과</a>'));
    본다('글 — noindex 아님', !/name="robots" content="noindex"/.test(본.body));

    const 없는글 = await 부른다('GET', '/column/없는-글');
    본다('없는 글 → 404', 없는글.status === 404);
    const 초안주소 = await 부른다('GET', '/column/초안-글');
    본다('초안 글은 밖에서 404', 초안주소.status === 404);

    const 지도 = await 부른다('GET', '/sitemap.xml');
    본다('사이트맵에 칼럼', 지도.body.includes('<loc>https://100yearmap.com/column/') && 지도.body.includes('<loc>https://100yearmap.com/column</loc>'));
    본다('사이트맵에 초안 없음', !지도.body.includes(encodeURIComponent('초안-글')));

    const 남의사이트 = await 부른다('GET', '/column', { host: 'seoulmarkets.com' });
    본다('다른 사이트에는 칼럼 없음', !남의사이트.body.includes('백년지도 칼럼'));

    /* 지우기 */
    const 목록3 = await 부른다('GET', '/admin/column', { auth: true });
    const ids = [...목록3.body.matchAll(/name="id" value="([0-9a-f]{12})"/g)].map((m) => m[1]);
    for (const id of ids) {
      const r = await 부른다('POST', '/admin/column/delete', { auth: true, headers: 폼머리(), body: 폼({ t: 확인, id }) });
      본다('삭제 → 303', r.status === 303, String(r.status));
    }
    const 홈2 = await 부른다('GET', '/');
    본다('다 지우면 홈 칸 사라짐', !홈2.body.includes('home-columns'));
  } catch (e) {
    본다('서버 시험 중 오류', false, String(e?.stack ?? e));
    console.log(로그.slice(-2000));
  } finally {
    자식.kill();
    try { rmSync(서버폴더, { recursive: true, force: true }); } catch {}
  }
}

try { rmSync(임시, { recursive: true, force: true }); } catch {}
console.log(`${실패 ? '⛔' : '✅'} 백년지도 칼럼 자가시험 — 통과 ${통과} · 실패 ${실패}`);
process.exit(실패 ? 1 : 0);
