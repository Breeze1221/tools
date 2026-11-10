import { ArrowDown, ArrowUp, Download, FileImage, FileText, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FileDropZone } from '@/components/file-drop-zone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import {
  PAGE_SIZE_KEYS,
  PAGE_SIZES,
  PDF_DEFAULTS,
  PDF_FITS,
  PDF_ORIENTATIONS,
  type PageSizeKey,
  type PdfFit,
  type PdfOrientation,
} from './image-to-pdf.service'
import { renderImagesToPdf } from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const MAX_FILES = 100

type ErrorKey = 'errorRender' | 'errorEmpty'

type PdfItem = {
  id: string
  file: File
  previewUrl: string
}

type PdfResult = {
  blob: Blob
  pageCount: number
  fileName: string
}

export default function ImageToPdf() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-to-pdf' })
  const [items, setItems] = useState<PdfItem[]>([])
  const [pageSize, setPageSize] = useState<PageSizeKey>(PDF_DEFAULTS.pageSize)
  const [orientation, setOrientation] = useState<PdfOrientation>(PDF_DEFAULTS.orientation)
  const [margin, setMargin] = useState(PDF_DEFAULTS.margin)
  const [fit, setFit] = useState<PdfFit>(PDF_DEFAULTS.fit)
  const [result, setResult] = useState<PdfResult | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)

  const idRef = useRef(0)
  const urlsRef = useRef<string[]>([])

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url)
    }
  }, [])

  const clearResult = () => {
    setResult(null)
    setErrorKey(null)
  }

  const handleFiles = (files: File[]) => {
    const added: PdfItem[] = []
    for (const file of files) {
      if (items.length + added.length >= MAX_FILES) break
      const duplicate = [...items, ...added].some(
        (item) =>
          item.file.name === file.name &&
          item.file.size === file.size &&
          item.file.lastModified === file.lastModified,
      )
      if (duplicate) continue
      const previewUrl = URL.createObjectURL(file)
      urlsRef.current.push(previewUrl)
      idRef.current += 1
      added.push({ id: `pdf-${idRef.current}`, file, previewUrl })
    }
    if (added.length > 0) {
      setItems((current) => [...current, ...added])
      clearResult()
    }
  }

  const removeItem = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id)
      if (target) {
        URL.revokeObjectURL(target.previewUrl)
        urlsRef.current = urlsRef.current.filter((url) => url !== target.previewUrl)
      }
      return current.filter((item) => item.id !== id)
    })
    clearResult()
  }

  const moveItem = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    setItems((current) => {
      const next = [...current]
      const currentItem = next[index]
      const swapItem = next[target]
      if (!currentItem || !swapItem) return current
      next[index] = swapItem
      next[target] = currentItem
      return next
    })
    clearResult()
  }

  const updateOption = <Value extends string | number>(
    setter: (value: Value) => void,
    value: Value,
  ) => {
    setter(value)
    clearResult()
  }

  const handleRender = async () => {
    if (items.length === 0) {
      setErrorKey('errorEmpty')
      return
    }
    setIsRendering(true)
    setErrorKey(null)
    try {
      const rendered = await renderImagesToPdf(
        items.map((item) => item.file),
        { pageSize, orientation, margin, fit },
      )
      const fileName = 'images.pdf'
      setResult({ blob: rendered.blob, pageCount: rendered.pageCount, fileName })
    } catch {
      setResult(null)
      setErrorKey('errorRender')
    } finally {
      setIsRendering(false)
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
            <FileDropZone
              accept={ACCEPT}
              multiple
              maxFiles={MAX_FILES}
              icon={FileImage}
              label={t('dropTitle')}
              description={t('dropSubtitle')}
              minHeightClass="min-h-40"
              onFiles={handleFiles}
            />

            {items.length === 0 ? (
              <p className="text-muted-foreground text-xs">{t('listEmpty')}</p>
            ) : (
              <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <li
                    key={item.id}
                    className="bg-card flex items-center gap-3 rounded-lg border p-2"
                  >
                    <span className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="size-full object-cover"
                        decoding="async"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium" title={item.file.name}>
                        {item.file.name}
                      </span>
                      <span className="text-muted-foreground block text-xs">
                        {t('pageLabel', { page: index + 1 })} · {formatBytes(item.file.size)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('moveUp')}
                        disabled={index === 0}
                        onClick={() => moveItem(index, -1)}
                      >
                        <ArrowUp aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('moveDown')}
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(index, 1)}
                      >
                        <ArrowDown aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('remove', { name: item.file.name })}
                        onClick={() => removeItem(item.id)}
                      >
                        <X aria-hidden="true" />
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 self-start">
        <CardHeader>
          <CardTitle>{t('optionsTitle')}</CardTitle>
          <CardDescription>{t('optionsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {errorKey !== null && (
            <Alert variant="destructive">
              <AlertDescription>{t(errorKey)}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label>{t('pageSizeLabel')}</Label>
            <div className="flex flex-wrap gap-2">
              {PAGE_SIZE_KEYS.map((key) => (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={pageSize === key ? 'default' : 'outline'}
                  onClick={() => updateOption(setPageSize, key)}
                >
                  {t(`pageSize.${key}`)} · {PAGE_SIZES[key].width} × {PAGE_SIZES[key].height} mm
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('orientationLabel')}</Label>
            <div className="flex flex-wrap gap-2">
              {PDF_ORIENTATIONS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={orientation === value ? 'default' : 'outline'}
                  onClick={() => updateOption(setOrientation, value)}
                >
                  {t(`orientation.${value}`)}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('fitLabel')}</Label>
            <div className="flex flex-wrap gap-2">
              {PDF_FITS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={fit === value ? 'default' : 'outline'}
                  onClick={() => updateOption(setFit, value)}
                >
                  {t(`fit.${value}`)}
                </Button>
              ))}
            </div>
            <p className="text-muted-foreground text-xs">{t(`fitHint.${fit}`)}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>{t('marginLabel')}</Label>
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {margin} mm
              </span>
            </div>
            <Slider
              value={[margin]}
              min={0}
              max={40}
              step={1}
              onValueChange={([next]) => {
                if (next !== undefined) updateOption(setMargin, next)
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="gap-1.5"
              size="sm"
              disabled={isRendering}
              onClick={() => void handleRender()}
            >
              {isRendering ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <FileText data-icon="inline-start" />
              )}
              {isRendering ? t('rendering') : t('render')}
            </Button>
            {result !== null && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => downloadBlob(result.blob, result.fileName)}
              >
                <Download className="size-4" />
                {t('download')}
              </Button>
            )}
            <span className="text-muted-foreground text-xs">
              {result !== null
                ? `${t('pageCount', { total: result.pageCount })} · ${formatBytes(result.blob.size)}`
                : t('pageCountPreview', { total: items.length })}
            </span>
          </div>

          <p className="text-muted-foreground text-xs">{t('privacyNote')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
