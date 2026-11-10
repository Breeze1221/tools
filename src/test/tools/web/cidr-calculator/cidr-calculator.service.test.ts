import { describe, expect, it } from 'vitest'

import {
  CidrError,
  calcSubnet,
  intToIpv4,
  ipv4ToInt,
  isIpInCidr,
  parseCidr,
} from '@/tools/web/cidr-calculator/cidr-calculator.service'

describe('parseCidr', () => {
  it('parses ip/prefix notation', () => {
    expect(parseCidr('192.168.1.10/24')).toEqual({ ip: '192.168.1.10', prefix: 24 })
  })

  it('parses ip plus dotted subnet mask', () => {
    expect(parseCidr('192.168.1.10 255.255.255.0')).toEqual({
      ip: '192.168.1.10',
      prefix: 24,
    })
  })

  it('parses ip plus slash-prefixed mask', () => {
    expect(parseCidr('192.168.1.10 /24')).toEqual({ ip: '192.168.1.10', prefix: 24 })
  })

  it('normalizes leading zeros in the address', () => {
    expect(parseCidr('192.168.001.010/24')).toEqual({ ip: '192.168.1.10', prefix: 24 })
  })

  it('keeps prefix 0 and 32', () => {
    expect(parseCidr('0.0.0.0/0').prefix).toBe(0)
    expect(parseCidr('10.0.0.1/32').prefix).toBe(32)
  })

  it('throws on empty input', () => {
    expect(() => parseCidr('   ')).toThrow(CidrError)
  })

  it('throws when the prefix is missing', () => {
    expect(() => parseCidr('192.168.1.10')).toThrow(/Missing prefix/i)
  })

  it('throws on an invalid ip', () => {
    expect(() => parseCidr('192.168.1.256/24')).toThrow(/octet out of range/i)
    expect(() => parseCidr('192.168.1/24')).toThrow(CidrError)
    expect(() => parseCidr('192.168.1.a/24')).toThrow(CidrError)
  })

  it('throws on an invalid prefix', () => {
    expect(() => parseCidr('192.168.1.10/33')).toThrow(/Prefix length/i)
    expect(() => parseCidr('192.168.1.10/abc')).toThrow(/prefix/i)
  })

  it('throws on a non-contiguous subnet mask', () => {
    expect(() => parseCidr('192.168.1.10 255.0.255.0')).toThrow(/contiguous/i)
  })
})

describe('calcSubnet', () => {
  it('computes a /24 network', () => {
    expect(calcSubnet('192.168.1.10/24')).toMatchObject({
      ip: '192.168.1.10',
      prefix: 24,
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      mask: '255.255.255.0',
      wildcard: '0.0.0.255',
      totalAddresses: 256,
      usableHosts: 254,
      ipClass: 'C',
      isPrivate: true,
      isLoopback: false,
      binaryNetwork: '11000000.10101000.00000001.00000000',
      binaryMask: '11111111.11111111.11111111.00000000',
    })
  })

  it('accepts ip plus dotted mask and yields the same network', () => {
    expect(calcSubnet('10.1.2.3 255.255.0.0')).toMatchObject({
      network: '10.1.0.0',
      broadcast: '10.1.255.255',
      prefix: 16,
      usableHosts: 65534,
    })
  })

  it('treats both addresses of a /31 as usable (RFC 3021)', () => {
    expect(calcSubnet('10.0.0.0/31')).toMatchObject({
      network: '10.0.0.0',
      broadcast: '10.0.0.1',
      firstHost: '10.0.0.0',
      lastHost: '10.0.0.1',
      totalAddresses: 2,
      usableHosts: 2,
    })
  })

  it('treats a /32 as a single usable host (RFC 3021)', () => {
    expect(calcSubnet('8.8.8.8/32')).toMatchObject({
      network: '8.8.8.8',
      broadcast: '8.8.8.8',
      firstHost: '8.8.8.8',
      lastHost: '8.8.8.8',
      totalAddresses: 1,
      usableHosts: 1,
    })
  })

  it('handles a /0 network', () => {
    expect(calcSubnet('192.168.1.10/0')).toMatchObject({
      network: '0.0.0.0',
      broadcast: '255.255.255.255',
      firstHost: '0.0.0.1',
      lastHost: '255.255.255.254',
      mask: '0.0.0.0',
      wildcard: '255.255.255.255',
      totalAddresses: 4294967296,
      usableHosts: 4294967294,
    })
  })

  it('classifies IP addresses by the first octet', () => {
    expect(calcSubnet('10.0.0.1/8').ipClass).toBe('A')
    expect(calcSubnet('172.16.0.1/12').ipClass).toBe('B')
    expect(calcSubnet('192.168.1.1/24').ipClass).toBe('C')
    expect(calcSubnet('224.0.0.1/32').ipClass).toBe('D')
    expect(calcSubnet('240.0.0.1/32').ipClass).toBe('E')
  })

  it('detects private ranges', () => {
    expect(calcSubnet('10.0.0.1/8').isPrivate).toBe(true)
    expect(calcSubnet('172.16.0.1/12').isPrivate).toBe(true)
    expect(calcSubnet('192.168.1.1/24').isPrivate).toBe(true)
    expect(calcSubnet('8.8.8.8/32').isPrivate).toBe(false)
    expect(calcSubnet('172.32.0.1/12').isPrivate).toBe(false)
  })

  it('detects loopback addresses', () => {
    expect(calcSubnet('127.0.0.1/8').isLoopback).toBe(true)
    expect(calcSubnet('192.168.1.1/24').isLoopback).toBe(false)
  })

  it('throws on invalid input', () => {
    expect(() => calcSubnet('')).toThrow(CidrError)
    expect(() => calcSubnet('192.168.1.10/40')).toThrow(CidrError)
  })
})

describe('isIpInCidr', () => {
  it('accepts an address inside the subnet', () => {
    expect(isIpInCidr('192.168.1.200', '192.168.1.0/24')).toBe(true)
    expect(isIpInCidr('192.168.1.0', '192.168.1.0/24')).toBe(true)
    expect(isIpInCidr('192.168.1.255', '192.168.1.0/24')).toBe(true)
  })

  it('rejects an address outside the subnet', () => {
    expect(isIpInCidr('192.168.2.1', '192.168.1.0/24')).toBe(false)
    expect(isIpInCidr('10.0.0.1', '192.168.1.0/24')).toBe(false)
  })

  it('matches with a dotted mask subnet', () => {
    expect(isIpInCidr('10.1.2.3', '10.0.0.0 255.0.0.0')).toBe(true)
    expect(isIpInCidr('11.1.2.3', '10.0.0.0 255.0.0.0')).toBe(false)
  })

  it('throws when the ip or cidr is invalid', () => {
    expect(() => isIpInCidr('999.1.1.1', '192.168.1.0/24')).toThrow(CidrError)
    expect(() => isIpInCidr('192.168.1.1', '192.168.1.0/33')).toThrow(CidrError)
  })
})

describe('ipv4ToInt / intToIpv4', () => {
  it('converts dotted addresses to integers', () => {
    expect(ipv4ToInt('0.0.0.0')).toBe(0)
    expect(ipv4ToInt('192.168.1.1')).toBe(3232235777)
    expect(ipv4ToInt('255.255.255.255')).toBe(4294967295)
  })

  it('round-trips between integers and dotted addresses', () => {
    for (const ip of ['0.0.0.0', '1.2.3.4', '192.168.1.1', '255.255.255.255']) {
      expect(intToIpv4(ipv4ToInt(ip))).toBe(ip)
    }
  })

  it('throws on malformed addresses', () => {
    expect(() => ipv4ToInt('1.2.3')).toThrow(CidrError)
    expect(() => ipv4ToInt('1.2.3.256')).toThrow(CidrError)
    expect(() => ipv4ToInt('')).toThrow(CidrError)
  })

  it('throws on out-of-range integers', () => {
    expect(() => intToIpv4(-1)).toThrow(CidrError)
    expect(() => intToIpv4(4294967296)).toThrow(CidrError)
    expect(() => intToIpv4(1.5)).toThrow(CidrError)
  })
})
