import type { DefinedTool } from '../define-tool'

import { tool as bcrypt } from './bcrypt'
import { tool as encryption } from './encryption'
import { tool as fileHashChecker } from './file-hash-checker'
import { tool as hashIdentifier } from './hash-identifier'
import { tool as hashText } from './hash-text'
import { tool as hmacCalculator } from './hmac-calculator'
import { tool as idGenerator } from './id-generator'
import { tool as identifierValidator } from './identifier-validator'
import { tool as keyGenerator } from './key-generator'
import { tool as passphraseGenerator } from './passphrase-generator'
import { tool as passwordStrengthAnalyser } from './password-strength-analyser'
import { tool as pdfSignatureChecker } from './pdf-signature-checker'
import { tool as pkceGenerator } from './pkce-generator'
import { tool as sshKeyFingerprint } from './ssh-key-fingerprint'
import { tool as x509CertificateDecoder } from './x509-certificate-decoder'

export const cryptoTools: readonly DefinedTool[] = [
  hashText,
  idGenerator,
  bcrypt,
  encryption,
  fileHashChecker,
  keyGenerator,
  passphraseGenerator,
  passwordStrengthAnalyser,
  pdfSignatureChecker,
  hmacCalculator,
  x509CertificateDecoder,
  sshKeyFingerprint,
  pkceGenerator,
  identifierValidator,
  hashIdentifier,
]
