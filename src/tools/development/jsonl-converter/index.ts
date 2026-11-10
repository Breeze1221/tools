import { ListOrdered } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'jsonl-converter',
  path: '/jsonl-converter',
  keywords: [
    'jsonl',
    'ndjson',
    'json lines',
    'json array',
    'convert',
    'converter',
    'JSON 数组',
    'JSONL 转换',
    '逐行 JSON',
    '换行分隔 JSON',
  ],
  icon: ListOrdered,
  component: () => import('./JsonlConverter'),
  createdAt: '2026-11-10',
})
