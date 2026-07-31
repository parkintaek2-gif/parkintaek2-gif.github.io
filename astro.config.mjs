import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { SITE_URL, ADS } from './src/consts';
import { buildFundChart, SWITCH_JS } from './src/lib/fundchart.mjs';

/**
 * ⚠ Sätteri 의 플러그인 API 는 unified/rehype 와 다르다.
 *   rehype:  () => (tree) => { tree.children... }
 *   Sätteri: { name, element: { filter: ['tag'], visit(node, ctx) {...} } }
 *
 * 태그 이름으로 필터링된 노드만 JS 로 넘어오고, 트리 수정은 ctx 의 메서드로 한다
 * (ctx.replaceNode / insertBefore / parent / indexOf ...).
 * rehype 스타일로 쓰면 **아무 일도 일어나지 않고 조용히 넘어간다.** 실제로 그렇게
 * 당했다 — 본문 광고와 표 감싸기가 한동안 안 돌고 있었는데 눈치채지 못했다.
 */

const el = (tagName, properties = {}, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const txt = (value) => ({ type: 'text', value: String(value) });

/**
 * 기사 본문 한가운데(중간 h2 앞)에 광고 슬롯을 하나 끼워 넣는다.
 * 마크다운 원문은 건드리지 않는다.
 * 광고 미설정이면 운영 빌드에서는 아무것도 넣지 않고, 개발 중에만 자리를 보여준다.
 */
function inArticleAdPlugin() {
  const configured = ADS.client !== '' && ADS.slots.inArticle !== '';
  const dev = process.env.NODE_ENV !== 'production';

  // 문서마다 h2 를 세야 하므로 팩토리로 만들어 상태를 초기화한다.
  const seen = [];
  let inserted = false;

  return {
    name: 'in-article-ad',
    element: {
      filter: ['h2'],
      visit(node, ctx) {
        if (!configured && !dev) return;
        if (inserted) return;
        // 최상위(본문 바로 아래) h2 만 센다.
        const parent = ctx.parent(node);
        if (!parent || parent.type !== 'root') return;
        seen.push(node);
        // 세 번째 h2 앞에 넣는다. 그보다 짧은 기사에는 넣지 않는다.
        if (seen.length !== 3) return;

        const slot = configured
          ? el('aside', { className: ['ad-slot'], 'aria-label': 'Advertisement' }, [
              el('ins', {
                className: ['adsbygoogle'],
                style: 'display:block',
                'data-ad-client': ADS.client,
                'data-ad-slot': ADS.slots.inArticle,
                'data-ad-format': 'auto',
                'data-full-width-responsive': 'true',
              }),
            ])
          : el('aside', { className: ['ad-slot', 'ad-slot--placeholder'], 'aria-hidden': 'true' }, [
              txt('ad slot — in-article'),
            ]);

        ctx.insertBefore(node, slot);
        inserted = true;
      },
    },
  };
}

/**
 * 데이터 표가 좁은 화면에서 페이지 전체를 가로로 밀어내지 않게
 * 각 표를 가로 스크롤 컨테이너로 감싼다.
 */
function wrapTablesPlugin() {
  return {
    name: 'wrap-tables',
    element: {
      filter: ['table'],
      visit(node, ctx) {
        const parent = ctx.parent(node);
        if (parent && parent.type === 'element' && parent.tagName === 'div') return; // 이미 감싸짐
        ctx.wrapNode(node, el('div', { className: ['table-scroll'] }));
      },
    },
  };
}

/**
 * ```fundchart 코드펜스를 기간 전환되는 펀드 수익률 차트로 바꾼다.
 * 기사 마크다운에는 JSON 만 적으면 되고, SVG 는 빌드 때 만들어진다.
 * JSON 이 깨져 있으면 조용히 넘어가지 않고 빌드를 세운다 — 기사에 빈 자리가
 * 남은 채 발행되는 것보다 낫다.
 */
function fundChartPlugin() {
  return {
    name: 'fund-chart',
    element: {
        filter: ['code'],
        visit(node, ctx) {
          const p = node.properties ?? {};
          const cls = []
            .concat(p.className ?? [])
            .concat(typeof p.class === 'string' ? p.class.split(/\s+/) : []);
          if (!cls.includes('language-fundchart')) return;

          const raw = ctx.textContent(node);
          let spec;
          try {
            spec = JSON.parse(raw);
          } catch (e) {
            throw new Error(`fundchart 블록의 JSON 을 읽지 못했습니다: ${e.message}`);
          }
          if (!Array.isArray(spec.funds) || spec.funds.length === 0) {
            throw new Error('fundchart 블록에 funds 배열이 비어 있습니다.');
          }

          // <code> 의 부모인 <pre> 를 통째로 차트로 갈아끼운다.
          const pre = ctx.parent(node);
          ctx.replaceNode(pre && pre.tagName === 'pre' ? pre : node, buildFundChart(spec));
        },
      },
  };
}

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    // 구문강조를 끈다. 이 사이트에 코드블록은 쓸 일이 없고, 켜두면 Shiki 가 먼저 돌면서
    // ```fundchart 의 language- 클래스를 먹어버려 아래 플러그인이 블록을 못 찾는다.
    syntaxHighlight: false,
    processor: satteri({
      // 팩토리로 넘긴다 — 문서마다 클로저 상태(h2 카운트 등)가 초기화되어야 한다.
      hastPlugins: [fundChartPlugin, inArticleAdPlugin, wrapTablesPlugin],
    }),
  },
});
