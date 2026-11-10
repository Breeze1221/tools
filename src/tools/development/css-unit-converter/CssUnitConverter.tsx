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
import { CSS_UNITS, convertUnits, formatNumber, type CssUnit } from './css-unit-converter.service'

/** 单位 → i18n 键（% 不适合直接当键名） */
const UNIT_LABEL_KEYS: Record<CssUnit, string> = {
  px: 'px',
  rem: 'rem',
  em: 'em',
  pt: 'pt',
  '%': 'percent',
  vw: 'vw',
  vh: 'vh',
  vmin: 'vmin',
  vmax: 'vmax',
}

export default function CssUnitConverter() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'css-unit-converter' })

  const [value, setValue] = useState('16')
  const [unit, setUnit] = useState<CssUnit>('px')
  const [rootFontSize, setRootFontSize] = useState('16')
  const [parentFontSize, setParentFontSize] = useState('16')
  const [viewportWidth, setViewportWidth] = useState('1920')
  const [viewportHeight, setViewportHeight] = useState('1080')

  const { results, errorKey } = useMemo(() => {
    if (value.trim() === '') {
      return { results: null, errorKey: null as string | null }
    }
    try {
      const config = {
        rootFontSize: Number(rootFontSize),
        parentFontSize: Number(parentFontSize),
        viewportWidth: Number(viewportWidth),
        viewportHeight: Number(viewportHeight),
      }
      return { results: convertUnits(Number(value), unit, config), errorKey: null as string | null }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'Value must be a finite number') {
        return { results: null, errorKey: 'errors.value' }
      }
      if (message.startsWith('Unknown unit')) {
        return { results: null, errorKey: 'errors.unit' }
      }
      return { results: null, errorKey: 'errors.config' }
    }
  }, [value, unit, rootFontSize, parentFontSize, viewportWidth, viewportHeight])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('inputLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="css-unit-value">{t('valueLabel')}</Label>
              <Input
                id="css-unit-value"
                type="number"
                inputMode="decimal"
                step="any"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder={t('valuePlaceholder')}
                className="font-mono"
              />
            </div>

            <div className="flex flex-col gap-2 sm:w-44">
              <Label htmlFor="css-unit-unit">{t('unitLabel')}</Label>
              <Select value={unit} onValueChange={(next) => setUnit(next as CssUnit)}>
                <SelectTrigger id="css-unit-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CSS_UNITS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`units.${UNIT_LABEL_KEYS[item]}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {errorKey !== null && (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey)}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('configLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <ConfigField
              id="css-root-font-size"
              label={t('config.rootFontSize')}
              value={rootFontSize}
              onValueChange={setRootFontSize}
            />
            <ConfigField
              id="css-parent-font-size"
              label={t('config.parentFontSize')}
              value={parentFontSize}
              onValueChange={setParentFontSize}
            />
            <ConfigField
              id="css-viewport-width"
              label={t('config.viewportWidth')}
              value={viewportWidth}
              onValueChange={setViewportWidth}
            />
            <ConfigField
              id="css-viewport-height"
              label={t('config.viewportHeight')}
              value={viewportHeight}
              onValueChange={setViewportHeight}
            />
          </div>
          <p className="text-muted-foreground text-xs">{t('configHint')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('outputLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {CSS_UNITS.map((target) => {
            const converted = results?.[target]
            return (
              <div
                key={target}
                className="grid grid-cols-[88px_1fr] items-center gap-3 sm:grid-cols-[120px_1fr]"
              >
                <Label
                  htmlFor={`css-unit-output-${target}`}
                  className="text-muted-foreground justify-end"
                >
                  {t(`units.${UNIT_LABEL_KEYS[target]}`)}
                </Label>
                <InputCopyable
                  id={`css-unit-output-${target}`}
                  value={converted === undefined ? '' : `${formatNumber(converted)}${target}`}
                  readOnly
                  placeholder={t('resultPlaceholder')}
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

function ConfigField({
  id,
  label,
  value,
  onValueChange,
}: {
  id: string
  label: string
  value: string
  onValueChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min="1"
        step="any"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="font-mono"
      />
    </div>
  )
}
