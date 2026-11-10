import { Tag } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'semver-range-checker',
  path: '/semver-range-checker',
  keywords: [
    'semver',
    'version',
    'range',
    'satisfies',
    'caret',
    'tilde',
    'npm',
    '语义化版本',
    '版本范围',
    '版本校验',
  ],
  icon: Tag,
  component: () => import('./SemverRangeChecker'),
  createdAt: '2026-11-10',
})
