import { describe, expect, it } from 'vitest'

import {
  formatDn,
  getFingerprint,
  parseCertificate,
  pemToDer,
} from '@/tools/crypto/x509-certificate-decoder/x509-certificate-decoder.service'

/** 自签测试证书：RSA 2048 / SHA-256 / CA:TRUE / SAN toolbox.test */
const TEST_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIEATCCAumgAwIBAgIIAQIDBAUGBwgwDQYJKoZIhvcNAQELBQAwajELMAkGA1UE
BhMCQ04xEDAOBgNVBAgMB0JlaWppbmcxEDAOBgNVBAcMB0JlaWppbmcxEDAOBgNV
BAoMB1Rvb2xCb3gxDjAMBgNVBAsMBVRvb2xzMRUwEwYDVQQDDAx0b29sYm94LnRl
c3QwHhcNMjYxMTEwMDMxNDI1WhcNMzYxMTA3MDMxNDI1WjBqMQswCQYDVQQGEwJD
TjEQMA4GA1UECAwHQmVpamluZzEQMA4GA1UEBwwHQmVpamluZzEQMA4GA1UECgwH
VG9vbEJveDEOMAwGA1UECwwFVG9vbHMxFTATBgNVBAMMDHRvb2xib3gudGVzdDCC
ASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMJDvGQ7NrBLZ4dWbLdi8cpl
qMAKtrv34qtFruPEvRP7yokmIMyz4BmLba2/Ac5X4julQC7+m+7ZDllW4ul3BsAJ
u7U597q0lw0NC24qVb7iZ+RNtjejllKg2bUW46lUgW6NZYBWBjk5imoovX+vsdFW
KnJRhxFu2irTDcdCXk/6B1hTrDBz3kseu3eHMUEGGX8CkEjdZaDIGFtXPKrOV52Z
JttRyoKD9XbQBhQU+V5B8Xc+3YZezHpUaQyz1d3PPE47/8uAwcYZ8G6HZEx2hNYL
oGHA/BIDZNIJkCYIJnMhYLgTTGQFSCkdVPpeRtt4RpftjHrZ4gGyzw+ssQ0k6+cC
AwEAAaOBqjCBpzAdBgNVHQ4EFgQUpKYPFYLEe40ekVzWvFxSloNMuQowHwYDVR0j
BBgwFoAUpKYPFYLEe40ekVzWvFxSloNMuQowDwYDVR0TAQH/BAUwAwEB/zAOBgNV
HQ8BAf8EBAMCAYYwLwYDVR0RBCgwJoIMdG9vbGJveC50ZXN0ghB3d3cudG9vbGJv
eC50ZXN0hwR/AAABMBMGA1UdJQQMMAoGCCsGAQUFBwMBMA0GCSqGSIb3DQEBCwUA
A4IBAQC+bxk4LXeL1QiynhhoAmBkiwKMG+P+DmiQ/NhjaFGCpjIZUyGHOlJ4/BNp
ddBy2fAo6HLHB5ns1p/Xrc8ibd4qO/WaXoh2sSMIUgwE1RQ0Qrjwj9cwf7VfrWDg
xerNK6ustfEVP7kBWkDqR60L7eqQ5CcbutDcrWo/dju9yqpdObUYpS19Iiqbiciy
bBJMBrDvanK58YLX7EzFuSSRO12h/urE1VKZq59PTvZfFJY+FOJjX1h8dU41Zkzo
4PZXJew6vjvBFBr0XCQ45iRenWXLhKUNkUdeaoD6KmPQXXdldnQWUUszT45maKWu
VUbRaUA3Exsp/N4JsdyedaVyJdnP
-----END CERTIFICATE-----`

const TEST_CERTIFICATE_BASE64 = TEST_CERTIFICATE.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')

const EXPECTED_NAME = 'C=CN, ST=Beijing, L=Beijing, O=ToolBox, OU=Tools, CN=toolbox.test'

describe('x509-certificate-decoder service', () => {
  describe('parseCertificate', () => {
    it('parses version, serial number and signature algorithm', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE)
      expect(certificate.version).toBe(3)
      expect(certificate.serialNumber).toBe('0102030405060708')
      expect(certificate.signatureAlgorithm).toBe('SHA-256 with RSA')
      expect(certificate.signatureAlgorithmOid).toBe('1.2.840.113549.1.1.11')
    })

    it('parses issuer and subject', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE)
      expect(formatDn(certificate.issuer)).toBe(EXPECTED_NAME)
      expect(formatDn(certificate.subject)).toBe(EXPECTED_NAME)
      expect(certificate.subject.map((attribute) => attribute.shortName)).toEqual([
        'C',
        'ST',
        'L',
        'O',
        'OU',
        'CN',
      ])
    })

    it('parses the public key algorithm and size', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE)
      expect(certificate.publicKeyAlgorithm).toBe('RSA')
      expect(certificate.publicKeyBits).toBe(2048)
      expect(certificate.curve).toBeNull()
    })

    it('parses the validity window and reports a valid certificate', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE, Date.parse('2030-01-01T00:00:00Z'))
      expect(certificate.validity.notBefore).toBe('2026-11-10T03:14:25.000Z')
      expect(certificate.validity.notAfter).toBe('2036-11-07T03:14:25.000Z')
      expect(certificate.validity.isExpired).toBe(false)
      expect(certificate.validity.isNotYetValid).toBe(false)
    })

    it('flags an expired certificate', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE, Date.parse('2040-01-01T00:00:00Z'))
      expect(certificate.validity.isExpired).toBe(true)
      expect(certificate.validity.isNotYetValid).toBe(false)
    })

    it('flags a certificate that is not valid yet', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE, Date.parse('2020-01-01T00:00:00Z'))
      expect(certificate.validity.isExpired).toBe(false)
      expect(certificate.validity.isNotYetValid).toBe(true)
    })

    it('parses SAN DNS and IP entries', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE)
      expect(certificate.subjectAltNames.dnsNames).toEqual(['toolbox.test', 'www.toolbox.test'])
      expect(certificate.subjectAltNames.ipAddresses).toEqual(['127.0.0.1'])
    })

    it('detects CA basic constraints and key usages', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE)
      expect(certificate.isCa).toBe(true)
      expect(certificate.keyUsages).toEqual(['digitalSignature', 'keyCertSign', 'cRLSign'])
    })

    it('accepts base64 DER without a PEM header', () => {
      const fromPem = parseCertificate(TEST_CERTIFICATE)
      const fromBase64 = parseCertificate(TEST_CERTIFICATE_BASE64)
      expect(fromBase64.serialNumber).toBe(fromPem.serialNumber)
      expect(fromBase64.tbsFingerprint).toBe(fromPem.tbsFingerprint)
    })

    it('throws for empty input', () => {
      expect(() => parseCertificate('   ')).toThrow(/empty/)
    })

    it('throws for a malformed PEM body', () => {
      expect(() =>
        parseCertificate('-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----'),
      ).toThrow(/DER/)
    })

    it('throws when the PEM block is not a certificate', () => {
      const publicKey = TEST_CERTIFICATE.replaceAll('CERTIFICATE', 'PUBLIC KEY')
      expect(() => parseCertificate(publicKey)).toThrow(/unexpected type/)
    })

    it('throws for input that is neither PEM nor base64', () => {
      expect(() => parseCertificate('!!!!')).toThrow(/base64/)
    })
  })

  describe('getFingerprint', () => {
    it('returns a 64 character lowercase hex digest', () => {
      const certificate = parseCertificate(TEST_CERTIFICATE)
      expect(certificate.tbsFingerprint).toMatch(/^[0-9a-f]{64}$/)
      expect(getFingerprint(pemToDer(TEST_CERTIFICATE))).toMatch(/^[0-9a-f]{64}$/)
      // tbsCertificate 只是整张证书的一部分，两者指纹必须不同
      expect(certificate.tbsFingerprint).not.toBe(getFingerprint(pemToDer(TEST_CERTIFICATE)))
    })
  })

  describe('pemToDer', () => {
    it('returns DER bytes for a certificate block', () => {
      const der = pemToDer(TEST_CERTIFICATE)
      expect(der.length).toBeGreaterThan(0)
      expect(der[0]).toBe(0x30)
    })
  })

  describe('formatDn', () => {
    it('joins attributes in encoded order', () => {
      expect(formatDn([{ oid: '2.5.4.3', shortName: 'CN', value: 'example.com' }])).toBe(
        'CN=example.com',
      )
    })

    it('returns an empty string for an empty name', () => {
      expect(formatDn([])).toBe('')
    })
  })
})
