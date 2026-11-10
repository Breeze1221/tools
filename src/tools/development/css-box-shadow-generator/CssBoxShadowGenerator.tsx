import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
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
import {
  MAX_SHADOW_LAYERS,
  SHADOW_LIMITS,
  SHADOW_MODES,
  SHADOW_PRESETS,
  buildBoxShadow,
  buildBoxShadowCss,
  createLayer,
  type ShadowLayer,
  type ShadowMode,
} from './css-box-shadow-generator.service'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function safeHex(color: string): string {
  return HEX_COLOR.test(color) ? color : '#000000'
}

function clampValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

type LayerPatch = Partial<Omit<ShadowLayer, 'id'>>

type NumberControlProps = {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onValueChange: (value: number) => void
}

/** Slider + numeric input pair used for every geometry value */
function NumberControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onValueChange,
}: NumberControlProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          <Input
            id={`${id}-number`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => {
              const next = Number(event.target.value)
              if (Number.isFinite(next)) {
                onValueChange(clampValue(next, min, max))
              }
            }}
            aria-label={label}
            className="h-8 w-20 font-mono"
          />
          {suffix !== undefined && <span className="text-muted-foreground text-xs">{suffix}</span>}
        </div>
      </div>
      <Slider
        id={id}
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onValueChange(clampValue(values[0] ?? value, min, max))}
        aria-label={label}
      />
    </div>
  )
}

type LayerEditorProps = {
  layer: ShadowLayer
  index: number
  canRemove: boolean
  onPatch: (patch: LayerPatch) => void
  onRemove: () => void
}

function LayerEditor({ layer, index, canRemove, onPatch, onRemove }: LayerEditorProps) {
  const { t } = useTranslation('tools-development', {
    keyPrefix: 'css-box-shadow-generator',
  })
  const insetId = `${layer.id}-inset`

  return (
    <div className="bg-muted/30 flex flex-col gap-3 rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{t('layerTitle', { index: index + 1 })}</span>
        <div className="flex items-center gap-2">
          <Switch
            id={insetId}
            checked={layer.inset}
            onCheckedChange={(checked) => onPatch({ inset: checked })}
          />
          <Label htmlFor={insetId} className="cursor-pointer text-xs">
            {t('insetLabel')}
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={!canRemove}
            aria-label={t('removeLayer', { index: index + 1 })}
            onClick={onRemove}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <NumberControl
          id={`${layer.id}-x`}
          label={t('xLabel')}
          value={layer.x}
          min={-SHADOW_LIMITS.offset}
          max={SHADOW_LIMITS.offset}
          suffix="px"
          onValueChange={(x) => onPatch({ x })}
        />
        <NumberControl
          id={`${layer.id}-y`}
          label={t('yLabel')}
          value={layer.y}
          min={-SHADOW_LIMITS.offset}
          max={SHADOW_LIMITS.offset}
          suffix="px"
          onValueChange={(y) => onPatch({ y })}
        />
        <NumberControl
          id={`${layer.id}-blur`}
          label={t('blurLabel')}
          value={layer.blur}
          min={0}
          max={SHADOW_LIMITS.blur}
          suffix="px"
          onValueChange={(blur) => onPatch({ blur })}
        />
        <NumberControl
          id={`${layer.id}-spread`}
          label={t('spreadLabel')}
          value={layer.spread}
          min={-SHADOW_LIMITS.spread}
          max={SHADOW_LIMITS.spread}
          suffix="px"
          onValueChange={(spread) => onPatch({ spread })}
        />
        <NumberControl
          id={`${layer.id}-opacity`}
          label={t('opacityLabel')}
          value={Math.round(layer.opacity * 100)}
          min={0}
          max={100}
          suffix="%"
          onValueChange={(opacity) => onPatch({ opacity: opacity / 100 })}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${layer.id}-color`} className="text-xs">
            {t('colorLabel')}
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={safeHex(layer.color)}
              onChange={(event) => onPatch({ color: event.target.value })}
              aria-label={t('colorLabel')}
              className="border-input h-8 w-12 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
            />
            <Input
              id={`${layer.id}-color`}
              value={layer.color}
              onChange={(event) => onPatch({ color: event.target.value })}
              aria-label={t('colorValue')}
              spellCheck={false}
              className="w-32 font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CssBoxShadowGenerator() {
  const { t } = useTranslation('tools-development', {
    keyPrefix: 'css-box-shadow-generator',
  })

  const [layers, setLayers] = useState<ShadowLayer[]>(() =>
    SHADOW_PRESETS[0].layers.map((layer) => ({ ...layer })),
  )
  const [mode, setMode] = useState<ShadowMode>('box-shadow')
  const [nextId, setNextId] = useState(0)

  const shadow = useMemo(() => {
    try {
      return buildBoxShadow(layers)
    } catch {
      return ''
    }
  }, [layers])

  const css = useMemo(() => {
    try {
      return buildBoxShadowCss(layers, mode)
    } catch {
      return ''
    }
  }, [layers, mode])

  const patchLayer = (id: string, patch: LayerPatch) => {
    setLayers((current) =>
      current.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer)),
    )
  }

  const handleAddLayer = () => {
    setLayers((current) =>
      current.length >= MAX_SHADOW_LAYERS
        ? current
        : [...current, { ...createLayer(), id: `custom-${nextId}` }],
    )
    setNextId(nextId + 1)
  }

  const handleRemoveLayer = (id: string) => {
    setLayers((current) =>
      current.length <= 1 ? current : current.filter((layer) => layer.id !== id),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">{t('presetsLabel')}</span>
        {SHADOW_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setLayers(preset.layers.map((layer) => ({ ...layer })))}
          >
            {t(`preset-${preset.id}`)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base">{t('layersLabel')}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={layers.length >= MAX_SHADOW_LAYERS}
              onClick={handleAddLayer}
            >
              <Plus className="size-4" />
              {t('addLayer')}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {layers.map((layer, index) => (
              <LayerEditor
                key={layer.id}
                layer={layer}
                index={index}
                canRemove={layers.length > 1}
                onPatch={(patch) => patchLayer(layer.id, patch)}
                onRemove={() => handleRemoveLayer(layer.id)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('previewLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="bg-muted/50 flex min-h-56 items-center justify-center rounded-lg border p-6">
              <div
                className="bg-background size-40 rounded-2xl"
                style={{ boxShadow: shadow }}
                role="img"
                aria-label={t('previewAria')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="css-box-shadow-mode">{t('outputModeLabel')}</Label>
              <Select
                value={mode}
                onValueChange={(next) => {
                  const matched = SHADOW_MODES.find((item) => item === next)
                  if (matched) {
                    setMode(matched)
                  }
                }}
              >
                <SelectTrigger id="css-box-shadow-mode" className="w-60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHADOW_MODES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`mode-${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === 'filter' && (
              <p className="text-muted-foreground text-xs">{t('filterHint')}</p>
            )}

            <div className="flex flex-col gap-2">
              <Label>{t('outputLabel')}</Label>
              <TextareaCopyable value={css} rows={3} className="font-mono" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
