import { createRequire } from 'node:module';
const require = createRequire('file:///C:/Users/User/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await b.newPage();
try {
  await page.goto('https://m.sports.naver.com/wfootball/article/055/0001395891', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 4000));
  const r = await page.evaluate(() => {
    const 제목 = document.querySelector('h2,h3,.ArticleHead_article_head_title__YUNFf')?.innerText
      || document.title;
    const 본문 = (document.querySelector('._article_content, #comp_news_article, .ArticleContent_comp_article_content__luCQb')?.innerText
      || document.body.innerText || '');
    const 시각 = [...document.querySelectorAll('time,.ArticleHead_article_head_info__dQbnj,span')]
      .map((e) => e.innerText).filter((t) => /20\d\d[.\-]\s?\d/.test(t || '')).slice(0, 2);
    return { 제목, 시각, 본문: 본문.replace(/\n{2,}/g, '\n').slice(0, 2200) };
  });
  console.log('제목: ' + r.제목);
  console.log('시각: ' + JSON.stringify(r.시각));
  console.log('── 본문 ──');
  console.log(r.본문);
  await page.close();
} finally { await b.disconnect(); }
