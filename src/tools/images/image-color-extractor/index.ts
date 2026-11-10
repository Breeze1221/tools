import { Pipette } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-color-extractor',
  path: '/image-color-extractor',
  keywords: [
    'color extractor',
    'image color',
    'dominant color',
    'palette',
    'color palette',
    'extract colors',
    '图片主色',
    '主色提取',
    '配色板',
    '颜色提取',
    '调色板',
  ],
  icon: Pipette,
  component: () => import('./ImageColorExtractor'),
  createdAt: '2026-11-10',
})
