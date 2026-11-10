import { describe, expect, it } from 'vitest'

import {
  MORSE_CODE_MAP,
  morseToText,
  textToMorse,
} from '@/tools/text/morse-code-converter/morse-code-converter.service'

describe('MORSE_CODE_MAP', () => {
  it('maps letters, digits and punctuation', () => {
    expect(MORSE_CODE_MAP.A).toBe('.-')
    expect(MORSE_CODE_MAP.Z).toBe('--..')
    expect(MORSE_CODE_MAP['0']).toBe('-----')
    expect(MORSE_CODE_MAP['.']).toBe('.-.-.-')
  })
})

describe('textToMorse', () => {
  it('encodes letters separated by spaces', () => {
    expect(textToMorse('SOS')).toBe('... --- ...')
  })

  it('is case insensitive', () => {
    expect(textToMorse('sos')).toBe(textToMorse('SOS'))
  })

  it('separates words with a slash', () => {
    expect(textToMorse('Hello World')).toBe(
      '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    )
  })

  it('encodes digits and punctuation', () => {
    expect(textToMorse('A1')).toBe('.- .----')
    expect(textToMorse('Hi!')).toBe('.... .. -.-.--')
  })

  it('returns an empty string for empty or whitespace input', () => {
    expect(textToMorse('')).toBe('')
    expect(textToMorse('   ')).toBe('')
  })

  it('throws on unsupported characters', () => {
    expect(() => textToMorse('你好')).toThrow(/Unsupported character/)
    expect(() => textToMorse('hi#')).toThrow(/Unsupported character/)
  })
})

describe('morseToText', () => {
  it('decodes letters separated by spaces', () => {
    expect(morseToText('... --- ...')).toBe('SOS')
  })

  it('decodes words separated by slashes', () => {
    expect(morseToText('.... . .-.. .-.. --- / .-- --- .-. .-.. -..')).toBe('HELLO WORLD')
  })

  it('tolerates extra whitespace', () => {
    expect(morseToText('  ...   ---   ...  ')).toBe('SOS')
  })

  it('returns an empty string for empty input', () => {
    expect(morseToText('')).toBe('')
    expect(morseToText('   ')).toBe('')
  })

  it('throws on invalid Morse code', () => {
    expect(() => morseToText('.......')).toThrow(/Invalid Morse code/)
    expect(() => morseToText('... --- .-.-.-.-')).toThrow(/Invalid Morse code/)
  })

  it('round-trips text with letters, digits and punctuation', () => {
    const source = 'HELLO WORLD 123?!'
    expect(morseToText(textToMorse(source))).toBe(source)
  })
})
