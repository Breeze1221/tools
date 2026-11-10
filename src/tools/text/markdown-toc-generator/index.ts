import { ListTree } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'markdown-toc-generator',
  path: '/markdown-toc-generator',
  keywords: [
    'markdown toc',
    'table of contents',
    'markdown outline',
    'toc generator',
    'anchor links',
    'Markdown 目录',
    '目录生成',
    '标题大纲',
    '锚点',
    '文档导航',
  ],
  icon: ListTree,
  component: () => import('./MarkdownTocGenerator'),
  createdAt: '2026-11-10',
})
