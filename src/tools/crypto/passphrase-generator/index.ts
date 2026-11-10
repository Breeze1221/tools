import { KeyRound } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'passphrase-generator',
  path: '/passphrase-generator',
  keywords: [
    'passphrase',
    'password',
    'diceware',
    'memorable',
    'phrase',
    '口令',
    '短语',
    '密码',
    '易记',
    '词表',
  ],
  icon: KeyRound,
  component: () => import('./PassphraseGenerator'),
  createdAt: '2026-11-09',
})
