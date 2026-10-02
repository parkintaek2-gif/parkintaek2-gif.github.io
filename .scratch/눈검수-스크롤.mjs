import { 손님탭에서 } from '../scripts/lib/우리크롬.mjs';

const 항목 = [
  { 경로: '/health-workforce-activity-rate', w: 400, y: 1200, 이름: 'act-mid' },
  { 경로: '/health-workforce-activity-rate', w: 400, y: 2600, 이름: 'act-bottom' },
  { 경로: '/health-workforce-growth-2013-2023', w: 400, y: 1800, 이름: 'grow-mid' },
  { 경로: '/health-workforce-growth-2013-2023', w: 400, y: 3400, 이름: 'grow-mid2' },
];

for (const { 경로, w, y, 이름 } of 항목) {
  await 손님탭에서(async (page) => {
    await page.setViewport({ width: w, height: 900 });
    await page.goto(`http://127.0.0.1:3901${경로}`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 200));
    const 파일 = `.scratch/scroll-${이름}.png`;
    await page.screenshot({ path: 파일 });
    console.log('찍음', 이름);
  });
}
console.log('끝');
