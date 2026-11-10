import { Receipt } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'tip-calculator',
  path: '/tip-calculator',
  keywords: [
    'tip',
    'tip calculator',
    'gratuity',
    'bill split',
    'restaurant',
    '小费',
    '小费计算',
    '账单分摊',
    'AA',
    '服务费',
  ],
  icon: Receipt,
  component: () => import('./TipCalculator'),
  createdAt: '2026-11-10',
})
