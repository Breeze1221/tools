import { RotateCw } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-rotate-flip',
  path: '/image-rotate-flip',
  keywords: [
    'rotate image',
    'flip image',
    'mirror image',
    'rotate photo',
    'flip horizontal',
    'flip vertical',
    '图片旋转',
    '图片翻转',
    '镜像图片',
    '水平翻转',
    '垂直翻转',
    '旋转图片',
  ],
  icon: RotateCw,
  component: () => import('./ImageRotateFlip'),
  createdAt: '2026-11-10',
  wide: true,
})
