import { Frame } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-border-frame',
  path: '/image-border-frame',
  keywords: [
    'image border',
    'photo frame',
    'add border',
    'picture frame',
    'rounded corners',
    'drop shadow',
    '图片边框',
    '照片边框',
    '添加边框',
    '图片加框',
    '圆角图片',
    '阴影边框',
  ],
  icon: Frame,
  component: () => import('./ImageBorderFrame'),
  createdAt: '2026-11-10',
  wide: true,
})
