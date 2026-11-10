import { Pilcrow } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'lorem-ipsum-generator',
  path: '/lorem-ipsum-generator',
  keywords: [
    'lorem ipsum',
    'lorem',
    'placeholder text',
    'dummy text',
    'filler text',
    'random text',
    '占位文本',
    '占位符',
    '假文',
    '填充文本',
    '测试文本',
    '排版',
  ],
  icon: Pilcrow,
  component: () => import('./LoremIpsumGenerator'),
  createdAt: '2026-11-10',
})
