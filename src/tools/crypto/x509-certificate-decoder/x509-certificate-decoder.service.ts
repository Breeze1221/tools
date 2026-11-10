/**
 * X.509 证书只读解析（RFC 5280）：不解签名、不校验证书链。
 * 输入为 PEM（CERTIFICATE）或 DER 的 Base64，畸形数据一律抛 Error。
 */

import CryptoJS from 'crypto-js'

import { base64ToBytes } from '@/utils/base64'
import { bytesToHex } from '@/utils/bytes'
import { pemToDer as decodePem } from '@/utils/pem'
import {
  Asn1Tag,
  derChild,
  derExpectTag,
  derIntegerMagnitude,
  derIntegerValue,
  derObjectIdentifierText,
  derStringText,
  derTlv,
  parseDer,
  type DerElement,
} from '@/utils/asn1'

export interface DnAttribute {
  oid: string
  /** 常用短名（CN / O / OU / C…），未知 OID 回退为点分形式 */
  shortName: string
  value: string
}

export type DistinguishedName = DnAttribute[]

export interface CertificateValidity {
  /** ISO 8601（UTC） */
  notBefore: string
  notAfter: string
  isExpired: boolean
  isNotYetValid: boolean
}

export interface SubjectAltNames {
  dnsNames: string[]
  ipAddresses: string[]
}

export const keyUsageIds = [
  'digitalSignature',
  'nonRepudiation',
  'keyEncipherment',
  'dataEncipherment',
  'keyAgreement',
  'keyCertSign',
  'cRLSign',
  'encipherOnly',
  'decipherOnly',
] as const

export type KeyUsageId = (typeof keyUsageIds)[number]

export interface ParsedCertificate {
  /** 1 / 2 / 3 */
  version: number
  /** 递增整数，小写 hex */
  serialNumber: string
  signatureAlgorithm: string
  signatureAlgorithmOid: string
  issuer: DistinguishedName
  subject: DistinguishedName
  validity: CertificateValidity
  publicKeyAlgorithm: string
  publicKeyAlgorithmOid: string
  publicKeyBits: number
  curve: string | null
  subjectAltNames: SubjectAltNames
  isCa: boolean
  keyUsages: KeyUsageId[]
  /** 原始 tbsCertificate（含 TLV 头）的 SHA-256，小写 hex */
  tbsFingerprint: string
}

const OID_RSA = '1.2.840.113549.1.1.1'
const OID_EC_PUBLIC_KEY = '1.2.840.10045.2.1'
const OID_ED25519 = '1.3.101.112'
const OID_ED448 = '1.3.101.113'

const SIGNATURE_ALGORITHMS: Record<string, string> = {
  '1.2.840.113549.1.1.2': 'MD2 with RSA',
  '1.2.840.113549.1.1.4': 'MD5 with RSA',
  '1.2.840.113549.1.1.5': 'SHA-1 with RSA',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  '1.2.840.113549.1.1.11': 'SHA-256 with RSA',
  '1.2.840.113549.1.1.12': 'SHA-384 with RSA',
  '1.2.840.113549.1.1.13': 'SHA-512 with RSA',
  '1.2.840.10045.4.1': 'SHA-1 with ECDSA',
  '1.2.840.10045.4.3.1': 'SHA-224 with ECDSA',
  '1.2.840.10045.4.3.2': 'SHA-256 with ECDSA',
  '1.2.840.10045.4.3.3': 'SHA-384 with ECDSA',
  '1.2.840.10045.4.3.4': 'SHA-512 with ECDSA',
  '1.2.840.10040.4.3': 'SHA-1 with DSA',
  '2.16.840.1.101.3.4.3.2': 'SHA-256 with DSA',
  '1.3.101.112': 'Ed25519',
  '1.3.101.113': 'Ed448',
}

const PUBLIC_KEY_ALGORITHMS: Record<string, string> = {
  [OID_RSA]: 'RSA',
  '1.2.840.113549.1.1.10': 'RSASSA-PSS',
  [OID_EC_PUBLIC_KEY]: 'ECDSA',
  [OID_ED25519]: 'Ed25519',
  [OID_ED448]: 'Ed448',
  '1.2.840.10040.4.1': 'DSA',
  '1.2.840.113549.1.3.1': 'DH',
}

const CURVES: Record<string, string> = {
  '1.2.840.10045.3.1.1': 'P-192',
  '1.2.840.10045.3.1.7': 'P-256',
  '1.3.132.0.10': 'secp256k1',
  '1.3.132.0.34': 'P-384',
  '1.3.132.0.35': 'P-521',
}

const CURVE_BITS: Record<string, number> = {
  'P-192': 192,
  'P-256': 256,
  secp256k1: 256,
  'P-384': 384,
  'P-521': 521,
}

const DN_SHORT_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.4': 'SN',
  '2.5.4.5': 'serialNumber',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.9': 'street',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '2.5.4.12': 'title',
  '2.5.4.15': 'businessCategory',
  '2.5.4.17': 'postalCode',
  '2.5.4.42': 'GN',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '0.9.2342.19200300.100.1.1': 'UID',
  '0.9.2342.19200300.100.1.25': 'DC',
}

const EXT_BASIC_CONSTRAINTS = '2.5.29.19'
const EXT_KEY_USAGE = '2.5.29.15'
const EXT_SUBJECT_ALT_NAME = '2.5.29.17'

const UTC_TIME = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?(?:Z|([+-])(\d{2})(\d{2}))$/
const GENERALIZED_TIME =
  /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:[.,]\d+)?(?:Z|([+-])(\d{2})(\d{2}))$/

/** PEM → DER 字节；只接受 CERTIFICATE 块 */
export function pemToDer(pem: string): Uint8Array {
  return decodePem(pem, ['CERTIFICATE']).der
}

/** 证书输入统一转 DER：带 PEM 头走 PEM，否则按 DER 的 Base64 处理 */
function toDer(input: string): Uint8Array {
  const trimmed = input.trim()
  if (trimmed === '') {
    throw new Error('Certificate: input is empty')
  }
  return trimmed.includes('-----BEGIN') ? pemToDer(trimmed) : base64ToBytes(trimmed)
}

/** 一段 DER 的 SHA-256 指纹（小写 hex） */
export function getFingerprint(der: Uint8Array): string {
  return CryptoJS.SHA256(CryptoJS.lib.WordArray.create(der)).toString(CryptoJS.enc.Hex)
}

/** Distinguished Name → 可读字符串，保留证书里的编码顺序 */
export function formatDn(dn: DistinguishedName): string {
  return dn.map((attribute) => `${attribute.shortName}=${attribute.value}`).join(', ')
}

function parseAlgorithm(
  element: DerElement,
  names: Record<string, string>,
): { oid: string; name: string } {
  const sequence = derExpectTag(element, Asn1Tag.sequence, 'AlgorithmIdentifier')
  const oid = derObjectIdentifierText(
    derExpectTag(
      derChild(sequence, 0, 'AlgorithmIdentifier'),
      Asn1Tag.objectIdentifier,
      'algorithm',
    ),
  )
  return { oid, name: names[oid] ?? oid }
}

function parseName(element: DerElement): DistinguishedName {
  const sequence = derExpectTag(element, Asn1Tag.sequence, 'Name')
  const attributes: DnAttribute[] = []
  for (const rdn of sequence.children) {
    derExpectTag(rdn, 0x31, 'relativeDistinguishedName')
    for (const attribute of rdn.children) {
      const pair = derExpectTag(attribute, Asn1Tag.sequence, 'AttributeTypeAndValue')
      const oid = derObjectIdentifierText(
        derExpectTag(derChild(pair, 0, 'AttributeTypeAndValue'), Asn1Tag.objectIdentifier, 'type'),
      )
      attributes.push({
        oid,
        shortName: DN_SHORT_NAMES[oid] ?? oid,
        value: derStringText(derChild(pair, 1, 'AttributeTypeAndValue')),
      })
    }
  }
  return attributes
}

function buildTime(
  year: number,
  month: string,
  day: string,
  hour: string,
  minute: string,
  second: string,
  sign?: string,
  offsetHour?: string,
  offsetMinute?: string,
): Date {
  const monthNumber = Number(month)
  const dayNumber = Number(day)
  const hourNumber = Number(hour)
  const minuteNumber = Number(minute)
  const secondNumber = Number(second)
  if (
    monthNumber < 1 ||
    monthNumber > 12 ||
    dayNumber < 1 ||
    dayNumber > 31 ||
    hourNumber > 23 ||
    minuteNumber > 59 ||
    secondNumber > 60
  ) {
    throw new Error('Certificate: time value is out of range')
  }
  const milliseconds = Date.UTC(
    year,
    monthNumber - 1,
    dayNumber,
    hourNumber,
    minuteNumber,
    secondNumber,
  )
  if (!sign) {
    return new Date(milliseconds)
  }
  const offset = (Number(offsetHour) * 60 + Number(offsetMinute)) * 60 * 1000
  return new Date(sign === '+' ? milliseconds - offset : milliseconds + offset)
}

function parseTime(element: DerElement): Date {
  const text = new TextDecoder('latin1').decode(element.content).trim()
  if (element.tag === 0x17) {
    const match = UTC_TIME.exec(text)
    if (!match) {
      throw new Error(`Certificate: invalid UTCTime "${text}"`)
    }
    const [, yy, month, day, hour, minute, second = '00', sign, offHour, offMinute] = match
    const twoDigitYear = Number(yy)
    return buildTime(
      twoDigitYear >= 50 ? 1900 + twoDigitYear : 2000 + twoDigitYear,
      month,
      day,
      hour,
      minute,
      second,
      sign,
      offHour,
      offMinute,
    )
  }
  if (element.tag === 0x18) {
    const match = GENERALIZED_TIME.exec(text)
    if (!match) {
      throw new Error(`Certificate: invalid GeneralizedTime "${text}"`)
    }
    const [, year, month, day, hour, minute, second, sign, offHour, offMinute] = match
    return buildTime(Number(year), month, day, hour, minute, second, sign, offHour, offMinute)
  }
  throw new Error(`Certificate: unsupported time tag 0x${element.tag.toString(16)}`)
}

function bitLength(bytes: Uint8Array): number {
  let start = 0
  while (start < bytes.length && bytes[start] === 0) {
    start++
  }
  const first = bytes[start]
  if (first === undefined) {
    return 0
  }
  let bits = (bytes.length - start - 1) * 8
  let value = first
  while (value > 0) {
    bits++
    value >>= 1
  }
  return bits
}

/** RSA 的位数取模数位长；RSAPublicKey 结构异常时交给调用方回退 */
function rsaKeyBits(keyBytes: Uint8Array): number | null {
  try {
    const rsaKey = derExpectTag(parseDer(keyBytes), Asn1Tag.sequence, 'RSAPublicKey')
    const modulus = derIntegerMagnitude(
      derExpectTag(derChild(rsaKey, 0, 'RSAPublicKey'), Asn1Tag.integer, 'modulus'),
    )
    return bitLength(modulus)
  } catch {
    return null
  }
}

function readCurve(algorithm: DerElement): string | null {
  const parameters = algorithm.children[1]
  if (!parameters || parameters.tag !== Asn1Tag.objectIdentifier) {
    return null
  }
  const oid = derObjectIdentifierText(parameters)
  return CURVES[oid] ?? oid
}

function parsePublicKey(spki: DerElement): {
  oid: string
  name: string
  bits: number
  curve: string | null
} {
  const algorithmElement = derChild(spki, 0, 'subjectPublicKeyInfo')
  const algorithm = parseAlgorithm(algorithmElement, PUBLIC_KEY_ALGORITHMS)
  const keyElement = derExpectTag(
    derChild(spki, 1, 'subjectPublicKeyInfo'),
    Asn1Tag.bitString,
    'subjectPublicKey',
  )
  const unusedBits = keyElement.content[0] ?? 0
  const keyBytes = keyElement.content.subarray(1)
  const rawBits = keyBytes.length * 8 - unusedBits
  const curve = readCurve(algorithmElement)

  if (algorithm.oid === OID_RSA) {
    return { ...algorithm, bits: rsaKeyBits(keyBytes) ?? rawBits, curve }
  }
  if (curve) {
    const curveBits = CURVE_BITS[curve]
    if (curveBits !== undefined) {
      return { ...algorithm, bits: curveBits, curve }
    }
  }
  if (algorithm.oid === OID_ED25519) {
    return { ...algorithm, bits: 256, curve }
  }
  if (algorithm.oid === OID_ED448) {
    return { ...algorithm, bits: 448, curve }
  }
  return { ...algorithm, bits: rawBits, curve }
}

function formatIpAddress(bytes: Uint8Array): string {
  if (bytes.length === 4) {
    return Array.from(bytes).join('.')
  }
  if (bytes.length === 16) {
    const groups: string[] = []
    for (let i = 0; i < bytes.length; i += 2) {
      groups.push(((bytes[i] << 8) | bytes[i + 1]).toString(16))
    }
    return groups.join(':')
  }
  return bytesToHex(bytes)
}

function readSubjectAltNames(element: DerElement): SubjectAltNames {
  const sequence = derExpectTag(element, Asn1Tag.sequence, 'subjectAltName')
  const dnsNames: string[] = []
  const ipAddresses: string[] = []
  for (const name of sequence.children) {
    if (name.tag === 0x82) {
      dnsNames.push(new TextDecoder('latin1').decode(name.content))
    } else if (name.tag === 0x87) {
      ipAddresses.push(formatIpAddress(name.content))
    }
  }
  return { dnsNames, ipAddresses }
}

function readCaFlag(element: DerElement): boolean {
  const sequence = derExpectTag(element, Asn1Tag.sequence, 'basicConstraints')
  const first = sequence.children[0]
  return first !== undefined && first.tag === Asn1Tag.boolean && first.content[0] !== 0
}

function readKeyUsages(element: DerElement): KeyUsageId[] {
  const bitString = derExpectTag(element, Asn1Tag.bitString, 'keyUsage')
  const unusedBits = bitString.content[0] ?? 0
  const bits = bitString.content.subarray(1)
  const totalBits = bits.length * 8 - unusedBits
  return keyUsageIds.filter((_, index) => {
    const byte = bits[index >> 3]
    return byte !== undefined && index < totalBits && (byte & (0x80 >> (index & 7))) !== 0
  })
}

function parseExtensions(explicit: DerElement): {
  isCa: boolean
  subjectAltNames: SubjectAltNames
  keyUsages: KeyUsageId[]
} {
  const result = {
    isCa: false,
    subjectAltNames: { dnsNames: [], ipAddresses: [] } as SubjectAltNames,
    keyUsages: [] as KeyUsageId[],
  }
  const list = derExpectTag(derChild(explicit, 0, 'extensions'), Asn1Tag.sequence, 'Extensions')

  for (const extension of list.children) {
    try {
      const sequence = derExpectTag(extension, Asn1Tag.sequence, 'Extension')
      const oid = derObjectIdentifierText(
        derExpectTag(derChild(sequence, 0, 'Extension'), Asn1Tag.objectIdentifier, 'extnID'),
      )
      const valueIndex = sequence.children[1]?.tag === Asn1Tag.boolean ? 2 : 1
      const extnValue = derExpectTag(
        derChild(sequence, valueIndex, 'Extension'),
        Asn1Tag.octetString,
        'extnValue',
      )
      const value = parseDer(extnValue.content)
      if (oid === EXT_BASIC_CONSTRAINTS) {
        result.isCa = readCaFlag(value)
      } else if (oid === EXT_SUBJECT_ALT_NAME) {
        result.subjectAltNames = readSubjectAltNames(value)
      } else if (oid === EXT_KEY_USAGE) {
        result.keyUsages = readKeyUsages(value)
      }
    } catch {
      // 单个扩展损坏不影响其余字段展示
    }
  }
  return result
}

/**
 * 解析证书。`now` 用于有效期判断，默认当前时间（便于单测固定时间轴）。
 */
export function parseCertificate(input: string, now: number = Date.now()): ParsedCertificate {
  const der = toDer(input)
  const certificate = derExpectTag(parseDer(der), Asn1Tag.sequence, 'Certificate')
  const tbs = derExpectTag(
    derChild(certificate, 0, 'Certificate'),
    Asn1Tag.sequence,
    'tbsCertificate',
  )

  let cursor = 0
  const take = (context: string): DerElement => {
    const child = tbs.children[cursor]
    if (!child) {
      throw new Error(`Certificate: tbsCertificate is missing ${context}`)
    }
    cursor++
    return child
  }

  let version = 1
  if (tbs.children[0]?.tag === 0xa0) {
    const versionField = take('version')
    version =
      derIntegerValue(
        derExpectTag(derChild(versionField, 0, 'version'), Asn1Tag.integer, 'version'),
      ) + 1
  }

  const serialElement = derExpectTag(take('serialNumber'), Asn1Tag.integer, 'serialNumber')
  const serialNumber = bytesToHex(derIntegerMagnitude(serialElement))

  const signature = parseAlgorithm(take('signature'), SIGNATURE_ALGORITHMS)
  const issuer = parseName(take('issuer'))

  const validityElement = derExpectTag(take('validity'), Asn1Tag.sequence, 'validity')
  const notBefore = parseTime(derChild(validityElement, 0, 'validity'))
  const notAfter = parseTime(derChild(validityElement, 1, 'validity'))

  const subject = parseName(take('subject'))
  const publicKey = parsePublicKey(
    derExpectTag(take('subjectPublicKeyInfo'), Asn1Tag.sequence, 'subjectPublicKeyInfo'),
  )

  const extensionsTag = tbs.children.slice(cursor).find((child) => child.tag === 0xa3)
  const extensions = extensionsTag
    ? parseExtensions(extensionsTag)
    : { isCa: false, subjectAltNames: { dnsNames: [], ipAddresses: [] }, keyUsages: [] }

  return {
    version,
    serialNumber,
    signatureAlgorithm: signature.name,
    signatureAlgorithmOid: signature.oid,
    issuer,
    subject,
    validity: {
      notBefore: notBefore.toISOString(),
      notAfter: notAfter.toISOString(),
      isExpired: now > notAfter.getTime(),
      isNotYetValid: now < notBefore.getTime(),
    },
    publicKeyAlgorithm: publicKey.name,
    publicKeyAlgorithmOid: publicKey.oid,
    publicKeyBits: publicKey.bits,
    curve: publicKey.curve,
    subjectAltNames: extensions.subjectAltNames,
    isCa: extensions.isCa,
    keyUsages: extensions.keyUsages,
    tbsFingerprint: getFingerprint(derTlv(tbs.tag, tbs.content)),
  }
}
