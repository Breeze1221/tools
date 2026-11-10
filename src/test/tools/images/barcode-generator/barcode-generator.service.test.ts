import { describe, expect, it } from 'vitest'

import {
  code128Encode,
  codesToBits,
} from '@/tools/images/barcode-generator/barcode-generator.service'

describe('code128Encode', () => {
  // "HELLO" 用 Code 128B 编码向量验证
  it('encodes "HELLO" with variant B correctly', () => {
    const result = code128Encode('HELLO', 'B')
    expect(result.subset).toBe('B')
    expect(result.codes[0]).toBe(104) // Start B
    expect(result.codes[result.codes.length - 1]).toBe(106) // Stop
    // H='H' - 32 = 40
    expect(result.codes[1]).toBe('H'.charCodeAt(0) - 32) // 40
    expect(result.codes[2]).toBe('E'.charCodeAt(0) - 32) // 37
    expect(result.codes[3]).toBe('L'.charCodeAt(0) - 32) // 44
    expect(result.codes[4]).toBe('L'.charCodeAt(0) - 32) // 44
    expect(result.codes[5]).toBe('O'.charCodeAt(0) - 32) // 47
  })

  it('computes correct check digit', () => {
    const result = code128Encode('A', 'B')
    // Start B(104) * 1 + A(33) * 2 = 104 + 66 = 170, 170 % 103 = 67
    expect(result.check).toBe(67)
    expect(result.codes).toEqual([104, 33, 67, 106])
  })

  it('starts with Start symbol of selected subset', () => {
    // A 子集用 ASCII 0-95 范围内字符，'!' = 33 在 A 和 B 重叠区
    expect(code128Encode('!!', 'A').codes[0]).toBe(103) // Start A
    expect(code128Encode('ab', 'B').codes[0]).toBe(104) // Start B
    expect(code128Encode('0000', 'C').codes[0]).toBe(105) // Start C
  })

  it('variant auto selects C for even-length digit strings', () => {
    const result = code128Encode('123456', 'auto')
    expect(result.subset).toBe('C')
    expect(result.codes[1]).toBe(12)
    expect(result.codes[2]).toBe(34)
    expect(result.codes[3]).toBe(56)
  })

  it('variant auto selects A when only A-only chars present', () => {
    // SOH (1) + SP (32)：1 是 A-only (0-31)，32 重叠，没有 B-only (96-127)
    const result = code128Encode('\u0001 ', 'auto')
    expect(result.subset).toBe('A')
    expect(result.codes[1]).toBe(1) // SOH = 1
  })

  it('variant auto selects B for printable ASCII', () => {
    const result = code128Encode('Hello!', 'auto')
    expect(result.subset).toBe('B')
  })

  it('rejects empty input', () => {
    expect(() => code128Encode('', 'B')).toThrow(/at least 1 character/)
  })

  it('rejects input longer than 50 chars', () => {
    const long = 'a'.repeat(51)
    expect(() => code128Encode(long, 'auto')).toThrow(/at most 50/)
  })

  it('rejects chars outside B subset', () => {
    expect(() => code128Encode('café', 'B')).toThrow(/ASCII 32-127/)
    expect(() => code128Encode('a\nb', 'B')).toThrow(/ASCII 32-127/)
  })

  it('rejects non-digit input for subset C', () => {
    // 长度必须偶数，这里 'ab12' 长度 4 但含非数字
    expect(() => code128Encode('ab12', 'C')).toThrow(/digits only/)
  })

  it('rejects odd-length digit string for subset C', () => {
    expect(() => code128Encode('123', 'C')).toThrow(/even number/)
  })

  it('has correct structure: [Start, ...data, Check, Stop]', () => {
    // 结构 = start(1) + data(n) + check(1) + stop(1) = n + 3
    const aResult = code128Encode('!!', 'A')
    // '!!' 是 A 子集 2 个数据符号
    expect(aResult.codes).toHaveLength(2 + 3) // 5
    expect(aResult.codes.at(-1)).toBe(106)

    const bResult = code128Encode('ab', 'B')
    expect(bResult.codes).toHaveLength(2 + 3)
    expect(bResult.codes.at(-1)).toBe(106)

    const cResult = code128Encode('0011', 'C')
    // 4 数字 -> 2 个 C 子集数据符号
    expect(cResult.codes).toHaveLength(2 + 3)
    expect(cResult.codes.at(-1)).toBe(106)
  })

  it('produces consistent bit strings via codesToBits', () => {
    const result = code128Encode('XY', 'B')
    const bits = codesToBits(result.codes)
    // codes: [StartB(104), X(56), Y(57), Check, Stop(106)] = 5 items
    // Stop 最后 13 模块，其余 11 模块
    expect(bits.length).toBe(4 * 11 + 13)
  })

  it('preserves codes[0] as start, codes[-2] as check, codes[-1] as stop', () => {
    const result = code128Encode('ABC', 'B')
    expect(result.codes[0]).toBe(104)
    expect(result.codes.at(-2)).toBe(result.check)
    expect(result.codes.at(-1)).toBe(106)
  })
})
