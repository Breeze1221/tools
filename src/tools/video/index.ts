import type { DefinedTool } from '../define-tool'

import { tool as musicToVideo } from './music-to-video'
import { tool as subtitleConverter } from './subtitle-converter'
import { tool as textToSpeech } from './text-to-speech'
import { tool as videoToGif } from './video-to-gif'

export const videoTools: readonly DefinedTool[] = [
  musicToVideo,
  videoToGif,
  textToSpeech,
  subtitleConverter,
]
