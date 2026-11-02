#!/usr/bin/env node
/**
 * 심는다-우리주소.mjs
 *   «우리» 바깥 주소를 서울마켓츠 배포 설정에 심는다 — 조회수에서 우리를 빼기 위해서다.
 *
 * ── 🔴 왜 (2026-11-02 · 사장님 「조회수에 우리를 빼」) ───────────────
 *   케이라이프맵에서 사람으로 센 조회 558회 중 366회(65%)가 우리였다.
 *   세 사이트도 같은 방식이어야 한다(사장님 2026-11-02 앞선 지시).
 *
 * ── 왜 저장소에 안 적나 ───────────────────────────────────────────
 *   ⛔ **이 저장소는 공개다.** 우리 바깥 주소를 여기 적지 않는다.
 *   값은 옆 저장소(klifemap, 비공개)의 server/우리주소.json 에서 읽어 온다.
 *
 * ⛔ 주소를 화면에 찍지 않는다.
 * ⚠ 심는 것과 «닿는 것»은 다른 말이다 — .cloudtype/app.yaml 의 env 에
 *   이름이 적혀 있어야 컨테이너가 읽는다. 2026-11-02 에 그 자리에서 한 번 막혔다.
 *
 * 쓰는 법
 *   node scripts/심는다-우리주소.mjs
 *   node scripts/심는다-우리주소.mjs --자체검사
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ctype자리, 가린다 } from './심는다-다리열쇠.mjs';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 짝 = '@parkintaek2/seoulmarkets:main';

/** 옆 저장소(비공개)에서 우리 주소를 읽는다. ⛔ 값을 찍지 않는다 */
export function 우리주소읽기() {
  for (const p of [path.join(뿌리, '..', 'klifemap', 'server', '우리주소.json')]) {
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (Array.isArray(j.주소) && j.주소.length) {
        return j.주소.map((x) => String(x).trim()).filter(Boolean).join(',');
      }
    } catch (e) { /* 다음 자리 */ }
  }
  return '';
}

function 심는다() {
  const 값 = 우리주소읽기();
  if (!값) {
    console.log('🔴 우리 주소를 못 읽었다 — klifemap/server/우리주소.json 을 보십시오');
    return false;
  }
  console.log('■ 심을 값의 길이 ' + 값.length + '글자 (값은 찍지 않습니다)');
  const 자리 = ctype자리();
  if (!자리) { console.log('🔴 ctype 본체를 못 찾았다'); return false; }
  const r = spawnSync(process.execPath, [자리, 'stage', 'secret', 'OUR_IPS', 값, '-t', 짝],
    { cwd: 뿌리, encoding: 'utf8' });
  const 나온글 = 가린다((r.stdout || '') + (r.stderr || ''), 값).trim();
  if (나온글) console.log('■ 도구가 한 말 : ' + 나온글.slice(0, 300));
  if (r.status !== 0) {
    console.log('🔴 못 심었다 — 돌아온 번호 ' + r.status + (r.error ? ' · ' + r.error.code : ''));
    return false;
  }
  console.log('✅ 심었다.');
  /* ⚠ 심는 것과 «닿는 것»은 다른 말이다. app.yaml 에 이름이 있어야 컨테이너가 읽는다.
     ⛔ 순서를 바꾸면 안 된다 — 없는 시크릿을 적으면 배포가 Starting 에서 멈춘다
       (.cloudtype/app.yaml 의 KDI 사고 기록 참조). 그래서 심은 «뒤»에만 적는다. */
  const 설정자리 = path.join(뿌리, '.cloudtype', 'app.yaml');
  let 설정 = fs.readFileSync(설정자리, 'utf8');
  if (설정.indexOf('name: OUR_IPS') < 0) {
    const 앵커 = ['    - name: KLM_ADMIN_KEY', '      secret: KLM_ADMIN_KEY'].join('\n');
    if (설정.indexOf(앵커) < 0) { console.log('🔴 설정에서 붙일 자리를 못 찾았다'); return false; }
    const 붙일것 = [
      앵커,
      '',
      '    # 🔴 [2026-11-02 · 사장님 「조회수에 우리를 빼」] 우리 바깥 주소.',
      '    #   이것이 없으면 우리가 본 것이 «손님»으로 세어진다 — 케이라이프맵에서',
      '    #   사람으로 센 조회의 65%가 우리였다.',
      '    #   ⛔ 값을 여기 적지 않는다. 이 저장소는 공개다.',
      '    - name: OUR_IPS',
      '      secret: OUR_IPS',
    ].join('\n');
    설정 = 설정.replace(앵커, 붙일것);
    fs.writeFileSync(설정자리, 설정);
    console.log('✅ 배포 설정에 OUR_IPS 를 적었다 (값이 아니라 이름만)');
  } else {
    console.log('■ 배포 설정에는 이미 적혀 있다');
  }
  console.log('■ 이제 배포를 올린다...');
  const a = spawnSync(process.execPath, [자리, 'apply', '-f', '.cloudtype/app.yaml', '-t', 짝],
    { cwd: 뿌리, encoding: 'utf8' });
  console.log(가린다((a.stdout || '') + (a.stderr || ''), 값).trim().slice(0, 300));
  if (a.status !== 0) {
    console.log('🔴 배포를 못 올렸다 — 돌아온 번호 ' + a.status);
    return false;
  }
  console.log('\n✅ 끝났다. 몇 분 뒤부터 관리자 화면의 수에서 우리가 빠진다.');
  return true;
}

function 안쓰는자리() {
  console.log('   ⚠ 아직 끝이 아니다 — .cloudtype/app.yaml 의 env 에 OUR_IPS 가 적혀 있어야');
  console.log('     컨테이너가 읽는다. 그 다음 apply 한다.');
  return true;
}

function 자체검사() {
  const T = []; const 참 = (이름, v) => { T.push([이름, !!v]); };
  const 값 = 우리주소읽기();
  참('옆 저장소에서 우리 주소를 읽었다 (값은 안 찍는다)', 값.length >= 7);
  참('⛔ 이 저장소 어디에도 그 값이 안 적혀 있다',
    !fs.readFileSync(path.join(뿌리, 'scripts', '심는다-우리주소.mjs'), 'utf8').includes(값));
  참('⛔ 나온 글에서 값을 가린다', 가린다('주소는 ' + 값 + ' 다', 값).indexOf(값) < 0);
  const 자리 = ctype자리();
  참('ctype 본체를 찾았다', !!자리);
  if (자리) {
    const r = spawnSync(process.execPath, [자리, '--version'], { encoding: 'utf8' });
    참('🔴 ctype 이 실제로 띄워진다', r.status === 0 && /\d/.test(r.stdout || ''));
  }
  T.forEach(([이름, v]) => console.log((v ? '  ✅ ' : '  ❌ ') + 이름));
  const 깨짐 = T.filter((x) => !x[1]).length;
  console.log(깨짐 ? '\n■ ' + 깨짐 + '건 실패' : '\n■ 자체 검사 모두 통과 — 심을 준비가 됐다');
  process.exit(깨짐 ? 1 : 0);
}

if (process.argv.includes('--자체검사')) 자체검사();
else process.exit(심는다() ? 0 : 1);
