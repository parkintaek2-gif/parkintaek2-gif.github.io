import fs from 'node:fs';
const LF = String.fromCharCode(10);
const p = 'scripts/check-stale-numbers.mjs';
let s = fs.readFileSync(p, 'utf8');
const 앵커 = "    확인문: 'moved from 37,962 places to 37,750',"
  + LF + '  }];';
if (!s.includes(앵커)) { console.log('🔴 자리 못 찾음'); process.exit(1); }
s = s.replace(앵커, [
  "    확인문: 'moved from 37,962 places to 37,750',",
  '  }, {',
  '    /*',
  '     * 🔴 2026-08-23 — 이 자리는 앞의 셋과 **뜻이 다르다.** 옛 수를 일부러 인용한 것이 아니다.',
  '     *   자료를 새로 캐자 「영화와 시리즈 둘 다 한 배우」 수가 다시 448 이 되었다.',
  '     *   448 은 8월 7일에 은퇴한 값이었는데, 오늘 **살아 있는 측정값으로 돌아왔다.**',
  '     * ⛔ 옛 수 목록은 「한 번 은퇴한 수」를 영구히 금지한다. 그러면 같은 수가 다시 참이 될 때',
  '     *   자가 참을 거짓이라고 부른다. 그건 자가 사람을 이기는 자리다.',
  '     * ⭐ 그래도 면제를 맨손으로 주지 않는다. 이 수는 **다른 자가 매번 자료에 대고 다시 센다** —',
  '     *   `scripts/check-join-articles.mjs` 의 「① 표 「Both film and series」」가 그것이다.',
  '     *   그 자가 있는 동안 이 수는 방치될 수 없다. 확인문은 그 칸이 아직 그 문장인지를 본다.',
  '     * ⚠ 그 자가 사라지거나 이 문장이 바뀌면 면제도 사라져야 한다.',
  '     */',
  "    파일: 'content/kculturewire/film-and-series-share-people-but-less-than-chance.md',",
  "    수: ['448'],",
  '    까닭: \'448 은 옛 수가 아니라 오늘 다시 잰 수다(영화·시리즈 둘 다 한 배우). \'',
  "      + '8월 7일에 은퇴했다가 자료가 늘며 되살아났다. check-join-articles.mjs 가 이 칸을 매번 "
  + "자료에 대고 다시 세므로, 여기 남아 있는 것은 방치가 아니라 측정 결과다',",
  "    확인문: 'have appeared in both',",
  '  }];',
].join(LF));
fs.writeFileSync(p, s);
console.log('되살아난 수 하나를 까닭과 함께 면제에 넣었다');
