import { Link2 } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'url-slug-generator',
  path: '/url-slug-generator',
  keywords: [
    'slug',
    'url slug',
    'slugify',
    'seo url',
    'permalink',
    'URL 别名',
    '网址优化',
    '链接生成',
    'slug 生成器',
    '中文转拼音',
  ],
  icon: Link2,
  component: () => import('./UrlSlugGenerator'),
  createdAt: '2026-11-10',
})
