#!/usr/bin/env node
/**
 * make-kr-listed-company-names.mjs — DART CORPCODE.xml 에서 «상장사만» 골라
 * 이름 사전(src/data/kr-listed-company-names.json)을 만든다.
 *
 * 왜 (2026-09-05 · 5번 지적) — 5번의 geo-fit 자(check-kcw-geo-fit.mjs)가 SeoulMarkets를
 * 25.6% 「실명」으로 쟀지만, 6번 자료(회사 이름)가 archive/ 에만 있어 사전이 못 읽고
 * 있었다("6번 몫을 옳게 재려면 상장사 이름 목록을 src/data 에 한 벌 두십시오").
 * stock_code 가 있는 것만 상장사다(비어 있으면 비상장·펀드 등).
 */
import fs from 'node:fs';
import path from 'node:path';

const 뿌리 = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1'), '..');
const 입력 = path.join(뿌리, 'archive/raw/dart-corpcode/CORPCODE.xml');
const 출력 = path.join(뿌리, 'src/data/kr-listed-company-names.json');

/**
 * DART 의 영문명은 «법인격 꼬리»가 붙어 있다 — "ECOPRO BM CO.,LTD." · "Celltrion, Inc."
 * 그런데 우리 제목은 짧은 이름을 쓴다 — "EcoPro BM's ₩886bn raise". 꼬리를 자르지 않으면
 * 사전에 있어도 제목에서 못 걸린다(2026-09-05 · geo-fit 재보니 25.6% 그대로였다 — 이 까닭).
 */
function 줄인이름(영문) {
  return 영문
    .replace(/(\s*[,.]*\s*(CORPORATION|CORP|LIMITED|L\.L\.C|LLC|INC|CO|LTD)\.?)+\s*$/gi, '')
    .replace(/[.,]\s*$/, '')
    .trim();
}

const xml = fs.readFileSync(입력, 'utf8');
const 블록들 = xml.split('<list>').slice(1);

const 회사들 = [];
for (const 블록 of 블록들) {
  const get = (태그) => {
    const m = 블록.match(new RegExp(`<${태그}>([\\s\\S]*?)</${태그}>`));
    return m ? m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : '';
  };
  const 종목코드 = get('stock_code');
  if (!종목코드) continue; // 상장사만
  const 영문전체 = get('corp_eng_name');
  const 짧은영문 = 줄인이름(영문전체);
  if (!짧은영문 || 짧은영문.length < 2) continue; // 꼬리만 자르면 남는 게 없는 이름은 버림
  회사들.push({
    ticker: 종목코드,
    name: 짧은영문,
    회사: get('corp_name'),
    corp_code: get('corp_code'),
  });
}

fs.writeFileSync(출력, JSON.stringify({
  무엇: 'DART CORPCODE.xml 중 stock_code 있는(=상장) 법인만. 5번 geo-fit 자가 「실명(회사이름)」을 읽는 사전으로 쓴다.',
  출처: 'opendart.fss.or.kr corpCode.xml, 로컬 archive/raw/dart-corpcode/CORPCODE.xml',
  잰때: new Date().toISOString(),
  개수: 회사들.length,
  회사들,
}, null, 1));

console.log(`✅ 상장사 ${회사들.length}곳 → ${path.relative(뿌리, 출력)}`);
