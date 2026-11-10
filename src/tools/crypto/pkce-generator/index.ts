import { ShieldCheck } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'pkce-generator',
  path: '/pkce-generator',
  keywords: [
    'pkce',
    'oauth',
    'oauth2',
    'rfc 7636',
    'code verifier',
    'code challenge',
    's256',
    'plain',
    'sha256',
    'authorization code',
    '授权码',
    '验证器',
    '挑战码',
    '随机',
    '校验',
  ],
  icon: ShieldCheck,
  component: () => import('./PkceGenerator'),
  createdAt: '2026-11-10',
})
