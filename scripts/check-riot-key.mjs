/**
 * Riot 키가 살아 있는지 **미리** 본다.
 *
 * ── 왜 ─────────────────────────────────────────────────────────
 * Personal Key 는 **24시간짜리**다. 수집은 매일 22:00 에 돈다.
 * 지금까지는 **22:00 에 실패하고 나서야** 죽은 줄 알았고, 그때는 이미 늦었다 —
 * **랭크 사다리는 소급이 안 된다.** 8/5 가 그렇게 영영 비었다.
 *
 * 낮에 물어보면 저녁에 못 받을 것을 미리 안다. 사장님 손은 16:00 에 한 번에 올리므로
 * **16:00 전에 알아야 그날 안에 고쳐진다.** 이 검사는 그 한 가지를 위해 있다.
 *
 * 쓰는 법
 *   node scripts/check-riot-key.mjs          살았으면 0, 죽었으면 1
 *   node scripts/check-riot-key.mjs --quiet  수집기 안에서 조용히 쓸 때
 *
 * ⛔ 키를 고치지 않는다. **CAPTCHA 때문에 사람만 재발급할 수 있다.**
 *    이 검사가 하는 일은 「언제 알았나」를 앞당기는 것뿐이다.
 * ⛔ npm test 에는 안 넣는다. 바깥 서비스에 기대는 검사라
 *    Riot 이 잠깐 흔들리면 남의 빌드까지 막는다. 사람이 부를 때만 돈다.
 */
import fs from 'node:fs';

const REGIONS = ['kr', 'na1', 'euw1'];
const 조용히 = process.argv.includes('--quiet');
const 말 = (...a) => { if (!조용히) console.log(...a); };

const env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '';
const m = env.match(/RIOT[A-Z_]*=\s*(\S+)/);
if (!m) {
  console.log('🔴 .env 에 RIOT 키가 없다');
  process.exit(1);
}
const key = m[1];

const 결과 = [];
for (const r of REGIONS) {
  try {
    const res = await fetch(
      `https://${r}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`,
      { headers: { 'X-Riot-Token': key } },
    );
    결과.push({ region: r, status: res.status });
  } catch (e) {
    결과.push({ region: r, status: 0, err: e.message });
  }
}

const 산것 = 결과.filter((x) => x.status === 200).length;
const 죽은것 = 결과.filter((x) => x.status === 401 || x.status === 403).length;

말(`Riot 키 ${key.slice(0, 12)}… · ${결과.map((x) => `${x.region} ${x.status || 'x'}`).join(' · ')}`);

/* 마지막 수집일도 같이 본다 — 키가 살아 있어도 어제 것이 없으면 그것도 알아야 한다. */
const DIR = 'archive/raw/riot-ladder';
if (fs.existsSync(DIR)) {
  const days = fs.readdirSync(DIR).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const 마지막 = days[days.length - 1];
  말(`마지막 수집 ${마지막} · 모은 날 ${days.length}일`);
}

if (산것 === REGIONS.length) {
  말('✅ 살아 있다 — 오늘 22:00 수집은 이 키로 된다');
  process.exit(0);
}
if (죽은것 > 0) {
  console.log('🔴 키가 죽었다 — 오늘 22:00 수집이 빈다. 사다리는 소급이 안 된다.');
  console.log('   사람이 developer.riotgames.com 에서 REGENERATE 해야 한다 (CAPTCHA).');
  console.log('   16:00 「사장님 손」에 올릴 것.');
  process.exit(1);
}
console.log(`⚠ 판정 못 함 — ${결과.map((x) => `${x.region} ${x.status}`).join(' · ')}`);
console.log('   401·403 이 아니면 Riot 쪽이 흔들리는 것일 수 있다. 죽었다고 단정하지 않는다.');
process.exit(2);
