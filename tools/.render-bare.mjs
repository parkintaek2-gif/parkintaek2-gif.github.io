const { 재기 } = await import('../scripts/live-check.mjs');
const 표식 = ['배우자궁','조상궁','부모궁','자식궁','세운','대운','감명 근거','상신','일원','격국','생년월일'];
const r = await 재기('https://klifemap.ai/saju.html', 표식);
console.log('● 빈 지면(감명 안 돌림)에서 손님 눈에 보이는 수\n');
for (const w of 표식) {
  const v = r.셈[w] || {};
  console.log('  ' + w.padEnd(10) + ' 눈 ' + String(v.보이는곳 ?? '?').padStart(4) + '  · 판 ' + String(v.판에 ?? '?').padStart(5));
}
