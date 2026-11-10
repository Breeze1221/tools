import { CalendarPlus } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'ics-calendar-generator',
  path: '/ics-calendar-generator',
  keywords: [
    'ics',
    'icalendar',
    'calendar',
    'event',
    'reminder',
    '日历',
    '日程',
    '事件',
    '提醒',
    '日历文件',
  ],
  icon: CalendarPlus,
  component: () => import('./IcsCalendarGenerator'),
  createdAt: '2026-11-10',
})
