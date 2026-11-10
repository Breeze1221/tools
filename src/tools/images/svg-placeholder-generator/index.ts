import { Frame } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'svg-placeholder-generator',
  path: '/svg-placeholder-generator',
  keywords: [
    'svg placeholder',
    'placeholder image',
    'placeholder generator',
    'dummy image',
    'mockup image',
    'svg generator',
    'SVG 占位图',
    '占位图生成',
    '占位图片',
    '图片占位',
  ],
  icon: Frame,
  component: () => import('./SvgPlaceholderGenerator'),
  createdAt: '2026-11-10',
})
