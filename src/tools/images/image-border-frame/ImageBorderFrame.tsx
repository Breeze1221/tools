import { Download, Frame, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
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
  FRAME_DEFAULTS,
  buildFrameStyle,
  type FrameConfig,
} from './image-border-frame.service'
import {
  OUTPUT_FORMATS,
  renderFramedImage,
  type FrameRenderResult,
  type OutputFormat,
} from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'

type ErrorKey = 'errorRender'

type SelectedFile = {
  file: File
  previewUrl: string
}

type RenderedPreview = FrameRenderResult & {
  url: string
  style: string
  format: OutputFormat
}

type NumberParam = 'padding' | 'borderWidth' | 'radius' | 'shadow'

const NUMBER_PARAMS: readonly { key: NumberParam; min: number; max: number; unit: string }[] = [
  { key: 'padding', min: 0, max: 200, unit: 'px' },
  { key: 'borderWidth', min: 0, max: 50, unit: 'px' },
  { key: 'radius', min: 0, max: 200, unit: 'px' },
  { key: 'shadow', min: 0, max: 100, unit: 'px' },
]

const FORMAT_LABELS: Record<OutputFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
}

/** 把 service 生成的 CSS 声明串转成 React 可用的 style 对象 */
function cssTextToStyle(css: string): CSSProperties {
  const style: Record<string, string> = {}
  for (const declaration of css.split(';')) {
    const separator = declaration.indexOf(':')
    if (separator <= 0) continue
    const property = declaration.slice(0, separator).trim()
    const value = declaration.slice(separator + 1).trim()
    const key = property.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase())
    style[key] = value
  }
  return style as unknown as CSSProperties
}

export default function ImageBorderFrame() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-border-frame' })
  const [source, setSource] = useState<SelectedFile | null>(null)
  const [config, setConfig] = useState<FrameConfig>(FRAME_DEFAULTS)
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

  const updateConfig = <Key extends keyof FrameConfig>(key: Key, value: FrameConfig[Key]) => {
    setConfig((current) => ({ ...current, [key]: value }))
    setErrorKey(null)
    clearResult()
  }

  const handleRender = async () => {
    if (source === null) return
    setIsRendering(true)
    setErrorKey(null)
    try {
      const rendered = await renderFramedImage({
        file: source.file,
        config,
        format,
        quality,
      })
      if (resultUrlRef.current !== '') URL.revokeObjectURL(resultUrlRef.current)
      const url = URL.createObjectURL(rendered.blob)
      resultUrlRef.current = url
      setResult({ ...rendered, url, style: buildFrameStyle(config), format })
    } catch {
      clearResult()
      setErrorKey('errorRender')
    } finally {
      setIsRendering(false)
    }
  }

  const frameStyle = buildFrameStyle(config)
  const visibleResult =
    result !== null && result.style === frameStyle && result.format === format ? result : null

  const outputName = (fileName: string): string => {
    const base = fileName.replace(/\.[^.]+$/, '')
    return `${base}-framed.${format === 'jpeg' ? 'jpg' : format}`
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
                icon={Frame}
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
            <CardTitle>{t('frameTitle')}</CardTitle>
            <CardDescription>{t('frameHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {NUMBER_PARAMS.map((param) => (
              <div key={param.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label>{t(`param.${param.key}`)}</Label>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {config[param.key]} {param.unit}
                  </span>
                </div>
                <Slider
                  value={[config[param.key]]}
                  min={param.min}
                  max={param.max}
                  step={1}
                  onValueChange={([next]) => {
                    if (next !== undefined) updateConfig(param.key, next)
                  }}
                />
              </div>
            ))}

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField
                id="frame-background"
                label={t('backgroundColorLabel')}
                value={config.backgroundColor}
                onChange={(value) => updateConfig('backgroundColor', value)}
              />
              <ColorField
                id="frame-border"
                label={t('borderColorLabel')}
                value={config.borderColor}
                onChange={(value) => updateConfig('borderColor', value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="frame-format">{t('formatLabel')}</Label>
                <Select
                  value={format}
                  onValueChange={(value) => {
                    if (value === 'png' || value === 'jpeg' || value === 'webp') {
                      setFormat(value)
                      clearResult()
                    }
                  }}
                >
                  <SelectTrigger id="frame-format" className="w-full">
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
                <div className="flex flex-col gap-2">
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

          <div className="bg-muted/30 flex min-h-64 items-center justify-center overflow-auto rounded-xl border p-6">
            {source !== null ? (
              <div style={cssTextToStyle(frameStyle)}>
                <img
                  src={source.previewUrl}
                  alt={t('previewAlt')}
                  className="block max-h-[380px] max-w-full object-contain"
                />
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">{t('previewEmpty')}</span>
            )}
          </div>

          {visibleResult !== null && (
            <div className="bg-muted/30 flex items-center justify-center overflow-hidden rounded-xl border p-3">
              <img
                src={visibleResult.url}
                alt={t('resultAlt')}
                className="max-h-64 max-w-full object-contain"
              />
            </div>
          )}

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
                <Frame data-icon="inline-start" />
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

type ColorFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorField({ id, label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          aria-label={label}
          className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0.5"
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="text-muted-foreground font-mono text-xs">{value}</span>
      </div>
    </div>
  )
}
