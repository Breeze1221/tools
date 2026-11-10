import { describe, expect, it } from 'vitest'

import {
  buildPlaceholderSvg,
  escapeXml,
  type PlaceholderOptions,
  svgToDataUri,
} from '@/tools/images/svg-placeholder-generator/svg-placeholder-generator.service'

const baseOptions: PlaceholderOptions = {
  width: 640,
  height: 360,
  background: '#ffffff',
  textColor: '#333333',
  text: 'Hello',
  fontSize: 24,
  radius: 8,
  borderWidth: 2,
  borderColor: '#000000',
  fontFamily: 'Arial, sans-serif',
}

describe('escapeXml', () => {
  it('escapes the five XML-sensitive characters', () => {
    expect(escapeXml('<a href="x">&\'</a>')).toBe(
      '&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;',
    )
  })

  it('leaves plain text untouched', () => {
    expect(escapeXml('placeholder 1200×630')).toBe('placeholder 1200×630')
  })
})

describe('buildPlaceholderSvg', () => {
  it('renders width, height, rect and text elements', () => {
    const svg = buildPlaceholderSvg(baseOptions)
    expect(svg).toContain('<svg')
    expect(svg).toContain('width="640"')
    expect(svg).toContain('height="360"')
    expect(svg).toContain('<rect')
    expect(svg).toContain('<text')
    expect(svg).toContain('Hello')
  })

  it('falls back to width × height when text is empty', () => {
    const svg = buildPlaceholderSvg({ ...baseOptions, text: '   ' })
    expect(svg).toContain('>640×360</text>')
  })

  it('escapes the text content', () => {
    const svg = buildPlaceholderSvg({ ...baseOptions, text: '<script>alert("x")</script>' })
    expect(svg).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(svg).not.toContain('<script>')
  })

  it('applies custom colors and font settings', () => {
    const svg = buildPlaceholderSvg({
      ...baseOptions,
      background: '#123456',
      textColor: '#abcdef',
      borderColor: '#fedcba',
      borderWidth: 4,
      fontFamily: 'Georgia, serif',
      fontSize: 32,
    })
    expect(svg).toContain('fill="#123456"')
    expect(svg).toContain('fill="#abcdef"')
    expect(svg).toContain('stroke="#fedcba"')
    expect(svg).toContain('stroke-width="4"')
    expect(svg).toContain('font-family="Georgia, serif"')
    expect(svg).toContain('font-size="32"')
  })

  it('throws when the width is outside 1–4000', () => {
    expect(() => buildPlaceholderSvg({ ...baseOptions, width: 0 })).toThrow(Error)
    expect(() => buildPlaceholderSvg({ ...baseOptions, width: 4001 })).toThrow(Error)
  })

  it('throws when the height is outside 1–4000', () => {
    expect(() => buildPlaceholderSvg({ ...baseOptions, height: -1 })).toThrow(Error)
    expect(() => buildPlaceholderSvg({ ...baseOptions, height: 5000 })).toThrow(Error)
  })

  it('throws when the font size is not positive', () => {
    expect(() => buildPlaceholderSvg({ ...baseOptions, fontSize: 0 })).toThrow(
      'fontSize must be greater than 0',
    )
    expect(() => buildPlaceholderSvg({ ...baseOptions, fontSize: -8 })).toThrow(Error)
  })

  it('clamps the radius and border width to half the short side', () => {
    const svg = buildPlaceholderSvg({
      ...baseOptions,
      width: 100,
      height: 100,
      radius: 500,
      borderWidth: 400,
    })
    expect(svg).toContain('rx="50"')
    expect(svg).toContain('stroke-width="50"')
  })
})

describe('svgToDataUri', () => {
  it('produces a URI-encoded SVG data URI', () => {
    const uri = svgToDataUri('<svg xmlns="http://www.w3.org/2000/svg" />')
    expect(uri.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true)
    expect(uri).not.toContain('<')
    expect(uri).toContain('%3Csvg')
  })
})
