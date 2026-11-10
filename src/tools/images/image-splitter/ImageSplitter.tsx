import { Download, Grid2x2, Loader2, Package } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import { MAX_GRID, SPLIT_PRESETS, computeTiles, type Tile } from './image-splitter.service'
import {
  OUTPUT_FORMATS,
  buildTilesZip,
  renderTiles,
  type OutputFormat,
  type TileFile,
} from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'

type ErrorKey = 'errorRender' | 'errorZip' | 'errorGrid'

type SelectedFile = {
  file: File
  previewUrl: string
  width: number
  height: number
}

type GeneratedTile = TileFile & {
  url: string
}

const FORMAT_LABELS: Record<OutputFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
}

export default function ImageSplitter() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-splitter' })
  const [source, setSource] = useState<SelectedFile | null>(null)
  const [rows, setRows] = useState(2)
  const [cols, setCols] = useState(2)
  const [format, setFormat] = useState<OutputFormat>('png')
  const [quality, setQuality] = useState(0.92)
  const [generated, setGenerated] = useState<GeneratedTile[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  const sourceUrlRef = useRef('')
  const tileUrlsRef = useRef<string[]>([])

  const releaseTileUrls = () => {
    for (const url of tileUrlsRef.current) URL.revokeObjectURL(url)
    tileUrlsRef.current = []
  }

  useEffect(() => {
    return () => {
      if (sourceUrlRef.current !== '') URL.revokeObjectURL(sourceUrlRef.current)
      for (const url of tileUrlsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  const tiles = useMemo<Tile[]>(() => {
    if (source === null || source.width <= 0) return []
    try {
      return computeTiles({ width: source.width, height: source.height }, rows, cols)
    } catch {
      return []
    }
  }, [source, rows, cols])

  const gridError = source !== null && source.width > 0 && tiles.length === 0

  const verticalLines = useMemo(() => {
    if (source === null || source.width <= 0) return []
    return tiles
      .filter((tile) => tile.row === 0)
      .slice(0, -1)
      .map((tile) => ((tile.x + tile.width) / source.width) * 100)
  }, [tiles, source])

  const horizontalLines = useMemo(() => {
    if (source === null || source.height <= 0) return []
    return tiles
      .filter((tile) => tile.col === 0)
      .slice(0, -1)
      .map((tile) => ((tile.y + tile.height) / source.height) * 100)
  }, [tiles, source])

  const resetGenerated = () => {
    releaseTileUrls()
    setGenerated([])
  }

  const handleSourceFiles = (files: File[]) => {
    const next = files[0]
    if (!next) return
    if (sourceUrlRef.current !== '') URL.revokeObjectURL(sourceUrlRef.current)
    sourceUrlRef.current = URL.createObjectURL(next)
    setSource({ file: next, previewUrl: sourceUrlRef.current, width: 0, height: 0 })
    setErrorKey(null)
    resetGenerated()
  }

  const handleGridChange = (nextRows: number, nextCols: number) => {
    setRows(Math.min(MAX_GRID, Math.max(1, nextRows)))
    setCols(Math.min(MAX_GRID, Math.max(1, nextCols)))
    setErrorKey(null)
    resetGenerated()
  }

  const handleGenerate = async () => {
    if (source === null) return
    if (tiles.length === 0) {
      setErrorKey('errorGrid')
      return
    }
    setIsRendering(true)
    setErrorKey(null)
    try {
      const files = await renderTiles(source.file, tiles, format, quality)
      releaseTileUrls()
      const next = files.map((file) => {
        const url = URL.createObjectURL(file.blob)
        tileUrlsRef.current.push(url)
        return { ...file, url }
      })
      setGenerated(next)
    } catch {
      setErrorKey('errorRender')
    } finally {
      setIsRendering(false)
    }
  }

  const handleDownloadZip = async () => {
    if (generated.length === 0 || source === null) return
    try {
      const blob = await buildTilesZip(generated)
      const base = source.file.name.replace(/\.[^.]+$/, '')
      downloadBlob(blob, `${base}-tiles.zip`)
    } catch {
      setErrorKey('errorZip')
    }
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
                icon={Grid2x2}
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
                        current === null
                          ? current
                          : { ...current, width: naturalWidth, height: naturalHeight },
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
            <CardTitle>{t('gridTitle')}</CardTitle>
            <CardDescription>{t('gridHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {SPLIT_PRESETS.map((preset) => (
                <Button
                  key={`${preset.rows}x${preset.cols}`}
                  type="button"
                  size="sm"
                  variant={rows === preset.rows && cols === preset.cols ? 'default' : 'outline'}
                  onClick={() => handleGridChange(preset.rows, preset.cols)}
                >
                  {preset.cols} × {preset.rows}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="split-rows">{t('rowsLabel')}</Label>
                <Input
                  id="split-rows"
                  type="number"
                  min={1}
                  max={MAX_GRID}
                  value={rows}
                  onChange={(event) =>
                    handleGridChange(Number(event.target.value) || 1, cols)
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="split-cols">{t('colsLabel')}</Label>
                <Input
                  id="split-cols"
                  type="number"
                  min={1}
                  max={MAX_GRID}
                  value={cols}
                  onChange={(event) =>
                    handleGridChange(rows, Number(event.target.value) || 1)
                  }
                />
              </div>
            </div>

            {source !== null && source.width > 0 && (
              <p className={gridError ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
                {gridError
                  ? t('errorGrid')
                  : t('gridSummary', { total: tiles.length, rows, cols })}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="split-format">{t('formatLabel')}</Label>
                <Select
                  value={format}
                  onValueChange={(value) => {
                    if (value === 'png' || value === 'jpeg' || value === 'webp') {
                      setFormat(value)
                      resetGenerated()
                    }
                  }}
                >
                  <SelectTrigger id="split-format" className="w-full">
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
                        resetGenerated()
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <Button
              className="w-fit gap-1.5"
              disabled={source === null || isRendering || tiles.length === 0}
              onClick={() => void handleGenerate()}
            >
              {isRendering ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Grid2x2 data-icon="inline-start" />
              )}
              {isRendering ? t('splitting') : t('split')}
            </Button>
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

          {source === null ? (
            <div className="flex min-h-56 items-center justify-center rounded-xl border border-dashed p-4">
              <p className="text-muted-foreground text-sm">{t('previewEmpty')}</p>
            </div>
          ) : (
            <div className="bg-muted/30 flex min-h-56 items-center justify-center overflow-hidden rounded-xl border p-3">
              <div className="relative inline-block max-w-full">
                <img
                  src={source.previewUrl}
                  alt={t('previewAlt')}
                  className="block max-h-[420px] max-w-full object-contain"
                />
                {verticalLines.map((percent) => (
                  <span
                    key={`v-${percent}`}
                    className="absolute inset-y-0 w-px bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.6)]"
                    style={{ left: `${percent}%` }}
                  />
                ))}
                {horizontalLines.map((percent) => (
                  <span
                    key={`h-${percent}`}
                    className="absolute inset-x-0 h-px bg-white/80 shadow-[0_0_2px_rgba(0,0,0,0.6)]"
                    style={{ top: `${percent}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {generated.length > 0 && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void handleDownloadZip()}
                >
                  <Package className="size-4" />
                  {t('downloadZip')}
                </Button>
                <span className="text-muted-foreground text-xs">
                  {t('tileCount', { total: generated.length })}
                </span>
              </div>
              <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
                {generated.map((tile) => (
                  <div key={tile.name} className="bg-card flex flex-col gap-1.5 rounded-lg border p-2">
                    <div className="bg-muted/40 flex h-24 items-center justify-center overflow-hidden rounded">
                      <img src={tile.url} alt={tile.name} className="max-h-full max-w-full object-contain" />
                    </div>
                    <span className="truncate text-xs" title={tile.name}>
                      {tile.name}
                    </span>
                    <Button
                      variant="outline"
                      size="xs"
                      className="gap-1"
                      onClick={() => downloadBlob(tile.blob, tile.name)}
                    >
                      <Download className="size-3.5" />
                      {t('downloadOne')}
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
