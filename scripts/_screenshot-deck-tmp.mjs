import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/USER/Documents/GitHub/klifemap/package.json');
const puppeteer = require('puppeteer-core');

const html = fs.readFileSync('docs/nasdaq-deck/deck.html', 'utf8');
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const page = await b.newPage();
await page.setViewport({ width: 1280, height: 720 });
await page.setContent(html, { waitUntil: 'load' });
const slides = await page.$$('section.slide');
console.log('slides found:', slides.length);
fs.mkdirSync('docs/nasdaq-deck/shots', { recursive: true });
for (let i = 0; i < slides.length; i++) {
  await slides[i].screenshot({ path: `docs/nasdaq-deck/shots/slide-${i + 1}.png` });
}
await b.close();
console.log('done');
