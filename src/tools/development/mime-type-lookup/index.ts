import { FileType } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'mime-type-lookup',
  path: '/mime-type-lookup',
  keywords: [
    'mime',
    'mime-type',
    'content-type',
    'media-type',
    'extension',
    'file-type',
    'lookup',
    'MIME 类型',
    '扩展名',
    '文件类型',
    '内容类型',
  ],
  icon: FileType,
  component: () => import('./MimeTypeLookup'),
  createdAt: '2026-11-10',
})
