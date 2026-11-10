import { Bot } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'robots-txt-generator',
  path: '/robots-txt-generator',
  keywords: [
    'robots.txt',
    'robots txt generator',
    'crawler rules',
    'user-agent',
    'disallow',
    'sitemap directive',
    'robots 文件',
    '爬虫规则',
    '抓取协议',
    '禁止抓取',
    '网站收录',
  ],
  icon: Bot,
  component: () => import('./RobotsTxtGenerator'),
  createdAt: '2026-11-10',
})
