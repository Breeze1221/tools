import { LayoutGrid } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'css-grid-generator',
  path: '/css-grid-generator',
  keywords: [
    'css',
    'grid',
    'grid-template-columns',
    'layout',
    'generator',
    '网格布局',
    '栅格',
    'CSS 生成器',
  ],
  icon: LayoutGrid,
  component: () => import('./CssGridGenerator'),
  createdAt: '2026-11-10',
  wide: true,
})
