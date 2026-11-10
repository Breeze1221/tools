import { Square } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'css-box-shadow-generator',
  path: '/css-box-shadow-generator',
  keywords: [
    'css',
    'box-shadow',
    'shadow',
    'drop-shadow',
    'filter',
    'generator',
    '阴影',
    '投影',
    'CSS 生成器',
  ],
  icon: Square,
  component: () => import('./CssBoxShadowGenerator'),
  createdAt: '2026-11-10',
})
