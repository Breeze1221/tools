import { ScanEye } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'exif-viewer-cleaner',
  path: '/exif-viewer-cleaner',
  keywords: [
    'exif',
    'exif viewer',
    'exif remover',
    'metadata',
    'metadata remover',
    'gps',
    'privacy',
    'jpeg',
    'png',
    'exif 查看',
    'exif 清除',
    '元数据',
    '照片信息',
    '隐私',
  ],
  icon: ScanEye,
  component: () => import('./ExifViewerCleaner'),
  createdAt: '2026-11-10',
})
