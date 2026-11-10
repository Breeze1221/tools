import { BadgeCheck } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'identifier-validator',
  path: '/identifier-validator',
  keywords: [
    'credit card',
    'luhn',
    'imei',
    'iban',
    'isbn',
    'isbn-10',
    'isbn-13',
    'validator',
    'checksum',
    '信用卡',
    '银行卡',
    '证件',
    '校验位',
    '校验',
  ],
  icon: BadgeCheck,
  component: () => import('./IdentifierValidator'),
  createdAt: '2026-11-10',
})
