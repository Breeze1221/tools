import { Tags } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'meta-tag-generator',
  path: '/meta-tag-generator',
  keywords: [
    'meta tag generator',
    'meta tags',
    'open graph',
    'og tags',
    'twitter card',
    'seo meta',
    'canonical',
    'meta 标签',
    '元标签生成',
    '社交分享标签',
    'SEO 标签',
    '页面标题',
  ],
  icon: Tags,
  component: () => import('./MetaTagGenerator'),
  createdAt: '2026-11-10',
})
