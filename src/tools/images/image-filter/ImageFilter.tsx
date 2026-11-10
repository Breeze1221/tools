import { Download, Loader2, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FileAddButtons, FileDropZone } from '@/components/file-drop-zone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import {
  FILTER_DEFAULTS,
  FILTER_KEYS,
  FILTER_PRESETS,
  FILTER_RANGES,
  buildFilter,
  type FilterConfig,
  type FilterKey,
} from './image-filter.service'
import {
  OUTPUT_FORMATS,
  renderFilteredImage,
  type FilterRenderResult,
  type OutputFormat,
} from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'

type ErrorKey = 'errorRender'

type SelectedFile = {
  file: File
  previewUrl: string
}

type RenderedPreview = FilterRenderResult & {
  url: string
  filter: string
  format: OutputFormat
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
}

const PARAM_UNITS: Record<FilterKey, string> = {
  brightness: '%',
  contrast: '%',
  saturate: '%',
  hueRotate: '°',
  grayscale: '%',
  sepia: '%',
  blur: 'px',
}

export default function ImageFilter() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-filter' })
  const [source, setSource] = useState<SelectedFile | null>(null)
  const [config, setConfig] = useState<FilterConfig>(FILTER_DEFAULTS)
  const [presetId, setPresetId] = useState<string>('original')
  const [format, setFormat] = useState<OutputFormat>('png')
  const [quality, setQuality] = useState(0.92)
  const [result, setResult] = useState<RenderedPreview | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  const sourceUrlRef = useRef('')
  const resultUrlRef = useRef('')

  const clearResult = () => {
    if (resultUrlRef.current !== '') {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = ''
    }
    setResult(null)
  }

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
    setErrorKey(null)
    clearResult()
  }

  const updateParam = (key: FilterKey, value: number) => {
    setConfig((current) => ({ ...current, [key]: value }))
    setPresetId('custom')
    setErrorKey(null)
    clearResult()
  }

  const applyPreset = (id: string) => {
    const preset = FILTER_PRESETS.find((item) => item.id === id)
    if (!preset) return
    setConfig(preset.config)
    setPresetId(preset.id)
    setErrorKey(null)
    clearResult()
  }

  const handleRender = async () => {
    if (source === null) return
    setIsRendering(true)
    setErrorKey(null)
    try {
      const rendered = await renderFilteredImage({
        file: source.file,
        config,
        format,
        quality,
      })
      if (resultUrlRef.current !== '') URL.revokeObjectURL(resultUrlRef.current)
      const url = URL.createObjectURL(rendered.blob)
      resultUrlRef.current = url
      setResult({ ...rendered, url, filter: buildFilter(config), format })
    } catch {
      clearResult()
      setErrorKey('errorRender')
    } finally {
      setIsRendering(false)
    }
  }

  const visibleResult =
    result !== null && result.filter === buildFilter(config) && result.format === format
      ? result
      : null

  const outputName = (fileName: string): string => {
    const base = fileName.replace(/\.[^.]+$/, '')
    return `${base}-filtered.${format === 'jpeg' ? 'jpg' : format}`
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
                icon={SlidersHorizontal}
                label={t('dropTitle')}
                description={t('dropSubtitle')}
                minHeightClass="min-h-52"
                onFiles={handleSourceFiles}
              />
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="bg-muted/40 flex size-28 shrink-0 items-center justify-center rounded-xl border p-2">
                  <img
                    src={source.previewUrl}
                    alt={t('previewAlt')}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={source.file.name}>
                      {source.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatBytes(source.file.size)}</p>
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
            <CardTitle>{t('filterTitle')}</CardTitle>
            <CardDescription>{t('filterHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label>{t('presetLabel')}</Label>
              <div className="flex flex-wrap gap-2">
                {FILTER_PRESETS.map((preset) => (
                  <Button
                    key={preset.id}
                    type="button"
                    size="sm"
                    variant={presetId === preset.id ? 'default' : 'outline'}
                    onClick={() => applyPreset(preset.id)}
                  >
                    {t(`preset.${preset.id}`)}
                  </Button>
                ))}
                {presetId === 'custom' && (
                  <span className="text-muted-foreground self-center text-xs">
                    {t('presetCustom')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {FILTER_KEYS.map((key) => {
                const range = FILTER_RANGES[key]
                return (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <Label>{t(`param.${key}`)}</Label>
                      <span className="text-muted-foreground font-mono text-xs tabular-nums">
                        {config[key]} {PARAM_UNITS[key]}
                      </span>
                    </div>
                    <Slider
                      value={[config[key]]}
                      min={range.min}
                      max={range.max}
                      step={1}
                      onValueChange={([next]) => {
                        if (next !== undefined) updateParam(key, next)
                      }}
                    />
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset('original')}
              >
                {t('reset')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 self-start">
        <CardHeader>
          <CardTitle>{t('previewTitle')}</CardTitle>
          <CardDescription>{t('previewHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errorKey !== null && (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey)}</AlertDescription>
            </Alert>
          )}

          <div className="bg-muted/30 flex min-h-64 items-center justify-center overflow-hidden rounded-xl border p-3">
            {source !== null ? (
              <img
                src={source.previewUrl}
                alt={t('previewAlt')}
                style={{ filter: buildFilter(config) }}
                className="max-h-[520px] max-w-full object-contain"
              />
            ) : (
              <span className="text-muted-foreground text-sm">{t('previewEmpty')}</span>
            )}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-format">{t('formatLabel')}</Label>
              <Select
                value={format}
                onValueChange={(value) => {
                  if (value === 'png' || value === 'jpeg' || value === 'webp') {
                    setFormat(value)
                    clearResult()
                  }
                }}
              >
                <SelectTrigger id="filter-format" className="w-full">
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
              <div className="min-w-40 flex-1">
                <div className="flex items-center justify-between">
                  <Label>{t('qualityLabel')}</Label>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <Slider
                  value={[Math.round(quality * 100)]}
                  min={10}
                  max={100}
                  step={1}
                  onValueChange={([next]) => {
                    if (next !== undefined) {
                      setQuality(next / 100)
                      clearResult()
                    }
                  }}
                />
              </div>
            )}
          </div>

          <code className="text-muted-foreground bg-muted/40 block overflow-x-auto rounded-md border px-2 py-1.5 font-mono text-xs">
            {buildFilter(config)}
          </code>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="gap-1.5"
              size="sm"
              disabled={source === null || isRendering}
              onClick={() => void handleRender()}
            >
              {isRendering ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              {isRendering ? t('rendering') : t('render')}
            </Button>
            {visibleResult !== null && source !== null && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => downloadBlob(visibleResult.blob, outputName(source.file.name))}
              >
                <Download className="size-4" />
                {t('download')}
              </Button>
            )}
            <span className="text-muted-foreground font-mono text-xs">
              {visibleResult !== null
                ? `${visibleResult.width} × ${visibleResult.height} px · ${formatBytes(visibleResult.blob.size)}`
                : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
