import { describe, expect, it } from 'vitest'

import {
  MAX_TTS_TEXT_LENGTH,
  pickDefaultVoice,
  splitIntoSentences,
  validateText,
} from '@/tools/video/text-to-speech/text-to-speech.service'

describe('splitIntoSentences', () => {
  it('splits Chinese sentences and keeps the punctuation', () => {
    expect(splitIntoSentences('你好。今天天气不错！要出门吗？')).toEqual([
      '你好。',
      '今天天气不错！',
      '要出门吗？',
    ])
  })

  it('splits English sentences at terminal punctuation', () => {
    expect(splitIntoSentences('Hello world. How are you? Fine!')).toEqual([
      'Hello world.',
      'How are you?',
      'Fine!',
    ])
  })

  it('treats newlines as sentence boundaries', () => {
    expect(splitIntoSentences('第一行\n第二行\n\n第三行')).toEqual(['第一行', '第二行', '第三行'])
  })

  it('does not split decimals or version numbers', () => {
    expect(splitIntoSentences('Pi is 3.14, version v1.2 stays.')).toEqual([
      'Pi is 3.14, version v1.2 stays.',
    ])
  })

  it('returns an empty list for blank input', () => {
    expect(splitIntoSentences('   \n  ')).toEqual([])
  })
})

describe('validateText', () => {
  it('returns trimmed text for valid input', () => {
    expect(validateText('  hello  ')).toBe('hello')
  })

  it('throws for empty or whitespace-only text', () => {
    expect(() => validateText('')).toThrow('Text is empty')
    expect(() => validateText('   \n ')).toThrow('Text is empty')
  })

  it('throws when text exceeds the character limit', () => {
    expect(() => validateText('a'.repeat(MAX_TTS_TEXT_LENGTH + 1))).toThrow(
      `Text exceeds ${MAX_TTS_TEXT_LENGTH} characters`,
    )
    expect(() => validateText('a'.repeat(MAX_TTS_TEXT_LENGTH))).not.toThrow()
  })
})

describe('pickDefaultVoice', () => {
  const english = { name: 'English', lang: 'en-US', default: true }
  const chineseTw = { name: 'Chinese Taiwan', lang: 'zh-TW' }
  const chineseCn = { name: 'Chinese Mainland', lang: 'zh-CN' }

  it('prefers a Chinese voice over the system default', () => {
    expect(pickDefaultVoice([english, chineseCn])).toBe(chineseCn)
  })

  it('prefers zh-CN over other Chinese locales', () => {
    expect(pickDefaultVoice([english, chineseTw, chineseCn])).toBe(chineseCn)
  })

  it('falls back to the default voice, then the first one', () => {
    expect(pickDefaultVoice([english, { name: 'French', lang: 'fr-FR' }])).toBe(english)
    const first = { name: 'French', lang: 'fr-FR' }
    expect(pickDefaultVoice([first, { name: 'German', lang: 'de-DE' }])).toBe(first)
  })

  it('returns null when no voices are available', () => {
    expect(pickDefaultVoice([])).toBeNull()
  })
})
