#!/usr/bin/env node
/**
 * 심는다-다리열쇠.mjs
 *   서울마켓츠 배포에 `KLM_ADMIN_KEY` 를 심는다.
 *   심고 나면 server.mjs 가 **2분마다 스스로** 세 사이트 집계를
 *   케이라이프맵 관리자 화면으로 보낸다. 이 PC 가 꺼져 있어도 돈다.
 *
 * ── 🔴 왜 이 파일이 따로 있나 (2026-11-02) ─────────────────────────
 *   사장님 「케이라이프맵 관리자 페이지에 세 사이트 집계를 볼 수 있게 해」 → 「해」
 *   배포에 비밀값을 심는 일은 이 자리(5번 세션)에서 막혀 있다.
 *   그래서 **사장님이 한 줄로 실행하실 수 있게** 따로 뺐다.
 *
 * ── 쓰는 법 ───────────────────────────────────────────────────────
 *   node scripts/심는다-다리열쇠.mjs
 *   node scripts/심는다-다리열쇠.mjs --자체검사     (심지 않고 준비됐는지만 본다)
 *
 * ⛔ 열쇠 값을 화면에 한 글자도 찍지 않는다 — 길이와 성공 여부만 적는다.
 * ⛔ ctype 은 반드시 -t 로 짝을 밝힌다. 맨몸으로 치지 않는다.
 * ⛔ 이 파일에는 열쇠가 없다. 옆 저장소의 .env 에서 읽어 쓸 뿐이다.
 *    (이 저장소는 공개다 — 열쇠에서 나온 값을 여기 적지 않는다.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 열쇠자리 = path.join(뿌리, '..', 'klifemap', '.env');
const 짝 = '@parkintaek2/seoulmarkets:main';

export function 열쇠읽기() {
  try {
    const m = fs.readFileSync(열쇠자리, 'utf8').match(/^SAJU_ADMIN_KEY\s*=\s*(.+)$/m);
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
  } catch (e) { return ''; }
}

/** 나온 글에서 열쇠를 가린다 — 도구가 값을 되뿜어도 화면에 안 남게 */
export function 가린다(글, 값) {
  if (!값) return String(글 ?? '');
  return String(글 ?? '').split(값).join('(가렸다)');
}

export function 자체검사() {
  const T = [];
  const 참 = (이름, x) => T.push([이름, !!x]);
  참('열쇠 자리를 안다', typeof 열쇠자리 === 'string' && 열쇠자리.includes('klifemap'));
  참('⛔ 나온 글에서 열쇠를 가린다', 가린다('앞 ABC 뒤', 'ABC') === '앞 (가렸다) 뒤');
  참('⛔ 빈 값에는 안 터진다', 가린다(null, '') === '');
  const k = 열쇠읽기();
  참('옆 저장소에서 열쇠를 읽었다 (값은 안 찍는다)', k.length > 8);
  T.forEach(([이름, x]) => console.log((x ? '  ✅ ' : '  ❌ ') + 이름));
  const 깨짐 = T.filter((x) => !x[1]).length;
  console.log(깨짐 ? `\n■ 자체 검사 ${깨짐}건 실패` : '\n■ 자체 검사 모두 통과 — 심을 준비가 됐다');
  return 깨짐 === 0;
}

function 심는다() {
  const 값 = 열쇠읽기();
  if (!값) {
    console.log('🔴 케이라이프맵 열쇠를 못 읽었다 — ' + 열쇠자리 + ' 를 확인해 주십시오');
    return false;
  }
  console.log('■ 심을 값의 길이 ' + 값.length + '글자 (값은 찍지 않습니다)');
  const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['ctype', 'stage', 'secret', 'KLM_ADMIN_KEY', 값, '-t', 짝],
    { cwd: 뿌리, encoding: 'utf8' });
  const 나온글 = 가린다((r.stdout || '') + (r.stderr || ''), 값).trim();
  if (나온글) console.log('■ 도구가 한 말 : ' + 나온글.slice(0, 400));
  if (r.status !== 0) {
    console.log('🔴 못 심었다 — 돌아온 번호 ' + r.status);
    return false;
  }
  console.log('✅ 심었다.');
  console.log('   이제 아래 한 줄로 배포를 다시 올리면 서버가 스스로 보내기 시작합니다 —');
  console.log('   npx ctype update web -t ' + 짝);
  return true;
}

const 이파일이진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일이진입점) {
  if (process.argv.includes('--자체검사')) process.exit(자체검사() ? 0 : 1);
  else process.exit(심는다() ? 0 : 1);
}
