import { Stamp } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-watermarker',
  path: '/image-watermarker',
  keywords: [
    'watermark',
    'image watermark',
    'add watermark',
    'watermark image',
    'photo watermark',
    'text watermark',
    '图片水印',
    '加水印',
    '水印',
    '照片水印',
    '文字水印',
  ],
  icon: Stamp,
  component: () => import('./ImageWatermarker'),
  createdAt: '2026-11-10',
})
