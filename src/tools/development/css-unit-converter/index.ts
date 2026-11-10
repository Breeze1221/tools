import { Ruler } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'css-unit-converter',
  path: '/css-unit-converter',
  keywords: [
    'css',
    'unit',
    'convert',
    'converter',
    'px',
    'rem',
    'em',
    'pt',
    'vw',
    'vh',
    'vmin',
    'vmax',
    'CSS 单位',
    '单位换算',
    '像素',
    '视口',
  ],
  icon: Ruler,
  component: () => import('./CssUnitConverter'),
  createdAt: '2026-11-10',
})
