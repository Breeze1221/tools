import { Check, Copy, Download, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FileAddButtons, FileDropZone } from '@/components/file-drop-zone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import { WATERMARK_ANCHORS, type WatermarkAnchor } from './image-watermarker.service'
import {
  renderWatermarkedImage,
  type ComposeWatermarkOptions,
  type WatermarkResult,
} from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const COPIED_RESET_MS = 1800

type Mode = 'text' | 'image'
type OutputFormat = 'png' | 'jpeg'
type ErrorKey =
  'errorMissingSource' | 'errorEmptyText' | 'errorMissingImage' | 'errorRender' | 'errorCopy'

type SelectedFile = {
  file: File
  previewUrl: string
}

type RenderedPreview = WatermarkResult & {
  url: string
}

export default function ImageWatermarker() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-watermarker' })
  const [source, setSource] = useState<SelectedFile | null>(null)
  const [mode, setMode] = useState<Mode>('text')
  const [text, setText] = useState('© ToolBox')
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState('#ffffff')
  const [textOpacity, setTextOpacity] = useState(0.6)
  const [rotation, setRotation] = useState(-30)
  const [anchor, setAnchor] = useState<WatermarkAnchor>('bottom-right')
  const [margin, setMargin] = useState(24)
  const [tile, setTile] = useState(false)
  const [watermarkFile, setWatermarkFile] = useState<File | null>(null)
  const [watermarkPreview, setWatermarkPreview] = useState('')
  const [scale, setScale] = useState(0.25)
  const [imageOpacity, setImageOpacity] = useState(0.8)
  const [imageAnchor, setImageAnchor] = useState<WatermarkAnchor>('bottom-right')
  const [imageMargin, setImageMargin] = useState(24)
  const [format, setFormat] = useState<OutputFormat>('png')
  const [quality, setQuality] = useState(0.92)
  const [result, setResult] = useState<RenderedPreview | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  const sourceUrlRef = useRef('')
  const watermarkUrlRef = useRef('')
  const resultUrlRef = useRef('')
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      for (const url of [sourceUrlRef.current, watermarkUrlRef.current, resultUrlRef.current]) {
        if (url !== '') URL.revokeObjectURL(url)
      }
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  const clearResult = () => {
    if (resultUrlRef.current !== '') {
      URL.revokeObjectURL(resultUrlRef.current)
      resultUrlRef.current = ''
    }
    setResult(null)
    setIsCopied(false)
  }

  const handleSourceFiles = (files: File[]) => {
    const next = files[0]
    if (!next) return
    if (sourceUrlRef.current !== '') URL.revokeObjectURL(sourceUrlRef.current)
    sourceUrlRef.current = URL.createObjectURL(next)
    setSource({ file: next, previewUrl: sourceUrlRef.current })
    setErrorKey(null)
    clearResult()
  }

  const handleWatermarkFiles = (files: File[]) => {
    const next = files[0]
    if (!next) return
    if (watermarkUrlRef.current !== '') URL.revokeObjectURL(watermarkUrlRef.current)
    watermarkUrlRef.current = URL.createObjectURL(next)
    setWatermarkFile(next)
    setWatermarkPreview(watermarkUrlRef.current)
    setErrorKey(null)
    clearResult()
  }

  const buildOptions = (override?: OutputFormat): ComposeWatermarkOptions | null => {
    if (source === null) return null
    return {
      file: source.file,
      format: override ?? format,
      quality,
      text:
        mode === 'text'
          ? { text, fontSize, color, opacity: textOpacity, rotation, anchor, margin, tile }
          : undefined,
      watermark:
        mode === 'image' && watermarkFile !== null
          ? {
              file: watermarkFile,
              options: { scale, opacity: imageOpacity, anchor: imageAnchor, margin: imageMargin },
            }
          : undefined,
    }
  }

  const handleRender = async () => {
    const options = buildOptions()
    if (options === null) {
      setErrorKey('errorMissingSource')
      return
    }
    if (mode === 'text' && text.trim() === '') {
      setErrorKey('errorEmptyText')
      return
    }
    if (mode === 'image' && watermarkFile === null) {
      setErrorKey('errorMissingImage')
      return
    }

    setIsRendering(true)
    setErrorKey(null)
    try {
      const rendered = await renderWatermarkedImage(options)
      if (resultUrlRef.current !== '') URL.revokeObjectURL(resultUrlRef.current)
      const url = URL.createObjectURL(rendered.blob)
      resultUrlRef.current = url
      setResult({ ...rendered, url })
      setIsCopied(false)
    } catch {
      clearResult()
      setErrorKey('errorRender')
    } finally {
      setIsRendering(false)
    }
  }

  const handleCopy = async () => {
    if (result === null) return
    if (typeof ClipboardItem === 'undefined' || typeof navigator.clipboard === 'undefined') {
      setErrorKey('errorCopy')
      return
    }

    try {
      let blob = result.blob
      if (blob.type !== 'image/png') {
        const pngOptions = buildOptions('png')
        if (pngOptions === null) return
        blob = (await renderWatermarkedImage(pngOptions)).blob
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setIsCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setIsCopied(false), COPIED_RESET_MS)
    } catch {
      setErrorKey('errorCopy')
    }
  }

  const outputName = (fileName: string, outputFormat: OutputFormat): string => {
    const base = fileName.replace(/\.[^.]+$/, '')
    return `${base}-watermarked.${outputFormat === 'jpeg' ? 'jpg' : 'png'}`
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {source === null ? (
            <FileDropZone
              accept={ACCEPT}
              label={t('dropTitle')}
              description={t('dropSubtitle')}
              minHeightClass="min-h-64"
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
                if (value === 'text' || value === 'image') {
                  setMode(value)
                  setErrorKey(null)
                  clearResult()
                }
              }}
            >
              <ToggleGroupItem value="text">{t('modeText')}</ToggleGroupItem>
              <ToggleGroupItem value="image">{t('modeImage')}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {mode === 'text' ? (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="watermark-text">{t('textLabel')}</Label>
                <Input
                  id="watermark-text"
                  value={text}
                  placeholder={t('textPlaceholder')}
                  onChange={(event) => setText(event.target.value)}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <OptionSlider
                  label={t('fontSizeLabel')}
                  value={fontSize}
                  min={8}
                  max={240}
                  step={1}
                  unit="px"
                  onChange={setFontSize}
                />
                <OptionSlider
                  label={t('rotationLabel')}
                  value={rotation}
                  min={-90}
                  max={90}
                  step={1}
                  unit="°"
                  onChange={setRotation}
                />
                <OptionSlider
                  label={t('opacityLabel')}
                  value={Math.round(textOpacity * 100)}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(value) => setTextOpacity(value / 100)}
                />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="watermark-color">{t('colorLabel')}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="watermark-color"
                      type="color"
                      value={color}
                      aria-label={t('colorLabel')}
                      className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0.5"
                      onChange={(event) => setColor(event.target.value)}
                    />
                    <span className="text-muted-foreground font-mono text-xs">{color}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t('tileLabel')}</span>
                  <span className="text-muted-foreground text-xs">{t('tileHint')}</span>
                </div>
                <Switch checked={tile} onCheckedChange={setTile} />
              </div>

              <AnchorField
                value={anchor}
                margin={margin}
                groupLabel={t('anchorLabel')}
                marginLabel={t('marginLabel')}
                label={(value) => t(`anchor.${value}`)}
                onAnchorChange={setAnchor}
                onMarginChange={setMargin}
              />
            </>
          ) : (
            <>
              {watermarkFile === null ? (
                <FileDropZone
                  accept={ACCEPT}
                  label={t('chooseWatermark')}
                  description={t('watermarkImageHint')}
                  minHeightClass="min-h-32"
                  onFiles={handleWatermarkFiles}
                />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="bg-muted/40 flex size-16 shrink-0 items-center justify-center rounded-lg border p-1">
                    <img
                      src={watermarkPreview}
                      alt={t('watermarkPreviewAlt')}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" title={watermarkFile.name}>
                      {watermarkFile.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatBytes(watermarkFile.size)}
                    </p>
                  </div>
                  <FileAddButtons
                    accept={ACCEPT}
                    browseLabel={t('replaceWatermark')}
                    onFiles={handleWatermarkFiles}
                  />
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <OptionSlider
                  label={t('scaleLabel')}
                  value={Math.round(scale * 100)}
                  min={5}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(value) => setScale(value / 100)}
                />
                <OptionSlider
                  label={t('opacityLabel')}
                  value={Math.round(imageOpacity * 100)}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(value) => setImageOpacity(value / 100)}
                />
              </div>

              <AnchorField
                value={imageAnchor}
                margin={imageMargin}
                groupLabel={t('anchorLabel')}
                marginLabel={t('marginLabel')}
                label={(value) => t(`anchor.${value}`)}
                onAnchorChange={setImageAnchor}
                onMarginChange={setImageMargin}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('exportTitle')}</CardTitle>
          <CardDescription>{t('exportHint')}</CardDescription>
          <CardAction>
            <Button disabled={source === null || isRendering} onClick={() => void handleRender()}>
              {isRendering ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              {isRendering ? t('rendering') : t('render')}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label>{t('formatLabel')}</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={format}
                onValueChange={(value) => {
                  if (value === 'png' || value === 'jpeg') {
                    setFormat(value)
                    clearResult()
                  }
                }}
              >
                <ToggleGroupItem value="png">PNG</ToggleGroupItem>
                <ToggleGroupItem value="jpeg">JPEG</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {format === 'jpeg' && (
              <div className="min-w-56 flex-1">
                <OptionSlider
                  label={t('qualityLabel')}
                  value={Math.round(quality * 100)}
                  min={10}
                  max={100}
                  step={1}
                  unit="%"
                  onChange={(value) => setQuality(value / 100)}
                />
              </div>
            )}
          </div>

          {errorKey !== null && (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey)}</AlertDescription>
            </Alert>
          )}

          {result === null ? (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-4">
              <p className="text-muted-foreground text-sm">{t('resultEmpty')}</p>
            </div>
          ) : (
            <>
              <div className="bg-muted/30 flex min-h-40 items-center justify-center overflow-hidden rounded-xl border p-3">
                <img
                  src={result.url}
                  alt={t('resultAlt')}
                  className="max-h-[420px] max-w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    downloadBlob(result.blob, outputName(source?.file.name ?? 'image', format))
                  }
                >
                  <Download className="size-4" />
                  {t('download')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void handleCopy()}
                >
                  {isCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {isCopied ? t('copied') : t('copy')}
                </Button>
                <span className="text-muted-foreground font-mono text-xs">
                  {result.width} × {result.height} px · {formatBytes(result.blob.size)}
                </span>
              </div>
            </>
          )}
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

type AnchorFieldProps = {
  value: WatermarkAnchor
  margin: number
  groupLabel: string
  marginLabel: string
  label: (anchor: WatermarkAnchor) => string
  onAnchorChange: (anchor: WatermarkAnchor) => void
  onMarginChange: (margin: number) => void
}

function AnchorField({
  value,
  margin,
  groupLabel,
  marginLabel,
  label,
  onAnchorChange,
  onMarginChange,
}: AnchorFieldProps) {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <div className="flex flex-col gap-2">
        <Label>{groupLabel}</Label>
        <div
          role="group"
          aria-label={groupLabel}
          className="grid w-fit grid-cols-3 gap-1 rounded-lg border p-1"
        >
          {WATERMARK_ANCHORS.map((anchor) => (
            <button
              key={anchor}
              type="button"
              title={label(anchor)}
              aria-label={label(anchor)}
              aria-pressed={value === anchor}
              onClick={() => onAnchorChange(anchor)}
              className={cn(
                'flex size-8 items-center justify-center rounded-md border transition-colors',
                value === anchor
                  ? 'border-primary bg-primary/10'
                  : 'hover:bg-muted border-transparent',
              )}
            >
              <span
                className={cn(
                  'size-2 rounded-full',
                  value === anchor ? 'bg-primary' : 'bg-muted-foreground/40',
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-48 flex-1">
        <OptionSlider
          label={marginLabel}
          value={margin}
          min={0}
          max={200}
          step={1}
          unit="px"
          onChange={onMarginChange}
        />
      </div>
    </div>
  )
}
