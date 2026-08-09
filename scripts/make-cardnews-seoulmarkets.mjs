/**
 * make-cardnews-seoulmarkets.mjs — 기사 한 편 → 카드뉴스(캐러셀) 여러 장 (사장님 지시 2026-08-09)
 *
 * 배포 퀴즈 Q6(카드뉴스) 이 0/44 이라 만든다. og 카드 엔진과 같은 색·폰트를 쓴다.
 * 세로 1080×1350(인스타·스레드 캐러셀). 한 편에서 5~6장:
 *   ① 표지(브랜드+큰 수+제목) ②~④ 핵심 수치(crossChecks) ⑤ 출처·투자자문아님 ⑥ CTA
 *
 * ⛔ 억지 수를 만들지 않는다 — crossChecks 에 이미 있는 문장만 슬라이드로 옮긴다.
 * 실행: node scripts/make-cardnews-seoulmarkets.mjs [slug ...]   (없으면 전체)
 * 출력: public/cardnews/<slug>-1.png ...
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 낼방 = path.join(ROOT, 'public', 'cardnews');
fs.mkdirSync(낼방, { recursive: true });

const 색 = { 바탕: '#0d1420', 결: '#161b22', 파랑: '#7ab3e6', 글: '#e7eaef', 흐림: '#929cab', 선: '#232a33' };
const 고딕 = "'Helvetica Neue',Helvetica,Arial,'Segoe UI',sans-serif";
const 명조 = "Georgia,'Times New Roman',serif";
const 막는다 = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 폭(글자수 근사)에 맞춰 줄로 나눈다. */
function 줄나눔(글, 폭) {
  const 말 = String(글).split(/\s+/);
  const 줄 = []; let 현재 = '';
  for (const w of 말) {
    if ((현재 + ' ' + w).trim().length > 폭) { if (현재) 줄.push(현재); 현재 = w; }
    else 현재 = (현재 + ' ' + w).trim();
  }
  if (현재) 줄.push(현재);
  return 줄;
}

const 프론트 = (t) => {
  const m = t.match(/^---\n([\s\S]*?)\n---/); if (!m) return {};
  const y = m[1];
  const g = (k) => (y.match(new RegExp(`^${k}:\\s*"?(.+?)"?\\s*$`, 'm')) || [])[1];
  const 리스트 = (k) => {
    const 줄들 = y.split('\n');
    const start = 줄들.findIndex((l) => l.trim() === `${k}:`);
    if (start < 0) return [];
    const out = [];
    for (let i = start + 1; i < 줄들.length; i++) {
      const l = 줄들[i];
      if (!/^\s/.test(l)) break;              // 들여쓰기 끝 = 다음 키
      const m2 = l.match(/^\s*-\s*"?(.+?)"?\s*$/);
      if (m2) out.push(m2[1]);
    }
    return out;
  };
  const src = (y.match(/org:\s*"([^"]+)"/) || [])[1] || 'SeoulMarkets';
  return { title: g('title'), dek: g('dek'), crossChecks: 리스트('crossChecks'), source: src };
};

const cards = (() => {
  const p = path.join(ROOT, 'src/data/seoulmarkets-og-cards.json');
  return fs.existsSync(p) ? (JSON.parse(fs.readFileSync(p, 'utf8')).chosen || {}) : {};
})();

const W = 1080, H = 1350, M = 90;
const 틀 = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${색.바탕}"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${색.파랑}"/>
  <text x="${M}" y="120" font-family="${고딕}" font-size="30" font-weight="bold" fill="${색.파랑}" letter-spacing="7">SEOUL MARKETS</text>
  ${inner}
  <text x="${M}" y="${H - 70}" font-family="${고딕}" font-size="26" fill="${색.흐림}">Measured, not repeated</text>
  <text x="${W - M}" y="${H - 70}" text-anchor="end" font-family="${고딕}" font-size="26" fill="${색.파랑}" letter-spacing="1">seoulmarkets.com</text>
</svg>`;

function 표지(figure, title) {
  const 제목 = 줄나눔(title, 26).slice(0, 5);
  let s = '';
  if (figure) s += `<text x="${M}" y="430" font-family="${명조}" font-size="150" font-weight="bold" fill="${색.글}" letter-spacing="-3">${막는다(figure)}</text>`;
  s += `<line x1="${M}" y1="500" x2="${W - M}" y2="500" stroke="${색.선}" stroke-width="1"/>`;
  s += 제목.map((줄, i) => `<text x="${M}" y="${580 + i * 66}" font-family="${고딕}" font-size="52" font-weight="bold" fill="${색.글}">${막는다(줄)}</text>`).join('\n  ');
  return 틀(s);
}
function 사실(n, 총, 문장) {
  const 줄 = 줄나눔(문장, 30).slice(0, 12);
  let s = `<text x="${M}" y="240" font-family="${고딕}" font-size="30" font-weight="bold" fill="${색.파랑}" letter-spacing="2">${n} / ${총}</text>`;
  s += 줄.map((l, i) => `<text x="${M}" y="${360 + i * 62}" font-family="${고딕}" font-size="46" fill="${색.글}">${막는다(l)}</text>`).join('\n  ');
  return 틀(s);
}
function 마무리(source) {
  const 출 = 줄나눔(`Source: ${source}`, 40).slice(0, 4);
  let s = `<text x="${M}" y="360" font-family="${명조}" font-size="60" font-weight="bold" fill="${색.글}">License the data.</text>`;
  s += 출.map((l, i) => `<text x="${M}" y="${470 + i * 46}" font-family="${고딕}" font-size="32" fill="${색.흐림}">${막는다(l)}</text>`).join('\n  ');
  s += `<text x="${M}" y="720" font-family="${고딕}" font-size="34" fill="${색.흐림}">Not investment advice.</text>`;
  s += `<text x="${M}" y="800" font-family="${고딕}" font-size="40" font-weight="bold" fill="${색.파랑}">seoulmarkets.com/data</text>`;
  return 틀(s);
}

const 대상 = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs.readdirSync(path.join(ROOT, 'content/articles')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));

let 만든편 = 0; let 만든장 = 0; const 막힘 = [];
for (const slug of 대상) {
  const fp = path.join(ROOT, 'content/articles', `${slug}.md`);
  if (!fs.existsSync(fp)) { 막힘.push(`${slug} 없음`); continue; }
  const fm = 프론트(fs.readFileSync(fp, 'utf8'));
  const cc = (fm.crossChecks || []).slice(0, 3);
  if (!fm.title || cc.length === 0) { 막힘.push(`${slug} — title/crossChecks 부족`); continue; }
  const figure = cards[slug]?.figure || '';
  const slides = [표지(figure, fm.title), ...cc.map((c, i) => 사실(i + 1, cc.length, c)), 마무리(fm.source)];
  for (let i = 0; i < slides.length; i++) {
    const png = await sharp(Buffer.from(slides[i])).png().toBuffer();
    fs.writeFileSync(path.join(낼방, `${slug}-${i + 1}.png`), png);
    만든장++;
  }
  만든편++;
}
console.log(`카드뉴스 ${만든편}편 · ${만든장}장 → public/cardnews/<slug>-N.png`);
if (막힘.length) console.log(`⚠ 건너뜀 ${막힘.length}: ${막힘.slice(0, 5).join(' · ')}`);
console.log('⚠ 한 장을 실제로 열어 글이 안 잘리는지 보고 커밋한다.');
