import { Download, ImagePlus, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
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
import { downloadBlob, downloadText } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import {
  buildHtmlSnippet,
  buildIco,
  buildWebManifest,
  faviconPngSizes,
  icoSizes,
} from './favicon-generator.service'
import { renderPng } from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/svg+xml'
const ICO_SIZE_SET: ReadonlySet<number> = new Set(icoSizes)
const DOWNLOAD_INTERVAL_MS = 150

type PngOutput = {
  size: number
  blob: Blob
}

type GeneratedAssets = {
  pngs: PngOutput[]
  ico: Blob
}

type SelectedFile = {
  file: File
  previewUrl: string
}

function pngFileName(size: number): string {
  return `favicon-${size}x${size}.png`
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export default function FaviconGenerator() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'favicon-generator' })
  const [selected, setSelected] = useState<SelectedFile | null>(null)
  const [appName, setAppName] = useState('My App')
  const [shortName, setShortName] = useState('App')
  const [assets, setAssets] = useState<GeneratedAssets | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasError, setHasError] = useState(false)
  const previewRef = useRef('')

  const file = selected?.file ?? null
  const previewUrl = selected?.previewUrl ?? ''

  useEffect(() => {
    return () => {
      if (previewRef.current !== '') {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const manifest = useMemo(
    () =>
      buildWebManifest({
        name: appName.trim() || 'My App',
        shortName: shortName.trim() || 'App',
      }),
    [appName, shortName],
  )
  const snippet = useMemo(() => buildHtmlSnippet(), [])

  const handleFiles = (files: File[]) => {
    const next = files[0]
    if (!next) {
      return
    }
    if (previewRef.current !== '') {
      URL.revokeObjectURL(previewRef.current)
    }
    previewRef.current = URL.createObjectURL(next)
    setSelected({ file: next, previewUrl: previewRef.current })
    setAssets(null)
    setHasError(false)
  }

  const handleGenerate = async () => {
    if (!file) {
      return
    }
    setIsGenerating(true)
    setHasError(false)
    try {
      const pngs = await Promise.all(
        faviconPngSizes.map(async (size) => ({ size, blob: await renderPng(file, size) })),
      )
      const icoImages = await Promise.all(
        pngs
          .filter((png) => ICO_SIZE_SET.has(png.size))
          .map(async (png) => ({
            size: png.size,
            data: new Uint8Array(await png.blob.arrayBuffer()),
          })),
      )
      setAssets({
        pngs,
        ico: new Blob([buildIco(icoImages)], { type: 'image/x-icon' }),
      })
    } catch {
      setAssets(null)
      setHasError(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadAll = async () => {
    if (!assets) {
      return
    }
    for (const png of assets.pngs) {
      downloadBlob(png.blob, pngFileName(png.size))
      await wait(DOWNLOAD_INTERVAL_MS)
    }
    downloadBlob(assets.ico, 'favicon.ico')
    await wait(DOWNLOAD_INTERVAL_MS)
    downloadText(manifest, 'site.webmanifest', 'application/manifest+json')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {file === null ? (
            <FileDropZone
              accept={ACCEPT}
              label={t('dropTitle')}
              description={t('dropSubtitle')}
              minHeightClass="min-h-64"
              onFiles={handleFiles}
            />
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="bg-muted/40 flex size-28 shrink-0 items-center justify-center rounded-xl border p-2">
                {previewUrl !== '' && (
                  <img
                    src={previewUrl}
                    alt={t('previewAlt')}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="favicon-app-name" className="text-xs">
                      {t('appName')}
                    </Label>
                    <Input
                      id="favicon-app-name"
                      value={appName}
                      placeholder={t('appNamePlaceholder')}
                      onChange={(event) => setAppName(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="favicon-short-name" className="text-xs">
                      {t('shortName')}
                    </Label>
                    <Input
                      id="favicon-short-name"
                      value={shortName}
                      placeholder={t('shortNamePlaceholder')}
                      onChange={(event) => setShortName(event.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <FileAddButtons
                    accept={ACCEPT}
                    browseLabel={t('replaceFile')}
                    onFiles={handleFiles}
                  />
                  <Button disabled={isGenerating} onClick={() => void handleGenerate()}>
                    {isGenerating ? (
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                    ) : (
                      <ImagePlus data-icon="inline-start" />
                    )}
                    {isGenerating ? t('generating') : t('generate')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {hasError && (
            <Alert variant="destructive">
              <AlertDescription>{t('errorGenerate')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {assets !== null && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('sizesTitle')}</CardTitle>
              <CardDescription>{t('sizesHint', { count: assets.pngs.length })}</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => void handleDownloadAll()}
                >
                  <Download className="size-4" />
                  {t('downloadAll')}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {assets.pngs.map((png) => (
                  <li key={png.size} className="flex items-center gap-3 rounded-lg border p-2">
                    <span className="bg-muted/50 flex size-10 shrink-0 items-center justify-center rounded-md border font-mono text-xs">
                      {png.size}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-xs">
                        {pngFileName(png.size)}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {png.size} × {png.size} · {formatBytes(png.blob.size)}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      title={t('download')}
                      aria-label={`${t('download')} ${pngFileName(png.size)}`}
                      onClick={() => downloadBlob(png.blob, pngFileName(png.size))}
                    >
                      <Download />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('icoTitle')}</CardTitle>
              <CardDescription>{t('icoHint')}</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => downloadBlob(assets.ico, 'favicon.ico')}
                >
                  <Download className="size-4" />
                  {t('download')}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-mono text-xs">
                favicon.ico · {formatBytes(assets.ico.size)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('manifestTitle')}</CardTitle>
              <CardDescription>{t('manifestHint')}</CardDescription>
              <CardAction>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() =>
                    downloadText(manifest, 'site.webmanifest', 'application/manifest+json')
                  }
                >
                  <Download className="size-4" />
                  {t('download')}
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <TextareaCopyable value={manifest} rows={12} />
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('snippetTitle')}</CardTitle>
          <CardDescription>{t('snippetHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          <TextareaCopyable value={snippet} rows={12} />
        </CardContent>
      </Card>
    </div>
  )
}
