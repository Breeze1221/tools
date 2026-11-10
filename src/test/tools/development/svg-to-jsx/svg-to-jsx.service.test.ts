import { describe, expect, it } from 'vitest'

import {
  camelCase,
  optimizeSvg,
  parseSvgSource,
  styleStringToObject,
  toHtmlEntities,
  toJsxComponent,
} from '@/tools/development/svg-to-jsx/svg-to-jsx.service'

describe('camelCase', () => {
  it('converts hyphenated attributes', () => {
    expect(camelCase('stroke-width')).toBe('strokeWidth')
    expect(camelCase('stroke-linecap')).toBe('strokeLinecap')
    expect(camelCase('fill-rule')).toBe('fillRule')
  })

  it('handles SVG-specific capitalization', () => {
    expect(camelCase('viewBox')).toBe('viewBox')
    expect(camelCase('viewbox')).toBe('viewBox')
    expect(camelCase('preserveAspectRatio')).toBe('preserveAspectRatio')
    expect(camelCase('gradientUnits')).toBe('gradientUnits')
  })

  it('returns already-camelCase names unchanged', () => {
    expect(camelCase('d')).toBe('d')
    expect(camelCase('cx')).toBe('cx')
    expect(camelCase('class')).toBe('class')
  })
})

describe('styleStringToObject', () => {
  it('parses simple key:value pairs', () => {
    expect(styleStringToObject('fill: red')).toBe("{ fill: 'red' }")
  })

  it('parses multiple declarations', () => {
    const result = styleStringToObject('fill: red; stroke-width: 2')
    expect(result).toContain("fill: 'red'")
    expect(result).toContain("strokeWidth: '2'")
  })

  it('handles empty and trailing semicolons', () => {
    expect(styleStringToObject('')).toBe('')
    expect(styleStringToObject('fill: red;')).toContain("fill: 'red'")
  })

  it('handles CSS custom properties', () => {
    const result = styleStringToObject('--my-color: #fff')
    expect(result).toContain("'--my-color': '#fff'")
  })
})

describe('parseSvgSource', () => {
  it('throws on empty input', () => {
    expect(() => parseSvgSource('')).toThrow('Invalid SVG input')
  })

  it('throws on whitespace-only input', () => {
    expect(() => parseSvgSource('   ')).toThrow('Invalid SVG input')
  })

  it('throws on non-SVG input', () => {
    expect(() => parseSvgSource('<div></div>')).toThrow('Invalid SVG input')
  })

  it('returns cleaned source for valid SVG', () => {
    const cleaned = parseSvgSource(
      '<?xml version="1.0"?><!-- x --><!DOCTYPE svg><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>',
    )
    expect(cleaned).not.toContain('<?xml')
    expect(cleaned).not.toContain('<!--')
    expect(cleaned).toContain('<svg')
  })
})

describe('optimizeSvg', () => {
  it('removes the XML declaration, DOCTYPE and comments', () => {
    const input =
      '<?xml version="1.0" encoding="UTF-8"?><!-- icon --><!DOCTYPE svg><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>'

    const output = optimizeSvg(input)

    expect(output).not.toContain('<?xml')
    expect(output).not.toContain('<!DOCTYPE')
    expect(output).not.toContain('<!--')
  })

  it('collapses whitespace between tags and inside the root tag', () => {
    const input = '<svg   viewBox="0 0 1 1"   >\n  <path d="M0 0" />\n</svg>'

    expect(optimizeSvg(input)).toBe('<svg viewBox="0 0 1 1"><path d="M0 0"/></svg>')
  })

  it('throws when the root element is not svg', () => {
    expect(() => optimizeSvg('<div></div>')).toThrow(/Invalid SVG/)
  })

  it('throws on empty input', () => {
    expect(() => optimizeSvg('   ')).toThrow(/empty/i)
  })
})

describe('toJsxComponent', () => {
  it('converts class to className and style to object', () => {
    const input =
      '<svg viewBox="0 0 1 1" class="icon"><rect style="fill: red; stroke-width: 2"></rect></svg>'

    const output = toJsxComponent(input, { componentName: 'Icon', typescript: false })

    expect(output).toContain('className="icon"')
    expect(output).toContain("style={{ fill: 'red', strokeWidth: '2' }}")
    expect(output).toContain('<rect style={{ fill: \'red\', strokeWidth: \'2\' }} />')
  })

  it('converts xlink:href to href', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><use xlink:href="#icon" /></svg>'

    const output = toJsxComponent(input, { componentName: 'Logo', typescript: true })
    expect(output).toContain('href="#icon"')
    expect(output).not.toContain('xlink')
  })

  it('produces a named TSX component with SVGProps', () => {
    const input =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke-width="2" fill-rule="evenodd" data-name="x" aria-hidden="true"/></svg>'

    const output = toJsxComponent(input, { componentName: 'Logo', typescript: true })

    expect(output).toContain('export function Logo(props: SVGProps<SVGSVGElement>)')
    expect(output).toContain('{...props}')
    expect(output).toContain('viewBox="0 0 24 24"')
    expect(output).not.toContain('xmlns=')
    expect(output).toContain('strokeWidth="2"')
    expect(output).toContain('fillRule="evenodd"')
    expect(output).toContain('data-name="x"')
    expect(output).toContain('aria-hidden="true"')
  })

  it('produces JSX variant without TS types', () => {
    const output = toJsxComponent(
      '<svg viewBox="0 0 1 1"><circle cx="1" cy="1" r="1"></circle></svg>',
      { typescript: false },
    )
    expect(output).toContain('export function SvgComponent(props)')
    expect(output).not.toContain('SVGProps')
  })

  it('collapses empty element pairs into self-closing tags', () => {
    const output = toJsxComponent(
      '<svg viewBox="0 0 1 1"><circle cx="1" cy="1" r="1"></circle></svg>',
    )
    expect(output).toContain('<circle cx="1" cy="1" r="1" />')
    expect(output).not.toContain('</circle>')
  })

  it('throws on invalid SVG input', () => {
    expect(() => toJsxComponent('<div></div>')).toThrow(/Invalid SVG/)
    expect(() => toJsxComponent('')).toThrow()
  })

  it('throws on an invalid component name', () => {
    expect(() =>
      toJsxComponent('<svg viewBox="0 0 1 1"/>', { componentName: '1 Logo' }),
    ).toThrow(/Invalid component name/)
  })
})

describe('toHtmlEntities', () => {
  it('produces a clean HTML-friendly snippet', () => {
    const output = toHtmlEntities(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path stroke-width="2"/></svg>',
      { componentName: 'Icon' },
    )
    expect(output).toContain('<!-- Icon -->')
    expect(output).toContain('<svg')
    expect(output).not.toContain('xmlns')
    expect(output).not.toContain('stroke-width')
  })
})
