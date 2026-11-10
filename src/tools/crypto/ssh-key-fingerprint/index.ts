import { Fingerprint } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'ssh-key-fingerprint',
  path: '/ssh-key-fingerprint',
  keywords: [
    'ssh',
    'ssh-keygen',
    'public key',
    'authorized_keys',
    'fingerprint',
    'sha256',
    'md5',
    'ed25519',
    'rsa',
    'ecdsa',
    '公钥',
    '指纹',
    '密钥',
    '校验',
  ],
  icon: Fingerprint,
  component: () => import('./SshKeyFingerprint'),
  createdAt: '2026-11-10',
})
