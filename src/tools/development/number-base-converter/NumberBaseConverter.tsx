import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BASE_MAX,
  BASE_MIN,
  OUTPUT_BASES,
  convertAll,
  detectBase,
  formatThousands,
  groupBinary,
} from './number-base-converter.service'

const AUTO = 'auto'

const BASE_OPTIONS = Array.from(
  { length: BASE_MAX - BASE_MIN + 1 },
  (_, index) => BASE_MIN + index,
)

export default function NumberBaseConverter() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'number-base-converter' })

  const [input, setInput] = useState('')
  const [base, setBase] = useState<string>(AUTO)

  const detectedBase = useMemo(() => {
    try {
      return detectBase(input)
    } catch {
      return 10
    }
  }, [input])

  const effectiveBase = base === AUTO ? detectedBase : Number(base)

  const result = useMemo(() => {
    if (input.trim() === '') {
      return { values: null, error: null }
    }
    try {
      return { values: convertAll(input, effectiveBase), error: null }
    } catch {
      return { values: null, error: t('invalid', { base: effectiveBase }) }
    }
  }, [input, effectiveBase, t])

  const displayValue = (outputBase: number, raw: string): string => {
    if (outputBase === 2) {
      return groupBinary(raw)
    }
    if (outputBase === 10) {
      return formatThousands(raw)
    }
    return raw
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('inputLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="number-base-input">{t('numberLabel')}</Label>
              <Input
                id="number-base-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('inputPlaceholder')}
                spellCheck={false}
                autoComplete="off"
                className="font-mono"
              />
            </div>

            <div className="flex flex-col gap-2 sm:w-48">
              <Label htmlFor="number-base-input-base">{t('inputBaseLabel')}</Label>
              <Select value={base} onValueChange={setBase}>
                <SelectTrigger id="number-base-input-base" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AUTO}>{t('base-auto')}</SelectItem>
                  {BASE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={String(option)}>
                      {t('baseOption', { base: option })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            {base === AUTO
              ? t('autoHint', { base: detectedBase })
              : t('fixedHint', { base: effectiveBase })}
          </p>

          {result.error !== null && (
            <Alert variant="destructive">
              <AlertDescription>{result.error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('outputLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {OUTPUT_BASES.map((outputBase) => {
            const raw = result.values?.[String(outputBase)] ?? ''
            return (
              <div
                key={outputBase}
                className="grid grid-cols-[88px_1fr] items-center gap-3 sm:grid-cols-[112px_1fr]"
              >
                <Label
                  htmlFor={`number-base-output-${outputBase}`}
                  className="text-muted-foreground justify-end"
                >
                  {t(`base-${outputBase}`)}
                </Label>
                <InputCopyable
                  id={`number-base-output-${outputBase}`}
                  value={raw === '' ? '' : displayValue(outputBase, raw)}
                  readOnly
                  placeholder={t('outputPlaceholder')}
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
