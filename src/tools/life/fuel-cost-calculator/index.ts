import { Fuel } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'fuel-cost-calculator',
  path: '/fuel-cost-calculator',
  keywords: [
    'fuel',
    'fuel cost',
    'gas',
    'petrol',
    'mileage',
    'mpg',
    'trip cost',
    '油费',
    '油耗',
    '加油',
    '自驾',
    '油耗计算',
  ],
  icon: Fuel,
  component: () => import('./FuelCostCalculator'),
  createdAt: '2026-11-10',
})
