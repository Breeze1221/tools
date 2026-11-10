import { Barcode } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'barcode-generator',
  path: '/barcode-generator',
  keywords: [
    'barcode',
    'barcode generator',
    'code 128',
    'code128',
    'ean-13',
    'ean13',
    'gtin',
    '条形码',
    '条形码生成',
    '条码',
    '条码生成',
  ],
  icon: Barcode,
  component: () => import('./BarcodeGenerator'),
  createdAt: '2026-11-10',
})
