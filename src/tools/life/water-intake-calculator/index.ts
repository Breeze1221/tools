import { Droplets } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'water-intake-calculator',
  path: '/water-intake-calculator',
  keywords: [
    'water intake',
    'hydration',
    'daily water',
    'drink water',
    'water calculator',
    '饮水量',
    '喝水',
    '补水',
    '每日饮水',
    '水分',
  ],
  icon: Droplets,
  component: () => import('./WaterIntakeCalculator'),
  createdAt: '2026-11-10',
})
