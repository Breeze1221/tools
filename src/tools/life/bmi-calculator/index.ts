import { HeartPulse } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'bmi-calculator',
  path: '/bmi-calculator',
  keywords: [
    'bmi',
    'body mass index',
    'healthy weight',
    'height',
    'weight',
    'health',
    '体质指数',
    '健康体重',
    '身高体重',
    '胖瘦',
  ],
  icon: HeartPulse,
  component: () => import('./BmiCalculator'),
  createdAt: '2026-11-10',
})
