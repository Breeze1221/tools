import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { downloadBlob } from '@/utils/download'
import {
  base64ToBytes,
  buildDataUri,
  bytesToBase64,
  detectImageMime,
  formatBytes,
  parseDataUri,
} from './base64-image-converter.service'
import { readFileBytes } from './render'

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml'
const LARGE_FILE_BYTES = 15 * 1024 * 1024

const EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

function extensionFor(mime: string): string {
  return EXTENSIONS[mime] ?? 'bin'
}

type SourceFile = {
  fileName: string
  size: number
  mime: string
  bytes: Uint8Array<ArrayBuffer>
}

export default function Base64ImageConverter() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'base64-image-converter' })

  return (
    <Tabs defaultValue="encode" className="gap-4">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="encode">{t('tab-encode')}</TabsTrigger>
        <TabsTrigger value="decode">{t('tab-decode')}</TabsTrigger>
      </TabsList>

      {/* forceMount：来回切换时保留各自的输入 */}
      <TabsContent value="encode" forceMount className="data-[state=inactive]:hidden">
        <EncodePanel />
      </TabsContent>
      <TabsContent value="decode" forceMount className="data-[state=inactive]:hidden">
        <DecodePanel />
      </TabsContent>
    </Tabs>
  )
}

function EncodePanel() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'base64-image-converter' })
  const [source, setSource] = useState<SourceFile | null>(null)
  const [includePrefix, setIncludePrefix] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleFiles = (files: File[]) => {
    const next = files[0]
    if (!next) {
      return
    }
    setHasError(false)
    void readFileBytes(next)
      .then((bytes) => {
        const mime =
          detectImageMime(bytes) ??
          (next.type.startsWith('image/') ? next.type : 'application/octet-stream')
        setSource({ fileName: next.name, size: next.size, mime, bytes })
      })
      .catch(() => {
        setSource(null)
        setHasError(true)
      })
  }

  const base64 = useMemo(() => (source === null ? '' : bytesToBase64(source.bytes)), [source])
  const dataUri = source === null ? '' : `data:${source.mime};base64,${base64}`
  const output = includePrefix ? dataUri : base64
  const ratio = source !== null && source.size > 0 ? base64.length / source.size : 0

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('encodeTitle')}</CardTitle>
          <CardDescription>{t('encodeHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {source === null ? (
            <FileDropZone
              accept={ACCEPT}
              label={t('dropTitle')}
              description={t('dropSubtitle')}
              minHeightClass="min-h-64"
              onFiles={handleFiles}
            />
          ) : (
            <>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="bg-muted/40 flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border p-2">
                  <img
                    src={dataUri}
                    alt={t('previewAlt')}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" title={source.fileName}>
                      {source.fileName}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {source.mime} · {formatBytes(source.size)}
                    </p>
                  </div>
                  <FileAddButtons
                    accept={ACCEPT}
                    browseLabel={t('replaceFile')}
                    onFiles={handleFiles}
                  />
                </div>
              </div>

              {source.size > LARGE_FILE_BYTES && (
                <Alert>
                  <AlertDescription>{t('largeFile')}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {hasError && (
            <Alert variant="destructive">
              <AlertDescription>{t('errorRead')}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="base64-include-prefix">{t('includePrefix')}</Label>
            <Switch
              id="base64-include-prefix"
              checked={includePrefix}
              onCheckedChange={setIncludePrefix}
            />
          </div>
        </CardContent>
      </Card>

      {source !== null && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t('infoTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <InfoItem label={t('infoOriginalSize')} value={formatBytes(source.size)} />
                <InfoItem label={t('infoBase64Length')} value={String(base64.length)} />
                <InfoItem label={t('infoRatio')} value={t('ratioValue', { ratio: ratio.toFixed(2) })} />
                <InfoItem label={t('infoMime')} value={source.mime} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('outputTitle')}</CardTitle>
              <CardDescription>{t('outputHint')}</CardDescription>
            </CardHeader>
            <CardContent>
              <TextareaCopyable value={output} rows={10} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function DecodePanel() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'base64-image-converter' })
  const [raw, setRaw] = useState('')

  const decoded = useMemo(() => {
    const text = raw.trim()
    if (text === '') {
      return { status: 'empty' as const }
    }
    try {
      if (text.startsWith('data:')) {
        const parsed = parseDataUri(text)
        if (parsed.bytes.length === 0) {
          return { status: 'error' as const }
        }
        return {
          status: 'ok' as const,
          bytes: parsed.bytes,
          mime: detectImageMime(parsed.bytes) ?? parsed.mime,
          length: parsed.base64.length,
        }
      }
      const bytes = base64ToBytes(text)
      return {
        status: 'ok' as const,
        bytes,
        mime: detectImageMime(bytes) ?? 'application/octet-stream',
        length: text.replace(/\s+/g, '').length,
      }
    } catch {
      return { status: 'error' as const }
    }
  }, [raw])

  const previewUrl =
    decoded.status === 'ok' ? buildDataUri(decoded.bytes, decoded.mime) : ''

  const handleDownload = () => {
    if (decoded.status !== 'ok') {
      return
    }
    downloadBlob(
      new Blob([decoded.bytes], { type: decoded.mime }),
      `${t('downloadFileName')}.${extensionFor(decoded.mime)}`,
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('decodeTitle')}</CardTitle>
          <CardDescription>{t('decodeHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={raw}
            rows={10}
            spellCheck={false}
            className="font-mono text-xs"
            placeholder={t('decodePlaceholder')}
            aria-label={t('decodeTitle')}
            onChange={(event) => setRaw(event.target.value)}
          />
          {decoded.status === 'error' && (
            <Alert variant="destructive">
              <AlertDescription>{t('decodeError')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('decodedTitle')}</CardTitle>
          <CardDescription>{t('decodedHint')}</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={decoded.status !== 'ok'}
              onClick={handleDownload}
            >
              <Download className="size-4" />
              {t('downloadImage')}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {decoded.status === 'empty' && (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-4">
              <p className="text-muted-foreground text-sm">{t('emptyDecode')}</p>
            </div>
          )}
          {decoded.status === 'ok' && (
            <div className="flex flex-col gap-3">
              <div className="bg-muted/40 flex min-h-40 items-center justify-center overflow-auto rounded-xl border p-3">
                <img
                  src={previewUrl}
                  alt={t('decodedAlt')}
                  className="max-h-80 max-w-full object-contain"
                />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <InfoItem label={t('decodeInfoSize')} value={formatBytes(decoded.bytes.length)} />
                <InfoItem label={t('decodeInfoType')} value={decoded.mime} />
                <InfoItem label={t('infoBase64Length')} value={String(decoded.length)} />
              </dl>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate font-mono text-xs" title={value}>
        {value}
      </dd>
    </div>
  )
}
