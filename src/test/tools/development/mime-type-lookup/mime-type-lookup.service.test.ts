import { describe, expect, it } from 'vitest'

import {
  MIME_TABLE,
  lookupByExtension,
  lookupByMime,
  normalizeExtension,
  normalizeMime,
  searchMime,
} from '@/tools/development/mime-type-lookup/mime-type-lookup.service'

describe('mime-type-lookup service', () => {
  describe('MIME_TABLE', () => {
    it('contains at least 100 mappings', () => {
      expect(MIME_TABLE.length).toBeGreaterThanOrEqual(100)
    })

    it('uses lowercase extensions without leading dots', () => {
      for (const entry of MIME_TABLE) {
        expect(entry.mime).toBe(entry.mime.toLowerCase())
        for (const extension of entry.extensions) {
          expect(extension).toBe(extension.toLowerCase())
          expect(extension.startsWith('.')).toBe(false)
        }
      }
    })
  })

  describe('lookupByExtension', () => {
    it('finds json, png and mp4', () => {
      expect(lookupByExtension('json')[0]?.mime).toBe('application/json')
      expect(lookupByExtension('png')[0]?.mime).toBe('image/png')
      expect(lookupByExtension('mp4')[0]?.mime).toBe('video/mp4')
    })

    it('accepts extensions with a leading dot', () => {
      expect(lookupByExtension('.json')[0]?.mime).toBe('application/json')
      expect(lookupByExtension('.PNG')[0]?.mime).toBe('image/png')
    })

    it('is case insensitive and trims whitespace', () => {
      expect(lookupByExtension('  JSON  ')[0]?.mime).toBe('application/json')
      expect(lookupByExtension('Mp4')[0]?.mime).toBe('video/mp4')
    })

    it('returns every MIME sharing the extension', () => {
      const icons = lookupByExtension('ico').map((entry) => entry.mime)
      expect(icons).toContain('image/x-icon')
      expect(icons).toContain('image/vnd.microsoft.icon')
    })

    it('returns an empty array for unknown or empty input', () => {
      expect(lookupByExtension('nope')).toEqual([])
      expect(lookupByExtension('')).toEqual([])
      expect(lookupByExtension('   ')).toEqual([])
      expect(lookupByExtension('.')).toEqual([])
    })
  })

  describe('lookupByMime', () => {
    it('finds extensions by MIME type', () => {
      expect(lookupByMime('image/png')[0]?.extensions).toContain('png')
      expect(lookupByMime('application/json')[0]?.extensions).toContain('json')
    })

    it('ignores case, whitespace and charset parameters', () => {
      expect(lookupByMime('IMAGE/PNG')[0]?.mime).toBe('image/png')
      expect(lookupByMime('text/html; charset=utf-8')[0]?.mime).toBe('text/html')
    })

    it('returns an empty array for unknown MIME types', () => {
      expect(lookupByMime('application/x-unknown')).toEqual([])
      expect(lookupByMime('')).toEqual([])
    })
  })

  describe('searchMime', () => {
    it('matches mime, extension and category fragments', () => {
      expect(searchMime('json').some((entry) => entry.mime === 'application/json')).toBe(true)
      expect(searchMime('woff').some((entry) => entry.mime === 'font/woff2')).toBe(true)
      expect(searchMime('audio').every((entry) => entry.category === 'audio')).toBe(true)
    })

    it('filters by category', () => {
      const images = searchMime('', 'image')
      expect(images.length).toBeGreaterThan(0)
      expect(images.every((entry) => entry.category === 'image')).toBe(true)
    })

    it('returns everything for an empty query', () => {
      expect(searchMime('')).toHaveLength(MIME_TABLE.length)
    })

    it('returns an empty array when nothing matches', () => {
      expect(searchMime('definitely-not-a-mime')).toEqual([])
    })
  })

  describe('normalizers', () => {
    it('normalizes extensions', () => {
      expect(normalizeExtension('...JSON')).toBe('json')
      expect(normalizeExtension(' .Png ')).toBe('png')
    })

    it('normalizes MIME types', () => {
      expect(normalizeMime(' Text/HTML ; charset=UTF-8')).toBe('text/html')
    })
  })
})
