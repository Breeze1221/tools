import { Database } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'fake-data-generator',
  path: '/fake-data-generator',
  keywords: [
    'fake',
    'mock',
    'dummy',
    'sample',
    'test data',
    'json',
    'csv',
    '假数据',
    '模拟数据',
    '测试数据',
    '造数',
  ],
  icon: Database,
  component: () => import('./FakeDataGenerator'),
  createdAt: '2026-11-10',
})
