import { Globe2 } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'timezone-meeting-planner',
  path: '/timezone-meeting-planner',
  keywords: [
    'timezone',
    'time zone',
    'meeting',
    'planner',
    'overlap',
    'utc',
    'converter',
    '时区',
    '会议',
    '跨时区',
    '时间换算',
    '时差',
  ],
  icon: Globe2,
  component: () => import('./TimezoneMeetingPlanner'),
  createdAt: '2026-11-10',
})
