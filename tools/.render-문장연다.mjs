const { 재기 } = await import('../scripts/live-check.mjs');
const r = await 재기('https://klifemap.ai/saju.html', ['감명 근거','상신','격국','대운']);
console.log('● 손님 눈에 보이는 글자 ' + r.글길이.toLocaleString() + '자 · 제목 ' + r.제목 + '\n');
for (const w of ['감명 근거','상신','격국','대운']) {
  console.log('── 「' + w + '」 가 나오는 대목');
  let i = -1, n = 0;
  while ((i = r.글.indexOf(w, i + 1)) >= 0 && n < 3) {
    n++;
    console.log('   …' + r.글.slice(Math.max(0, i - 80), i + 80).replace(/\n/g, ' ⏎ ') + '…');
  }
  if (!n) console.log('   (없음)');
}
console.log('\n── 이 화면 앞 300자');
console.log('   ' + r.글.slice(0, 300).replace(/\n+/g, ' ⏎ '));
