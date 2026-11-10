import { describe, expect, it } from 'vitest'

import {
  md5Fingerprint,
  parsePublicKey,
  sha256Fingerprint,
} from '@/tools/crypto/ssh-key-fingerprint/ssh-key-fingerprint.service'

/** 期望值来自本机 ssh-keygen 实测（与 key-generator 的 fixture 相同） */
const ED25519_PUBLIC_LINE =
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIAAShnJnWzQUKP/GDAWR+fcPrqRX23sQT1HxqA4DtMhz probe-ed25519'
const ED25519_BLOB_B64 = 'AAAAC3NzaC1lZDI1NTE5AAAAIAAShnJnWzQUKP/GDAWR+fcPrqRX23sQT1HxqA4DtMhz'
const RSA_BLOB_B64 =
  'AAAAB3NzaC1yc2EAAAADAQABAAABAQDa61tkubCg5+oxkBzatmqLGVZ05lI6+X+p40bR9fZ0Ir9ufo7yBA3hNcIoZ7o59itr+NvJXrtJipg9y7JW0fOflKr5y/lZjb5QU1z3O1iWt3Pn7V9xqt7hKsuNnj82U+AXzAHSfeSFoCMnDJTmmqqrF6I1FSAk7DKk6qdg4uODU38IO3zR1Cf41ZE/Wfps5iPmxK55GedQ5ockRog1cRJdin1Wv/b9Tq2/rQQnSthM9xh+dHvBTcgeB+gRKvDrOnUtwe4K+kMvnKCLM4mxkLh0Yr93qlp6Mf6pwzMo+7PspUMoYHjgLzOSydAITvM1/iBBQLHWfxKb+4uSDYadpB0x'
const ECDSA_BLOB_B64 =
  'AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBN8wFNJvySn6WO89qGrYcnYv5sQUrzvjgLWsd5N8JKCorugB1GLdtybB0+zX7FDpNOiiePofi7C+yHZtCxQvSGM='

describe('ssh-key-fingerprint service', () => {
  describe('parsePublicKey', () => {
    it('parses an ed25519 authorized_keys line', () => {
      const parsed = parsePublicKey(ED25519_PUBLIC_LINE)
      expect(parsed.keyType).toBe('ssh-ed25519')
      expect(parsed.comment).toBe('probe-ed25519')
      expect(parsed.bits).toBe(256)
      expect(parsed.base64).toBe(ED25519_BLOB_B64)
    })

    it('parses a bare base64 blob without a declared type', () => {
      const parsed = parsePublicKey(ED25519_BLOB_B64)
      expect(parsed.keyType).toBe('ssh-ed25519')
      expect(parsed.comment).toBe('')
    })

    it('reads the modulus size of an RSA key', () => {
      const parsed = parsePublicKey(`ssh-rsa ${RSA_BLOB_B64} rsa@host`)
      expect(parsed.keyType).toBe('ssh-rsa')
      expect(parsed.bits).toBe(2048)
      expect(parsed.comment).toBe('rsa@host')
    })

    it('reads the curve size of an ECDSA key', () => {
      const parsed = parsePublicKey(`ecdsa-sha2-nistp256 ${ECDSA_BLOB_B64}`)
      expect(parsed.keyType).toBe('ecdsa-sha2-nistp256')
      expect(parsed.bits).toBe(256)
    })

    it('throws for an empty input', () => {
      expect(() => parsePublicKey('   ')).toThrow(/empty/)
    })

    it('throws for a private key', () => {
      expect(() =>
        parsePublicKey('-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n'),
      ).toThrow(/private key/)
    })

    it('throws for invalid base64', () => {
      expect(() => parsePublicKey('ssh-ed25519 !!!!!!!!')).toThrow(/base64/)
    })

    it('throws when the declared type does not match the blob', () => {
      expect(() => parsePublicKey(`ssh-ed25519 ${RSA_BLOB_B64}`)).toThrow(/does not match/)
    })

    it('throws when the payload is missing', () => {
      expect(() => parsePublicKey('ssh-ed25519')).toThrow(/missing base64/)
    })
  })

  describe('fingerprints', () => {
    it('matches ssh-keygen SHA256 output for ed25519', async () => {
      await expect(sha256Fingerprint(ED25519_PUBLIC_LINE)).resolves.toBe(
        'SHA256:KYVFypdPtVjNUBKEgUk8k5iybiz3dy88tNyuY/2K7hU',
      )
    })

    it('matches ssh-keygen MD5 output for ed25519', () => {
      expect(md5Fingerprint(ED25519_PUBLIC_LINE)).toBe(
        'MD5:01:6a:30:e8:7c:a4:bf:85:5d:6b:15:cb:a1:1c:3b:cf',
      )
    })

    it('keeps + and / of standard base64 for RSA', async () => {
      await expect(sha256Fingerprint(`ssh-rsa ${RSA_BLOB_B64}`)).resolves.toBe(
        'SHA256:EE2AJpO5+VhIufG1fgh4MxQYqZBX4VEOjXtNX7Ro/+Q',
      )
    })

    it('keeps the MD5 colons for RSA', () => {
      expect(md5Fingerprint(`ssh-rsa ${RSA_BLOB_B64}`)).toBe(
        'MD5:c1:7e:44:f4:bb:9a:d5:0e:e5:d4:b3:f3:45:41:89:5d',
      )
    })

    it('computes the SHA256 fingerprint of an ECDSA key', async () => {
      await expect(sha256Fingerprint(`ecdsa-sha2-nistp256 ${ECDSA_BLOB_B64}`)).resolves.toBe(
        'SHA256:t2bCS63yEbyvIO7qYurjN5vD2cNyZfW8Sky3ParVeWY',
      )
    })

    it('rejects an empty input', async () => {
      await expect(sha256Fingerprint('')).rejects.toThrow(/empty/)
    })
  })
})
