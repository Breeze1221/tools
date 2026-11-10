import { FileCode2 } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'dotenv-converter',
  path: '/dotenv-converter',
  keywords: [
    'dotenv',
    '.env',
    'env',
    'json',
    'yaml',
    'environment variables',
    'config',
    '环境变量',
    '配置转换',
  ],
  icon: FileCode2,
  component: () => import('./DotenvConverter'),
  createdAt: '2026-11-10',
  wide: true,
})
