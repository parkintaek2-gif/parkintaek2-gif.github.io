/**
 * Piper 를 받아 둔다. ⛔ 저장소 안에 넣지 않는다 — 깃에 100MB 넘는 것을 올리면 안 된다.
 * ⚠ 이 기계는 램이 빠듯하다(1.3GB 남음). 그래서 **medium** 품질을 받는다. high 는 두 배다.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const 둘곳 = 'C:\\Users\\USER\\Documents\\GitHub\\_tools\\piper';
fs.mkdirSync(둘곳, { recursive: true });

const UA = 'KCultureWire/1.0 (https://www.kculturewire.com) node';

function 내려받기(url, 낼길, 남은따라가기 = 5) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      host: u.host, path: u.pathname + u.search, headers: { 'User-Agent': UA },
    }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
        res.resume();
        if (!남은따라가기) { reject(new Error('따라가기 너무 많다')); return; }
        내려받기(new URL(res.headers.location, url).href, 낼길, 남은따라가기 - 1).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) { res.resume(); reject(new Error(`HTTP ${res.statusCode} — ${url}`)); return; }
      const 총 = Number(res.headers['content-length'] ?? 0);
      let 받은 = 0;
      const 쓰기 = fs.createWriteStream(낼길);
      res.on('data', (c) => {
        받은 += c.length;
        if (총 && 받은 % 5 < c.length) { /* 조용히 */ }
      });
      res.pipe(쓰기);
      쓰기.on('finish', () => {
        쓰기.close(() => resolve({ 낼길, 크기: fs.statSync(낼길).size }));
      });
      쓰기.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(300000, () => { req.destroy(); reject(new Error('시간 넘음')); });
    req.end();
  });
}

const 받을것 = [
  ['https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip',
    'piper_windows_amd64.zip'],
  /* 목소리 넷 — 남녀 둘씩 받아 **들어 보고 고른다**. ⛔ 안 듣고 정하지 않는다 */
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx',
    'en_US-ryan-medium.onnx'],
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/ryan/medium/en_US-ryan-medium.onnx.json',
    'en_US-ryan-medium.onnx.json'],
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx',
    'en_US-hfc_male-medium.onnx'],
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_male/medium/en_US-hfc_male-medium.onnx.json',
    'en_US-hfc_male-medium.onnx.json'],
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx',
    'en_US-amy-medium.onnx'],
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/amy/medium/en_US-amy-medium.onnx.json',
    'en_US-amy-medium.onnx.json'],
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx',
    'en_US-hfc_female-medium.onnx'],
  ['https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx.json',
    'en_US-hfc_female-medium.onnx.json'],
];

for (const [url, 이름] of 받을것) {
  const 낼길 = path.join(둘곳, 이름);
  if (fs.existsSync(낼길) && fs.statSync(낼길).size > 1000) {
    console.log(`   이미 있다 ${이름} ${(fs.statSync(낼길).size / 1048576).toFixed(1)}MB`);
    continue;
  }
  try {
    const r = await 내려받기(url, 낼길);
    console.log(`✅ ${이름.padEnd(38)} ${(r.크기 / 1048576).toFixed(1)}MB`);
  } catch (e) {
    console.error(`⛔ ${이름} — ${e.message}`);
  }
}
console.log(`\n둔 곳: ${둘곳}`);
