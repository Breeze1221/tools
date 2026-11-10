import { FileCode } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'file-hash-checker',
  path: '/file-hash-checker',
  keywords: ['hash', 'md5', 'sha1', 'sha256', 'sha512', 'sha3', 'file hash', '校验', '哈希'],
  icon: FileCode,
  component: () => import('./FileHashChecker'),
  createdAt: '2026-11-10',
})
