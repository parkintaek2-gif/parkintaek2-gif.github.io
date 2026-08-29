import fs from 'node:fs';

const 본문 = (p) => {
  const h = fs.readFileSync(p, 'utf8');
  const i = h.indexOf('<body');
  return i > 0 ? h.slice(i) : h.replace(/<head[\s\S]*?<\/head>/i, '');
};

const 재다 = (p, 말들) => {
  if (!fs.existsSync(p)) { console.log(`⚠ 없다 — ${p}`); return; }
  const b = 본문(p);
  const 줄 = 말들.map((w) => `${w}:${b.toLowerCase().split(w.toLowerCase()).length - 1}`);
  console.log(p.split('/').slice(-2).join('/'), 줄.join(' · '));
};

재다('dist/wikitip/star-sign/aries.html', ['astrology', 'Wikidata']);
재다('dist/wikitip/year/2024.html', ['charted during', 'not released']);
재다('dist/wikitip/actors-in-their/20s.html', ['Wikidata', '1997', '2006']);
재다('dist/wikitip/firm/cj-enm.html', ['widest', 'same week']);
재다('public/wikitip/born-year/1996.html', ['Wikidata', 'turn 30']);
