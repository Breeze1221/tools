import { ArrowRight, Captions, Check, Copy, Download, Upload } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCopy } from '@/composable/use-copy'
import { downloadText } from '@/utils/download'

import {
  SUBTITLE_EXTENSIONS,
  SUBTITLE_FORMATS,
  SUBTITLE_MIME,
  convertSubtitles,
  detectFormat,
  type SubtitleFormat,
  type SubtitleSourceFormat,
} from './subtitle-converter.service'

function isSubtitleFormat(value: string): value is SubtitleFormat {
  return (SUBTITLE_FORMATS as readonly string[]).includes(value)
}

function isSourceFormat(value: string): value is SubtitleSourceFormat {
  return value === 'auto' || isSubtitleFormat(value)
}

/** 字幕互转：SRT / VTT / ASS 解析后统一成字条，再序列化成目标格式 */
export default function SubtitleConverter() {
  const { t } = useTranslation('tools-video', { keyPrefix: 'subtitle-converter' })
  const { copy, isCopied } = useCopy()
  const fileRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')
  const [from, setFrom] = useState<SubtitleSourceFormat>('auto')
  const [to, setTo] = useState<SubtitleFormat>('srt')
  const [fileName, setFileName] = useState('')
  const [readError, setReadError] = useState(false)

  const detected = useMemo<SubtitleFormat | null>(() => {
    if (!input.trim()) return null
    try {
      return detectFormat(input)
    } catch {
      return null
    }
  }, [input])

  const result = useMemo(() => {
    if (!input.trim()) return { text: '', failed: false }
    try {
      return { text: convertSubtitles(input, from, to), failed: false }
    } catch {
      return { text: '', failed: true }
    }
  }, [input, from, to])

  const formatOptions = SUBTITLE_FORMATS.map((format) => ({
    value: format,
    label: t(`format.${format}`),
    meta: SUBTITLE_EXTENSIONS[format],
  }))

  const baseName = fileName.replace(/\.[^.]+$/, '') || 'subtitles'

  const handleFile = async (file: File) => {
    try {
      const content = await file.text()
      setInput(content)
      setFileName(file.name)
      setFrom('auto')
      setReadError(false)
    } catch {
      setReadError(true)
    }
  }

  const handleDownload = () => {
    if (!result.text) return
    downloadText(result.text, `${baseName}${SUBTITLE_EXTENSIONS[to]}`, SUBTITLE_MIME[to])
  }

  return (
    <div className="flex flex-col gap-4">
      {(readError || result.failed) && (
        <Alert variant="destructive">
          <AlertDescription>{readError ? t('error-read') : t('error-convert')}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label>{t('source-label')}</Label>
            <MorphSelect
              label={t('source-label')}
              hideLabel
              items={[
                { value: 'auto', label: t('format.auto'), meta: t('auto-meta') },
                ...formatOptions,
              ]}
              value={from}
              onValueChange={(value) => {
                if (isSourceFormat(value)) setFrom(value)
              }}
              className="w-full"
            />
          </div>

          <ArrowRight className="text-muted-foreground hidden size-4 shrink-0 md:block" />

          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Label>{t('target-label')}</Label>
            <MorphSelect
              label={t('target-label')}
              hideLabel
              items={formatOptions}
              value={to}
              onValueChange={(value) => {
                if (isSubtitleFormat(value)) setTo(value)
              }}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Captions className="size-4" />
              {t('input-title')}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              {t('upload')}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value)
                setFileName('')
                setReadError(false)
              }}
              placeholder={t('input-placeholder')}
              className="min-h-72 resize-y font-mono text-xs"
              aria-label={t('input-title')}
            />
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span>{t('line-count', { count: input ? input.split('\n').length : 0 })}</span>
              {from === 'auto' && detected && (
                <Badge variant="outline">
                  {t('detected', { format: t(`format.${detected}`) })}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>{t('output-title')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!result.text}
                onClick={() => void copy(result.text)}
              >
                {isCopied(result.text) ? <Check className="size-4" /> : <Copy className="size-4" />}
                {t('copy')}
              </Button>
              <Button variant="outline" size="sm" disabled={!result.text} onClick={handleDownload}>
                <Download className="size-4" />
                {t('download', { ext: SUBTITLE_EXTENSIONS[to] })}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Textarea
              readOnly
              value={result.text}
              placeholder={t('output-placeholder')}
              className="min-h-72 resize-y font-mono text-xs"
              aria-label={t('output-title')}
            />
            <p className="text-muted-foreground text-xs">{t('privacy-note')}</p>
          </CardContent>
        </Card>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".srt,.vtt,.ass,.ssa"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
