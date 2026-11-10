import { Braces } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'json-schema-generator',
  path: '/json-schema-generator',
  keywords: [
    'json',
    'schema',
    'json-schema',
    'generator',
    'draft-07',
    '2020-12',
    '数据校验',
    '模式生成',
  ],
  icon: Braces,
  component: () => import('./JsonSchemaGenerator'),
  createdAt: '2026-11-10',
})
