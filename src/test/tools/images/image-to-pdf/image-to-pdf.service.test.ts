import { describe, expect, it } from 'vitest'

import {
  PAGE_SIZES,
  PAGE_SIZE_KEYS,
  PDF_DEFAULTS,
  PDF_FITS,
  PDF_ORIENTATIONS,
  computePdfLayout,
  type PageSizeKey,
  type PdfFit,
  type PdfOrientation,
} from '@/tools/images/image-to-pdf/image-to-pdf.service'

describe('image-to-pdf service', () => {
  it('exposes the supported page sizes, orientations and fits', () => {
    expect(PAGE_SIZE_KEYS).toEqual(['a4', 'letter'])
    expect(PAGE_SIZES.a4).toEqual({ width: 210, height: 297 })
    expect(PAGE_SIZES.letter).toEqual({ width: 215.9, height: 279.4 })
    expect(PDF_ORIENTATIONS).toEqual(['portrait', 'landscape'])
    expect(PDF_FITS).toEqual(['contain', 'cover', 'stretch'])
    expect(PDF_DEFAULTS).toEqual({
      pageSize: 'a4',
      orientation: 'portrait',
      margin: 12,
      fit: 'contain',
    })
  })

  it('fits a landscape image inside an A4 portrait page', () => {
    const layout = computePdfLayout(
      { width: 1000, height: 500 },
      { pageSize: 'a4', orientation: 'portrait', margin: 10, fit: 'contain' },
    )
    expect(layout).toMatchObject({
      pageWidth: 210,
      pageHeight: 297,
      contentX: 10,
      contentY: 10,
      contentWidth: 190,
      contentHeight: 277,
      x: 10,
      y: 101,
      width: 190,
      height: 95,
    })
    expect(layout.scale).toBeCloseTo(0.19, 5)
  })

  it('swaps the page dimensions in landscape orientation', () => {
    const layout = computePdfLayout(
      { width: 1000, height: 500 },
      { pageSize: 'a4', orientation: 'landscape', margin: 0, fit: 'contain' },
    )
    expect(layout.pageWidth).toBe(297)
    expect(layout.pageHeight).toBe(210)
    expect(layout).toMatchObject({ x: 0, y: 30.75, width: 297, height: 148.5 })
  })

  it('supports Letter pages', () => {
    const layout = computePdfLayout(
      { width: 800, height: 600 },
      { pageSize: 'letter', orientation: 'portrait', margin: 0, fit: 'contain' },
    )
    expect(layout.pageWidth).toBe(215.9)
    expect(layout.pageHeight).toBe(279.4)
    expect(layout.contentWidth).toBe(215.9)
  })

  it('covers the page and centers the overflow horizontally', () => {
    const layout = computePdfLayout(
      { width: 1000, height: 500 },
      { pageSize: 'a4', orientation: 'portrait', margin: 10, fit: 'cover' },
    )
    expect(layout).toMatchObject({ x: -172, y: 10, width: 554, height: 277 })
    expect(layout.scale).toBeCloseTo(0.554, 5)
  })

  it('stretches the image to the content box', () => {
    const layout = computePdfLayout(
      { width: 1000, height: 500 },
      { pageSize: 'a4', orientation: 'portrait', margin: 10, fit: 'stretch' },
    )
    expect(layout).toMatchObject({
      x: 10,
      y: 10,
      width: 190,
      height: 277,
      scale: 0.19,
    })
  })

  it('clamps the margin so the content area stays positive', () => {
    const layout = computePdfLayout(
      { width: 100, height: 100 },
      { pageSize: 'a4', orientation: 'portrait', margin: 1000, fit: 'contain' },
    )
    expect(layout.contentX).toBe(104)
    expect(layout.contentWidth).toBe(2)
    expect(layout.contentHeight).toBe(89)

    const zero = computePdfLayout(
      { width: 100, height: 100 },
      { pageSize: 'a4', orientation: 'portrait', margin: -20, fit: 'contain' },
    )
    expect(zero.contentWidth).toBe(210)
    expect(zero.contentHeight).toBe(297)
  })

  it('rejects invalid image sizes', () => {
    expect(() =>
      computePdfLayout({ width: 0, height: 100 }, PDF_DEFAULTS),
    ).toThrow(/positive/)
    expect(() =>
      computePdfLayout({ width: 100, height: Number.NaN }, PDF_DEFAULTS),
    ).toThrow(/positive/)
  })

  it('rejects unknown options and non-finite margins', () => {
    expect(() =>
      computePdfLayout(
        { width: 100, height: 100 },
        { ...PDF_DEFAULTS, pageSize: 'b5' as PageSizeKey },
      ),
    ).toThrow(/page size/)
    expect(() =>
      computePdfLayout(
        { width: 100, height: 100 },
        { ...PDF_DEFAULTS, orientation: 'diagonal' as PdfOrientation },
      ),
    ).toThrow(/orientation/)
    expect(() =>
      computePdfLayout(
        { width: 100, height: 100 },
        { ...PDF_DEFAULTS, fit: 'zoom' as PdfFit },
      ),
    ).toThrow(/fit mode/)
    expect(() =>
      computePdfLayout(
        { width: 100, height: 100 },
        { ...PDF_DEFAULTS, margin: Number.NaN },
      ),
    ).toThrow(/finite number/)
  })
})
