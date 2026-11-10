import { Contrast } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'wcag-contrast-checker',
  path: '/wcag-contrast-checker',
  keywords: ['wcag', 'contrast', 'a11y', 'accessibility', '对比度', '无障碍'],
  icon: Contrast,
  component: () => import('./WcagContrastChecker'),
  createdAt: '2026-11-10',
})
