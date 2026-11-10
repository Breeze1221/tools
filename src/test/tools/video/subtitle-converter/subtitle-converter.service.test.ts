import { describe, expect, it } from 'vitest'

import {
  convertSubtitles,
  detectFormat,
  formatTimestamp,
  parseAss,
  parseSrt,
  parseVtt,
  toAss,
  toSrt,
  toVtt,
  type SubtitleCue,
} from '@/tools/video/subtitle-converter/subtitle-converter.service'

const CUES: SubtitleCue[] = [
  { startMs: 1000, endMs: 4000, text: 'Hello world' },
  { startMs: 4_000, endMs: 6_500, text: 'First line\nSecond line' },
]

const SRT = `1
00:00:01,000 --> 00:00:04,000
Hello world

2
00:00:04,000 --> 00:00:06,500
First line
Second line
`

const VTT = `WEBVTT

NOTE this is a comment

00:00:01.000 --> 00:00:04.000
Hello world

00:00:04.000 --> 00:00:06.500
First line
Second line
`

const ASS = `[Script Info]
ScriptType: v4.00+

[V4+ Styles]
Format: Name, Fontname, Fontsize

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Hello world
Dialogue: 0,0:00:04.00,0:00:06.50,Default,,0,0,0,,First line\\NSecond line
`

describe('parseSrt', () => {
  it('parses indices, comma timestamps and multi-line text', () => {
    expect(parseSrt(SRT)).toEqual(CUES)
  })

  it('throws when no cue can be found', () => {
    expect(() => parseSrt('')).toThrow('No SRT cues found')
    expect(() => parseSrt('not subtitles')).toThrow('No SRT cues found')
  })
})

describe('parseVtt', () => {
  it('parses dot timestamps, ignores WEBVTT header and NOTE blocks', () => {
    expect(parseVtt(VTT)).toEqual(CUES)
  })

  it('throws when no cue can be found', () => {
    expect(() => parseVtt('WEBVTT\n\nNOTE only')).toThrow('No VTT cues found')
  })
})

describe('parseAss', () => {
  it('parses dialogue fields and converts \\N into a newline', () => {
    expect(parseAss(ASS)).toEqual(CUES)
  })

  it('strips inline override tags', () => {
    const input = 'Dialogue: 0,0:00:02.00,0:00:03.50,Default,,0,0,0,,{\\i1}Italic text{\\i0}'
    expect(parseAss(input)).toEqual([{ startMs: 2000, endMs: 3500, text: 'Italic text' }])
  })

  it('throws when there is no Dialogue line', () => {
    expect(() => parseAss('[Script Info]\nTitle: empty')).toThrow('No ASS dialogue lines found')
  })
})

describe('serialisers', () => {
  it('writes SRT with comma milliseconds and sequential indices', () => {
    const output = toSrt(CUES)
    expect(output).toContain('1\n00:00:01,000 --> 00:00:04,000\nHello world')
    expect(output).toContain('2\n00:00:04,000 --> 00:00:06,500\nFirst line\nSecond line')
  })

  it('writes VTT with a WEBVTT header and dot milliseconds', () => {
    const output = toVtt(CUES)
    expect(output.startsWith('WEBVTT\n\n')).toBe(true)
    expect(output).toContain('00:00:01.000 --> 00:00:04.000\nHello world')
  })

  it('writes ASS with the minimal header and \\N line breaks', () => {
    const output = toAss(CUES)
    expect(output).toContain('[Script Info]')
    expect(output).toContain('[V4+ Styles]')
    expect(output).toContain('[Events]')
    expect(output).toContain('Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Hello world')
    expect(output).toContain('First line\\NSecond line')
  })

  it('formats timestamps at hour boundaries', () => {
    expect(formatTimestamp(3_661_500, ',')).toBe('01:01:01,500')
    expect(formatTimestamp(3_661_500, '.')).toBe('01:01:01.500')
  })
})

describe('round trips', () => {
  it('SRT -> VTT -> SRT keeps cues intact', () => {
    expect(parseSrt(toSrt(parseVtt(toVtt(parseSrt(SRT)))))).toEqual(CUES)
  })

  it('VTT -> ASS -> VTT keeps cues intact', () => {
    expect(parseVtt(toVtt(parseAss(toAss(parseVtt(VTT)))))).toEqual(CUES)
  })

  it('ASS -> SRT -> ASS keeps cues intact', () => {
    expect(parseAss(toAss(parseSrt(toSrt(parseAss(ASS)))))).toEqual(CUES)
  })
})

describe('detectFormat', () => {
  it('detects SRT, VTT and ASS content', () => {
    expect(detectFormat(SRT)).toBe('srt')
    expect(detectFormat(VTT)).toBe('vtt')
    expect(detectFormat(ASS)).toBe('ass')
  })

  it('throws for empty or unrecognised input', () => {
    expect(() => detectFormat('   ')).toThrow('Input is empty')
    expect(() => detectFormat('just some text')).toThrow('Unrecognised subtitle format')
  })
})

describe('convertSubtitles', () => {
  it('converts with auto detection', () => {
    const output = convertSubtitles(SRT, 'auto', 'vtt')
    expect(output.startsWith('WEBVTT')).toBe(true)
    expect(output).toContain('00:00:01.000 --> 00:00:04.000')
  })

  it('converts between explicit formats', () => {
    expect(convertSubtitles(VTT, 'vtt', 'ass')).toContain(
      'Dialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Hello world',
    )
  })

  it('throws for empty input', () => {
    expect(() => convertSubtitles('   ', 'auto', 'srt')).toThrow('Input is empty')
  })

  it('throws when the format cannot be detected', () => {
    expect(() => convertSubtitles('random content', 'auto', 'srt')).toThrow(
      'Unrecognised subtitle format',
    )
  })
})
