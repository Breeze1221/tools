import { describe, expect, it } from 'vitest'

import {
  assertValidFontSize,
  assertValidOpacity,
  buildTilePositions,
  clampRotation,
  computeWatermarkPosition,
  type WatermarkAnchor,
} from '@/tools/images/image-watermarker/image-watermarker.service'

const position = (anchor: WatermarkAnchor, margin = 10) =>
  computeWatermarkPosition({
    canvasW: 200,
    canvasH: 100,
    wmW: 20,
    wmH: 10,
    anchor,
    margin,
  })

describe('computeWatermarkPosition', () => {
  it('places the watermark at every one of the nine anchors', () => {
    expect(position('top-left')).toEqual({ x: 10, y: 10 })
    expect(position('top')).toEqual({ x: 90, y: 10 })
    expect(position('top-right')).toEqual({ x: 170, y: 10 })
    expect(position('left')).toEqual({ x: 10, y: 45 })
    expect(position('center')).toEqual({ x: 90, y: 45 })
    expect(position('right')).toEqual({ x: 170, y: 45 })
    expect(position('bottom-left')).toEqual({ x: 10, y: 80 })
    expect(position('bottom')).toEqual({ x: 90, y: 80 })
    expect(position('bottom-right')).toEqual({ x: 170, y: 80 })
  })

  it('ignores the margin for centered anchors', () => {
    expect(position('center', 999)).toEqual(position('center', 0))
  })

  it('clamps an oversized margin so the watermark stays inside the canvas', () => {
    const input = { canvasW: 100, canvasH: 100, wmW: 40, wmH: 40, margin: 500 }
    expect(computeWatermarkPosition({ ...input, anchor: 'top-left' })).toEqual({ x: 30, y: 30 })
    expect(computeWatermarkPosition({ ...input, anchor: 'bottom-right' })).toEqual({
      x: 30,
      y: 30,
    })
  })

  it('clamps a negative margin to zero', () => {
    expect(position('top-left', -50)).toEqual({ x: 0, y: 0 })
  })

  it('throws when a rectangle size is not positive', () => {
    expect(() =>
      computeWatermarkPosition({
        canvasW: 200,
        canvasH: 100,
        wmW: 0,
        wmH: 10,
        anchor: 'center',
        margin: 10,
      }),
    ).toThrow(Error)
    expect(() =>
      computeWatermarkPosition({
        canvasW: 200,
        canvasH: 0,
        wmW: 20,
        wmH: 10,
        anchor: 'center',
        margin: 10,
      }),
    ).toThrow(Error)
  })
})

describe('buildTilePositions', () => {
  it('fills the canvas with a grid of watermark positions', () => {
    const positions = buildTilePositions({
      canvasW: 200,
      canvasH: 100,
      wmW: 50,
      wmH: 25,
      gapX: 50,
      gapY: 25,
    })

    expect(positions).toHaveLength(4)
    expect(positions).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 50 },
      { x: 100, y: 50 },
    ])
  })

  it('counts partial tiles at the right and bottom edges', () => {
    const positions = buildTilePositions({
      canvasW: 250,
      canvasH: 150,
      wmW: 50,
      wmH: 30,
      gapX: 50,
      gapY: 20,
    })

    expect(positions).toHaveLength(9)
    expect(positions.at(-1)).toEqual({ x: 200, y: 100 })
  })

  it('defaults the gap to zero', () => {
    const positions = buildTilePositions({ canvasW: 100, canvasH: 100, wmW: 50, wmH: 50 })
    expect(positions).toHaveLength(4)
  })

  it('throws when a tile size is not positive', () => {
    expect(() => buildTilePositions({ canvasW: 100, canvasH: 100, wmW: 0, wmH: 50 })).toThrow(Error)
  })
})

describe('assertValidOpacity', () => {
  it('accepts values between 0 and 1', () => {
    expect(assertValidOpacity(0)).toBe(0)
    expect(assertValidOpacity(0.35)).toBe(0.35)
    expect(assertValidOpacity(1)).toBe(1)
  })

  it('throws for out-of-range or non-finite values', () => {
    expect(() => assertValidOpacity(-0.1)).toThrow(Error)
    expect(() => assertValidOpacity(1.1)).toThrow(Error)
    expect(() => assertValidOpacity(Number.NaN)).toThrow(Error)
  })
})

describe('assertValidFontSize', () => {
  it('accepts a positive font size', () => {
    expect(assertValidFontSize(12)).toBe(12)
  })

  it('throws for zero, negative or non-finite sizes', () => {
    expect(() => assertValidFontSize(0)).toThrow(Error)
    expect(() => assertValidFontSize(-8)).toThrow(Error)
    expect(() => assertValidFontSize(Number.POSITIVE_INFINITY)).toThrow(Error)
  })
})

describe('clampRotation', () => {
  it('keeps angles inside -90 to 90 degrees', () => {
    expect(clampRotation(45)).toBe(45)
    expect(clampRotation(120)).toBe(90)
    expect(clampRotation(-120)).toBe(-90)
  })

  it('falls back to zero for non-finite input', () => {
    expect(clampRotation(Number.NaN)).toBe(0)
  })
})
