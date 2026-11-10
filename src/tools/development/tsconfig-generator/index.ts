import { FileJson2 } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'tsconfig-generator',
  path: '/tsconfig-generator',
  keywords: [
    'tsconfig',
    'typescript',
    'compilerOptions',
    'config',
    'generator',
    'TypeScript 配置',
    '编译配置',
  ],
  icon: FileJson2,
  component: () => import('./TsconfigGenerator'),
  createdAt: '2026-11-10',
})
