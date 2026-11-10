import { describe, expect, it } from 'vitest'

import {
  MAX_CHINESE_NUMBER,
  chineseToNumber,
  numberToChinese,
} from '@/tools/text/chinese-number-converter/chinese-number-converter.service'

describe('chineseToNumber', () => {
  it('parses basic digits and zero variants', () => {
    expect(chineseToNumber('零')).toBe(0)
    expect(chineseToNumber('〇')).toBe(0)
    expect(chineseToNumber('一')).toBe(1)
    expect(chineseToNumber('九')).toBe(9)
  })

  it('parses tens and teens', () => {
    expect(chineseToNumber('十')).toBe(10)
    expect(chineseToNumber('十一')).toBe(11)
    expect(chineseToNumber('十二')).toBe(12)
    expect(chineseToNumber('二十')).toBe(20)
    expect(chineseToNumber('二十九')).toBe(29)
  })

  it('parses hundreds and thousands with zeros', () => {
    expect(chineseToNumber('一百零五')).toBe(105)
    expect(chineseToNumber('一千零一')).toBe(1001)
    expect(chineseToNumber('九百九十九')).toBe(999)
  })

  it('parses 万 and 亿 groups', () => {
    expect(chineseToNumber('两万三千')).toBe(23000)
    expect(chineseToNumber('一万零五')).toBe(10005)
    expect(chineseToNumber('一亿二千万')).toBe(120_000_000)
    expect(chineseToNumber('三千五百万')).toBe(35_000_000)
    expect(chineseToNumber('九千九百九十九亿')).toBe(MAX_CHINESE_NUMBER)
  })

  it('parses decimals after 点', () => {
    expect(chineseToNumber('三点一四')).toBe(3.14)
    expect(chineseToNumber('十点五')).toBe(10.5)
  })

  it('accepts Arabic digits and full-width digits', () => {
    expect(chineseToNumber('１23')).toBe(123)
    expect(chineseToNumber('1,234')).toBe(1234)
    expect(chineseToNumber('3.5')).toBe(3.5)
  })

  it('throws on empty or invalid input', () => {
    expect(() => chineseToNumber('')).toThrow(/empty/)
    expect(() => chineseToNumber('   ')).toThrow(/empty/)
    expect(() => chineseToNumber('abc')).toThrow(/Unexpected character/)
    expect(() => chineseToNumber('一百元')).toThrow(/Unexpected character/)
    expect(() => chineseToNumber('负一')).toThrow(/Unexpected character/)
  })

  it('throws on malformed decimals', () => {
    expect(() => chineseToNumber('一百点')).toThrow(/no digits after the decimal/)
    expect(() => chineseToNumber('一点二点三')).toThrow(/more than one decimal/)
  })
})

describe('numberToChinese', () => {
  it('converts zero, tens and hundreds', () => {
    expect(numberToChinese(0)).toBe('零')
    expect(numberToChinese(10)).toBe('十')
    expect(numberToChinese(11)).toBe('十一')
    expect(numberToChinese(20)).toBe('二十')
    expect(numberToChinese(105)).toBe('一百零五')
    expect(numberToChinese(110)).toBe('一百一十')
    expect(numberToChinese(1001)).toBe('一千零一')
  })

  it('converts 万 and 亿 groups', () => {
    expect(numberToChinese(10005)).toBe('一万零五')
    expect(numberToChinese(100000)).toBe('十万')
    expect(numberToChinese(100010)).toBe('十万零一十')
    expect(numberToChinese(1_000_000)).toBe('一百万')
    expect(numberToChinese(35_000_000)).toBe('三千五百万')
    expect(numberToChinese(999_900_000_000)).toBe('九千九百九十九亿')
  })

  it('converts decimals', () => {
    expect(numberToChinese(1234.56)).toBe('一千二百三十四点五六')
    expect(numberToChinese(1.5)).toBe('一点五')
    expect(numberToChinese(0.05)).toBe('零点零五')
    expect(numberToChinese(0.5)).toBe('零点五')
  })

  it('accepts numeric strings with separators', () => {
    expect(numberToChinese('1,234')).toBe('一千二百三十四')
  })

  it('produces RMB financial uppercase', () => {
    expect(numberToChinese(0, { financial: true })).toBe('零元整')
    expect(numberToChinese(10, { financial: true })).toBe('壹拾元整')
    expect(numberToChinese(100, { financial: true })).toBe('壹佰元整')
    expect(numberToChinese(1234.56, { financial: true })).toBe(
      '壹仟贰佰叁拾肆元伍角陆分',
    )
    expect(numberToChinese(1.05, { financial: true })).toBe('壹元零伍分')
    expect(numberToChinese(0.5, { financial: true })).toBe('伍角')
    expect(numberToChinese(0.05, { financial: true })).toBe('伍分')
  })

  it('throws on negative, non-finite or out-of-range values', () => {
    expect(() => numberToChinese(-1)).toThrow(/negative/)
    expect(() => numberToChinese(Number.NaN)).toThrow(/finite/)
    expect(() => numberToChinese(Number.POSITIVE_INFINITY)).toThrow(/finite/)
    expect(() => numberToChinese('abc')).toThrow(/finite/)
    expect(() => numberToChinese(MAX_CHINESE_NUMBER + 1)).toThrow(/maximum/)
  })
})
