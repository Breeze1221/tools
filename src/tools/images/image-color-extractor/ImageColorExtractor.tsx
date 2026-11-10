import { Check, Copy, Download, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useCopy } from '@/composable/use-copy'
import { FileAddButtons, FileDropZone } from '@/components/file-drop-zone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { downloadText } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import { readableOn, relativeLuminance, toCssRgb } from '@/utils/color'
import {
  averageColor,
  DEFAULT_PALETTE_COLORS,
  extractPalette,
  MAX_PALETTE_COLORS,
  MIN_PALETTE_COLORS,
  toCssVariables,
  toPaletteJson,
  type PaletteColor,
} from './image-color-extractor.service'
import { sampleImage, type SampledImage } from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const ERROR_EMPTY = 'Image has no opaque pixels'

type SortMode = 'ratio' | 'lightness'

type SelectedFile = {
  file: File
  previewUrl: string
}

type PaletteSwatchProps = {
  color: PaletteColor
  copied: boolean
  copyHint: string
  ratioLabel: string
  onCopy: () => void
}

function PaletteSwatch({ color, copied, copyHint, ratioLabel, onCopy }: PaletteSwatchProps) {
  const foreground = readableOn({ r: color.r / 255, g: color.g / 255, b: color.b / 255, a: 1 })

  return (
    <button
      type="button"
      title={copyHint}
      aria-label={`${color.hex} ${ratioLabel}`}
      onClick={onCopy}
      className="group focus-visible:ring-ring flex cursor-pointer flex-col overflow-hidden rounded-xl border text-left transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <span
        className="flex h-20 items-end justify-end p-2"
        style={{ backgroundColor: color.hex, color: toCssRgb(foreground) }}
      >
        {copied ? (
          <Check className="size-4" />
        ) : (
          <Copy className="size-4 opacity-0 transition-opacity group-hover:opacity-70" />
        )}
      </span>
      <span className="bg-card flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="font-mono text-sm">{color.hex}</span>
        <span className="text-muted-foreground text-xs tabular-nums">{ratioLabel}</span>
      </span>
    </button>
  )
}

export default function ImageColorExtractor() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-color-extractor' })
  const { copy, isCopied } = useCopy()
  const [selected, setSelected] = useState<SelectedFile | null>(null)
  const [sampled, setSampled] = useState<SampledImage | null>(null)
  const [count, setCount] = useState(DEFAULT_PALETTE_COLORS)
  const [sortMode, setSortMode] = useState<SortMode>('ratio')
  const [isReading, setIsReading] = useState(false)
  const [errorKey, setErrorKey] = useState<'errorEmpty' | 'errorRead' | null>(null)
  const previewRef = useRef('')
  const loadIdRef = useRef(0)

  useEffect(() => {
    return () => {
      if (previewRef.current !== '') {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const palette = useMemo(() => {
    if (!sampled) return []
    return extractPalette(sampled.pixels, { count })
  }, [sampled, count])

  const sortedPalette = useMemo(() => {
    if (sortMode === 'ratio') return palette
    return [...palette].sort(
      (a, b) =>
        relativeLuminance({ r: a.r / 255, g: a.g / 255, b: a.b / 255, a: 1 }) -
        relativeLuminance({ r: b.r / 255, g: b.g / 255, b: b.b / 255, a: 1 }),
    )
  }, [palette, sortMode])

  const average = useMemo(() => {
    if (!sampled) return ''
    try {
      return averageColor(sampled.pixels)
    } catch {
      return ''
    }
  }, [sampled])

  const handleFiles = (files: File[]) => {
    const next = files[0]
    if (!next) return

    if (previewRef.current !== '') {
      URL.revokeObjectURL(previewRef.current)
    }
    previewRef.current = URL.createObjectURL(next)
    setSelected({ file: next, previewUrl: previewRef.current })
    setSampled(null)
    setErrorKey(null)
    setIsReading(true)

    const loadId = (loadIdRef.current += 1)
    void (async () => {
      try {
        const result = await sampleImage(next)
        // 先用默认色数验证一次：全透明图片要在这里就给出提示，而不是留下空色板
        extractPalette(result.pixels, { count: DEFAULT_PALETTE_COLORS })
        if (loadIdRef.current !== loadId) return
        setSampled(result)
      } catch (error) {
        if (loadIdRef.current !== loadId) return
        setSampled(null)
        setErrorKey(
          error instanceof Error && error.message === ERROR_EMPTY ? 'errorEmpty' : 'errorRead',
        )
      } finally {
        if (loadIdRef.current === loadId) setIsReading(false)
      }
    })()
  }

  const handleDownload = () => {
    downloadText(toPaletteJson(sortedPalette), 'palette.json', 'application/json')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {selected === null ? (
            <FileDropZone
              accept={ACCEPT}
              label={t('dropTitle')}
              description={t('dropSubtitle')}
              minHeightClass="min-h-48"
              onFiles={handleFiles}
            />
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="bg-muted/40 flex min-h-28 items-center justify-center overflow-hidden rounded-xl border p-2 sm:w-56">
                <img
                  src={selected.previewUrl}
                  alt={t('previewAlt')}
                  className="max-h-40 max-w-full object-contain"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={selected.file.name}>
                    {selected.file.name}
                  </p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {formatBytes(selected.file.size)}
                    {sampled && ` · ${sampled.sourceWidth} × ${sampled.sourceHeight} px`}
                  </p>
                </div>
                <FileAddButtons
                  accept={ACCEPT}
                  browseLabel={t('replaceFile')}
                  onFiles={handleFiles}
                />
              </div>
            </div>
          )}

          {isReading && (
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="size-4 animate-spin" />
              {t('reading')}
            </p>
          )}

          {errorKey !== null && (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey)}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {sampled !== null && palette.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('paletteTitle')}</CardTitle>
            <CardDescription>{t('paletteHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                title={t('copyHint')}
                onClick={() => void copy(average)}
                className="hover:bg-muted/60 flex w-fit items-center gap-3 rounded-lg p-1.5 text-left transition-colors"
              >
                <span
                  className="size-9 shrink-0 rounded-lg border"
                  style={{ backgroundColor: average }}
                />
                <span>
                  <span className="text-muted-foreground block text-xs">{t('averageTitle')}</span>
                  <span className="font-mono text-sm">{average}</span>
                </span>
                {isCopied(average) ? (
                  <Check className="text-primary size-4" />
                ) : (
                  <Copy className="text-muted-foreground size-4" />
                )}
              </button>

              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                aria-label={t('sortLabel')}
                value={sortMode}
                onValueChange={(value) =>
                  setSortMode(value === 'lightness' ? 'lightness' : 'ratio')
                }
              >
                <ToggleGroupItem value="ratio">{t('sortRatio')}</ToggleGroupItem>
                <ToggleGroupItem value="lightness">{t('sortLightness')}</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>{t('countLabel')}</Label>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {t('countValue', { count })}
                </span>
              </div>
              <Slider
                min={MIN_PALETTE_COLORS}
                max={MAX_PALETTE_COLORS}
                step={1}
                value={[count]}
                aria-label={t('countLabel')}
                onValueChange={(value) => {
                  const next = value[0]
                  if (next !== undefined) setCount(next)
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPalette.map((color) => (
                <PaletteSwatch
                  key={color.hex}
                  color={color}
                  copied={isCopied(color.hex)}
                  copyHint={t('copyHint')}
                  ratioLabel={t('ratioValue', { percent: (color.ratio * 100).toFixed(1) })}
                  onCopy={() => void copy(color.hex)}
                />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => void copy(toCssVariables(sortedPalette))}
              >
                <Copy className="size-4" />
                {t('copyCss')}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload}>
                <Download className="size-4" />
                {t('exportJson')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
