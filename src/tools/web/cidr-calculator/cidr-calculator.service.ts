/**
 * IPv4 子网计算：严格解析 CIDR / 「IP + 掩码」，输出纯可序列化的子网信息。
 * 零 DOM/React 依赖；非法输入一律抛 CidrError（英文技术信息由 UI 层翻译）。
 */

export type IpClass = 'A' | 'B' | 'C' | 'D' | 'E'

export type CidrErrorCode = 'empty' | 'format' | 'invalid-ip' | 'invalid-prefix' | 'invalid-mask'

/** 带错误码的解析错误：UI 用 code 取本地化文案，message 保留英文技术细节 */
export class CidrError extends Error {
  readonly code: CidrErrorCode

  constructor(code: CidrErrorCode, detail: string) {
    super(detail)
    this.name = 'CidrError'
    this.code = code
  }
}

export interface SubnetInfo {
  ip: string
  prefix: number
  network: string
  broadcast: string
  firstHost: string
  lastHost: string
  mask: string
  wildcard: string
  totalAddresses: number
  usableHosts: number
  ipClass: IpClass
  isPrivate: boolean
  isLoopback: boolean
  binaryNetwork: string
  binaryMask: string
}

/** 私有/保留网段：10/8、172.16/12、192.168/16、127/8、169.254/16、100.64/10、0/8 */
const PRIVATE_RANGES = [
  ['10.0.0.0', 8],
  ['172.16.0.0', 12],
  ['192.168.0.0', 16],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['100.64.0.0', 10],
  ['0.0.0.0', 8],
] as const

/** 前缀长度 → 32 位掩码整数；prefix 为 0 时不能走位移（JS 位移按 32 取模） */
function maskFromPrefix(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
}

/** 点分十进制 → 0..2^32-1；每段必须是 0–255 的纯数字 */
export function ipv4ToInt(ip: string): number {
  const parts = ip.trim().split('.')
  if (parts.length !== 4) {
    throw new CidrError('invalid-ip', `Invalid IPv4 address: "${ip}"`)
  }

  let value = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      throw new CidrError('invalid-ip', `Invalid IPv4 address: "${ip}"`)
    }
    const octet = Number(part)
    if (octet > 255) {
      throw new CidrError('invalid-ip', `Octet out of range in "${ip}"`)
    }
    value = value * 256 + octet
  }
  return value
}

/** 0..2^32-1 → 点分十进制 */
export function intToIpv4(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) {
    throw new CidrError('invalid-ip', `Integer out of IPv4 range: ${n}`)
  }
  return [n >>> 24, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.')
}

/** 掩码写法：纯数字前缀（0–32）或点分子网掩码（必须是连续的 1） */
function parseMask(mask: string): number {
  if (/^\d{1,2}$/.test(mask)) {
    const prefix = Number(mask)
    if (prefix > 32) {
      throw new CidrError('invalid-prefix', `Prefix length out of range: ${mask}`)
    }
    return prefix
  }

  if (mask.includes('.')) {
    const bits = ipv4ToInt(mask).toString(2).padStart(32, '0')
    if (!/^1*0*$/.test(bits)) {
      throw new CidrError('invalid-mask', `Subnet mask is not contiguous: ${mask}`)
    }
    const firstZero = bits.indexOf('0')
    return firstZero === -1 ? 32 : firstZero
  }

  throw new CidrError('invalid-prefix', `Invalid prefix length: "${mask}"`)
}

/**
 * 解析 `192.168.1.10/24`、`192.168.1.10 255.255.255.0`、`192.168.1.10 /24`
 * 以及 `192.168.1.10/255.255.255.0`；地址会被规范化为无前导零的写法。
 */
export function parseCidr(input: string): { ip: string; prefix: number } {
  const trimmed = input.trim()
  if (trimmed === '') {
    throw new CidrError('empty', 'Empty CIDR input')
  }

  const tokens = trimmed.split(/\s+/)
  let address: string
  let mask: string

  if (tokens.length === 1) {
    const slash = tokens[0].indexOf('/')
    if (slash === -1) {
      throw new CidrError('format', `Missing prefix length: "${input}"`)
    }
    address = tokens[0].slice(0, slash)
    mask = tokens[0].slice(slash + 1)
  } else if (tokens.length === 2) {
    address = tokens[0]
    mask = tokens[1]
  } else {
    throw new CidrError('format', `Unexpected input: "${input}"`)
  }

  // 「IP /24」这种写法允许第二个 token 自带斜杠
  if (mask.startsWith('/')) {
    mask = mask.slice(1)
  }

  if (mask === '') {
    throw new CidrError('invalid-prefix', `Missing prefix length: "${input}"`)
  }

  return { ip: intToIpv4(ipv4ToInt(address)), prefix: parseMask(mask) }
}

function classifyIp(firstOctet: number): IpClass {
  if (firstOctet < 128) return 'A'
  if (firstOctet < 192) return 'B'
  if (firstOctet < 224) return 'C'
  if (firstOctet < 240) return 'D'
  return 'E'
}

/** 点分十进制 → 每段 8 位的二进制点分串 */
function toBinaryDotted(value: number): string {
  return intToIpv4(value)
    .split('.')
    .map((octet) => Number(octet).toString(2).padStart(8, '0'))
    .join('.')
}

/** 计算子网全部信息；/31、/32 的可用主机数按 RFC 3021 处理 */
export function calcSubnet(input: string): SubnetInfo {
  const { ip, prefix } = parseCidr(input)
  const ipInt = ipv4ToInt(ip)
  const maskInt = maskFromPrefix(prefix)
  const networkInt = (ipInt & maskInt) >>> 0
  const broadcastInt = (networkInt | (~maskInt >>> 0)) >>> 0
  const totalAddresses = 2 ** (32 - prefix)
  const usableHosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : totalAddresses - 2
  const firstHostInt = prefix >= 31 ? networkInt : networkInt + 1
  const lastHostInt = prefix >= 31 ? broadcastInt : broadcastInt - 1
  const firstOctet = Number(ip.split('.')[0])

  return {
    ip,
    prefix,
    network: intToIpv4(networkInt),
    broadcast: intToIpv4(broadcastInt),
    firstHost: intToIpv4(firstHostInt),
    lastHost: intToIpv4(lastHostInt),
    mask: intToIpv4(maskInt),
    wildcard: intToIpv4(~maskInt >>> 0),
    totalAddresses,
    usableHosts,
    ipClass: classifyIp(firstOctet),
    isPrivate: PRIVATE_RANGES.some(
      ([base, bits]) => (ipInt & maskFromPrefix(bits)) >>> 0 === ipv4ToInt(base),
    ),
    isLoopback: firstOctet === 127,
    binaryNetwork: toBinaryDotted(networkInt),
    binaryMask: toBinaryDotted(maskInt),
  }
}

/** 判断某个 IPv4 是否落在给定网段内；任一侧非法时抛 CidrError */
export function isIpInCidr(ip: string, cidr: string): boolean {
  const target = ipv4ToInt(ip)
  const { ip: base, prefix } = parseCidr(cidr)
  const maskInt = maskFromPrefix(prefix)
  return (target & maskInt) >>> 0 === (ipv4ToInt(base) & maskInt) >>> 0
}
