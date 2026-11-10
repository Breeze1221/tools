import { Cookie } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'cookie-parser',
  path: '/cookie-parser',
  keywords: [
    'cookie parser',
    'parse cookies',
    'cookie header',
    'set-cookie',
    'cookie builder',
    'document.cookie',
    'Cookie 解析',
    'Cookie 生成',
    '请求头 Cookie',
    '浏览器 Cookie',
    'Set-Cookie',
  ],
  icon: Cookie,
  component: () => import('./CookieParser'),
  createdAt: '2026-11-10',
})
