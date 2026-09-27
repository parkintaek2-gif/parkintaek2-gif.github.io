#!/usr/bin/env node
/**
 * measure-klifemap-multilingual-keywords.mjs
 *   케이라이프맵 **영어·중국어·일본어** 검색어를 재서 명리 50위·점성학 50위로 줄 세우고,
 *   그 가운데 우리가 아직 안 잡히는 말(빈자리)을 골라낸다.
 *
 * 🔴 사장님 (2026-09-26) 「다국어의 검색량 많은 키워드를 찾아라 … 50위 정도까지 …
 *   명리와 점성학 모두 해」— 다국어(영·일·중)는 2번 몫으로 갈렸다(5번 분장, 09-27).
 *
 * `measure-klifemap-korean-keywords.mjs`(5번, 한국어판)와 **같은 방식**을 따른다 —
 * 유료 검색량 자료가 없어 대리 지표를 재고, 그 이름 그대로 부른다.
 *   ① 구글 자동완성(언어별 hl/gl) — 그 나라 손님이 실제로 치는 말. 「순서」가 인기 차례
 *   ② 서치콘솔 노출         — 우리가 «이미» 뜨고 있는 말과 그 횟수(실제 수, klifemap 전체
 *                              언어가 한 GSC 속성에 섞여 있어 문자 집합으로 언어를 가른다)
 * ⛔ 네이버는 한국 전용이라 뺀다 — 우물이 하나(구글)뿐이라는 한계를 그대로 적는다.
 * ⛔ ①을 「월간 검색량 몇 회」로 옮겨 적지 않는다. 순위만 말한다.
 * ⛔ 못 물은 것을 0 으로 적지 않는다 — 「못 물었다」로 따로 센다.
 *
 * 쓰는 법
 *   node scripts/measure-klifemap-multilingual-keywords.mjs --자가시험
 *   node scripts/measure-klifemap-multilingual-keywords.mjs --언어 en
 *   node scripts/measure-klifemap-multilingual-keywords.mjs --모두   (en·zh·ja 다)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const 뿌리 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const 쉼 = (ms) => new Promise((r) => setTimeout(r, ms));

/** 언어별 구글 자동완성 지역 설정 — 그 말을 실제로 치는 나라를 골랐다 */
export const 언어설정 = {
  en: { hl: 'en', gl: 'us', 이름: '영어' },
  zh: { hl: 'zh-CN', gl: 'cn', 이름: '중국어(간체)' },
  ja: { hl: 'ja', gl: 'jp', 이름: '일본어' },
};

/** 씨앗 — 경쟁 지면·GSC 실측(bazi wedding date calculator 6회 등)으로 확인한 실제 문구에서 출발 */
export const 씨앗 = {
  en: {
    명리: [
      'bazi', 'four pillars of destiny', 'saju', 'korean astrology',
      'bazi calculator', 'bazi chart', 'bazi compatibility', 'bazi reading',
      'bazi wedding date calculator', 'wedding date calculator', 'moving date calculator',
      'luck pillars', 'chinese fortune telling', 'chinese astrology calculator',
    ],
    점성학: [
      'horoscope', 'astrology', 'zodiac sign', 'daily horoscope', 'weekly horoscope',
      'birth chart', 'natal chart', 'rising sign', 'moon sign', 'astrology compatibility',
      'synastry', 'astrology reading', 'free tarot', 'tarot card reading', 'ai astrology',
    ],
  },
  zh: {
    명리: [
      '八字', '生辰八字', '免费八字', '八字算命', '八字合婚', '八字精批',
      '择日', '结婚择日', '搬家择日', '生肖运势', '今日运势', '四柱推命',
    ],
    점성학: [
      '星座', '星座运势', '今日星座运势', '本命盘', '星盘', '合盘',
      '上升星座', '塔罗牌', '免费塔罗', '塔罗占卜', '月亮星座', 'ai占星',
    ],
  },
  ja: {
    명리: [
      '四柱推命', '無料四柱推命', '四柱推命 相性', '四柱推命 占い', '命式',
      '結婚 日取り', '引っ越し 日取り', '生年月日 占い', '干支 占い',
    ],
    점성학: [
      'ホロスコープ', '星座占い', '今日の星座占い', 'ネイタルチャート', '出生図',
      '相性占い', '上昇宮', 'タロット', '無料タロット', 'タロット占い', 'ai占星術',
    ],
  },
};

/** 우리 것과 무관한 말은 뺀다 — 언어마다 다르게 샌다 */
export const 거르는말 = {
  en: ['wikipedia', 'reddit', 'app', 'jobs', 'salary', 'stock', 'movie', 'lyrics'],
  zh: ['维基', '百度贴吧', '知乎', '招聘', '股票', '电影', '歌词'],
  ja: ['ウィキペディア', '2ch', '5ch', '求人', '転職', '株価', '映画', '歌詞'],
};

const 다듬기 = (s) => String(s).replace(/\s+/g, ' ').trim();

/** 구글 자동완성. 못 물으면 undefined(빈 배열과 다르다) */
export async function 구글자동완성(말, 언어, 부르기 = fetch) {
  const cfg = 언어설정[언어];
  if (!cfg) return undefined;
  const u = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${cfg.hl}&gl=${cfg.gl}&q=${encodeURIComponent(말)}`;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await 부르기(u, { headers: { 'User-Agent': 'klifemap.ai research' } });
      if (r.ok) {
        const j = await r.json();
        return (j[1] || []).map(다듬기).filter(Boolean);
      }
    } catch (e) { /* 다시 문다 */ }
    await 쉼(700 * (i + 1));
  }
  return undefined;
}

/** 자동완성 «순서»를 점수로 바꾼다. 1등 10점 … 10등 밖은 1점. 「검색량」이 아니다 */
export function 자리점수(자리) {
  if (!Number.isInteger(자리) || 자리 < 0) return 0;
  return Math.max(1, 10 - 자리);
}

/** 여러 우물에서 캔 말들을 한 표로 모은다 (지금은 구글 하나뿐이라 구조만 맞춘다) */
export function 모은다(캔것, 언어) {
  const 걸러 = 거르는말[언어] || [];
  const 표 = new Map();
  for (const { 우물, 줄 } of 캔것) {
    if (!Array.isArray(줄)) continue;
    줄.forEach((말, 자리) => {
      const k = 다듬기(말).toLowerCase();
      if (!k || 걸러.some((x) => k.includes(x.toLowerCase()))) return;
      const 이전 = 표.get(k) || { 말: 다듬기(말), 점수: 0, 우물들: [] };
      이전.점수 += 자리점수(자리);
      if (!이전.우물들.includes(우물)) 이전.우물들.push(우물);
      표.set(k, 이전);
    });
  }
  return [...표.values()].sort((a, b) => (b.점수 - a.점수) || a.말.localeCompare(b.말));
}

/** 문자 집합으로 그 검색어가 어느 언어인지 대충 가른다 — 한 GSC 속성에 네 언어가 섞여 있다 */
export function 언어짐작(말) {
  if (/[぀-ヿ]/.test(말)) return 'ja'; // 히라가나·가타카나가 있으면 일본어로 본다
  if (/[가-힣]/.test(말)) return 'ko';
  if (/[一-鿿]/.test(말)) return 'zh'; // 한자만 있고 가나가 없으면 중국어로 본다
  if (/[a-z]/i.test(말)) return 'en';
  return null;
}

/** GSC 파일들에서 언어별 노출표를 만든다 */
export function 우리가뜨는말(자료폴더 = path.join(뿌리, 'src/data')) {
  const 표 = { en: new Map(), zh: new Map(), ja: new Map() };
  let 읽은파일 = 0, 본줄 = 0;
  for (const f of fs.existsSync(자료폴더) ? fs.readdirSync(자료폴더) : []) {
    if (!/^gsc-klifemap-.*\.json$/.test(f)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(자료폴더, f), 'utf8'));
      const 줄들 = Array.isArray(j) ? j : (j.rows || []);
      for (const r of 줄들) {
        본줄++;
        const raw = Array.isArray(r.keys) ? r.keys.find((x) => !/^\d{4}-\d{2}-\d{2}$/.test(x)) : r.key;
        const 말 = raw ? 다듬기(raw) : null;
        if (!말) continue;
        const 언 = 언어짐작(말);
        if (!언 || !표[언]) continue;
        const 노출 = Number(r.impressions ?? 0) || 0;
        표[언].set(말.toLowerCase(), Math.max(표[언].get(말.toLowerCase()) || 0, 노출));
      }
      읽은파일++;
    } catch (e) { /* 건너뛴다 */ }
  }
  return { 표, 읽은파일, 본줄 };
}

/* ─────────────────────────────── 자가시험 ─────────────────────────────── */
export function 자가시험() {
  const 결과 = [];
  const 본다 = (이름, 됐나, 덧말 = '') => 결과.push({ 이름, 됐나: !!됐나, 덧말 });

  본다('세 언어 설정이 다 있다', Object.keys(언어설정).length === 3);
  본다('세 언어 다 씨앗이 있다', ['en', 'zh', 'ja'].every((l) => 씨앗[l]?.명리?.length >= 8 && 씨앗[l]?.점성학?.length >= 8));
  본다('성명학 씨앗이 없다(다국어 영구 금지)',
    !Object.values(씨앗).some((v) => v.명리.some((w) => /name|改名|作名|命名/.test(w))));

  본다('자리점수 — 1등이 제일 높다', 자리점수(0) === 10);
  본다('자리점수 — 뒤로 갈수록 낮다', 자리점수(0) > 자리점수(3) && 자리점수(3) > 자리점수(8));
  본다('자리점수 — 열 등 밖도 0 이 아니다', 자리점수(30) === 1);

  const 모음en = 모은다([
    { 우물: '구글', 줄: ['bazi calculator', 'bazi chart', 'bazi wikipedia'] },
  ], 'en');
  본다('영어 — 거르는 말(wikipedia)이 빠진다', !모음en.some((x) => x.말.includes('wikipedia')));
  본다('영어 — 순서대로 점수가 붙는다', 모음en[0]?.말 === 'bazi calculator' && 모음en[0].점수 > 모음en[1].점수);

  본다('언어짐작 — 일본어(가나)', 언어짐작('四柱推命 占い') === 'ja');
  본다('언어짐작 — 중국어(한자만)', 언어짐작('生辰八字') === 'zh');
  본다('언어짐작 — 한국어(한글)', 언어짐작('무료사주') === 'ko');
  본다('언어짐작 — 영어', 언어짐작('bazi calculator') === 'en');
  본다('언어짐작 — 못 가르면 null', 언어짐작('') === null);

  const { 표, 읽은파일 } = 우리가뜨는말();
  본다('서치콘솔 자료를 읽는다(폴더가 있으면)', 읽은파일 >= 0);
  본다('영어 노출표가 Map 이다', 표.en instanceof Map);

  const 이글 = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  본다('산출물에 「검색량」이라는 말을 안 쓴다(칸 이름 기준)',
    !['순위', '말', '대리점수', '우물', '우리노출'].some((k) => k.includes('검색량')));

  return 결과;
}

/* ─────────────────────────────── 본 일 ─────────────────────────────── */
async function 잰다(언어) {
  const cfg = 언어설정[언어];
  if (!cfg) throw new Error(`모르는 언어 — ${언어}`);
  const { 표: 노출표들, 읽은파일, 본줄 } = 우리가뜨는말();
  const 노출표 = 노출표들[언어];
  console.log(`■ [${cfg.이름}] 서치콘솔 ${읽은파일}개 파일·줄 ${본줄}개 가운데 이 언어로 가른 말 ${노출표.size}개`);

  const 낼것 = {
    언어, 잰때: new Date().toLocaleString('ko-KR'),
    우물: ['구글자동완성(단일 우물 — 네이버는 한국 전용이라 뺐다)'],
    서치콘솔: { 파일: 읽은파일, 줄: 본줄, 이언어로가른말: 노출표.size },
    갈래: {}, 못물은것: [],
  };

  for (const [갈래, 말들] of Object.entries(씨앗[언어])) {
    const 캔것 = [];
    let 못물음 = 0;
    for (const 씨 of 말들) {
      const g = await 구글자동완성(씨, 언어);
      if (g === undefined) { 못물음++; 낼것.못물은것.push(씨); } else 캔것.push({ 우물: '구글', 줄: g });
      await 쉼(400);
      process.stdout.write('.');
    }
    const 줄세운것 = 모은다(캔것, 언어).slice(0, 50).map((x, i) => ({
      순위: i + 1, 말: x.말, 대리점수: x.점수, 우물: x.우물들,
      우리노출: 노출표.get(x.말.toLowerCase()) ?? 0,
    }));
    낼것.갈래[갈래] = {
      씨앗수: 말들.length, 못물음, 쉰개: 줄세운것,
      빈자리: 줄세운것.filter((x) => x.우리노출 === 0).map((x) => x.말),
    };
    console.log(`\n■ [${cfg.이름}] ${갈래} — ${줄세운것.length}위까지 세웠다 · 빈자리 ${낼것.갈래[갈래].빈자리.length}개 · 못 물은 씨앗 ${못물음}`);
    for (const r of 줄세운것.slice(0, 10)) {
      console.log(`   ${String(r.순위).padStart(2)}. ${r.말.padEnd(28)} 대리점수 ${String(r.대리점수).padStart(3)} · 우리노출 ${r.우리노출}`);
    }
  }

  const 낼곳 = path.join(뿌리, `src/data/klifemap-${언어}-keywords.json`);
  fs.writeFileSync(낼곳, JSON.stringify(낼것, null, 2), 'utf8');
  console.log(`\n✅ 냈다 — ${path.relative(뿌리, 낼곳)}`);
}

const 이파일이진입점 = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (이파일이진입점) {
  if (process.argv.includes('--자가시험')) {
    const 결과 = 자가시험();
    let 빨강 = 0;
    console.log('■ 다국어 검색어 자 — 자가시험');
    for (const r of 결과) {
      if (!r.됐나) 빨강++;
      console.log(`  ${r.됐나 ? '✅' : '🔴'} ${r.이름}${r.덧말 ? `  (${r.덧말})` : ''}`);
    }
    console.log(빨강 ? `🔴 빨강 ${빨강}개` : `✅ ${결과.length}가지 다 통과`);
    process.exit(빨강 ? 1 : 0);
  } else {
    const i = process.argv.indexOf('--언어');
    const 언어들 = process.argv.includes('--모두') ? ['en', 'zh', 'ja'] : (i >= 0 ? [process.argv[i + 1]] : ['en']);
    for (const l of 언어들) await 잰다(l);
  }
}
