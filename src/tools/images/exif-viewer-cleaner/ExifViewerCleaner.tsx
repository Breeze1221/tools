import { Download, FileImage, ScanEye, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FileAddButtons, FileDropZone } from '@/components/file-drop-zone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import {
  detectFormat,
  hasExif,
  isPng,
  metadataBytesSaved,
  parsePngMetadata,
  readExifTags,
  stripMetadata,
  type ExifTag,
} from './exif-viewer-cleaner.service'

const ACCEPT = 'image/jpeg,image/png,image/webp'
const SUPPORTED_EXTS = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
} as const

type ImageKind = 'jpeg' | 'png' | 'webp'
type LoadError = 'unsupported' | 'read'

type LoadedImage = {
  file: File
  bytes: Uint8Array<ArrayBuffer>
  kind: ImageKind
}

export default function ExifViewerCleaner() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'exif-viewer-cleaner' })
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [loadError, setLoadError] = useState<LoadError | null>(null)

  const loadFile = async (file: File) => {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      const kind = detectFormat(bytes)
      if (kind === 'unknown') {
        setImage(null)
        setLoadError('unsupported')
        return
      }
      setImage({ file, bytes, kind })
      setLoadError(null)
    } catch {
      setImage(null)
      setLoadError('read')
    }
  }

  const handleFiles = (files: File[]) => {
    const next = files[0]
    if (next === undefined) return
    void loadFile(next)
  }

  // 读取元数据
  const tags = useMemo(() => (image !== null ? readExifTags(image.bytes) : []), [image])
  const pngMeta = useMemo(() => {
    if (image === null || !isPng(image.bytes)) return null
    return parsePngMetadata(image.bytes)
  }, [image])
  const hasAnyMeta = useMemo(() => (image !== null ? hasExif(image.bytes) : false), [image])

  // 清除结果
  const [applyClean, setApplyClean] = useState(true)
  const stripped = useMemo(() => {
    if (image === null || !applyClean) return null
    try {
      return stripMetadata(image.bytes)
    } catch {
      return null
    }
  }, [image, applyClean])

  const savedBytes =
    image === null || stripped === null ? 0 : metadataBytesSaved(image.bytes, stripped)
  const hasStripError = image !== null && stripped === null && applyClean

  const handleDownload = () => {
    if (image === null) return
    if (applyClean && stripped === null) return
    const blob = applyClean
      ? new Blob([stripped!], { type: SUPPORTED_EXTS[image.kind] })
      : new Blob([image.bytes], { type: SUPPORTED_EXTS[image.kind] })
    downloadBlob(blob, `clean-${image.file.name}`)
  }

  const displayValue = (tag: ExifTag): string => {
    if (tag.key === 'orientation') {
      return t(`orientation.${tag.value}`, { defaultValue: tag.value })
    }
    return tag.value
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 上传卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {image === null ? (
            <FileDropZone
              accept={ACCEPT}
              label={t('dropTitle')}
              description={t('dropSubtitle')}
              minHeightClass="min-h-64"
              onFiles={handleFiles}
            />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="bg-muted/40 flex size-12 shrink-0 items-center justify-center rounded-lg border">
                <FileImage className="text-muted-foreground size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" title={image.file.name}>
                  {image.file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {image.kind.toUpperCase()} · {formatBytes(image.file.size)}
                </p>
              </div>
              <FileAddButtons accept={ACCEPT} browseLabel={t('replaceFile')} onFiles={handleFiles} />
            </div>
          )}

          {loadError !== null && (
            <Alert variant="destructive">
              <AlertDescription>
                {t(loadError === 'unsupported' ? 'errorUnsupported' : 'errorRead')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {image !== null && (
        <>
          {/* 原始尺寸 vs 清除后尺寸 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanEye className="size-4" />
                {t('tagsTitle')}
              </CardTitle>
              <CardDescription>
                {tags.length === 0 && !pngMeta && !hasAnyMeta
                  ? t('tagsEmpty')
                  : t('tagsHint', { count: tags.length + (pngMeta ? Object.keys(pngMeta.texts).length : 0) })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* JPEG EXIF 表格 */}
              {image.kind === 'jpeg' && tags.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('tagColumn')}</TableHead>
                      <TableHead>{t('valueColumn')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map((tag) => (
                      <TableRow key={tag.key}>
                        <TableCell className="text-muted-foreground">
                          {t(`tags.${tag.key}`)}
                        </TableCell>
                        <TableCell className="font-mono break-all whitespace-normal">
                          {displayValue(tag)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* PNG 元数据 */}
              {image.kind === 'png' && pngMeta && (
                <div className="flex flex-col gap-3">
                  {Object.keys(pngMeta.texts).length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('tagColumn')}</TableHead>
                          <TableHead>{t('valueColumn')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(pngMeta.texts).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="text-muted-foreground">{key}</TableCell>
                            <TableCell className="font-mono break-all whitespace-normal">
                              {value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                  {pngMeta.hasIccp && (
                    <p className="text-muted-foreground text-sm">
                      ICC 色彩配置 (iCCP)
                    </p>
                  )}
                </div>
              )}

              {/* WebP */}
              {image.kind === 'webp' && (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  {hasAnyMeta ? t('webpHasMeta') : t('webpNoMeta')}
                </p>
              )}

              {/* 无元数据 */}
              {tags.length === 0 && !pngMeta && !hasAnyMeta && (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                  {t('emptyTags')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* 清除元数据 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="size-4" />
                {t('resultTitle')}
              </CardTitle>
              <CardDescription>{t('resultHint')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* 开关 */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t('applyCleanLabel')}</span>
                  <span className="text-muted-foreground text-xs">
                    {t('applyCleanHint')}
                  </span>
                </div>
                <Switch checked={applyClean} onCheckedChange={setApplyClean} />
              </div>

              {hasStripError ? (
                <Alert variant="destructive">
                  <AlertDescription>{t('errorStrip')}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border p-3">
                      <dt className="text-muted-foreground text-xs">{t('before')}</dt>
                      <dd className="mt-1 font-mono text-sm">
                        {formatBytes(image.file.size)}
                      </dd>
                    </div>
                    <div className="rounded-lg border p-3">
                      <dt className="text-muted-foreground text-xs">{t('after')}</dt>
                      <dd className="mt-1 font-mono text-sm">
                        {applyClean && stripped !== null
                          ? formatBytes(stripped.length)
                          : formatBytes(image.file.size)}
                      </dd>
                    </div>
                    <div className="rounded-lg border p-3">
                      <dt className="text-muted-foreground text-xs">{t('saved')}</dt>
                      <dd className="mt-1 font-mono text-sm">
                        {applyClean && savedBytes > 0
                          ? formatBytes(savedBytes)
                          : t('nothingSaved')}
                      </dd>
                    </div>
                  </dl>

                  <Button className="gap-1.5" onClick={handleDownload}>
                    <Download className="size-4" />
                    {applyClean ? t('download') : t('downloadOriginal')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
