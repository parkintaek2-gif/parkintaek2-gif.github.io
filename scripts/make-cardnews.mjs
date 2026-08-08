#!/usr/bin/env node
/**
 * 카드뉴스를 만든다 — 사장님 지시(2026-08-08 09:2x).
 *
 *   *「각 사이트에서 콘텐츠를 만들 때 네가 만든 카드뉴스를 쓰고 샘플로 줘」*
 *   *「샘플을 만들어 내가 OK 하면 그런 식으로 나오게」*
 *
 * ## 🔴 이 카드뉴스가 지키는 것 — 우리가 파는 것이 이것이다
 *
 *   ⛔ **겁주지 않는다.** 「지금 바로」·「놓치지 마세요」·「모르면 손해」를 쓰지 않는다.
 *   ⛔ **등수를 매기지 않는다.** 좋은 학교/나쁜 학교를 말하지 않는다.
 *   ✅ **못 하는 것을 먼저 말한다.** 마지막에서 두 번째 장이 늘 「이 한 장에 없는 것」이다.
 *   ✅ 숫자는 **라이브 지면에서 읽어 온 것**만 쓴다. 기억으로 적지 않는다.
 *
 * ## ⚠ 규격
 *
 *   1080×1350 (세로 4:5) — 인스타·스레드·카카오가 다 안 자르는 크기다.
 *   ⛔ 정사각(1:1)으로 만들면 스레드에서 위아래가 잘린다.
 *
 * 쓰는 법
 *   node scripts/make-cardnews.mjs --out <폴더> --자료 <json>
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const 몫 = (이름) => { const i = process.argv.indexOf(이름); return i >= 0 ? process.argv[i + 1] : null; };

/* ── 카드 한 벌 ── 숫자는 전부 라이브 /report/area/서울특별시-강동구 에서 읽은 것 ── */
const 한벌 = {
  갈피: '강동구-14곳',
  빛: '#c9a84c', 사이트: '백년지도', 주소: '100yearmap.com',
  카드: [
    {
      꼴: '표지',
      위: '서울 강동구',
      큰: '고등학교 14곳,\n한 장에',
      아래: '학교를 하나씩 검색해 종이에 옮기지 않아도 되게',
    },
    {
      꼴: '수',
      제목: '이 구는 이렇게 퍼져 있습니다',
      큰: '53.4% ~ 93.2%',
      곁: '진학률이 가장 낮은 곳부터 가장 높은 곳까지',
      아래: '퍼진 폭 39.8%p · 가운데값 66.4% · 잰 곳 12곳',
    },
    {
      꼴: '말',
      제목: '저희는 등수를 매기지 않습니다',
      글: '점 하나가 학교 한 곳입니다.\n**어디쯤인지는 읽는 분이 보십시오.**\n\n표도 가나다순이지\n잘한 순서가 아닙니다.',
    },
    {
      꼴: '표',
      제목: '낮은 것이 나쁜 것이 아닙니다',
      머리: ['갈래', '전국 「그 밖」 가운데값', '학교 수'],
      줄: [['일반고', '17.3%', '1,494곳'], ['자율고', '26.2%', '110곳'], ['특목고', '18.8%', '103곳'], ['특성화고', '37%', '3곳']],
      아래: '갈래가 다르면 이 칸이 다릅니다.\n갈래가 다른 학교끼리 진학률만 빼서 견주면 **그 뺄셈은 뜻이 없습니다.**',
    },
    {
      꼴: '말',
      제목: '그래도 못 잰 것은 못 잰 것입니다',
      글: '이 구에서 가장 낮은 곳은 배재고(자율고)입니다.\n자율고는 「그 밖」이 원래 큽니다.\n\n**그런데 배재고는 46.6% 로\n전국 자율고 가운데값(26.2%)보다도 큽니다.**\n\n왜 그런지는 저희 자료로 못 잽니다.\n못 잰 것을 「재수 때문」으로 메우지 않겠습니다.',
    },
    {
      꼴: '말',
      제목: '두 곳을 빼지 않았습니다',
      글: '상일미디어고 · 서울컨벤션고는\n진학 칸이 비어 있습니다.\n**저희가 뺀 것이 아니라 나라 공시에 줄이 없습니다.**\n\n빼면 이 구에 학교가 12곳처럼 보입니다.\n실제로는 **14곳**입니다.',
    },
    {
      꼴: '없는것',
      제목: '이 한 장에 없는 것',
      목록: [
        '내신·수능 성적, 대학 합격 실적 — 아무도 내지 않는 숫자입니다',
        '어느 대학에 갔는지 — 공시는 전문대·대학교·국외까지만 나눕니다',
        '「그 밖」이 무엇인지 — 재수·취업·미상이 한 칸에 있습니다',
      ],
      아래: '학교의 좋고 나쁨을 저희가 말하지 않습니다.\n숫자를 모아 퍼짐과 함께 놓을 뿐입니다.',
    },
    {
      꼴: '끝',
      제목: '그다음은\n저희가 답을 못 드립니다',
      글: '저희가 재는 것은 **학교**이지 아이가 아닙니다.\n같은 학교가 어떤 아이에게는 맞고\n어떤 아이에게는 안 맞는데,\n**그 차이는 이 표에 없습니다.**',
      길: '100yearmap.com',
      곁: '학교알리미 2024 공시 · 공공누리 제1유형',
    },
  ],
};

const 굵게 = (s) => String(s ?? '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

function 카드HTML(c, i, 전체, 벌) {
  const 번호 = `<div class="no">${i + 1} / ${전체}</div>`;
  const 발 = `<div class="foot"><span class="brand">${벌.사이트}</span><span class="dom">${벌.주소}</span></div>`;
  let 속;
  if (c.꼴 === '표지') {
    속 = `<div class="mid cover">
      <div class="eyebrow">${c.위}</div>
      <h1>${굵게(c.큰)}</h1>
      <p class="sub">${굵게(c.아래)}</p>
    </div>`;
  } else if (c.꼴 === '수') {
    속 = `<div class="mid">
      <h2>${굵게(c.제목)}</h2>
      <div class="side">${굵게(c.곁)}</div>
      <div class="huge">${굵게(c.큰)}</div>
      <div class="under">${굵게(c.아래)}</div>
    </div>`;
  } else if (c.꼴 === '표') {
    속 = `<div class="mid">
      <h2>${굵게(c.제목)}</h2>
      <table><tr>${c.머리.map((h) => `<th>${h}</th>`).join('')}</tr>
      ${c.줄.map((r) => `<tr>${r.map((v, k) => `<td class="${k === 0 ? 'l' : 'n'}">${v}</td>`).join('')}</tr>`).join('')}</table>
      <div class="under">${굵게(c.아래)}</div>
    </div>`;
  } else if (c.꼴 === '없는것') {
    속 = `<div class="mid">
      <h2>${굵게(c.제목)}</h2>
      <ul>${c.목록.map((x) => `<li>${굵게(x)}</li>`).join('')}</ul>
      <div class="under">${굵게(c.아래)}</div>
    </div>`;
  } else if (c.꼴 === '끝') {
    속 = `<div class="mid cover">
      <h1 class="end">${굵게(c.제목)}</h1>
      <p class="body">${굵게(c.글)}</p>
      <div class="cta">${c.길}</div>
      <div class="src">${c.곁}</div>
    </div>`;
  } else {
    속 = `<div class="mid"><h2>${굵게(c.제목)}</h2><p class="body">${굵게(c.글)}</p></div>`;
  }
  return `<!doctype html><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;background:#0b0d12;color:#e9e9ee;
       font-family:'Noto Sans KR','Malgun Gothic',sans-serif;
       padding:88px 76px 64px;display:flex;flex-direction:column;position:relative}
  body::before{content:'';position:absolute;top:0;left:0;right:0;height:9px;background:${벌.빛}}
  .no{position:absolute;top:40px;right:76px;font-size:24px;color:#5c636f;font-weight:700}
  .mid{flex:1;display:flex;flex-direction:column;justify-content:center}
  .cover{justify-content:flex-start;padding-top:60px}
  .eyebrow{font-size:32px;color:${벌.빛};font-weight:700;margin-bottom:24px;letter-spacing:1px}
  h1{font-family:'Noto Serif KR',serif;font-weight:900;font-size:92px;line-height:1.28;letter-spacing:-2px}
  h1.end{font-size:74px}
  h2{font-family:'Noto Serif KR',serif;font-weight:900;font-size:60px;line-height:1.32;
     letter-spacing:-1.5px;margin-bottom:42px}
  .sub{font-size:34px;color:#9aa0ac;margin-top:36px;line-height:1.6}
  .side{font-size:30px;color:#9aa0ac;margin-bottom:14px}
  .huge{font-family:'Noto Serif KR',serif;font-weight:900;font-size:108px;color:${벌.빛};letter-spacing:-3px}
  .under{font-size:30px;color:#9aa0ac;margin-top:36px;line-height:1.65}
  .under b{color:#e9e9ee}
  .body{font-size:38px;line-height:1.72;color:#cfd4dd}
  .body b{color:#e9e9ee}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{font-size:26px;color:#8e95a1;text-align:left;padding:0 0 16px;font-weight:500}
  th:not(:first-child){text-align:right}
  td{font-size:38px;padding:20px 0;border-top:1px solid #262b36}
  td.l{color:#cfd4dd} td.n{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}
  ul{list-style:none} li{font-size:32px;line-height:1.6;color:#cfd4dd;padding-left:44px;
     position:relative;margin-bottom:28px}
  li::before{content:'⛔';position:absolute;left:0;font-size:26px;top:4px}
  .cta{margin-top:56px;font-size:40px;font-weight:900;color:${벌.빛}}
  .src{margin-top:18px;font-size:24px;color:#5c636f}
  .foot{display:flex;align-items:baseline;gap:16px;border-top:1px solid #1d222c;padding-top:26px}
  .brand{font-family:'Noto Serif KR',serif;font-weight:900;font-size:30px;color:${벌.빛}}
  .dom{font-size:24px;color:#5c636f}
</style>
${번호}${속}${발}`;
}

/* ── 찍기 ── */
const 낼폴더 = 몫('--out') ?? '.';
fs.mkdirSync(낼폴더, { recursive: true });

const puppeteer = require('puppeteer-core');
const b = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  args: ['--no-sandbox', '--font-render-hinting=none'],
});

const 낸것 = [];
for (let i = 0; i < 한벌.카드.length; i++) {
  const html = 카드HTML(한벌.카드[i], i, 한벌.카드.length, 한벌);
  const 낼길 = path.join(낼폴더, `카드뉴스_${한벌.갈피}_${String(i + 1).padStart(2, '0')}.png`);
  const 임시 = 낼길.replace(/\.png$/, '.tmp.html');
  fs.writeFileSync(임시, html, 'utf8');
  const p = await b.newPage();
  await p.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  await p.goto('file:///' + 임시.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await p.screenshot({ path: 낼길 });
  await p.close();
  fs.unlinkSync(임시);
  낸것.push(낼길);
}
await b.close();

for (const f of 낸것) console.log(`✅ ${path.basename(f)}  (${(fs.statSync(f).size / 1024).toFixed(0)} KB)`);
console.log(`\n카드 ${낸것.length}장 · 1080×1350 · ${낼폴더}`);
