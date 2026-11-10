import { ListTree } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'http-header-parser',
  path: '/http-header-parser',
  keywords: [
    'http header parser',
    'parse http headers',
    'request header',
    'response header',
    'raw http',
    'header to json',
    'HTTP 头解析',
    '请求头解析',
    '响应头解析',
    '原始报文',
    '头部字段',
    'HTTP 报文',
  ],
  icon: ListTree,
  component: () => import('./HttpHeaderParser'),
  createdAt: '2026-11-10',
})
