import { Files } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'gitignore-generator',
  path: '/gitignore-generator',
  keywords: [
    'gitignore',
    '.gitignore',
    'git',
    'generator',
    'template',
    'ignore',
    '忽略文件',
    '生成器',
    '模板',
    '版本控制',
  ],
  icon: Files,
  component: () => import('./GitignoreGenerator'),
  createdAt: '2026-11-10',
})
