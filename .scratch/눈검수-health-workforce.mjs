import { 손님탭에서 } from '../scripts/lib/우리크롬.mjs';

const 대상 = [
  '/health-workforce-activity-rate',
  '/health-workforce-growth-2013-2023',
];

for (const 경로 of 대상) {
  for (const [이름, w] of [['모바일400', 400], ['PC1280', 1280]]) {
    await 손님탭에서(async (page) => {
      await page.setViewport({ width: w, height: 900 });
      await page.goto(`http://127.0.0.1:3901${경로}`, { waitUntil: 'networkidle0', timeout: 30000 });
      const 파일 = `.scratch/${경로.replace(/\//g, '')}-${이름}.png`;
      await page.screenshot({ path: 파일, fullPage: false });
      console.log('찍음', 경로, 이름, 파일);
    });
  }
}
console.log('끝');
