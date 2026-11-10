import { Braces } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'json-to-typescript',
  path: '/json-to-typescript',
  keywords: [
    'json',
    'typescript',
    'interface',
    'type',
    'zod',
    'schema',
    'codegen',
    '类型',
    '生成',
    '接口',
    '模型',
  ],
  icon: Braces,
  component: () => import('./JsonToTypescript'),
  createdAt: '2026-11-10',
})
