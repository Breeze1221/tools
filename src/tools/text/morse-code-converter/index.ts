import { Radio } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'morse-code-converter',
  path: '/morse-code-converter',
  keywords: [
    'morse code',
    'morse',
    'encode morse',
    'decode morse',
    'telegraph',
    '摩斯码',
    '摩尔斯电码',
    '摩斯密码',
    '编码',
    '解码',
  ],
  icon: Radio,
  component: () => import('./MorseCodeConverter'),
  createdAt: '2026-11-10',
})
