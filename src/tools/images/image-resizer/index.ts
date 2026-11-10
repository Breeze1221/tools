import { Scaling } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-resizer',
  path: '/image-resizer',
  keywords: [
    'image resizer',
    'resize image',
    'scale image',
    'change image size',
    'resize photo',
    'image dimensions',
    '图片缩放',
    '图片尺寸',
    '调整图片大小',
    '修改分辨率',
    '等比缩放',
  ],
  icon: Scaling,
  component: () => import('./ImageResizer'),
  createdAt: '2026-11-10',
  wide: true,
})
