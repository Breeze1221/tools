import { SlidersHorizontal } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-filter',
  path: '/image-filter',
  keywords: [
    'image filter',
    'photo filter',
    'css filter',
    'color adjustment',
    'brightness contrast',
    'image effects',
    '图片滤镜',
    '照片滤镜',
    '亮度对比度',
    '色彩调整',
    '图片调色',
    '滤镜预设',
  ],
  icon: SlidersHorizontal,
  component: () => import('./ImageFilter'),
  createdAt: '2026-11-10',
  wide: true,
})
