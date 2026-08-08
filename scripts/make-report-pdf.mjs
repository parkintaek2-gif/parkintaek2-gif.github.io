#!/usr/bin/env node
/**
 * make-report-pdf.mjs — 업무보고 md 를 **흐르는 A4 문서** PDF 로 만든다.
 *
 * ⛔ `build-daily-report.mjs` 를 안 쓰는 이유 — 그건 **슬라이드**다. `## ` 하나가 한 장에
 *    강제로 눌려 들어가서, 넘치면 글자를 줄이다 못해 **조용히 잘린다**. 오늘 보고는
 *    표·막대·그림이 섞여 분량이 들쭉날쭉해서 슬라이드로는 반드시 무엇인가 사라진다.
 *    사장님이 못 보신 줄도 모르는 것이 제일 나쁘다. 그래서 **넘치면 다음 장으로 흐르게** 한다.
 *
 * 쓰는 법
 *   node scripts/make-report-pdf.mjs <md> [--out <pdf>]
 *   node scripts/make-report-pdf.mjs --selftest
 *
 * 규칙
 *   · 장 넘김은 브라우저가 한다. 우리가 세지 않는다 — 세면 틀린다
 *   · `![...](그림.png)` 는 **data URI 로 박는다**. 파일이 없으면 ⛔ 로 죽는다(빈칸으로 안 넘긴다)
 *   · 표·코드블록은 장 가운데서 안 갈라지게 `break-inside: avoid`
 *   · `---` 는 장 넘김이 아니라 그냥 선이다. 장을 넘기고 싶으면 `<!-- 장넘김 -->` 을 쓴다
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** 인라인 꾸밈 — **굵게** · `코드` 만. 보고에 링크는 안 쓴다 */
export function 꾸밈(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/(?<![*\w])\*([^*\n]+)\*(?!\w)/g, '<i>$1</i>');
}

/** 그림을 data URI 로 — **못 찾으면 던진다**. 빈칸으로 넘어가면 뒤에 아무도 못 알아챈다 */
export function 그림박기(그림경로, 기준폴더) {
  const 실제 = path.isAbsolute(그림경로) ? 그림경로 : path.join(기준폴더, 그림경로);
  if (!fs.existsSync(실제)) throw new Error(`⛔ 그림이 없다: ${실제} — 빈칸으로 넘기지 않는다`);
  const 확장 = path.extname(실제).slice(1).toLowerCase();
  const 종류 = 확장 === 'jpg' ? 'jpeg' : 확장;
  return `data:image/${종류};base64,${fs.readFileSync(실제).toString('base64')}`;
}

/**
 * ```진도 블록 → **진짜 표 + CSS 막대**.
 * ⛔ 글자 막대(███░░░)를 등폭 글꼴에 기대 줄 맞추던 것을 그만둔다. 이모지가 섞이면
 *    폭이 어긋나 칸이 들쭉날쭉해졌다 — 사장님이 「확 와닿지 않는다」 하신 그 모양이다.
 * 한 줄 서식:  이름 | 현재 | 목표 | 기한 | 비고
 *   · 현재/목표는 숫자. 단위는 목표에 붙여 쓴다(`133편`) — 화면에는 「133 / 133편」으로 나온다
 *   · 목표가 0 이거나 숫자가 아니면 **못 잰 것**이다. 0% 로 적지 않고 「—」로 둔다
 */
const 수 = (s) => { const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? Number(m[0]) : null; };

/**
 * ⛔ **안 끝난 것을 100% 로 적지 않는다.** 4,982/4,989 는 반올림하면 100% 인데,
 *   그 7건 안에 「약관이 세 사이트에 없다」가 들어 있다. 오늘 이 표를 보고 「② 는 다 됐네」
 *   하시면 안 된다. 끝나지 않았으면 99% 가 천장이고, 시작도 안 했으면 0% 가 바닥이다.
 */
export function 보일퍼센트(율) {
  if (율 >= 1) return 100;
  if (율 <= 0) return 0;
  return Math.min(99, Math.max(1, Math.round(율 * 100)));
}

/**
 * 문서 안의 모든 ```진도 블록을 **더해서** 한눈에 표를 만든다.
 * ⛔ 합계를 손으로 적지 않는다. 방금 손으로 적었다가 ① 을 5,260 대신 4,982 로 썼다.
 *    같은 숫자를 두 곳에 적으면 한 쪽만 고쳐진다 — 오늘 아침 그걸로 3번을 잘못 나무랐다.
 * 쓰는 법: 문서 어딘가에 빈 ```진도합계 블록을 두면 그 자리에 들어간다.
 */
export function 진도합계(원문) {
  const 덩이 = [...String(원문 ?? '').matchAll(/^#{2,3}\s+(.+?)\n+```진도\n([\s\S]*?)```/gm)];
  let 총a = 0, 총b = 0, 총끝 = 0, 총수 = 0;
  const 줄 = [];
  for (const [, 제목, 몸] of 덩이) {
    const 것들 = 몸.split('\n').map((x) => x.trim()).filter(Boolean)
      .map((x) => x.split('|').map((y) => y.trim())).filter((c) => c.length >= 3);
    let a = 0, b = 0, 끝 = 0, 잰것 = 0;
    for (const c of 것들) {
      const x = 수(c[1]), y = 수(c[2]);
      if (x === null || y === null || y <= 0) continue;
      a += x; b += y; 잰것 += 1; if (x >= y) 끝 += 1;
    }
    if (!잰것) continue;
    총a += a; 총b += b; 총끝 += 끝; 총수 += 잰것;
    /* 제목에서 「① 콘텐트 — 밖에서…」의 앞부분만 쓴다 — 표 칸에 문장이 들어가면 안 읽힌다 */
    const 짧게 = 제목.split('—')[0].replace(/\*\*/g, '').trim();
    줄.push(`${짧게} | ${a} | ${b} | | 끝난 항목 **${끝} / ${잰것}**`);
  }
  줄.push(`**전체** | ${총a} | ${총b} | | **끝난 항목 ${총끝} / ${총수}**`);
  return 진도표(줄);
}

export function 진도표(줄들) {
  const 칸 = (l) => l.split('|').map((x) => x.trim());
  const 몸 = 줄들.map((l) => l.trim()).filter(Boolean).map(칸).filter((c) => c.length >= 3);

  const 행 = 몸.map(([이름, 현재, 목표, 기한 = '', 비고 = '']) => {
    const a = 수(현재), b = 수(목표);
    const 율 = (a !== null && b !== null && b > 0) ? Math.max(0, Math.min(1, a / b)) : null;
    const 끝 = 율 === 1;
    const 폭 = 율 === null ? 0 : Math.max(율 > 0 ? 2 : 0, Math.round(율 * 100));
    const 단위 = String(목표).replace(/^[\d,\.]+/, '');
    return `<tr class="${끝 ? 'done' : ''}">
      <td class="nm">${꾸밈(이름)}</td>
      <td class="bar"><span class="track"><span class="fill${끝 ? ' ok' : ''}" style="width:${폭}%"></span></span></td>
      <td class="pc">${율 === null ? '—' : 보일퍼센트(율) + '%'}</td>
      <td class="num">${꾸밈(String(현재))} / ${꾸밈(String(목표))}${단위 ? '' : ''}</td>
      <td class="when">${꾸밈(기한)}</td>
      <td class="memo">${꾸밈(비고)}</td>
    </tr>`;
  }).join('');

  return `<table class="jindo"><thead><tr>
    <th>무엇을</th><th>진도</th><th class="pc">%</th><th class="num">현재 / 목표</th>
    <th class="when">언제까지</th><th>비고</th></tr></thead><tbody>${행}</tbody></table>`;
}

/**
 * md → html 본문. 아주 좁은 갈래만 받는다 — 보고서에 쓰는 것만.
 * @param {string} 원문
 * @param {(경로:string)=>string} 그림해결  그림 경로를 src 로 바꾸는 함수(검사에서 갈아낀다)
 */
export function 옮김(원문, 그림해결 = (p) => p) {
  const 전체 = String(원문 ?? '');
  const 줄들 = 전체.split('\n');
  const 밖 = [];
  let i = 0;
  let 표모으는중 = null;

  const 표닫기 = () => {
    if (!표모으는중) return;
    const [머리, , ...몸] = 표모으는중;
    const 칸 = (l) => l.replace(/^\||\|$/g, '').split('|').map((x) => x.trim());
    밖.push('<table><thead><tr>' + 칸(머리).map((c) => `<th>${꾸밈(c)}</th>`).join('') + '</tr></thead><tbody>');
    for (const l of 몸) 밖.push('<tr>' + 칸(l).map((c) => `<td>${꾸밈(c)}</td>`).join('') + '</tr>');
    밖.push('</tbody></table>');
    표모으는중 = null;
  };

  while (i < 줄들.length) {
    const 줄 = 줄들[i];

    /* 표 — 머리줄 다음에 |---| 가 오는 것만 표로 본다 */
    if (/^\|/.test(줄) && /^\|[\s:\-|]+\|$/.test(줄들[i + 1] ?? '')) {
      표닫기();
      표모으는중 = [줄, 줄들[i + 1]];
      i += 2;
      while (i < 줄들.length && /^\|/.test(줄들[i])) 표모으는중.push(줄들[i++]);
      표닫기();
      continue;
    }

    /* 코드블록 — 안쪽은 꾸미지 않는다 */
    if (/^```/.test(줄)) {
      표닫기();
      const 갈래 = 줄.slice(3).trim();
      const 담을것 = [];
      i += 1;
      while (i < 줄들.length && !/^```/.test(줄들[i])) 담을것.push(줄들[i++]);
      i += 1;
      /* ⚠ `진도목록` 은 **합계에 안 들어간다.** 「안 끝난 것만」 같은 발췌를 합계에 넣으면
       *   같은 일이 두 번 세어져 진도가 낮아진다. 보이는 모양은 `진도` 와 같다 */
      if (갈래 === '진도' || 갈래 === '진도목록') 밖.push(진도표(담을것));
      else if (갈래 === '진도합계') 밖.push(진도합계(전체));
      else 밖.push(`<pre>${esc(담을것.join('\n'))}</pre>`);
      continue;
    }

    표닫기();

    /* 장넘김 지시 */
    if (/^<!--\s*장넘김\s*-->/.test(줄)) { 밖.push('<div class="장넘김"></div>'); i += 1; continue; }
    /* 그 밖의 주석은 버린다 — 내부 메모가 나가면 안 된다 */
    if (/^<!--/.test(줄)) { i += 1; continue; }

    /* 그림 한 줄 */
    const 그림 = 줄.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (그림) {
      밖.push(`<figure><img src="${그림해결(그림[2])}" alt="${esc(그림[1])}"/>` +
        (그림[1] ? `<figcaption>${꾸밈(그림[1])}</figcaption>` : '') + '</figure>');
      i += 1; continue;
    }

    const h = 줄.match(/^(#{1,4})\s+(.*)$/);
    if (h) { 밖.push(`<h${h[1].length}>${꾸밈(h[2])}</h${h[1].length}>`); i += 1; continue; }

    if (/^\s*(---|___|\*\*\*)\s*$/.test(줄)) { 밖.push('<hr/>'); i += 1; continue; }

    if (/^>\s?/.test(줄)) {
      const 담을것 = [];
      while (i < 줄들.length && /^>\s?/.test(줄들[i])) 담을것.push(줄들[i++].replace(/^>\s?/, ''));
      밖.push(`<blockquote>${담을것.map(꾸밈).join('<br/>')}</blockquote>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(줄)) {
      const 담을것 = [];
      while (i < 줄들.length && /^\s*[-*]\s+/.test(줄들[i])) 담을것.push(줄들[i++].replace(/^\s*[-*]\s+/, ''));
      밖.push('<ul>' + 담을것.map((x) => `<li>${꾸밈(x)}</li>`).join('') + '</ul>');
      continue;
    }

    if (/^\s*$/.test(줄)) { i += 1; continue; }

    /* 그냥 글 — 이어지는 줄을 한 문단으로 */
    const 문단 = [줄];
    i += 1;
    while (i < 줄들.length && !/^\s*$/.test(줄들[i]) && !/^(#|>|```|\||!\[|\s*[-*]\s)/.test(줄들[i])
           && !/^\s*(---|___|\*\*\*)\s*$/.test(줄들[i])) 문단.push(줄들[i++]);
    밖.push(`<p>${문단.map(꾸밈).join('<br/>')}</p>`);
  }
  표닫기();
  return 밖.join('\n');
}

export const 겉옷 = (제목, 본문) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"/>
<title>${esc(제목)}</title><style>
  @page { size: A4; margin: 16mm 14mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: "맑은 고딕","Malgun Gothic",sans-serif; font-size: 10.5pt; line-height: 1.62;
         color: #16181d; margin: 0; }
  h1 { font-size: 20pt; margin: 0 0 4mm; letter-spacing: -.02em; }
  h2 { font-size: 14pt; margin: 9mm 0 3mm; padding-bottom: 1.6mm; border-bottom: 2px solid #16181d;
       break-after: avoid; }
  h3 { font-size: 11.5pt; margin: 6mm 0 2mm; color: #2c3140; break-after: avoid; }
  h4 { font-size: 10.5pt; margin: 4mm 0 1.5mm; color: #4a5163; break-after: avoid; }
  p { margin: 0 0 2.4mm; }
  hr { border: 0; border-top: 1px solid #d9dde5; margin: 6mm 0; }
  /* 막대·표 그림이 여기 들어온다. 등폭이라야 칸이 맞는다 */
  pre { font-family: "D2Coding",Consolas,"Courier New",monospace; font-size: 8.6pt; line-height: 1.5;
        background: #f5f6f9; border: 1px solid #e2e6ee; border-left: 3px solid #7b8394;
        border-radius: 3px; padding: 3mm 3.4mm; margin: 0 0 3mm; white-space: pre-wrap;
        word-break: break-all; break-inside: avoid; }
  code { font-family: "D2Coding",Consolas,monospace; font-size: .92em; background: #eef0f5;
         padding: .5mm 1.2mm; border-radius: 2px; }
  blockquote { margin: 0 0 3mm; padding: 2.2mm 3mm; background: #fbfaf3; border-left: 3px solid #c9ad4e;
               color: #4a4433; font-size: 9.8pt; break-inside: avoid; }
  table { width: 100%; border-collapse: collapse; margin: 0 0 3.6mm; font-size: 9.4pt;
          break-inside: avoid; }
  th, td { border: 1px solid #d9dde5; padding: 1.6mm 2.2mm; text-align: left; vertical-align: top; }
  th { background: #eef0f5; font-weight: 700; }
  ul { margin: 0 0 3mm; padding-left: 6mm; }
  li { margin: 0 0 1mm; }
  figure { margin: 0 0 5mm; break-inside: avoid; text-align: center; }
  figure img { max-width: 100%; height: auto; border: 1px solid #e2e6ee; border-radius: 4px; }
  figcaption { font-size: 9pt; color: #6b7280; margin-top: 1.6mm; }
  .장넘김 { break-after: page; }
  b { color: #0b0d12; }

  /* 진도표 — 막대는 글자가 아니라 칸이다. 이모지가 섞여도 줄이 안 어긋난다 */
  table.jindo { font-size: 9.2pt; }
  table.jindo th, table.jindo td { padding: 1.3mm 2mm; }
  table.jindo td.nm { width: 27%; font-weight: 600; }
  table.jindo td.bar { width: 22%; }
  table.jindo .track { display: block; height: 4.6mm; background: #e7eaf0; border-radius: 2px;
                       overflow: hidden; }
  table.jindo .fill { display: block; height: 100%; background: #4b6bdb; border-radius: 2px; }
  table.jindo .fill.ok { background: #2f9e5e; }
  table.jindo td.pc, table.jindo th.pc { width: 7%; text-align: right; font-variant-numeric: tabular-nums;
                                         font-weight: 700; }
  table.jindo td.num, table.jindo th.num { width: 15%; text-align: right;
                                           font-variant-numeric: tabular-nums; white-space: nowrap; }
  table.jindo td.when, table.jindo th.when { width: 10%; white-space: nowrap; }
  table.jindo td.memo { color: #4a5163; }
  table.jindo tr.done td.nm, table.jindo tr.done td.pc { color: #2f7a4e; }
</style></head><body>${본문}</body></html>`;

/* ─────────────────────────── 검사 ─────────────────────────── */
if (process.argv.includes('--selftest')) {
  let 통과 = 0, 실패 = 0;
  const 재본다 = (이름, 실제, 바람) => {
    const ok = typeof 바람 === 'function' ? 바람(실제) : 실제 === 바람;
    if (ok) { 통과 += 1; } else { 실패 += 1; console.error(`  ⛔ ${이름}\n     받은 것: ${JSON.stringify(실제)}`); }
  };
  const 던지나 = (이름, f) => { try { f(); 실패 += 1; console.error(`  ⛔ ${이름} — 안 던졌다`); } catch { 통과 += 1; } };

  재본다('굵게', 꾸밈('**가**'), '<b>가</b>');
  재본다('코드', 꾸밈('`가`'), '<code>가</code>');
  재본다('꺾쇠를 먼저 막는다', 꾸밈('<script>'), '&lt;script&gt;');
  재본다('별 하나는 기울임', 꾸밈('*가*'), '<i>가</i>');
  재본다('막대의 별표는 안 건드린다', 꾸밈('a*b'), 'a*b');

  재본다('제목 깊이', 옮김('### 셋'), '<h3>셋</h3>');
  재본다('코드블록 안은 안 꾸민다', 옮김('```\n**가**\n```'), '<pre>**가**</pre>');
  재본다('막대 글자가 살아남는다', 옮김('```\n███░░░ 51%\n```'), (s) => s.includes('███░░░ 51%'));
  재본다('표', 옮김('| 가 | 나 |\n|---|---|\n| 1 | 2 |'),
    (s) => s.includes('<th>가</th>') && s.includes('<td>2</td>'));
  재본다('표 아닌 파이프는 표가 아니다', 옮김('| 그냥 줄'), (s) => !s.includes('<table>'));
  재본다('인용', 옮김('> 사장님'), '<blockquote>사장님</blockquote>');
  재본다('목록', 옮김('- 하나\n- 둘'), '<ul><li>하나</li><li>둘</li></ul>');
  재본다('가로선은 장넘김이 아니다', 옮김('---'), '<hr/>');
  재본다('장넘김 지시', 옮김('<!-- 장넘김 -->'), '<div class="장넘김"></div>');
  재본다('내부 주석은 버린다', 옮김('<!-- 2번 파일이라 넘겼다 -->'), '');
  재본다('문단이 이어붙는다', 옮김('가\n나'), '<p>가<br/>나</p>');
  재본다('빈 입력', 옮김(''), '');
  재본다('null 도 안 죽는다', 옮김(null), '');
  재본다('그림', 옮김('![가](나.png)', () => 'DATA'),
    (s) => s.includes('src="DATA"') && s.includes('<figcaption>가</figcaption>'));
  재본다('설명 없는 그림엔 캡션이 없다', 옮김('![](나.png)', () => 'D'), (s) => !s.includes('figcaption'));
  던지나('없는 그림은 던진다', () => 그림박기('없는것.png', process.cwd()));
  재본다('겉옷에 A4', 겉옷('제목', '<p/>'), (s) => s.includes('size: A4'));
  재본다('겉옷 제목도 막는다', 겉옷('<b>x', '') , (s) => s.includes('&lt;b&gt;x'));
  재본다('표는 장 가운데서 안 갈라진다', 겉옷('t',''), (s) => /table\s*\{[^}]*break-inside:\s*avoid/.test(s));

  /* 진도표 */
  재본다('안 끝났으면 100% 로 안 적는다', 보일퍼센트(4982 / 4989), 99);
  재본다('끝났으면 100', 보일퍼센트(1), 100);
  재본다('넘쳐도 100', 보일퍼센트(2), 100);
  재본다('아무것도 안 했으면 0', 보일퍼센트(0), 0);
  재본다('조금이라도 했으면 0 이 아니다', 보일퍼센트(1 / 4957), 1);
  재본다('진도 100%', 진도표(['가|5|5|끝|']), (s) => s.includes('width:100%') && s.includes('>100%<'));
  재본다('99.9% 는 99% 로 나온다', 진도표(['가|4982|4989|오늘|']), (s) => s.includes('>99%<'));
  재본다('끝난 줄은 초록으로 표시', 진도표(['가|5|5|끝|']), (s) => s.includes('class="fill ok"'));
  재본다('안 끝난 줄은 초록이 아니다', 진도표(['가|1|5|끝|']), (s) => !s.includes('fill ok'));
  재본다('반쯤', 진도표(['가|1|2|8/9|말']), (s) => s.includes('width:50%') && s.includes('>50%<'));
  재본다('쉼표 붙은 큰 수', 진도표(['가|4,957|4,957장|계속|']), (s) => s.includes('width:100%'));
  재본다('0 은 0% 로 나온다', 진도표(['가|0|3|오늘|']), (s) => s.includes('>0%<'));
  재본다('0 은 막대가 안 찬다', 진도표(['가|0|3|오늘|']), (s) => s.includes('width:0%'));
  재본다('조금이라도 있으면 막대가 보인다', 진도표(['가|1|4957|오늘|']), (s) => s.includes('width:2%'));
  재본다('목표가 0 이면 못 잰 것 — 0% 가 아니다', 진도표(['가|0|0|오늘|']), (s) => s.includes('>—<'));
  재본다('목표가 글자면 못 잰 것', 진도표(['가|있음|모름|오늘|']), (s) => s.includes('>—<'));
  재본다('넘쳐도 100 을 안 넘는다', 진도표(['가|9|5|끝|']), (s) => s.includes('width:100%'));
  재본다('빈 줄은 버린다', 진도표(['', '  ', '가|1|2|오늘|']), (s) => (s.match(/<tr class=/g) ?? []).length === 1);
  재본다('칸이 모자란 줄은 버린다', 진도표(['가|1']), (s) => !s.includes('<tr class='));
  재본다('기한·비고 없어도 안 죽는다', 진도표(['가|1|2']), (s) => s.includes('<tr class='));
  재본다('진도 블록이 표로 나온다', 옮김('```진도\n가|1|2|오늘|말\n```'), (s) => s.includes('table class="jindo"'));
  재본다('보통 코드블록은 그대로 pre', 옮김('```\n가|1|2\n```'), (s) => s.startsWith('<pre>'));
  재본다('이름의 굵게가 산다', 진도표(['**가**|1|2|오늘|']), (s) => s.includes('<b>가</b>'));

  /* 진도합계 — 손으로 더하지 않는다 */
  const 본보기 = '## ① 가 — 하나\n\n```진도\nA|1|4|오늘|\nB|3|6|오늘|\n```\n\n## ② 나 — 둘\n\n```진도\nC|5|5|끝|\n```\n';
  재본다('합계가 두 덩이를 더한다', 진도합계(본보기), (s) => s.includes('4 / 10') || s.includes('>4 / 10<'));
  재본다('합계에 전체 줄이 있다', 진도합계(본보기), (s) => s.includes('<b>전체</b>'));
  재본다('합계 전체는 9/15', 진도합계(본보기), (s) => s.includes('9 / 15'));
  재본다('끝난 항목을 센다', 진도합계(본보기), (s) => s.includes('끝난 항목 <b>1 / 1</b>'));
  재본다('제목의 설명은 잘라 쓴다', 진도합계(본보기), (s) => s.includes('① 가') && !s.includes('하나'));
  재본다('못 잰 줄은 합계에서 뺀다', 진도합계('## ① 가\n\n```진도\nA|1|2|오늘|\nB|0|0|오늘|\n```\n'),
    (s) => s.includes('1 / 2'));
  재본다('진도 블록이 없으면 전체 줄만', 진도합계('글만 있다'), (s) => (s.match(/<tr class=/g) ?? []).length === 1);
  재본다('진도목록은 합계에 안 들어간다',
    진도합계('## 가\n\n```진도\nA|1|2|오늘|\n```\n\n## 발췌\n\n```진도목록\nA|1|2|오늘|\n```\n'),
    (s) => (s.match(/<tr class=/g) ?? []).length === 2);
  재본다('진도목록도 표로 나온다', 옮김('```진도목록\nA|1|2|오늘|\n```'), (s) => s.includes('table class="jindo"'));
  재본다('진도합계 블록이 자리를 찾는다',
    옮김('```진도합계\n```\n\n## ① 가\n\n```진도\nA|1|2|오늘|\n```'),
    (s) => (s.match(/table class="jindo"/g) ?? []).length === 2);

  console.log(실패 ? `\n⛔ ${실패}개 틀렸다 (통과 ${통과})` : `✅ 검사 ${통과}개 통과`);
  process.exit(실패 ? 1 : 0);
}

/* ─────────────────────────── 실행 ─────────────────────────── */
const 입력 = process.argv[2];
if (!입력) { console.error('⛔ md 파일을 주십시오'); process.exit(1); }
const j = process.argv.indexOf('--out');
const 출력 = j >= 0 ? process.argv[j + 1] : 입력.replace(/\.md$/, '.pdf');
const 기준폴더 = path.dirname(path.resolve(입력));

const 원문 = fs.readFileSync(입력, 'utf8');
const 제목 = (원문.split('\n').find((l) => l.startsWith('# ')) ?? '# 업무보고').slice(2).trim();
const html = 겉옷(제목, 옮김(원문, (p) => 그림박기(p, 기준폴더)));

/* 눈으로 볼 수 있게 html 도 남긴다 — **PDF 만 보면 무엇이 잘렸는지 못 본다** */
if (process.argv.includes('--html')) {
  const h = 출력.replace(/\.pdf$/, '.html');
  fs.writeFileSync(h, html, 'utf8');
  console.log(`   ↳ ${h}`);
}

const require = createRequire('C:\\Users\\USER\\Documents\\GitHub\\klifemap\\package.json');
const puppeteer = require('puppeteer-core');

const 브라우저 = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: 'new', args: ['--no-sandbox'],
});
const 장 = await 브라우저.newPage();
await 장.setContent(html, { waitUntil: 'load' });
await 장.pdf({
  path: 출력, format: 'A4', printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-size:8pt;color:#9aa0ac;font-family:sans-serif;' +
    'padding:0 14mm;text-align:right;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
  margin: { top: '16mm', bottom: '14mm', left: '14mm', right: '14mm' },
});
await 브라우저.close();

const 쪽 = fs.statSync(출력).size;
console.log(`✅ ${출력}  (${(쪽 / 1024).toFixed(0)}KB)`);
