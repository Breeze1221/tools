import { describe, expect, it } from 'vitest'

import {
  buildHtmlSnippet,
  buildIco,
  buildWebManifest,
  faviconPngSizes,
} from '@/tools/images/favicon-generator/favicon-generator.service'

const png = (size: number, length = 8) => ({
  size,
  data: new Uint8Array(length).fill(size),
})

describe('faviconPngSizes', () => {
  it('exposes every PNG size the tool generates', () => {
    expect(faviconPngSizes).toEqual([16, 32, 48, 96, 152, 167, 180, 192, 512])
  })
})

describe('buildIco', () => {
  it('writes the ICONDIR magic bytes', () => {
    const ico = buildIco([png(16), png(32)])
    expect([ico[0], ico[1], ico[2], ico[3]]).toEqual([0, 0, 1, 0])
  })

  it('writes the image count into the header', () => {
    const ico = buildIco([png(16), png(32), png(48)])
    const view = new DataView(ico.buffer)
    expect(view.getUint16(4, true)).toBe(3)
  })

  it('writes one 16-byte directory entry per image', () => {
    const ico = buildIco([png(16), png(32)])
    const view = new DataView(ico.buffer)
    expect(view.getUint16(10, true)).toBe(1) // planes
    expect(view.getUint16(12, true)).toBe(32) // bit count
    expect(view.getUint32(14, true)).toBe(8) // bytes in resource
    expect(view.getUint32(18, true)).toBe(38) // first payload offset
    expect(view.getUint32(34, true)).toBe(46) // second payload offset
  })

  it('sorts entries by size ascending and keeps payload bytes intact', () => {
    const ico = buildIco([png(48, 3), png(16, 1), png(32, 2)])
    expect(ico[6]).toBe(16)
    expect(ico[22]).toBe(32)
    expect(ico[38]).toBe(48)
    expect([...ico.slice(54, 55)]).toEqual([16])
    expect([...ico.slice(55, 57)]).toEqual([32, 32])
    expect([...ico.slice(57, 60)]).toEqual([48, 48, 48])
  })

  it('encodes a 256px dimension as 0', () => {
    const ico = buildIco([png(256)])
    expect(ico[6]).toBe(0)
    expect(ico[7]).toBe(0)
  })

  it('throws on an empty image list', () => {
    expect(() => buildIco([])).toThrow('ICO requires at least one image')
  })

  it('throws when a size is out of the 1-256 range', () => {
    expect(() => buildIco([png(0)])).toThrow(Error)
    expect(() => buildIco([png(257)])).toThrow(Error)
  })

  it('throws when a size is not an integer', () => {
    expect(() => buildIco([png(16.5)])).toThrow(Error)
  })
})

describe('buildWebManifest', () => {
  it('produces parseable JSON with one icon per PNG size', () => {
    const manifest = JSON.parse(buildWebManifest()) as {
      name: string
      short_name: string
      icons: { src: string; sizes: string; type: string }[]
      display: string
      start_url: string
      theme_color: string
      background_color: string
    }

    expect(manifest.icons).toHaveLength(faviconPngSizes.length)
    expect(manifest.icons.every((icon) => icon.type === 'image/png')).toBe(true)
    expect(manifest.icons[0]).toEqual({
      src: '/favicon-16x16.png',
      sizes: '16x16',
      type: 'image/png',
    })
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.theme_color).toBeTruthy()
    expect(manifest.background_color).toBeTruthy()
  })

  it('uses the provided name, short name and colors', () => {
    const manifest = JSON.parse(
      buildWebManifest({
        name: 'ToolBox',
        shortName: 'Tool',
        themeColor: '#123456',
        backgroundColor: '#abcdef',
      }),
    ) as { name: string; short_name: string; theme_color: string; background_color: string }

    expect(manifest.name).toBe('ToolBox')
    expect(manifest.short_name).toBe('Tool')
    expect(manifest.theme_color).toBe('#123456')
    expect(manifest.background_color).toBe('#abcdef')
  })
})

describe('buildHtmlSnippet', () => {
  it('includes icon links and the manifest', () => {
    const snippet = buildHtmlSnippet()
    expect(snippet).toContain('rel="icon"')
    expect(snippet).toContain('rel="manifest"')
    expect(snippet).toContain('/favicon.ico')
    expect(snippet).toContain('sizes="16x16"')
    expect(snippet).toContain('rel="apple-touch-icon"')
  })
})
