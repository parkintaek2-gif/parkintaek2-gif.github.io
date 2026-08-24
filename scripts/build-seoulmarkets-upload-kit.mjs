#!/usr/bin/env node
/**
 * build-seoulmarkets-upload-kit.mjs — 유튜브 업로드 킷을 «미리» 짓는다.
 *
 * ── 왜 (2026-08-25, 5번 총괄 지침) ────────────────────────────
 * 채널 생성은 사장님 손이라 아직 못 연다. 하지만 5번 말대로 «올릴 것을 제대로 짓는 일»이
 * 올리는 일보다 오래 걸린다. 채널이 열린 날 51편이 빨리 나가도록 제목·설명·해시태그·순서를
 * 파일로 미리 굳힌다. (모형: archive/kcw-upload-kit.json)
 *
 * ── 5번이 겪어 알려준 규칙 ────────────────────────────────────
 * · 설명 **첫 줄에 지면 주소** — 유튜브는 접기 전 두 줄만 보여 준다.
 * · **첫날 10편 한도** — 순서를 정해 둔다(freshest·강한 주제 먼저).
 * · 제목 ≤100자.
 *
 * 출력: archive/seoulmarkets-upload-kit.json
 * 자가시험: node scripts/build-seoulmarkets-upload-kit.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://seoulmarkets.com';
const OUT = path.join(ROOT, 'archive', 'seoulmarkets-upload-kit.json');
const ART_DIR = path.join(ROOT, 'content', 'articles');

/** content/articles/*.md 프론트매터를 가볍게 읽는다({ id, data:{ title, dek, category, tags, tickers, sources, pubDate } }). */
function readArticles() {
  if (!fs.existsSync(ART_DIR)) return [];
  const out = [];
  for (const f of fs.readdirSync(ART_DIR).filter((x) => x.endsWith('.md'))) {
    const txt = fs.readFileSync(path.join(ART_DIR, f), 'utf8');
    const m = txt.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    const fm = m[1];
    const scalar = (k) => { const r = fm.match(new RegExp(`^${k}:\\s*"?([^"\\n]+?)"?\\s*$`, 'm')); return r ? r[1].trim() : ''; };
    const arr = (k) => { const r = fm.match(new RegExp(`^${k}:\\s*\\[([^\\]]*)\\]`, 'm')); return r ? r[1].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean) : []; };
    const firstOrg = (() => { const r = fm.match(/sources:[\s\S]*?- org:\s*"?([^"\n]+?)"?\s*$/m); return r ? r[1].trim() : ''; })();
    out.push({
      id: f.replace(/\.md$/, ''),
      data: { title: scalar('title'), dek: scalar('dek'), category: scalar('category'), tags: arr('tags'), tickers: arr('tickers'), sources: firstOrg ? [{ org: firstOrg }] : [], pubDate: scalar('pubDate') },
    });
  }
  // 최신순(pubDate desc)
  out.sort((a, b) => String(b.data.pubDate).localeCompare(String(a.data.pubDate)));
  return out;
}

function hashtags(tags = []) {
  // 태그를 유튜브 해시태그로. 공백 제거, 영문·숫자만. 최대 5개(유튜브는 3개까지 제목 위에 보여줌).
  const base = ['Korea', 'KoreanStocks', 'KOSPI'];
  const extra = tags
    .map((t) => t.replace(/[^a-zA-Z0-9]+/g, ''))
    .filter(Boolean)
    .map((t) => t[0].toUpperCase() + t.slice(1));
  return [...new Set([...base, ...extra])].slice(0, 6).map((t) => '#' + t);
}

function buildEntry(a, order) {
  const url = `${SITE}/article/${a.id}`;
  const src = (a.data.sources && a.data.sources[0] && a.data.sources[0].org) || 'official Korean data';
  const tags = hashtags([...(a.data.tags || []), ...(a.data.tickers || [])]);
  // 설명: 첫 줄 = 지면 주소(유튜브 2줄 규칙). 그 다음 dek, 출처, 면책, 해시태그.
  const description = [
    url,
    '',
    a.data.dek,
    '',
    `Source: ${src}. Every figure is a share or a ratio — scale-invariant. Not investment advice.`,
    '',
    tags.join(' '),
  ].join('\n');
  return {
    order,
    day: Math.floor((order - 1) / 10) + 1, // 첫날 10편 한도 → 하루 10편씩
    id: a.id,
    file: `public/video/${a.id}.mp4`,
    title: a.data.title.slice(0, 100),
    description,
    hashtags: tags,
    pageUrl: url,
    category: a.data.category,
  };
}

async function main() {
  if (process.argv.includes('--self-test')) {
    const fake = { id: 'x', data: { title: 'T'.repeat(120), dek: 'D', tags: ['bond-yield', 'korea'], tickers: [], sources: [{ org: 'KRX' }], category: 'rates' } };
    const e = buildEntry(fake, 11);
    const ok =
      e.title.length === 100 &&
      e.day === 2 &&
      e.description.split('\n')[0] === 'https://seoulmarkets.com/article/x' &&
      e.hashtags.includes('#Korea');
    if (!ok) { console.error('❌ 자가시험 실패', { titleLen: e.title.length, day: e.day, firstLine: e.description.split('\n')[0] }); process.exit(1); }
    console.log('✅ 자가시험 통과 — 제목100·첫줄주소·10편/일·해시태그');
    return;
  }

  const all = readArticles();
  const withVideo = all.filter((a) => fs.existsSync(path.join(ROOT, `public/video/${a.id}.mp4`)) && fs.existsSync(path.join(ROOT, `public/cardnews/${a.id}-1.png`)));
  // 순서: 최신순(freshest 먼저).
  const kit = withVideo.map((a, i) => buildEntry(a, i + 1));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({
    site: 'SeoulMarkets',
    channelNote: 'YouTube channel creation is the boss\'s action (bundled by unit 5 into the 15:30 request). This kit is ready for the day it opens.',
    rules: ['Description line 1 = page URL (YouTube shows 2 lines before "more")', 'First day caps at 10 uploads', 'Title <= 100 chars', 'Videos are silent 9:16, ~20s'],
    total: kit.length,
    days: Math.ceil(kit.length / 10),
    videos: kit,
  }, null, 2) + '\n');

  console.log(`✅ 업로드 킷 · ${kit.length}편 · ${Math.ceil(kit.length / 10)}일치(10편/일) → ${path.relative(ROOT, OUT)}`);
  console.log(`   1편 예: "${kit[0]?.title}" → ${kit[0]?.pageUrl}`);
}

main();
