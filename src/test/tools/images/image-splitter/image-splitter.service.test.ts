import { describe, expect, it } from 'vitest'

import {
  MAX_GRID,
  SPLIT_PRESETS,
  computeTiles,
} from '@/tools/images/image-splitter/image-splitter.service'

describe('image-splitter service', () => {
  it('exposes presets within the grid limit', () => {
    expect(SPLIT_PRESETS.map((preset) => `${preset.rows}x${preset.cols}`)).toEqual([
      '2x2',
      '3x3',
      '4x4',
    ])
    for (const preset of SPLIT_PRESETS) {
      expect(preset.rows).toBeLessThanOrEqual(MAX_GRID)
      expect(preset.cols).toBeLessThanOrEqual(MAX_GRID)
    }
  })

  it('splits an evenly divisible image', () => {
    const tiles = computeTiles({ width: 100, height: 100 }, 2, 2)
    expect(tiles).toHaveLength(4)
    expect(tiles[0]).toEqual({ row: 0, col: 0, x: 0, y: 0, width: 50, height: 50 })
    expect(tiles[1]).toEqual({ row: 0, col: 1, x: 50, y: 0, width: 50, height: 50 })
    expect(tiles[2]).toEqual({ row: 1, col: 0, x: 0, y: 50, width: 50, height: 50 })
    expect(tiles[3]).toEqual({ row: 1, col: 1, x: 50, y: 50, width: 50, height: 50 })
  })

  it('gives leftover pixels to the last row and column', () => {
    const tiles = computeTiles({ width: 101, height: 100 }, 2, 2)
    const widths = tiles.filter((tile) => tile.row === 0).map((tile) => tile.width)
    expect(widths).toEqual([50, 51])

    const heights = tiles.filter((tile) => tile.col === 0).map((tile) => tile.height)
    expect(heights).toEqual([50, 50])

    const uneven = computeTiles({ width: 100, height: 101 }, 2, 2)
    expect(uneven.filter((tile) => tile.col === 0).map((tile) => tile.height)).toEqual([50, 51])
  })

  it('supports single-row and single-column grids', () => {
    expect(computeTiles({ width: 90, height: 60 }, 1, 3).map((tile) => tile.width)).toEqual([
      30, 30, 30,
    ])
    expect(computeTiles({ width: 90, height: 60 }, 3, 1).map((tile) => tile.height)).toEqual([
      20, 20, 20,
    ])
    expect(computeTiles({ width: 90, height: 60 }, 1, 1)).toEqual([
      { row: 0, col: 0, x: 0, y: 0, width: 90, height: 60 },
    ])
  })

  it('produces contiguous tiles covering the whole image', () => {
    const tiles = computeTiles({ width: 333, height: 217 }, 4, 5)
    expect(tiles).toHaveLength(20)
    const totalArea = tiles.reduce((sum, tile) => sum + tile.width * tile.height, 0)
    expect(totalArea).toBe(333 * 217)
    expect(tiles[5]?.x).toBe(0)
    expect(tiles[5]?.y).toBe(tiles[0]?.height)
  })

  it('rejects rows or columns outside 1–10', () => {
    expect(() => computeTiles({ width: 100, height: 100 }, 0, 2)).toThrow(/rows/)
    expect(() => computeTiles({ width: 100, height: 100 }, 2, 0)).toThrow(/cols/)
    expect(() => computeTiles({ width: 100, height: 100 }, 11, 2)).toThrow(/rows/)
    expect(() => computeTiles({ width: 100, height: 100 }, 2, 11)).toThrow(/cols/)
    expect(() => computeTiles({ width: 100, height: 100 }, 1.5, 2)).toThrow(/integer/)
  })

  it('rejects invalid image sizes', () => {
    expect(() => computeTiles({ width: 0, height: 100 }, 2, 2)).toThrow(/positive/)
    expect(() => computeTiles({ width: 100, height: -5 }, 2, 2)).toThrow(/positive/)
    expect(() => computeTiles({ width: Number.NaN, height: 100 }, 2, 2)).toThrow(/positive/)
  })

  it('throws when the image is smaller than the requested grid', () => {
    expect(() => computeTiles({ width: 2, height: 10 }, 1, 3)).toThrow(/too small/)
    expect(() => computeTiles({ width: 10, height: 2 }, 3, 1)).toThrow(/too small/)
  })
})
