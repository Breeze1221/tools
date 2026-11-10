import { Table } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'markdown-table-generator',
  path: '/markdown-table-generator',
  keywords: [
    'markdown table',
    'table generator',
    'csv to markdown',
    'tsv to markdown',
    'markdown to csv',
    'table convert',
    'Markdown 表格',
    '表格生成',
    '表格转换',
    'CSV 转表格',
    'TSV',
    '对齐表格',
  ],
  icon: Table,
  component: () => import('./MarkdownTableGenerator'),
  createdAt: '2026-11-10',
})
