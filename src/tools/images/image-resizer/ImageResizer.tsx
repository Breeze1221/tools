import { Download, Link2, Loader2, Scaling, Unlink2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { useTranslation } from 'react-i18next'

import { FileAddButtons, FileDropZone } from '@/components/file-drop-zone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import {
  MAX_DIMENSION,
  RESIZE_PERCENT_PRESETS,
  computeTargetSize,
  parseDimension,
  type ImageSize,
  type ResizeMode,
} from './image-resizer.service'
import {
  OUTPUT_FORMATS,
  renderResizedImage,
  type OutputFormat,
  type ResizeRenderResult,
} from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const RENDER_DELAY_MS = 180
const PERCENT_MIN = 5
const PERCENT_MAX = 200

type ErrorKey = 'errorInvalidSize' | 'errorRender'

type SelectedFile = {
  file: File
  previewUrl: string
}

type RenderedPreview = ResizeRenderResult & {
  url: string
  format: OutputFormat
}

const MODE_LABEL_KEYS = {
  exact: 'mode-exact',
  fit: 'mode-fit',
  cover: 'mode-cover',
  percent: 'mode-percent',
} as const

const FORMAT_LABELS: Record<OutputFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
}

export default function ImageResizer() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-resizer' })
  const [source, setSource] = useState<SelectedFile | null>(null)
  const [sourceSize, setSourceSize] = useState<ImageSize | null>(null)
  const [mode, setMode] = useState<ResizeMode>('fit')
  const [widthInput, setWidthInput] = useState('')
  const [heightInput, setHeightInput] = useState('')
  const [isAspectLocked, setIsAspectLocked] = useState(true)
  const [percent, setPercent] = useState(100)
  const [allowUpscale, setAllowUpscale] = useState(true)
  const [format, setFormat] = useState<OutputFormat>('png')
  const [quality, setQuality] = useState(0.92)
  const [result, setResult] = useState<RenderedPreview | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  const sourceUrlRef = useRef('')
  const resultUrlRef = useRef('')

  const clearResult = useCallback(() => {
    if (resultUrlRef.current !== '') {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = ''
    }
    setResult(null)
  }, [])

  useEffect(() => {
    return () => {
      for (const url of [sourceUrlRef.current, resultUrlRef.current]) {
        if (url !== '') URL.revokeObjectURL(url)
      }
    }
  }, [])

  const handleSourceFiles = (files: File[]) => {
    const next = files[0]
    if (!next) return
    if (sourceUrlRef.current !== '') URL.revokeObjectURL(sourceUrlRef.current)
    sourceUrlRef.current = URL.createObjectURL(next)
    setSource({ file: next, previewUrl: sourceUrlRef.current })
    setSourceSize(null)
    setErrorKey(null)
    clearResult()
  }

  const handleImageReady = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget
    if (naturalWidth <= 0 || naturalHeight <= 0) return
    setSourceSize({ width: naturalWidth, height: naturalHeight })
    setWidthInput(String(naturalWidth))
    setHeightInput(String(naturalHeight))
  }

  const handleWidthChange = (raw: string) => {
    setWidthInput(raw)
    if (!isAspectLocked || sourceSize === null) return
    const parsed = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) return
    setHeightInput(String(Math.max(1, Math.round((parsed * sourceSize.height) / sourceSize.width))))
  }

  const handleHeightChange = (raw: string) => {
    setHeightInput(raw)
    if (!isAspectLocked || sourceSize === null) return
    const parsed = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(parsed) || parsed <= 0) return
    setWidthInput(String(Math.max(1, Math.round((parsed * sourceSize.width) / sourceSize.height))))
  }

  const target = useMemo<ImageSize | null>(() => {
    if (sourceSize === null) return null
    try {
      if (mode === 'percent') {
        return computeTargetSize(sourceSize, { mode, percent, allowUpscale })
      }
      return computeTargetSize(sourceSize, {
        mode,
        width: parseDimension(widthInput),
        height: parseDimension(heightInput),
        allowUpscale,
      })
    } catch {
      return null
    }
  }, [sourceSize, mode, percent, allowUpscale, widthInput, heightInput])

  useEffect(() => {
    if (source === null || target === null) return

    let cancelled = false
    const timer = setTimeout(() => {
      setIsRendering(true)
      setErrorKey(null)
      renderResizedImage({
        file: source.file,
        width: target.width,
        height: target.height,
        format,
        quality,
      })
        .then((rendered) => {
          if (cancelled) return
          if (resultUrlRef.current !== '') URL.revokeObjectURL(resultUrlRef.current)
          const url = URL.createObjectURL(rendered.blob)
          resultUrlRef.current = url
          setResult({ ...rendered, url, format })
        })
        .catch(() => {
          if (!cancelled) setErrorKey('errorRender')
        })
        .finally(() => {
          if (!cancelled) setIsRendering(false)
        })
    }, RENDER_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source, target, format, quality])

  const isSizeInvalid = source !== null && target === null
  const isBusy = isRendering && target !== null
  const visibleResult =
    result !== null &&
    target !== null &&
    result.width === target.width &&
    result.height === target.height &&
    result.format === format
      ? result
      : null

  const outputName = (fileName: string): string => {
    const base = fileName.replace(/\.[^.]+$/, '')
    const extension = format === 'jpeg' ? 'jpg' : format
    const suffix = target === null ? 'resized' : `${target.width}x${target.height}`
    return `${base}-${suffix}.${extension}`
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="flex min-w-0 flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('sourceTitle')}</CardTitle>
            <CardDescription>{t('sourceHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {source === null ? (
              <FileDropZone
                accept={ACCEPT}
                icon={Scaling}
                label={t('dropTitle')}
                description={t('dropSubtitle')}
                minHeightClass="min-h-52"
                onFiles={handleSourceFiles}
              />
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="bg-muted/40 flex size-28 shrink-0 items-center justify-center rounded-xl border p-2">
                  <img
                    key={source.previewUrl}
                    src={source.previewUrl}
                    alt={t('previewAlt')}
                    className="max-h-full max-w-full object-contain"
                    onLoad={handleImageReady}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={source.file.name}>
                      {source.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(source.file.size)}
                      {sourceSize !== null && (
                        <>
                          {' · '}
                          {t('sourceMeta', {
                            width: sourceSize.width,
                            height: sourceSize.height,
                          })}
                        </>
                      )}
                    </p>
                  </div>
                  <FileAddButtons
                    accept={ACCEPT}
                    browseLabel={t('replaceFile')}
                    onFiles={handleSourceFiles}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settingsTitle')}</CardTitle>
            <CardDescription>{t('settingsHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label>{t('modeLabel')}</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={mode}
                onValueChange={(value) => {
                  if (
                    value === 'exact' ||
                    value === 'fit' ||
                    value === 'cover' ||
                    value === 'percent'
                  ) {
                    setMode(value)
                    setErrorKey(null)
                  }
                }}
              >
                {(Object.keys(MODE_LABEL_KEYS) as ResizeMode[]).map((key) => (
                  <ToggleGroupItem key={key} value={key}>
                    {t(MODE_LABEL_KEYS[key])}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {mode === 'percent' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Label>{t('percentLabel')}</Label>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {t('percentValue', { value: percent })}
                  </span>
                </div>
                <Slider
                  value={[percent]}
                  min={PERCENT_MIN}
                  max={PERCENT_MAX}
                  step={1}
                  onValueChange={([next]) => {
                    if (next !== undefined) setPercent(next)
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {RESIZE_PERCENT_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="xs"
                      variant={percent === preset ? 'default' : 'outline'}
                      onClick={() => setPercent(preset)}
                    >
                      {preset}%
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Label htmlFor="resize-width">{t('widthLabel')}</Label>
                    <Input
                      id="resize-width"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_DIMENSION}
                      value={widthInput}
                      placeholder="1920"
                      onChange={(event) => handleWidthChange(event.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant={isAspectLocked ? 'secondary' : 'outline'}
                    aria-pressed={isAspectLocked}
                    aria-label={t('lockAspect')}
                    title={t('lockAspect')}
                    onClick={() => setIsAspectLocked((locked) => !locked)}
                  >
                    {isAspectLocked ? <Link2 /> : <Unlink2 />}
                  </Button>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Label htmlFor="resize-height">{t('heightLabel')}</Label>
                    <Input
                      id="resize-height"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_DIMENSION}
                      value={heightInput}
                      placeholder="1080"
                      onChange={(event) => handleHeightChange(event.target.value)}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {isAspectLocked ? t('lockAspectHint') : t('unlockAspectHint')}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{t('allowUpscaleLabel')}</span>
                <span className="text-muted-foreground text-xs">{t('allowUpscaleHint')}</span>
              </div>
              <Switch
                checked={!allowUpscale}
                aria-label={t('allowUpscaleLabel')}
                onCheckedChange={(checked) => setAllowUpscale(!checked)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="resize-format">{t('formatLabel')}</Label>
                <Select
                  value={format}
                  onValueChange={(value) => {
                    if (value === 'png' || value === 'jpeg' || value === 'webp') {
                      setFormat(value)
                    }
                  }}
                >
                  <SelectTrigger id="resize-format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OUTPUT_FORMATS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {FORMAT_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {format !== 'png' && (
                <OptionSlider
                  label={t('qualityLabel')}
                  value={Math.round(quality * 100)}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(value) => setQuality(value / 100)}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 self-start">
        <CardHeader>
          <CardTitle>{t('resultTitle')}</CardTitle>
          <CardDescription>{t('resultHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isSizeInvalid && (
            <Alert variant="destructive">
              <AlertDescription>{t('errorInvalidSize')}</AlertDescription>
            </Alert>
          )}
          {errorKey !== null && (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey)}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/30 flex min-h-64 items-center justify-center overflow-hidden rounded-xl border p-3">
            {visibleResult !== null ? (
              <img
                src={visibleResult.url}
                alt={t('resultAlt')}
                className="max-h-[520px] max-w-full object-contain"
              />
            ) : isBusy ? (
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                {t('rendering')}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">{t('resultEmpty')}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={visibleResult === null || isBusy}
              onClick={() => {
                if (visibleResult === null || source === null) return
                downloadBlob(visibleResult.blob, outputName(source.file.name))
              }}
            >
              <Download className="size-4" />
              {t('download')}
            </Button>
            {isBusy && visibleResult !== null && (
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                {t('rendering')}
              </span>
            )}
            <span className="text-muted-foreground font-mono text-xs">
              {visibleResult !== null
                ? `${visibleResult.width} × ${visibleResult.height} px · ${formatBytes(visibleResult.blob.size)}`
                : target !== null
                  ? `${target.width} × ${target.height} px`
                  : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type OptionSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  onChange: (value: number) => void
}

function OptionSlider({ label, value, min, max, step, unit = '', onChange }: OptionSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => {
          if (next !== undefined) onChange(next)
        }}
      />
    </div>
  )
}
