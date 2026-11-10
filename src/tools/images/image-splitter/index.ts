import { Grid2x2 } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-splitter',
  path: '/image-splitter',
  keywords: [
    'split image',
    'image splitter',
    'crop grid',
    'slice image',
    'grid cut',
    'divide image',
    '图片切割',
    '图片切图',
    '九宫格切图',
    '网格切分',
    '拆分图片',
    '图片分块',
  ],
  icon: Grid2x2,
  component: () => import('./ImageSplitter'),
  createdAt: '2026-11-10',
  wide: true,
})
