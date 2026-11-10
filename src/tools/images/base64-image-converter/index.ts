import { ImagePlus } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'base64-image-converter',
  path: '/base64-image-converter',
  keywords: [
    'base64 image',
    'image to base64',
    'base64 to image',
    'data uri',
    'dataurl',
    'image encoder',
    'base64 图片',
    '图片转 base64',
    'base64 转图片',
    'data uri 转换',
  ],
  icon: ImagePlus,
  component: () => import('./Base64ImageConverter'),
  createdAt: '2026-11-10',
})
