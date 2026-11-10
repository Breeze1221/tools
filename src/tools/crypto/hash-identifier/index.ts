import { ScanSearch } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'hash-identifier',
  path: '/hash-identifier',
  keywords: [
    'hash',
    'identifier',
    'identify',
    'bcrypt',
    'argon2',
    'pbkdf2',
    'md5',
    'ntlm',
    'sha1',
    'sha256',
    'sha512',
    'crc32',
    'base64',
    '哈希',
    '识别',
    '类型',
    '摘要',
  ],
  icon: ScanSearch,
  component: () => import('./HashIdentifier'),
  createdAt: '2026-11-10',
})
