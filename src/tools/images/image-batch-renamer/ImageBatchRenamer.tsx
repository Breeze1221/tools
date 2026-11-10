import JSZip from 'jszip'
import { Check, Copy, Download, Files, FolderArchive, Loader2, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FileAddButtons, FileDropZone } from '@/components/file-drop-zone'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCopy } from '@/composable/use-copy'
import { cn } from '@/lib/utils'
import { downloadBlob } from '@/utils/download'
import { formatBytes } from '@/utils/format-bytes'
import {
  applyRenameRules,
  buildRenamePlan,
  DEFAULT_RENAME_RULES,
  MAX_INDEX_PADDING,
  MIN_INDEX_PADDING,
  type RenameRules,
} from './image-batch-renamer.service'

const ACCEPT = 'image/png,image/jpeg,image/webp'
const ZIP_FILE_NAME = 'renamed-images.zip'
const PADDING_OPTIONS = Array.from(
  { length: MAX_INDEX_PADDING - MIN_INDEX_PADDING + 1 },
  (_, index) => MIN_INDEX_PADDING + index,
)

type SelectedImage = {
  id: string
  file: File
}

type SeparatorValue = 'hyphen' | 'underscore' | 'none'

const SEPARATOR_VALUES: Record<SeparatorValue, RenameRules['separator']> = {
  hyphen: '-',
  underscore: '_',
  none: '',
}

const separatorToValue = (separator: RenameRules['separator']): SeparatorValue => {
  if (separator === '-') return 'hyphen'
  if (separator === '_') return 'underscore'
  return 'none'
}

export default function ImageBatchRenamer() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'image-batch-renamer' })
  const { copy, isCopied } = useCopy()
  const [files, setFiles] = useState<SelectedImage[]>([])
  const [rules, setRules] = useState<RenameRules>(DEFAULT_RENAME_RULES)
  const [isZipping, setIsZipping] = useState(false)
  const [zipFailed, setZipFailed] = useState(false)
  const idRef = useRef(0)

  const updateRules = (patch: Partial<RenameRules>) => {
    setRules((previous) => ({ ...previous, ...patch }))
  }

  const handleFiles = (incoming: File[]) => {
    const images = incoming.filter((file) => file.type.startsWith('image/'))
    if (images.length === 0) return

    setFiles((previous) => {
      const existing = new Set(
        previous.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`),
      )
      const additions: SelectedImage[] = []
      for (const file of images) {
        const key = `${file.name}:${file.size}:${file.lastModified}`
        if (existing.has(key)) continue
        existing.add(key)
        idRef.current += 1
        additions.push({ id: `image-${idRef.current}`, file })
      }
      return [...previous, ...additions]
    })
    setZipFailed(false)
  }

  const clearFiles = () => {
    setFiles([])
    setZipFailed(false)
  }

  const plan = useMemo(
    () =>
      buildRenamePlan(
        files.map((item) => ({ name: item.file.name })),
        rules,
      ),
    [files, rules],
  )

  const renameList = plan.map((item) => item.newName).join('\n')
  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0)
  const hasFiles = files.length > 0

  const handleDownloadZip = async () => {
    if (!hasFiles) return
    setIsZipping(true)
    setZipFailed(false)
    try {
      const zip = new JSZip()
      files.forEach((item, index) => {
        const target = plan[index]
        if (target) zip.file(target.newName, item.file)
      })
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, ZIP_FILE_NAME)
    } catch {
      setZipFailed(true)
    } finally {
      setIsZipping(false)
    }
  }

  const handleDownloadEach = () => {
    files.forEach((item, index) => {
      const target = plan[index]
      if (target) downloadBlob(item.file, target.newName)
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('uploadTitle')}</CardTitle>
          <CardDescription>{t('uploadHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <FileDropZone
            accept={ACCEPT}
            multiple
            label={t('dropTitle')}
            description={t('dropSubtitle')}
            minHeightClass={hasFiles ? 'min-h-32' : 'min-h-56'}
            onFiles={handleFiles}
          />

          {hasFiles && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                {t('fileSummary', { count: files.length, size: formatBytes(totalSize) })}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <FileAddButtons accept={ACCEPT} browseLabel={t('addFiles')} onFiles={handleFiles} />
                <Button variant="ghost" size="sm" className="gap-1.5" onClick={clearFiles}>
                  <Trash2 className="size-4" />
                  {t('clear')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('rulesTitle')}</CardTitle>
          <CardDescription>{t('rulesHint')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-prefix">{t('prefixLabel')}</Label>
            <Input
              id="rename-prefix"
              value={rules.prefix}
              placeholder={t('prefixPlaceholder')}
              onChange={(event) => updateRules({ prefix: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-suffix">{t('suffixLabel')}</Label>
            <Input
              id="rename-suffix"
              value={rules.suffix}
              placeholder={t('suffixPlaceholder')}
              onChange={(event) => updateRules({ suffix: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-start">{t('startIndexLabel')}</Label>
            <Input
              id="rename-start"
              type="number"
              min={0}
              max={9999}
              value={rules.startIndex}
              onChange={(event) => {
                const next = Number(event.target.value)
                updateRules({ startIndex: Number.isFinite(next) ? next : 0 })
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-padding">{t('paddingLabel')}</Label>
            <Select
              value={String(rules.indexPadding)}
              onValueChange={(value) => updateRules({ indexPadding: Number(value) })}
            >
              <SelectTrigger id="rename-padding" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PADDING_OPTIONS.map((padding) => (
                  <SelectItem key={padding} value={String(padding)}>
                    {t('paddingOption', { count: padding })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('separatorLabel')}</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={separatorToValue(rules.separator)}
              onValueChange={(value) => {
                const separator = SEPARATOR_VALUES[value as SeparatorValue]
                if (separator !== undefined) updateRules({ separator })
              }}
            >
              <ToggleGroupItem value="hyphen">{t('separatorHyphen')}</ToggleGroupItem>
              <ToggleGroupItem value="underscore">{t('separatorUnderscore')}</ToggleGroupItem>
              <ToggleGroupItem value="none">{t('separatorNone')}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-case">{t('caseLabel')}</Label>
            <Select
              value={rules.letterCase}
              onValueChange={(value) => {
                if (value === 'keep' || value === 'lower' || value === 'upper') {
                  updateRules({ letterCase: value })
                }
              }}
            >
              <SelectTrigger id="rename-case" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">{t('caseKeep')}</SelectItem>
                <SelectItem value="lower">{t('caseLower')}</SelectItem>
                <SelectItem value="upper">{t('caseUpper')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-find">{t('findLabel')}</Label>
            <Input
              id="rename-find"
              value={rules.find}
              placeholder={t('findPlaceholder')}
              onChange={(event) => updateRules({ find: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rename-replace">{t('replaceLabel')}</Label>
            <Input
              id="rename-replace"
              value={rules.replace}
              placeholder={t('replacePlaceholder')}
              onChange={(event) => updateRules({ replace: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t('sampleLabel')}</Label>
            <p className="bg-muted/40 truncate rounded-md border px-3 py-2 font-mono text-xs">
              {applyRenameRules('example.png', rules, 0)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('previewTitle')}</CardTitle>
          <CardDescription>
            {hasFiles ? t('previewHint', { count: files.length }) : t('previewEmpty')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {hasFiles && (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>{t('originalColumn')}</TableHead>
                    <TableHead>{t('newColumn')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.map((item, index) => (
                    <TableRow
                      key={`${files[index]?.id ?? item.originalName}-${index}`}
                      className={cn(item.hasConflict && 'bg-warning/10')}
                    >
                      <TableCell className="text-muted-foreground tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell
                        className="text-muted-foreground max-w-56 truncate"
                        title={item.originalName}
                      >
                        {item.originalName}
                      </TableCell>
                      <TableCell className="max-w-72 truncate font-medium" title={item.newName}>
                        <span className="flex items-center gap-2">
                          <span className="truncate">{item.newName}</span>
                          {item.hasConflict && (
                            <Badge
                              variant="outline"
                              className="border-warning/40 text-warning shrink-0"
                            >
                              {t('duplicateBadge')}
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {zipFailed && (
            <Alert variant="destructive">
              <AlertDescription>{t('zipFailed')}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="gap-1.5"
              disabled={!hasFiles || isZipping}
              onClick={() => void handleDownloadZip()}
            >
              {isZipping ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FolderArchive className="size-4" />
              )}
              {isZipping ? t('zipping') : t('downloadZip')}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={!hasFiles}
              onClick={handleDownloadEach}
            >
              <Download className="size-4" />
              {t('downloadEach')}
            </Button>
            <Button
              variant="outline"
              className="gap-1.5"
              disabled={!hasFiles}
              onClick={() => void copy(renameList)}
            >
              {isCopied(renameList) ? <Check className="size-4" /> : <Copy className="size-4" />}
              {isCopied(renameList) ? t('copied') : t('copyList')}
            </Button>
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Files className="size-3.5" />
              {t('copyHint')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
