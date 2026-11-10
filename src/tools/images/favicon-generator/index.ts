import { ImagePlus } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'favicon-generator',
  path: '/favicon-generator',
  keywords: [
    'favicon',
    'favicon generator',
    'ico',
    'ico generator',
    'apple touch icon',
    'webmanifest',
    'site icon',
    '网站图标',
    'favicon 生成',
    '图标生成',
    'ico 制作',
  ],
  icon: ImagePlus,
  component: () => import('./FaviconGenerator'),
  createdAt: '2026-11-09',
})
