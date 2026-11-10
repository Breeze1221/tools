import { KeyRound } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'hmac-calculator',
  path: '/hmac-calculator',
  keywords: [
    'hmac',
    'mac',
    'message-authentication-code',
    'sha1',
    'sha256',
    'sha384',
    'sha512',
    'signature',
    'digest',
    'webcrypto',
    'hex',
    'base64',
    'base64url',
    '消息认证码',
    '摘要',
    '签名',
    '密钥',
    '校验',
  ],
  icon: KeyRound,
  component: () => import('./HmacCalculator'),
  createdAt: '2026-11-10',
})
