import { Check, Copy, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { SpanCopyable } from '@/components/copyable/span-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useCopy } from '@/composable/use-copy'
import {
  CidrError,
  calcSubnet,
  isIpInCidr,
  type CidrErrorCode,
  type SubnetInfo,
} from './cidr-calculator.service'

type FieldRow = {
  key: string
  label: string
  value: string
}

type FieldGroups = {
  network: FieldRow[]
  address: FieldRow[]
  binary: FieldRow[]
}

/** 普通字段网格：细线分隔，值可点击复制 */
function FieldGrid({ rows }: { rows: FieldRow[] }) {
  return (
    <div className="bg-border grid grid-cols-1 gap-px overflow-hidden rounded-lg border sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <div key={row.key} className="bg-card flex min-w-0 flex-col gap-1 p-3">
          <span className="text-muted-foreground text-xs">{row.label}</span>
          <SpanCopyable value={row.value} className="self-start" />
        </div>
      ))}
    </div>
  )
}

/** 二进制展开：长串自动折行，右侧只留复制图标 */
function BinaryGrid({ rows }: { rows: FieldRow[] }) {
  return (
    <div className="bg-border grid grid-cols-1 gap-px overflow-hidden rounded-lg border">
      {rows.map((row) => (
        <div key={row.key} className="bg-card flex min-w-0 flex-col gap-1 p-3">
          <span className="text-muted-foreground text-xs">{row.label}</span>
          <div className="flex items-start gap-2">
            <span className="min-w-0 font-mono text-xs break-all">{row.value}</span>
            <SpanCopyable value={row.value} showText={false} className="shrink-0" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * IPv4 子网计算器：输入 CIDR 或「IP + 掩码」实时算出网络/广播地址、
 * 可用主机范围、掩码、地址数量与二进制展开，并支持判断 IP 是否属于该网段。
 */
export default function CidrCalculator() {
  const { t } = useTranslation('tools-web', { keyPrefix: 'cidr-calculator' })
  const { copy } = useCopy()

  const [input, setInput] = useState('')
  const [targetIp, setTargetIp] = useState('')

  const parsed = useMemo<{ info: SubnetInfo | null; error: CidrErrorCode | null }>(() => {
    const trimmed = input.trim()
    // 只有「IP + 掩码」形态才算完整输入，避免输入 IP 的过程中一直报格式错误
    if (trimmed === '' || !/[/\s]/.test(trimmed)) {
      return { info: null, error: null }
    }
    try {
      return { info: calcSubnet(trimmed), error: null }
    } catch (err) {
      return { info: null, error: err instanceof CidrError ? err.code : 'format' }
    }
  }, [input])
  const info = parsed.info

  const rows = useMemo<FieldGroups>(() => {
    if (info === null) {
      return { network: [], address: [], binary: [] }
    }
    const yesNo = (flag: boolean) => (flag ? t('yes') : t('no'))
    return {
      network: [
        { key: 'network', label: t('fields.network'), value: info.network },
        { key: 'broadcast', label: t('fields.broadcast'), value: info.broadcast },
        { key: 'mask', label: t('fields.mask'), value: info.mask },
        { key: 'wildcard', label: t('fields.wildcard'), value: info.wildcard },
        { key: 'prefix', label: t('fields.prefix'), value: `/${info.prefix}` },
        {
          key: 'totalAddresses',
          label: t('fields.totalAddresses'),
          value: info.totalAddresses.toLocaleString(),
        },
      ],
      address: [
        { key: 'firstHost', label: t('fields.firstHost'), value: info.firstHost },
        { key: 'lastHost', label: t('fields.lastHost'), value: info.lastHost },
        {
          key: 'usableHosts',
          label: t('fields.usableHosts'),
          value: info.usableHosts.toLocaleString(),
        },
        { key: 'ipClass', label: t('fields.ipClass'), value: info.ipClass },
        { key: 'isPrivate', label: t('fields.isPrivate'), value: yesNo(info.isPrivate) },
        { key: 'isLoopback', label: t('fields.isLoopback'), value: yesNo(info.isLoopback) },
      ],
      binary: [
        {
          key: 'binaryNetwork',
          label: t('fields.binaryNetwork'),
          value: info.binaryNetwork,
        },
        { key: 'binaryMask', label: t('fields.binaryMask'), value: info.binaryMask },
      ],
    }
  }, [info, t])

  const containment = useMemo(() => {
    if (info === null || targetIp.trim() === '') {
      return null
    }
    try {
      return { inRange: isIpInCidr(targetIp, input), error: null }
    } catch {
      return { inRange: false, error: 'invalid-ip' as const }
    }
  }, [info, input, targetIp])

  const handleCopyAll = () => {
    if (info === null) {
      return
    }
    const lines = [...rows.network, ...rows.address, ...rows.binary].map(
      (row) => `${row.label}: ${row.value}`,
    )
    void copy(lines.join('\n'))
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cidr-input">{t('inputLabel')}</Label>
          <InputCopyable
            id="cidr-input"
            value={input}
            onValueChange={setInput}
            placeholder={t('inputPlaceholder')}
            className="font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        {/* RFC 3021 的 /31、/32 可用主机数与常规公式不同，说明必须常驻 */}
        <p className="text-muted-foreground text-xs">{t('rfcNote')}</p>
        {parsed.error && (
          <Alert variant="destructive">
            <AlertDescription>{t(`errors.${parsed.error}`)}</AlertDescription>
          </Alert>
        )}
      </Card>

      {info && (
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-lg font-semibold">
              {info.ip}/{info.prefix}
            </span>
            <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
              <Copy className="size-4" />
              {t('copyAll')}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">{t('sectionNetwork')}</h2>
            <FieldGrid rows={rows.network} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">{t('sectionAddress')}</h2>
            <FieldGrid rows={rows.address} />
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold">{t('sectionBinary')}</h2>
            <BinaryGrid rows={rows.binary} />
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-sm font-semibold">{t('sectionContain')}</h2>
        <p className="text-muted-foreground text-xs">{t('containHint')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <InputCopyable
            value={targetIp}
            onValueChange={setTargetIp}
            placeholder={t('containPlaceholder')}
            className="min-w-0 flex-1 font-mono text-sm sm:max-w-xs"
            autoComplete="off"
            spellCheck={false}
            disabled={info === null}
          />
          {containment && containment.error === null && (
            <Badge variant={containment.inRange ? 'default' : 'outline'} className="gap-1">
              {containment.inRange ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              {containment.inRange ? t('containIn') : t('containOut')}
            </Badge>
          )}
        </div>
        {containment?.error && (
          <p className="text-destructive text-sm">{t(`errors.${containment.error}`)}</p>
        )}
      </Card>
    </div>
  )
}
