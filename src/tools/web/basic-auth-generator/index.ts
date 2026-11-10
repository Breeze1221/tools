import { KeyRound } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'basic-auth-generator',
  path: '/basic-auth-generator',
  keywords: [
    'basic auth',
    'http basic authentication',
    'authorization header',
    'base64 credentials',
    'curl basic auth',
    'Basic 认证',
    '基础认证',
    'Authorization 请求头',
    '用户名密码编码',
    'curl 示例',
  ],
  icon: KeyRound,
  component: () => import('./BasicAuthGenerator'),
  createdAt: '2026-11-10',
})
