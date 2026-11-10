import { Languages } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'chinese-number-converter',
  path: '/chinese-number-converter',
  keywords: [
    'chinese number',
    'chinese numeral',
    'number to chinese',
    'financial chinese',
    'rmb uppercase',
    '中文数字',
    '数字转中文',
    '人民币大写',
    '金额大写',
    '中文数字转换',
  ],
  icon: Languages,
  component: () => import('./ChineseNumberConverter'),
  createdAt: '2026-11-10',
})
