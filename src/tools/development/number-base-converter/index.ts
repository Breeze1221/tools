import { Binary } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'number-base-converter',
  path: '/number-base-converter',
  keywords: ['base', 'radix', 'binary', 'hex', 'octal', '进制', '二进制', '十六进制'],
  icon: Binary,
  component: () => import('./NumberBaseConverter'),
  createdAt: '2026-11-10',
})
