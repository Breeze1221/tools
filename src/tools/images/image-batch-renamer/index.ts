import { Files } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'image-batch-renamer',
  path: '/image-batch-renamer',
  keywords: [
    'batch rename',
    'rename images',
    'image renamer',
    'bulk rename',
    'file name',
    'zip download',
    '图片批量重命名',
    '批量改名',
    '重命名',
    '文件名处理',
    '打包下载',
  ],
  icon: Files,
  component: () => import('./ImageBatchRenamer'),
  createdAt: '2026-11-10',
})
