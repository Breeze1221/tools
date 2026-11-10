import { Download, Loader2, RotateCcw, RotateCw } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import { normalizeRotation, rotateDimensions } from './image-rotate-flip.service'
import {
  OUTPUT_FORMATS,
  renderRotatedImage,
  type OutputFormat,
  type RotateRenderResult,
} from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const RENDER_DELAY_MS = 180

type ErrorKey = 'errorRender'

type SelectedFile = {
  file: File
  previewUrl: string
  width: number
  height: number
}

type RenderedPreview = RotateRenderResult & {
  url: string
  rotation: number
  flipHorizontal: boolean
  flipVertical: boolean
  format: OutputFormat
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
}

export default function ImageRotateFlip() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-rotate-flip' })
  const [source, setSource] = useState<SelectedFile | null>(null)
  const [rotation, setRotation] = useState(0)
  const [flipHorizontal, setFlipHorizontal] = useState(false)
  const [flipVertical, setFlipVertical] = useState(false)
  const [format, setFormat] = useState<OutputFormat>('png')
  const [quality, setQuality] = useState(0.92)
  const [result, setResult] = useState<RenderedPreview | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  const sourceUrlRef = useRef('')
  const resultUrlRef = useRef('')

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
    setSource({ file: next, previewUrl: sourceUrlRef.current, width: 0, height: 0 })
    setErrorKey(null)
    setResult(null)
  }

  useEffect(() => {
    if (source === null || source.width <= 0) return

    let cancelled = false
    const timer = setTimeout(() => {
      setIsRendering(true)
      setErrorKey(null)
      renderRotatedImage({
        file: source.file,
        rotation,
        flipHorizontal,
        flipVertical,
        format,
        quality,
      })
        .then((rendered) => {
          if (cancelled) return
          if (resultUrlRef.current !== '') URL.revokeObjectURL(resultUrlRef.current)
          const url = URL.createObjectURL(rendered.blob)
          resultUrlRef.current = url
          setResult({ ...rendered, url, rotation, flipHorizontal, flipVertical, format })
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
  }, [source, rotation, flipHorizontal, flipVertical, format, quality])

  const outputSize =
    source !== null && source.width > 0
      ? rotateDimensions({ width: source.width, height: source.height }, rotation)
      : null

  const visibleResult =
    result !== null &&
    result.rotation === rotation &&
    result.flipHorizontal === flipHorizontal &&
    result.flipVertical === flipVertical &&
    result.format === format
      ? result
      : null

  const rotateBy = (delta: number) => {
    setRotation((current) => normalizeRotation(current + delta))
    setErrorKey(null)
  }

  const outputName = (fileName: string): string => {
    const base = fileName.replace(/\.[^.]+$/, '')
    return `${base}-rotated.${format === 'jpeg' ? 'jpg' : format}`
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
                icon={RotateCw}
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
                    onLoad={(event) => {
                      const { naturalWidth, naturalHeight } = event.currentTarget
                      if (naturalWidth <= 0 || naturalHeight <= 0) return
                      setSource((current) =>
                        current === null ? current : { ...current, width: naturalWidth, height: naturalHeight },
                      )
                    }}
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={source.file.name}>
                      {source.file.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(source.file.size)}
                      {source.width > 0 && (
                        <>
                          {' · '}
                          {t('sourceMeta', { width: source.width, height: source.height })}
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
            <CardTitle>{t('transformTitle')}</CardTitle>
            <CardDescription>{t('transformHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => rotateBy(-90)}>
                <RotateCcw className="size-4" />
                {t('rotateLeft')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => rotateBy(90)}>
                <RotateCw className="size-4" />
                {t('rotateRight')}
              </Button>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {t('rotationValue', { value: rotation })}
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{t('flipHorizontal')}</span>
                <Switch
                  checked={flipHorizontal}
                  aria-label={t('flipHorizontal')}
                  onCheckedChange={setFlipHorizontal}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium">{t('flipVertical')}</span>
                <Switch
                  checked={flipVertical}
                  aria-label={t('flipVertical')}
                  onCheckedChange={setFlipVertical}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rotate-format">{t('formatLabel')}</Label>
                <Select
                  value={format}
                  onValueChange={(value) => {
                    if (value === 'png' || value === 'jpeg' || value === 'webp') setFormat(value)
                  }}
                >
                  <SelectTrigger id="rotate-format" className="w-full">
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
                      if (next !== undefined) setQuality(next / 100)
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
          <CardTitle>{t('resultTitle')}</CardTitle>
          <CardDescription>{t('resultHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
            ) : isRendering ? (
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
              disabled={visibleResult === null || source === null}
              onClick={() => {
                if (visibleResult === null || source === null) return
                downloadBlob(visibleResult.blob, outputName(source.file.name))
              }}
            >
              <Download className="size-4" />
              {t('download')}
            </Button>
            <span className="text-muted-foreground font-mono text-xs">
              {outputSize !== null ? `${outputSize.width} × ${outputSize.height} px` : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
