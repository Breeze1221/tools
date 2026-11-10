import { Volume2 } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'text-to-speech',
  path: '/text-to-speech',
  keywords: [
    'text to speech',
    'tts',
    'speech synthesis',
    'read aloud',
    'voice',
    '文字转语音',
    '语音合成',
    '朗读',
    '配音',
    '本地朗读',
  ],
  icon: Volume2,
  component: () => import('./TextToSpeech'),
  createdAt: '2026-11-10',
})
