import { Route } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'htaccess-generator',
  path: '/htaccess-generator',
  keywords: [
    'htaccess',
    'apache',
    'rewrite',
    'redirect',
    'https',
    'www',
    '伪静态',
    '重定向',
    '服务器配置',
  ],
  icon: Route,
  component: () => import('./HtaccessGenerator'),
  createdAt: '2026-11-10',
})
