#!/usr/bin/env node
/**
 * check-기사분량.mjs — **기사 본문이 1,000자(공백 뺀 수)에 닿았나 잰다.**
 *
 * 🔴 사장님 (2026-11-04) — 「**기사 1,000자 이상 쓰라고 전에 지시했잖아. 정신 안차려**」
 *
 * ⚠ 왜 이 자가 있어야 하나
 *   이 바닥은 전에도 있었다. 2026-10-22 에 내가 **직접 걷어냈다.**
 *   그때 사장님이 날씨 열 문단을 여섯 문단으로 줄여 내보내신 것을 보고
 *   「길이가 아니라 내용이구나」로 읽고 「1,200자가 바닥이다」를 지웠다.
 *   그 결과 11월 4일 배구·농구 기사가 520자와 530자로 나갔고 다시 지적받았다.
 *   ⇒ 사장님이 걷어내신 것은 **느낌과 곁가지로 늘린 분량**이지 분량 자체가 아니었다.
 *     ⛔ 말로 된 규칙은 이렇게 잊힌다. 그래서 «재는 자»로 둔다.
 *
 * ⛔ 이 자가 통과시킨다고 좋은 기사가 아니다. 자는 글자만 센다.
 * ⛔ 모자랄 때 느낌·전망으로 채우지 않는다 — 확인한 사실을 더 찾아서 채운다.
 *
 * 쓰는 법
 *   node scripts/check-기사분량.mjs docs/기사-....txt [...]
 *   node scripts/check-기사분량.mjs --자가시험
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** 사장님이 정하신 바닥 */
export const 바닥 = 1000;

/** 기사 파일에서 «본문»만 꺼낸다.
 *  ⛔ 제목·부제목·캡션·출처 메모를 함께 세면 모자란 기사가 통과한다. */
export function 본문만(글) {
  const s = String(글 ?? '');
  const 시작 = s.indexOf('[본문]');
  if (시작 < 0) return null;
  let 몸 = s.slice(시작 + '[본문]'.length);
  /* 본문 뒤에 오는 칸들 가운데 «가장 먼저» 나오는 곳에서 끊는다 */
  let 끝 = 몸.length;
  for (const 표 of ['[추천 키워드]', '[자료 출처', '[해시태그]', '[키워드]']) {
    const i = 몸.indexOf(표);
    if (i >= 0 && i < 끝) 끝 = i;
  }
  return 몸.slice(0, 끝).trim();
}

/** 공백을 뺀 글자 수 */
export function 센다(본문) {
  return String(본문 ?? '').replace(/\s/g, '').length;
}

/** 한 편을 잰다 */
export function 잰다(글, 바닥수 = 바닥) {
  const 몸 = 본문만(글);
  if (몸 === null) return { 됐나: false, 수: 0, 까닭: '[본문] 칸을 못 찾았다 — 기사 꼴이 아니다' };
  const n = 센다(몸);
  if (n < 바닥수) return { 됐나: false, 수: n, 까닭: n + '자 — ' + (바닥수 - n) + '자 모자라다' };
  return { 됐나: true, 수: n, 까닭: n + '자' };
}

const 이파일이진입점 = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (이파일이진입점 && process.argv.includes('--자가시험')) {
  let 탈 = 0;
  const 재본다 = (이름, 참) => { if (참) console.log('  ✅ ' + 이름); else { console.log('  🔴 ' + 이름); 탈 += 1; } };
  console.log('■ 자가시험');

  const 긴것 = '[제목]\n짧은 제목\n\n[본문]\n' + '가'.repeat(1200) + '\n\n[추천 키워드]\n하나 / 둘 / 셋\n';
  재본다('1,200자는 통과', 잰다(긴것).됐나);
  재본다('수를 바로 센다', 잰다(긴것).수 === 1200);

  const 짧은것 = '[제목]\n가'.repeat(50) + '\n\n[본문]\n' + '가'.repeat(500) + '\n\n[추천 키워드]\n하나\n';
  재본다('500자는 떨어진다', !잰다(짧은것).됐나);
  재본다('몇 자 모자란지 적는다', 잰다(짧은것).까닭.includes('500자 모자라다'));

  /* 🔴 제목·캡션·출처를 함께 세면 모자란 기사가 통과한다 — 이 자리를 꼭 잰다 */
  const 머리가긴것 = '[제목]\n' + '제'.repeat(400)
    + '\n\n[사진 제목 및 캡션]\n' + '캡'.repeat(400)
    + '\n\n[본문]\n' + '가'.repeat(300)
    + '\n\n[추천 키워드]\n하나\n\n[자료 출처 — 데스크용]\n' + '출'.repeat(400);
  재본다('제목·캡션·출처는 안 센다', !잰다(머리가긴것).됐나 && 잰다(머리가긴것).수 === 300);

  재본다('본문 칸이 없으면 떨어진다', !잰다('그냥 글').됐나);
  재본다('빈 글은 떨어진다', !잰다('').됐나);
  재본다('공백과 줄바꿈은 안 센다', 센다(' 가 나\n다\t라 ') === 4);
  재본다('바닥은 1,000이다', 바닥 === 1000);
  /* 추천 키워드가 자료 출처보다 뒤에 있어도 «먼저 나오는 곳»에서 끊는다 */
  const 뒤바뀐것 = '[본문]\n' + '가'.repeat(100) + '\n\n[자료 출처 — 데스크용]\n' + '출'.repeat(500) + '\n\n[추천 키워드]\n하나';
  재본다('칸 차례가 바뀌어도 먼저 나오는 곳에서 끊는다', 잰다(뒤바뀐것).수 === 100);

  console.log(탈 ? '\n🔴 ' + 탈 + '가지 떨어졌다' : '\n✅ 모두 통과');
  process.exit(탈 ? 1 : 0);
}

if (이파일이진입점 && !process.argv.includes('--자가시험')) {
  const 길들 = process.argv.slice(2).filter((x) => !x.startsWith('--'));
  if (!길들.length) { console.log('🔴 잴 기사 파일을 달라'); process.exit(1); }
  console.log('■ 기사 분량 검사 — 본문 ' + 바닥 + '자(공백 뺀 수)가 바닥이다');
  console.log('  (사장님 2026-11-04 「기사 1,000자 이상 쓰라고 전에 지시했잖아」)\n');
  let 탈 = 0;
  for (const 길 of 길들) {
    if (!fs.existsSync(길)) { console.log('🔴 ' + 길 + ' — 파일이 없다'); 탈 += 1; continue; }
    const r = 잰다(fs.readFileSync(길, 'utf8'));
    console.log((r.됐나 ? '✅ ' : '🔴 ') + path.basename(길) + ' — ' + r.까닭);
    if (!r.됐나) 탈 += 1;
  }
  if (탈) {
    console.log('\n🔴 ' + 탈 + '편이 모자라다. ⛔ 느낌으로 채우지 말고 «확인한 사실»을 더 찾아 채운다.');
    console.log('   쿼터·세트별 흐름 · 승부가 갈린 장면과 남은 시간 · 양 팀 선수 기록 ·');
    console.log('   감독의 경기 뒤 발언 · 연승연패와 순위 · 다친 선수 · 두 팀이 앞서 만났던 경기');
  } else {
    console.log('\n✅ 모두 바닥을 넘었다');
  }
  process.exitCode = 탈 ? 1 : 0;
}

export default { 바닥, 본문만, 센다, 잰다 };
