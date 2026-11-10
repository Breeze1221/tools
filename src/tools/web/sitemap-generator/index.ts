import { Map } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'sitemap-generator',
  path: '/sitemap-generator',
  keywords: [
    'sitemap generator',
    'sitemap.xml',
    'xml sitemap',
    'urlset',
    'seo sitemap',
    'lastmod',
    'changefreq',
    '站点地图',
    'sitemap 生成',
    '搜索引擎收录',
    '优先级',
  ],
  icon: Map,
  component: () => import('./SitemapGenerator'),
  createdAt: '2026-11-10',
})
