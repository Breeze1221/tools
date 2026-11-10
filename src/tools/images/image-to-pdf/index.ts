import { FileText } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-to-pdf',
  path: '/image-to-pdf',
  keywords: [
    'image to pdf',
    'jpg to pdf',
    'png to pdf',
    'photo to pdf',
    'images to pdf',
    'merge images pdf',
    '图片转 PDF',
    '照片转 PDF',
    '图片合并 PDF',
    'JPG 转 PDF',
    'PNG 转 PDF',
    '多图生成 PDF',
  ],
  icon: FileText,
  component: () => import('./ImageToPdf'),
  createdAt: '2026-11-10',
  wide: true,
})
