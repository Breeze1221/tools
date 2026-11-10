import { Users } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'random-team-generator',
  path: '/random-team-generator',
  keywords: [
    'random team',
    'team generator',
    'group',
    'shuffle',
    'split teams',
    '随机分组',
    '随机分队',
    '分组工具',
    '抽签',
    '团队',
  ],
  icon: Users,
  component: () => import('./RandomTeamGenerator'),
  createdAt: '2026-11-10',
})
