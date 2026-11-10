import type { DefinedTool } from '../define-tool'

import { tool as markdownEditor } from './markdown-editor'
import { tool as textDiff } from './text-diff'
import { tool as textFormatter } from './text-formatter'
import { tool as asciiTextDrawer } from './ascii-text-drawer'
import { tool as loremIpsumGenerator } from './lorem-ipsum-generator'
import { tool as markdownTableGenerator } from './markdown-table-generator'
import { tool as urlSlugGenerator } from './url-slug-generator'
import { tool as markdownTocGenerator } from './markdown-toc-generator'
import { tool as unicodeInspector } from './unicode-inspector'
import { tool as wordFrequencyCounter } from './word-frequency-counter'
import { tool as findAndReplace } from './find-and-replace'
import { tool as textSimilarity } from './text-similarity'
import { tool as textTemplate } from './text-template'
import { tool as readabilityAnalyzer } from './readability-analyzer'
import { tool as chineseNumberConverter } from './chinese-number-converter'
import { tool as morseCodeConverter } from './morse-code-converter'

export const textTools: readonly DefinedTool[] = [
  markdownEditor,
  textDiff,
  textFormatter,
  asciiTextDrawer,
  loremIpsumGenerator,
  markdownTableGenerator,
  urlSlugGenerator,
  markdownTocGenerator,
  unicodeInspector,
  wordFrequencyCounter,
  findAndReplace,
  textSimilarity,
  textTemplate,
  readabilityAnalyzer,
  chineseNumberConverter,
  morseCodeConverter,
]
