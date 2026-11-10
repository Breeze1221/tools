import { ShieldCheck } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'x509-certificate-decoder',
  path: '/x509-certificate-decoder',
  keywords: [
    'x509',
    'certificate',
    'cert',
    'ssl',
    'tls',
    'pem',
    'der',
    'asn1',
    'san',
    'serial',
    'issuer',
    'subject',
    'fingerprint',
    '证书',
    '证书解析',
    '证书链',
    '公钥',
    '有效期',
    '指纹',
    '颁发者',
    '主体',
  ],
  icon: ShieldCheck,
  component: () => import('./X509CertificateDecoder'),
  createdAt: '2026-11-10',
})
