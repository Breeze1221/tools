import { useMemo, useState, type CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import { Slider } from '@/components/ui/slider'
import {
  GRID_ALIGN,
  GRID_AUTO_FLOW,
  GRID_LIMITS,
  GRID_UNITS,
  buildGridCss,
  buildGridStyle,
  type GridAlign,
  type GridConfig,
} from './css-grid-generator.service'

const DEFAULT_CONFIG: GridConfig = {
  columns: 3,
  rows: 2,
  unit: 'fr',
  trackSize: 1,
  customColumns: '',
  gap: 16,
  autoFlow: 'row',
  justifyItems: 'stretch',
  alignItems: 'stretch',
}

type SelectFieldProps<T extends string> = {
  id: string
  label: string
  value: T
  options: readonly T[]
  optionLabel: (value: T) => string
  onChange: (value: T) => void
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  optionLabel,
  onChange,
}: SelectFieldProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const match = options.find((item) => item === next)
          if (match !== undefined) {
            onChange(match)
          }
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {optionLabel(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function CssGridGenerator() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'css-grid-generator' })
  const [config, setConfig] = useState<GridConfig>(DEFAULT_CONFIG)

  const update = (patch: Partial<GridConfig>) => {
    setConfig((current) => ({ ...current, ...patch }))
  }

  const { css, style, error } = useMemo(() => {
    try {
      return {
        css: buildGridCss(config),
        style: buildGridStyle(config) as CSSProperties,
        error: null as string | null,
      }
    } catch (err) {
      return {
        css: '',
        style: {} as CSSProperties,
        error: err instanceof Error ? err.message : 'Invalid configuration',
      }
    }
  }, [config])

  const trackRange = GRID_LIMITS.trackSize[config.unit]
  const cellCount = Math.min(config.columns * config.rows, 144)

  return (
    <div className="flex flex-col gap-4">
      {error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{t('invalid')}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)_minmax(0,21rem)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settingsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="grid-columns">{t('columnsLabel')}</Label>
                <Input
                  id="grid-columns-number"
                  type="number"
                  min={GRID_LIMITS.columns.min}
                  max={GRID_LIMITS.columns.max}
                  value={config.columns}
                  onChange={(event) => update({ columns: Number(event.target.value) || 1 })}
                  className="h-8 w-20 font-mono"
                />
              </div>
              <Slider
                id="grid-columns"
                min={GRID_LIMITS.columns.min}
                max={GRID_LIMITS.columns.max}
                step={1}
                value={[config.columns]}
                onValueChange={(values) => update({ columns: values[0] ?? config.columns })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="grid-rows">{t('rowsLabel')}</Label>
                <Input
                  id="grid-rows-number"
                  type="number"
                  min={GRID_LIMITS.rows.min}
                  max={GRID_LIMITS.rows.max}
                  value={config.rows}
                  onChange={(event) => update({ rows: Number(event.target.value) || 1 })}
                  className="h-8 w-20 font-mono"
                />
              </div>
              <Slider
                id="grid-rows"
                min={GRID_LIMITS.rows.min}
                max={GRID_LIMITS.rows.max}
                step={1}
                value={[config.rows]}
                onValueChange={(values) => update({ rows: values[0] ?? config.rows })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('unitLabel')}</Label>
              <div className="flex gap-1.5">
                {GRID_UNITS.map((unit) => (
                  <Button
                    key={unit}
                    type="button"
                    size="sm"
                    variant={config.unit === unit ? 'default' : 'outline'}
                    onClick={() =>
                      update({
                        unit,
                        trackSize: GRID_LIMITS.trackSize[unit].min,
                      })
                    }
                  >
                    {t(`unit-${unit}`)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="grid-track-size">{t('trackSizeLabel')}</Label>
                <Input
                  id="grid-track-size-number"
                  type="number"
                  min={trackRange.min}
                  max={trackRange.max}
                  value={config.trackSize}
                  onChange={(event) =>
                    update({ trackSize: Number(event.target.value) || trackRange.min })
                  }
                  className="h-8 w-20 font-mono"
                />
              </div>
              <Slider
                id="grid-track-size"
                min={trackRange.min}
                max={trackRange.max}
                step={1}
                value={[config.trackSize]}
                onValueChange={(values) => update({ trackSize: values[0] ?? config.trackSize })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="grid-custom-columns">{t('customLabel')}</Label>
              <Input
                id="grid-custom-columns"
                value={config.customColumns}
                onChange={(event) => update({ customColumns: event.target.value })}
                placeholder={t('customPlaceholder')}
                spellCheck={false}
                className="font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="grid-gap">{t('gapLabel')}</Label>
                <Input
                  id="grid-gap-number"
                  type="number"
                  min={GRID_LIMITS.gap.min}
                  max={GRID_LIMITS.gap.max}
                  value={config.gap}
                  onChange={(event) => update({ gap: Number(event.target.value) || 0 })}
                  className="h-8 w-20 font-mono"
                />
              </div>
              <Slider
                id="grid-gap"
                min={GRID_LIMITS.gap.min}
                max={GRID_LIMITS.gap.max}
                step={1}
                value={[config.gap]}
                onValueChange={(values) => update({ gap: values[0] ?? config.gap })}
              />
            </div>

            <SelectField
              id="grid-auto-flow"
              label={t('autoFlowLabel')}
              value={config.autoFlow}
              options={GRID_AUTO_FLOW}
              optionLabel={(value) => t(`autoFlow-${value.replace(' ', '-')}`)}
              onChange={(autoFlow) => update({ autoFlow })}
            />

            <SelectField
              id="grid-justify-items"
              label={t('justifyItemsLabel')}
              value={config.justifyItems}
              options={GRID_ALIGN}
              optionLabel={(value) => t(`align-${value}`)}
              onChange={(justifyItems: GridAlign) => update({ justifyItems })}
            />

            <SelectField
              id="grid-align-items"
              label={t('alignItemsLabel')}
              value={config.alignItems}
              options={GRID_ALIGN}
              optionLabel={(value) => t(`align-${value}`)}
              onChange={(alignItems: GridAlign) => update({ alignItems })}
            />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('previewLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-border bg-muted/20 min-h-72 rounded-lg border p-3"
              style={style}
              role="img"
              aria-label={t('previewAria')}
            >
              {Array.from({ length: cellCount }, (_, index) => (
                <div
                  key={`grid-cell-${index}`}
                  className="bg-primary/10 border-border flex min-h-8 items-center justify-center rounded-md border text-xs text-foreground/60"
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('outputLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <TextareaCopyable value={css} rows={14} className="font-mono" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
