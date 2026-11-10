import type { DefinedTool } from '../define-tool'

import { tool as cookieParser } from './cookie-parser'
import { tool as htmlEntities } from './html-entities'
import { tool as urlParser } from './url-parser'
import { tool as deviceInformation } from './device-information'
import { tool as otpCodeGeneratorAndValidator } from './otp-code-generator-and-validator'
import { tool as userAgentParser } from './user-agent-parser'
import { tool as safelinkDecoder } from './safelink-decoder'
import { tool as ipLookup } from './ip-lookup'
import { tool as dnsLookup } from './dns-lookup'
import { tool as cidrCalculator } from './cidr-calculator'
import { tool as httpHeaderParser } from './http-header-parser'
import { tool as metaTagGenerator } from './meta-tag-generator'
import { tool as robotsTxtGenerator } from './robots-txt-generator'
import { tool as basicAuthGenerator } from './basic-auth-generator'
import { tool as sitemapGenerator } from './sitemap-generator'

export const webTools: readonly DefinedTool[] = [
  cookieParser,
  htmlEntities,
  urlParser,
  deviceInformation,
  otpCodeGeneratorAndValidator,
  userAgentParser,
  safelinkDecoder,
  ipLookup,
  dnsLookup,
  cidrCalculator,
  httpHeaderParser,
  metaTagGenerator,
  robotsTxtGenerator,
  basicAuthGenerator,
  sitemapGenerator,
]
