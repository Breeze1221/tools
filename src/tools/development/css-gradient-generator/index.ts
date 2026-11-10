import { Palette } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'css-gradient-generator',
  path: '/css-gradient-generator',
  keywords: ['css', 'gradient', 'linear-gradient', 'radial-gradient', 'conic-gradient', '渐变', '背景'],
  icon: Palette,
  component: () => import('./CssGradientGenerator'),
  createdAt: '2026-11-10',
})
