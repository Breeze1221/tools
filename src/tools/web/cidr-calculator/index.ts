import { Network } from 'lucide-react'

import { defineTool } from '../../define-tool'

export const tool = defineTool({
  name: 'cidr-calculator',
  path: '/cidr-calculator',
  keywords: [
    'cidr',
    'subnet',
    'subnet mask',
    'netmask',
    'wildcard mask',
    'network address',
    'broadcast',
    'usable hosts',
    'ipv4',
    '子网计算',
    '子网掩码',
    '网段计算',
    '网络地址',
    '广播地址',
    '可用主机',
    '通配符掩码',
  ],
  icon: Network,
  component: () => import('./CidrCalculator'),
  createdAt: '2026-11-10',
})
