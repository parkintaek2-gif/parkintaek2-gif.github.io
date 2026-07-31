import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import { SITE_URL, ADS } from './src/consts';

const el = (tagName, properties, children = []) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

/**
 * 기사 본문 한가운데(중간 h2 앞)에 광고 슬롯을 하나 끼워 넣는다.
 * 마크다운 원문을 건드리지 않으려고 HTML 트리(hast) 단계에서 처리한다.
 * 광고 미설정이면 운영 빌드에서는 아무것도 넣지 않고, 개발 중에만 자리를 보여준다.
 */
function hastInArticleAd() {
  return (tree) => {
    const configured = ADS.client !== '' && ADS.slots.inArticle !== '';
    const dev = process.env.NODE_ENV !== 'production';
    if (!configured && !dev) return;

    const headings = [];
    tree.children.forEach((node, i) => {
      if (node.type === 'element' && node.tagName === 'h2') headings.push(i);
    });
    if (headings.length < 3) return;
    const at = headings[Math.floor(headings.length / 2)];

    const node = configured
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
          { type: 'text', value: 'ad slot — in-article' },
        ]);

    tree.children.splice(at, 0, node);
  };
}

/**
 * 데이터 표가 좁은 화면에서 페이지 전체를 가로로 밀어내지 않게
 * 각 표를 가로 스크롤 컨테이너로 감싼다.
 */
function hastWrapTables() {
  return (tree) => {
    tree.children.forEach((node, i) => {
      if (node.type === 'element' && node.tagName === 'table') {
        tree.children[i] = el('div', { className: ['table-scroll'] }, [node]);
      }
    });
  };
}

export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'never',
  build: { format: 'file' },
  markdown: {
    processor: satteri({ hastPlugins: [hastInArticleAd, hastWrapTables] }),
  },
});
