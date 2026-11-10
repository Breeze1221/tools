import { describe, expect, it } from 'vitest'

import {
  applyRenameRules,
  buildRenamePlan,
  DEFAULT_RENAME_RULES,
  makeUniqueFileName,
  sanitizeExtension,
  sanitizeFileName,
  type RenameRules,
} from '@/tools/images/image-batch-renamer/image-batch-renamer.service'

const rules = (overrides: Partial<RenameRules> = {}): RenameRules => ({
  ...DEFAULT_RENAME_RULES,
  ...overrides,
})

describe('applyRenameRules', () => {
  it('joins prefix, original name, padded index and suffix', () => {
    const result = applyRenameRules(
      'photo.png',
      rules({ prefix: 'holiday', suffix: '-edit', indexPadding: 3, separator: '-' }),
      0,
    )

    expect(result).toBe('holiday-photo-001-edit.png')
  })

  it('increments the sequence from the start index', () => {
    const result = applyRenameRules('photo.png', rules({ startIndex: 10, indexPadding: 2 }), 4)
    expect(result).toBe('photo-14.png')
  })

  it('pads the sequence to the requested width', () => {
    expect(applyRenameRules('photo.png', rules({ indexPadding: 1 }), 0)).toBe('photo-1.png')
    expect(applyRenameRules('photo.png', rules({ indexPadding: 6 }), 0)).toBe('photo-000001.png')
  })

  it('clamps the index width into the 1-6 range', () => {
    expect(applyRenameRules('photo.png', rules({ indexPadding: 0 }), 0)).toBe('photo-1.png')
    expect(applyRenameRules('photo.png', rules({ indexPadding: 99 }), 0)).toBe('photo-000001.png')
  })

  it('replaces the requested text in the original name', () => {
    const result = applyRenameRules(
      'IMG_1234.jpg',
      rules({ find: 'IMG', replace: 'DSC', indexPadding: 1 }),
      0,
    )
    expect(result).toBe('DSC_1234-1.jpg')
  })

  it('does not modify the name when the find text is empty', () => {
    const result = applyRenameRules(
      'photo.png',
      rules({ find: '', replace: 'X', indexPadding: 1 }),
      0,
    )
    expect(result).toBe('photo-1.png')
  })

  it('applies lower and upper case to the composed stem', () => {
    expect(applyRenameRules('Photo.PNG', rules({ prefix: 'IMG', letterCase: 'lower' }), 0)).toBe(
      'img-photo-001.PNG',
    )
    expect(applyRenameRules('Photo.PNG', rules({ prefix: 'img', letterCase: 'upper' }), 0)).toBe(
      'IMG-PHOTO-001.PNG',
    )
  })

  it('keeps the original extension untouched', () => {
    expect(applyRenameRules('photo.JPG', rules(), 0)).toBe('photo-001.JPG')
  })

  it('works for files without an extension', () => {
    expect(applyRenameRules('photo', rules(), 0)).toBe('photo-001')
  })

  it('sanitizes forbidden characters in the generated stem', () => {
    const result = applyRenameRules('a:b.png', rules({ indexPadding: 1 }), 0)
    expect(result).toBe('a b-1.png')
  })
})

describe('sanitizeExtension', () => {
  it('strips dots and invalid characters', () => {
    expect(sanitizeExtension('.JPG')).toBe('JPG')
    expect(sanitizeExtension('j/p*g?')).toBe('jpg')
  })

  it('limits the length to 10 characters', () => {
    expect(sanitizeExtension('abcdefghijklmno')).toHaveLength(10)
  })
})

describe('sanitizeFileName', () => {
  it('removes path separators and control characters', () => {
    expect(sanitizeFileName('a/b\\c:d*?')).toBe('a b c d')
  })

  it('falls back to the provided value for empty input', () => {
    expect(sanitizeFileName('   ', 'image')).toBe('image')
  })
})

describe('makeUniqueFileName', () => {
  it('returns the candidate when it is free', () => {
    expect(makeUniqueFileName('cat-001.png', new Set())).toBe('cat-001.png')
  })

  it('appends -2 and then -3 for repeated collisions', () => {
    const used = new Set(['cat-001.png'])
    const second = makeUniqueFileName('cat-001.png', used)
    expect(second).toBe('cat-001-2.png')

    used.add(second)
    expect(makeUniqueFileName('cat-001.png', used)).toBe('cat-001-3.png')
  })

  it('compares names case-insensitively', () => {
    expect(makeUniqueFileName('cat-001.png', new Set(['CAT-001.PNG']))).toBe('cat-001-2.png')
  })

  it('appends the counter to names without an extension', () => {
    expect(makeUniqueFileName('photo', new Set(['photo']))).toBe('photo-2')
  })
})

describe('buildRenamePlan', () => {
  it('returns an empty array for an empty file list', () => {
    expect(buildRenamePlan([], rules())).toEqual([])
  })

  it('builds one plan item per file with sequential numbers', () => {
    const plan = buildRenamePlan(
      [{ name: 'a.png' }, { name: 'b.jpg' }],
      rules({ prefix: 'trip', indexPadding: 2 }),
    )

    expect(plan).toEqual([
      { originalName: 'a.png', newName: 'trip-a-01.png', hasConflict: false },
      { originalName: 'b.jpg', newName: 'trip-b-02.jpg', hasConflict: false },
    ])
  })

  it('produces unique names even when originals repeat', () => {
    const plan = buildRenamePlan(
      [{ name: 'a.png' }, { name: 'a.png' }, { name: 'a.png' }],
      rules({ indexPadding: 1 }),
    )
    const names = plan.map((item) => item.newName.toLowerCase())
    expect(new Set(names).size).toBe(plan.length)
  })
})
