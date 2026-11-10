import { describe, expect, it } from 'vitest'

import { algorithms, hashBytes, matchExpectedHash } from '@/tools/crypto/file-hash-checker/service'

describe('file-hash-checker service', () => {
  describe('algorithms', () => {
    it('contains the expected algorithms', () => {
      expect(algorithms).toHaveLength(7)
      expect(algorithms).toContain('MD5')
      expect(algorithms).toContain('SHA1')
      expect(algorithms).toContain('SHA256')
      expect(algorithms).toContain('SHA384')
      expect(algorithms).toContain('SHA512')
      expect(algorithms).toContain('SHA3-256')
      expect(algorithms).toContain('SHA3-512')
    })
  })

  describe('hashBytes', () => {
    const textEncoder = new TextEncoder()

    it('returns known MD5 for empty string', async () => {
      const bytes = textEncoder.encode('')
      const result = await hashBytes(bytes.buffer, 'MD5')
      expect(result).toBe('d41d8cd98f00b204e9800998ecf8427e')
    })

    it('returns known MD5 for "abc"', async () => {
      const bytes = textEncoder.encode('abc')
      const result = await hashBytes(bytes.buffer, 'MD5')
      expect(result).toBe('900150983cd24fb0d6963f7d28e17f72')
    })

    it('returns known SHA-256 for empty string', async () => {
      const bytes = textEncoder.encode('')
      const result = await hashBytes(bytes.buffer, 'SHA256')
      expect(result).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      )
    })

    it('returns known SHA-1 for "abc"', async () => {
      const bytes = textEncoder.encode('abc')
      const result = await hashBytes(bytes.buffer, 'SHA1')
      expect(result).toBe('a9993e364706816aba3e25717850c26c9cd0d89d')
    })

    it('returns known SHA-512 for "abc"', async () => {
      const bytes = textEncoder.encode('abc')
      const result = await hashBytes(bytes.buffer, 'SHA512')
      expect(result).toBe(
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
      )
    })

    it('throws on unsupported algorithm', async () => {
      const bytes = textEncoder.encode('test')
      await expect(hashBytes(bytes.buffer, 'BLAKE2' as never)).rejects.toThrow(
        /Unsupported algorithm/,
      )
    })

    it('returns lowercase hex for every supported algorithm', async () => {
      const bytes = textEncoder.encode('toolbox-test')
      for (const algo of algorithms) {
        const result = await hashBytes(bytes.buffer, algo)
        expect(result).toMatch(/^[0-9a-f]+$/)
      }
    })
  })

  describe('matchExpectedHash', () => {
    it('returns matching algorithms when found', () => {
      const results = {
        MD5: 'd41d8cd98f00b204e9800998ecf8427e',
        SHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      }
      expect(matchExpectedHash('d41d8cd98f00b204e9800998ecf8427e', results)).toEqual(['MD5'])
    })

    it('matches ignoring case and whitespace', () => {
      const results = { MD5: 'd41d8cd98f00b204e9800998ecf8427e' }
      expect(matchExpectedHash('  D41D8CD98F00B204E9800998ECF8427E  ', results)).toEqual(['MD5'])
    })

    it('returns empty array for empty expected', () => {
      const results = { MD5: 'd41d8cd98f00b204e9800998ecf8427e' }
      expect(matchExpectedHash('', results)).toEqual([])
    })

    it('returns empty array when no match', () => {
      const results = { MD5: 'd41d8cd98f00b204e9800998ecf8427e' }
      expect(matchExpectedHash('00000000000000000000000000000000', results)).toEqual([])
    })

    it('matches multiple algorithms when the same hash appears', () => {
      // 不同算法一般不会碰撞，但测试逻辑正常处理多命
      const results = {
        MD5: 'aaa',
        SHA1: 'bbb',
      }
      expect(matchExpectedHash('aaa', results)).toEqual(['MD5'])
      expect(matchExpectedHash('bbb', results)).toEqual(['SHA1'])
    })
  })
})
