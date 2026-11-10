import { AlignJustify } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'css-flexbox-playground',
  path: '/css-flexbox-playground',
  keywords: [
    'css',
    'flexbox',
    'flex',
    'justify-content',
    'align-items',
    'playground',
    '弹性布局',
    '弹性盒',
    '布局预览',
  ],
  icon: AlignJustify,
  component: () => import('./CssFlexboxPlayground'),
  createdAt: '2026-11-10',
  wide: true,
})
