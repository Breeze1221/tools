import { Captions } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'subtitle-converter',
  path: '/subtitle-converter',
  keywords: [
    'subtitle converter',
    'srt',
    'vtt',
    'webvtt',
    'ass',
    'ssa',
    'caption converter',
    '字幕转换',
    '字幕格式',
    'srt 转 vtt',
    'vtt 转 srt',
  ],
  icon: Captions,
  component: () => import('./SubtitleConverter'),
  createdAt: '2026-11-10',
})
