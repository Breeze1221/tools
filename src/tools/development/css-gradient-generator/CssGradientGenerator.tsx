import { Plus, Shuffle, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  CSS_MODES,
  GRADIENT_POSITIONS,
  GRADIENT_TYPES,
  RADIAL_SHAPES,
  buildGradient,
  buildGradientCss,
  gradientPresets,
  randomGradient,
  type GradientConfig,
  type GradientCssMode,
  type GradientPosition,
  type GradientStop,
} from './css-gradient-generator.service'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function safeHex(color: string): string {
  return HEX_COLOR.test(color) ? color : '#000000'
}

function positionKey(position: GradientPosition): string {
  return `position-${position.replace(' ', '-')}`
}

export default function CssGradientGenerator() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'css-gradient-generator' })

  const [config, setConfig] = useState<GradientConfig>(() => gradientPresets[0].config)
  const [mode, setMode] = useState<GradientCssMode>('background')
  const [nextStopId, setNextStopId] = useState(0)

  const gradient = useMemo(() => {
    try {
      return { css: buildGradient(config), error: null }
    } catch {
      return { css: '', error: t('invalid') }
    }
  }, [config, t])

  const css = useMemo(() => {
    try {
      return buildGradientCss(config, mode)
    } catch {
      return ''
    }
  }, [config, mode])

  const updateConfig = (patch: Partial<Omit<GradientConfig, 'stops'>>) => {
    setConfig((current) => ({ ...current, ...patch }))
  }

  const updateStop = (id: string, patch: Partial<Omit<GradientStop, 'id'>>) => {
    setConfig((current) => ({
      ...current,
      stops: current.stops.map((stop) => (stop.id === id ? { ...stop, ...patch } : stop)),
    }))
  }

  const handleAddStop = () => {
    const id = `stop-${nextStopId}`
    setNextStopId(nextStopId + 1)
    setConfig((current) => ({
      ...current,
      stops: [...current.stops, { id, color: '#ffffff', position: 50 }],
    }))
  }

  const handleRemoveStop = (id: string) => {
    setConfig((current) =>
      current.stops.length <= 2
        ? current
        : { ...current, stops: current.stops.filter((stop) => stop.id !== id) },
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setConfig(randomGradient())}>
          <Shuffle className="size-4" />
          {t('random')}
        </Button>
        <span className="text-muted-foreground text-xs">{t('presetsLabel')}</span>
        {gradientPresets.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfig(preset.config)}
          >
            {t(`preset-${preset.id}`)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('settingsLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-2">
                <Label>{t('typeLabel')}</Label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={config.type}
                  onValueChange={(value) => {
                    const next = GRADIENT_TYPES.find((item) => item === value)
                    if (next) {
                      updateConfig({ type: next })
                    }
                  }}
                >
                  {GRADIENT_TYPES.map((type) => (
                    <ToggleGroupItem key={type} value={type}>
                      {t(`type-${type}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex items-center gap-2 pb-1.5">
                <Switch
                  id="css-gradient-repeating"
                  checked={config.repeating}
                  onCheckedChange={(checked) => updateConfig({ repeating: checked })}
                />
                <Label htmlFor="css-gradient-repeating">{t('repeatingLabel')}</Label>
              </div>
            </div>

            {config.type === 'linear' && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="css-gradient-angle">{t('angleLabel')}</Label>
                  <Input
                    id="css-gradient-angle-number"
                    type="number"
                    min={0}
                    max={360}
                    value={config.angle}
                    onChange={(event) => updateConfig({ angle: Number(event.target.value) || 0 })}
                    className="w-20 font-mono"
                  />
                </div>
                <Slider
                  id="css-gradient-angle"
                  min={0}
                  max={360}
                  step={1}
                  value={[config.angle]}
                  onValueChange={(values) => updateConfig({ angle: values[0] ?? 0 })}
                />
              </div>
            )}

            {config.type === 'radial' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="css-gradient-shape">{t('shapeLabel')}</Label>
                  <Select
                    value={config.shape}
                    onValueChange={(value) => {
                      const next = RADIAL_SHAPES.find((item) => item === value)
                      if (next) {
                        updateConfig({ shape: next })
                      }
                    }}
                  >
                    <SelectTrigger id="css-gradient-shape" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIAL_SHAPES.map((shape) => (
                        <SelectItem key={shape} value={shape}>
                          {t(`shape-${shape}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="css-gradient-position">{t('positionLabel')}</Label>
                  <Select
                    value={config.position}
                    onValueChange={(value) => {
                      const next = GRADIENT_POSITIONS.find((item) => item === value)
                      if (next) {
                        updateConfig({ position: next })
                      }
                    }}
                  >
                    <SelectTrigger id="css-gradient-position" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADIENT_POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {t(positionKey(position))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {config.type === 'conic' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="css-gradient-start-angle">{t('startAngleLabel')}</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      id="css-gradient-start-angle"
                      min={0}
                      max={360}
                      step={1}
                      value={[config.startAngle]}
                      onValueChange={(values) => updateConfig({ startAngle: values[0] ?? 0 })}
                    />
                    <Input
                      type="number"
                      min={0}
                      max={360}
                      value={config.startAngle}
                      onChange={(event) =>
                        updateConfig({ startAngle: Number(event.target.value) || 0 })
                      }
                      className="w-20 font-mono"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="css-gradient-conic-position">{t('positionLabel')}</Label>
                  <Select
                    value={config.position}
                    onValueChange={(value) => {
                      const next = GRADIENT_POSITIONS.find((item) => item === value)
                      if (next) {
                        updateConfig({ position: next })
                      }
                    }}
                  >
                    <SelectTrigger id="css-gradient-conic-position" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADIENT_POSITIONS.map((position) => (
                        <SelectItem key={position} value={position}>
                          {t(positionKey(position))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>{t('stopsLabel')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddStop}>
                  <Plus className="size-4" />
                  {t('addStop')}
                </Button>
              </div>

              <ol className="flex flex-col gap-2">
                {config.stops.map((stop, index) => (
                  <li key={stop.id} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={safeHex(stop.color)}
                      onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                      aria-label={t('stopColor', { index: index + 1 })}
                      className="border-input h-9 w-10 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
                    />
                    <Input
                      value={stop.color}
                      onChange={(event) => updateStop(stop.id, { color: event.target.value })}
                      aria-label={t('stopColorValue', { index: index + 1 })}
                      spellCheck={false}
                      className="w-28 font-mono"
                    />
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[stop.position]}
                      onValueChange={(values) =>
                        updateStop(stop.id, { position: values[0] ?? stop.position })
                      }
                      aria-label={t('stopPosition', { index: index + 1 })}
                      className="min-w-16 flex-1"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={stop.position}
                      onChange={(event) => {
                        const next = Number(event.target.value)
                        if (Number.isFinite(next)) {
                          updateStop(stop.id, { position: Math.min(100, Math.max(0, next)) })
                        }
                      }}
                      aria-label={t('stopPositionValue', { index: index + 1 })}
                      className="w-20 font-mono"
                    />
                    <span className="text-muted-foreground text-xs">%</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={config.stops.length <= 2}
                      aria-label={t('removeStop', { index: index + 1 })}
                      onClick={() => handleRemoveStop(stop.id)}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('previewLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div
              className="border-border h-48 w-full rounded-lg border"
              style={{ backgroundImage: gradient.css }}
              role="img"
              aria-label={t('previewAria')}
            />

            {gradient.error && (
              <Alert variant="destructive">
                <AlertDescription>{gradient.error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="css-gradient-mode">{t('outputModeLabel')}</Label>
                <Select
                  value={mode}
                  onValueChange={(value) => {
                    const next = CSS_MODES.find((item) => item === value)
                    if (next) {
                      setMode(next)
                    }
                  }}
                >
                  <SelectTrigger id="css-gradient-mode" className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CSS_MODES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {t(`mode-${item}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('outputLabel')}</Label>
              <TextareaCopyable value={css} rows={2} className="font-mono" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
