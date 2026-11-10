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
  FLEX_ALIGN_CONTENT,
  FLEX_ALIGN_ITEMS,
  FLEX_CHILD_RANGE,
  FLEX_DIRECTIONS,
  FLEX_GAP_RANGE,
  FLEX_JUSTIFY_CONTENT,
  FLEX_PRESETS,
  FLEX_WRAPS,
  buildFlexCss,
  buildFlexStyle,
  type FlexConfig,
} from './css-flexbox-playground.service'

const CHILD_CLASSES = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5'] as const

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

export default function CssFlexboxPlayground() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'css-flexbox-playground' })
  const [config, setConfig] = useState<FlexConfig>(FLEX_PRESETS[0].config)

  const update = (patch: Partial<FlexConfig>) => {
    setConfig((current) => ({ ...current, ...patch }))
  }

  const { css, style, error } = useMemo(() => {
    try {
      return {
        css: buildFlexCss(config),
        style: buildFlexStyle(config) as CSSProperties,
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">{t('presetsLabel')}</span>
        {FLEX_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfig(preset.config)}
          >
            {t(`preset-${preset.id}`)}
          </Button>
        ))}
      </div>

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
              <Label>{t('directionLabel')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {FLEX_DIRECTIONS.map((direction) => (
                  <Button
                    key={direction}
                    type="button"
                    size="sm"
                    variant={config.direction === direction ? 'default' : 'outline'}
                    onClick={() => update({ direction })}
                  >
                    {t(`direction-${direction}`)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('wrapLabel')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {FLEX_WRAPS.map((wrap) => (
                  <Button
                    key={wrap}
                    type="button"
                    size="sm"
                    variant={config.wrap === wrap ? 'default' : 'outline'}
                    onClick={() => update({ wrap })}
                  >
                    {t(`wrap-${wrap}`)}
                  </Button>
                ))}
              </div>
            </div>

            <SelectField
              id="flex-justify"
              label={t('justifyContentLabel')}
              value={config.justifyContent}
              options={FLEX_JUSTIFY_CONTENT}
              optionLabel={(value) => t(`justify-${value}`)}
              onChange={(justifyContent) => update({ justifyContent })}
            />

            <SelectField
              id="flex-align-items"
              label={t('alignItemsLabel')}
              value={config.alignItems}
              options={FLEX_ALIGN_ITEMS}
              optionLabel={(value) => t(`align-${value}`)}
              onChange={(alignItems) => update({ alignItems })}
            />

            <SelectField
              id="flex-align-content"
              label={t('alignContentLabel')}
              value={config.alignContent}
              options={FLEX_ALIGN_CONTENT}
              optionLabel={(value) => t(`align-content-${value}`)}
              onChange={(alignContent) => update({ alignContent })}
            />

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="flex-gap">{t('gapLabel')}</Label>
                <Input
                  id="flex-gap-number"
                  type="number"
                  min={FLEX_GAP_RANGE.min}
                  max={FLEX_GAP_RANGE.max}
                  value={config.gap}
                  onChange={(event) => update({ gap: Number(event.target.value) || 0 })}
                  className="h-8 w-20 font-mono"
                />
              </div>
              <Slider
                id="flex-gap"
                min={FLEX_GAP_RANGE.min}
                max={FLEX_GAP_RANGE.max}
                step={1}
                value={[config.gap]}
                onValueChange={(values) => update({ gap: values[0] ?? config.gap })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="flex-children">{t('childrenLabel')}</Label>
                <Input
                  id="flex-children-number"
                  type="number"
                  min={FLEX_CHILD_RANGE.min}
                  max={FLEX_CHILD_RANGE.max}
                  value={config.children}
                  onChange={(event) => update({ children: Number(event.target.value) || 1 })}
                  className="h-8 w-20 font-mono"
                />
              </div>
              <Slider
                id="flex-children"
                min={FLEX_CHILD_RANGE.min}
                max={FLEX_CHILD_RANGE.max}
                step={1}
                value={[config.children]}
                onValueChange={(values) => update({ children: values[0] ?? config.children })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('previewLabel')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-border bg-muted/20 flex min-h-72 rounded-lg border p-3"
              style={style}
              role="img"
              aria-label={t('previewAria')}
            >
              {Array.from({ length: config.children }, (_, index) => (
                <div
                  key={`flex-child-${index}`}
                  className={`${CHILD_CLASSES[index % CHILD_CLASSES.length]} flex h-14 w-14 shrink-0 items-center justify-center rounded-md text-xs font-medium text-foreground/70`}
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
            <TextareaCopyable value={css} rows={12} className="font-mono" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
