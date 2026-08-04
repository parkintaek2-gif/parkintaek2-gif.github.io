import type { APIRoute } from 'astro';
import { toCsv, csvResponse, type Column } from '../../../lib/csv';
import universities from '../../../data/100yearmap/pages-university.json';

/**
 * /data/universities.csv — 전국 대학 377개교
 *
 * ⛔ **순위 열을 넣지 않는다.** 표에 등수가 있으면 받는 쪽이 그것으로 줄을 세운다.
 *    지면에서 안 쓴다고 해 놓고 표로 흘리면 같은 일이다.
 *
 * ⚠ 「전국평균」은 **공시가 발표한 값**이다. 우리가 계산한 것이 아니다.
 *    열 이름에 그 사실이 드러나게 `전국평균` 으로 두고, 안내 지면에 한 번 더 적는다.
 *
 * ⚠ **비율에는 분모를 같이 넣는다.** 취업률만 주면 받는 쪽이 졸업자로 나눈 값이라 오해한다.
 *    졸업자·취업대상자·취업자를 함께 낸다 (분모는 취업대상자다).
 */
const cols: Column<any>[] = [
  { key: '학교ID', get: (u) => u.schlId },
  { key: '학교명', get: (u) => u.표시명 },
  { key: '캠퍼스', get: (u) => u.캠퍼스 },
  { key: '학교종류', get: (u) => u.종류 },
  { key: '설립구분', get: (u) => u.설립 },
  { key: '지역', get: (u) => u.지역 },
  { key: '공시연도', get: (u) => u.공시연도 },

  { key: '졸업자', get: (u) => u.졸업자 },
  { key: '취업대상자', get: (u) => u.취업대상자 },
  { key: '취업자', get: (u) => u.취업자 },
  { key: '취업률', get: (u) => u.취업률?.값 },
  { key: '취업률_전국평균', get: (u) => u.취업률?.전국평균 },

  { key: '재적학생', get: (u) => u.재적학생 },
  { key: '중도탈락자', get: (u) => u.중도탈락자 },
  { key: '중도탈락률', get: (u) => u.중도탈락률?.값 },
  { key: '중도탈락률_전국평균', get: (u) => u.중도탈락률?.전국평균 },

  { key: '신입생충원율', get: (u) => u.신입생충원율?.값 },
  { key: '재학생충원율', get: (u) => u.재학생충원율?.값 },
  { key: '전임교원확보율', get: (u) => u.전임교원확보율?.값 },

  { key: '출처', get: (u) => u.출처 },
  { key: '주소', get: (u) => `https://100yearmap.com${u.url}` },
];

export const GET: APIRoute = () =>
  csvResponse('100yearmap-universities.csv', toCsv(cols, universities as any[]));
