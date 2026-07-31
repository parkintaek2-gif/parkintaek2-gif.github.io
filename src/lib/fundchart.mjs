/**
 * 펀드 수익률 비교 차트 — 마크다운의 ```fundchart 블록을 인터랙티브 차트로 바꾼다.
 *
 * 설계 원칙
 *  1. **기간별 SVG 를 전부 미리 그려 넣는다.** 자바스크립트는 보이는 것만 바꾼다.
 *     JS 안에 레이아웃 계산을 복제하지 않으므로, 서버가 그린 것과 브라우저가 그린 것이
 *     어긋날 일이 없다.
 *  2. **JS 가 없어도 읽힌다.** 기본 기간 차트가 그대로 보이고 버튼만 동작하지 않는다.
 *  3. 외부 라이브러리 0개. 인라인 스크립트 한 조각(약 0.6KB)이 전부다.
 *
 * 마크다운 사용법
 *
 * ```fundchart
 * {
 *   "title": "3년 수익률 상위 펀드의 보수 대비 성과",
 *   "sub": "기간별 수익률, %",
 *   "source": "금융투자협회 전자공시 · 2026-06-30 기준",
 *   "periods": ["1M", "3M", "6M", "1Y", "3Y"],
 *   "default": "1Y",
 *   "funds": [
 *     { "name": "○○코리아밸류", "house": "○○자산운용", "returns": {"1M": 2.1, "1Y": 14.2} }
 *   ]
 * }
 * ```
 *
 * 값이 없는 기간은 그냥 빼면 된다. 그 기간 차트에서 해당 펀드가 빠진다.
 */

const W = 640;
const LABEL_W = 210; // 펀드명이 들어갈 왼쪽 폭
const ROW_H = 30;
const BAR_H = 18;
const PAD_T = 16;
const PAD_B = 34;

const el = (tagName, properties = {}, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const txt = (value) => ({ type: 'text', value: String(value) });

/** 눈금을 깔끔한 수로 올린다 (2.3 → 3, 14.2 → 15) */
function niceMax(v) {
  if (v <= 0) return 1;
  const steps = [1, 2, 2.5, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200];
  const hit = steps.find((s) => s >= v);
  return hit ?? Math.ceil(v / 100) * 100;
}

/** 막대 하나. 0 을 기준으로 양수는 오른쪽, 음수는 왼쪽. 데이터 끝만 둥글게. */
function bar(x0, y, w, positive) {
  const h = BAR_H;
  if (w < 1) w = 1;
  const r = Math.min(4, w);
  return positive
    ? el(
        'path',
        {
          d: `M${x0},${y} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${h - 2 * r} a${r},${r} 0 0 1 ${-r},${r} h${-(w - r)} z`,
          fill: 'var(--c1)',
        },
        [],
      )
    : el(
        'path',
        {
          d: `M${x0},${y} h${-(w - r)} a${r},${r} 0 0 0 ${-r},${r} v${h - 2 * r} a${r},${r} 0 0 0 ${r},${r} h${w - r} z`,
          fill: 'var(--c-neg)',
        },
        [],
      );
}

/** 한 기간의 SVG 하나를 통째로 만든다. */
function periodSvg(period, funds, isDefault) {
  const rows = funds
    .filter((f) => typeof f.returns?.[period] === 'number')
    .map((f) => ({ ...f, v: f.returns[period] }))
    .sort((a, b) => b.v - a.v);

  const plotW = W - LABEL_W - 20;
  const maxAbs = niceMax(Math.max(...rows.map((r) => Math.abs(r.v)), 1));
  const hasNeg = rows.some((r) => r.v < 0);
  // 음수가 있으면 0 을 가운데로, 없으면 왼쪽 끝으로 — 공간을 낭비하지 않는다.
  const zeroX = hasNeg ? LABEL_W + plotW / 2 : LABEL_W;
  const scale = hasNeg ? plotW / 2 / maxAbs : plotW / maxAbs;

  const H = PAD_T + rows.length * ROW_H + PAD_B;
  const kids = [];

  // 격자 — 0 축 양옆 한 칸씩
  const ticks = hasNeg ? [-maxAbs, -maxAbs / 2, maxAbs / 2, maxAbs] : [maxAbs / 2, maxAbs];
  for (const t of ticks) {
    const x = zeroX + t * scale;
    kids.push(
      el('line', { className: ['grid'], x1: x, y1: PAD_T - 6, x2: x, y2: H - PAD_B + 4 }, []),
    );
    kids.push(
      el('text', { x, y: H - PAD_B + 20, 'text-anchor': 'middle' }, [
        txt((t > 0 ? '+' : '') + (Math.abs(t) % 1 ? t.toFixed(1) : t)),
      ]),
    );
  }

  rows.forEach((r, i) => {
    const y = PAD_T + i * ROW_H + (ROW_H - BAR_H) / 2;
    const w = Math.abs(r.v) * scale;
    kids.push(bar(zeroX, y, w, r.v >= 0));

    // 펀드명 + 운용사. 운용사가 이 기획의 핵심이라 같이 보여준다.
    kids.push(
      el('text', { x: LABEL_W - 12, y: y + 9, 'text-anchor': 'end' }, [txt(r.name)]),
    );
    if (r.house) {
      kids.push(
        el(
          'text',
          { x: LABEL_W - 12, y: y + 20, 'text-anchor': 'end', className: ['house'] },
          [txt(r.house)],
        ),
      );
    }

    // 값 라벨은 막대 바깥쪽 끝에. 잘리지 않게 방향을 맞춘다.
    const lx = r.v >= 0 ? zeroX + w + 8 : zeroX - w - 8;
    kids.push(
      el(
        'text',
        { className: ['v'], x: lx, y: y + 13, 'text-anchor': r.v >= 0 ? 'start' : 'end' },
        [txt((r.v > 0 ? '+' : '') + r.v.toFixed(1))],
      ),
    );
  });

  kids.push(
    el('line', { className: ['axis'], x1: zeroX, y1: PAD_T - 6, x2: zeroX, y2: H - PAD_B + 4 }, []),
  );

  return el(
    'svg',
    {
      viewBox: `0 0 ${W} ${H}`,
      role: 'img',
      'data-period': period,
      hidden: isDefault ? undefined : true,
      'aria-label': `${period} 기준 수익률. ${rows
        .slice(0, 3)
        .map((r) => `${r.name} ${r.v.toFixed(1)}%`)
        .join(', ')} 순.`,
    },
    kids,
  );
}

/**
 * 버튼이 눌리면 같은 figure 안에서 해당 기간 svg 만 보여준다.
 * 한 기사에 차트가 여러 개면 이 스크립트도 여러 번 들어가므로,
 * 플래그로 한 번만 실행되게 막는다(리스너 중복 등록 방지).
 */
const SWITCH_JS = `if(!window.__fundchart){window.__fundchart=1;
document.querySelectorAll('.fundchart').forEach(function(f){
f.querySelectorAll('[data-set]').forEach(function(b){b.addEventListener('click',function(){
f.querySelectorAll('[data-set]').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
f.querySelectorAll('svg[data-period]').forEach(function(s){s.hidden=s.getAttribute('data-period')!==b.getAttribute('data-set')});
})})})}`;

export function buildFundChart(spec) {
  const periods = spec.periods?.length
    ? spec.periods
    : [...new Set(spec.funds.flatMap((f) => Object.keys(f.returns ?? {})))];
  const def = spec.default && periods.includes(spec.default) ? spec.default : periods[0];

  const head = [];
  if (spec.title) head.push(el('p', { className: ['chart__title'] }, [txt(spec.title)]));
  if (spec.sub) head.push(el('p', { className: ['chart__sub'] }, [txt(spec.sub)]));

  const buttons = el(
    'div',
    { className: ['chart__periods'], role: 'group', 'aria-label': 'Return period' },
    periods.map((p) =>
      el(
        'button',
        { type: 'button', 'data-set': p, 'aria-pressed': p === def ? 'true' : 'false' },
        [txt(p)],
      ),
    ),
  );

  const svgs = periods.map((p) => periodSvg(p, spec.funds, p === def));

  const kids = [...head, buttons, ...svgs];
  if (spec.source) {
    kids.push(el('figcaption', {}, [txt(spec.source)]));
  }
  // 스위처를 차트 안에 직접 넣는다. 나중에 트리에 끼워 넣으면 방문 대상이 아니라
  // 별도 플러그인으로는 못 붙인다(그렇게 하다 한 번 놓쳤다).
  kids.push(el('script', {}, [txt(SWITCH_JS)]));

  return el('figure', { className: ['chart', 'fundchart'] }, kids);
}

export { SWITCH_JS };
