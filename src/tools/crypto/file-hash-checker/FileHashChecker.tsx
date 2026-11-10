import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, FileUp, Hash, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { algorithms, hashFile, matchExpectedHash, type Algorithm } from './service'

type FileStatus = 'pending' | 'computing' | 'done' | 'error'

type FileRow = {
  id: string
  name: string
  size: number
  file: File
  status: FileStatus
  progress: number
  hashes?: Partial<Record<Algorithm, string>>
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/** 单个结果单元格，可点击复制 */
function HashCell({ value, onCopyLabel }: { value?: string; onCopyLabel?: string }) {
  const [copied, setCopied] = useState(false)

  if (!value) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="group flex items-center gap-1 font-mono text-xs hover:underline"
      title={onCopyLabel}
    >
      <span className="truncate max-w-[220px]" dir="ltr">{value}</span>
      {copied ? (
        <Check className="text-primary size-3.5 shrink-0" />
      ) : (
        <Copy className="text-muted-foreground size-3.5 opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
      )}
    </button>
  )
}

export default function FileHashChecker() {
  const { t } = useTranslation('tools-crypto')
  const [rows, setRows] = useState<FileRow[]>([])
  const [selected, setSelected] = useState<Set<Algorithm>>(
    () => new Set(['MD5', 'SHA256', 'SHA512']),
  )
  const [expected, setExpected] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const algorithmsToRun: Algorithm[] = useMemo(
    () => algorithms.filter((a) => selected.has(a)),
    [selected],
  )

  const toggleAlgorithm = useCallback((algo: Algorithm) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(algo)) {
        if (next.size <= 1) return prev // 至少保留一个
        next.delete(algo)
      } else {
        next.add(algo)
      }
      return next
    })
  }, [])

  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      const newRows: FileRow[] = files.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        file,
        status: 'pending',
        progress: 0,
      }))
      setRows((prev) => [...prev, ...newRows])

      // 并发处理每个文件
      for (const row of newRows) {
        void (async () => {
          if (algorithmsToRun.length === 0) return
          setRows((prev) =>
            prev.map((r) => (r.id === row.id ? { ...r, status: 'computing', progress: 0 } : r)),
          )
          try {
            const hashes = await hashFile(row.file, algorithmsToRun, (processed, total) => {
              const pct = total === 0 ? 0 : Math.round((processed / total) * 100)
              setRows((prev) =>
                prev.map((r) => (r.id === row.id ? { ...r, progress: pct } : r)),
              )
            })
            setRows((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, status: 'done', hashes } : r)),
            )
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            setRows((prev) =>
              prev.map((r) =>
                r.id === row.id ? { ...r, status: 'error', error: message } : r,
              ),
            )
          }
        })()
      }
    },
    [algorithmsToRun],
  )

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const clearAll = useCallback(() => setRows([]), [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragging(false)
      const files = Array.from(event.dataTransfer.files ?? [])
      if (files.length > 0) void addFiles(files)
    },
    [addFiles],
  )

  const matches = useMemo(() => {
    if (!expected.trim() || rows.length === 0) return null
    // 所有完成的行合并 hashes 后比对
    const merged: Partial<Record<Algorithm, string>> = {}
    for (const row of rows) {
      if (row.status === 'done' && row.hashes) {
        for (const [algo, value] of Object.entries(row.hashes)) {
          if (value) merged[algo as Algorithm] = value
        }
      }
    }
    if (Object.keys(merged).length === 0) return null
    return matchExpectedHash(expected, merged)
  }, [expected, rows])

  return (
    <div className="flex flex-col gap-4">
      {/* 算法选择 */}
      <div className="flex flex-col gap-2">
        <Label>{t('file-hash-checker.algorithms')}</Label>
        <div className="flex flex-wrap gap-3">
          {algorithms.map((algo) => (
            <label key={algo} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox
                checked={selected.has(algo)}
                onCheckedChange={() => toggleAlgorithm(algo)}
              />
              <span className="font-mono">{algo}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 拖拽区 */}
      <div
        onDragEnter={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          if (!dragging) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <FileUp className="text-muted-foreground size-8" />
        <p className="text-sm font-medium">{t('file-hash-checker.dropLabel')}</p>
        <p className="text-muted-foreground text-xs">{t('file-hash-checker.dropHint')}</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            if (files.length > 0) void addFiles(files)
            e.target.value = ''
          }}
        />
      </div>

      {/* 文件列表 */}
      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>{t('file-hash-checker.results')} ({rows.length})</Label>
            <Button variant="ghost" size="sm" onClick={clearAll} className="h-7 text-xs">
              {t('file-hash-checker.clear')}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium min-w-[200px]">
                    {t('file-hash-checker.fileName')}
                  </th>
                  <th className="px-3 py-2 text-left font-medium w-24">
                    {t('file-hash-checker.fileSizeCol')}
                  </th>
                  {algorithmsToRun.map((algo) => (
                    <th key={algo} className="px-3 py-2 text-left font-medium font-mono text-xs">
                      {algo}
                    </th>
                  ))}
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium" title={row.name}>
                          {row.name}
                        </div>
                        {row.status === 'computing' && (
                          <div className="mt-1">
                            <div className="bg-muted h-1 w-full overflow-hidden rounded">
                              <div
                                className="bg-primary h-full transition-all"
                                style={{ width: `${row.progress}%` }}
                              />
                            </div>
                            <span className="text-muted-foreground text-[10px]">
                              {t('file-hash-checker.computing')} {row.progress}%
                            </span>
                          </div>
                        )}
                        {row.status === 'error' && (
                          <span className="text-destructive text-xs">
                            {row.error ?? t('file-hash-checker.hashFailed')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs">
                      {formatBytes(row.size)}
                    </td>
                    {algorithmsToRun.map((algo) => (
                      <td key={algo} className="px-3 py-2">
                        {row.status === 'done' && row.hashes ? (
                          <HashCell
                            value={row.hashes[algo]}
                            onCopyLabel={t('file-hash-checker.clickToCopy')}
                          />
                        ) : row.status === 'error' ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          <span className="text-muted-foreground text-xs animate-pulse">
                            {t('file-hash-checker.computing')}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeRow(row.id)}
                        aria-label={t('file-hash-checker.clear')}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 比对区 */}
      {rows.some((r) => r.status === 'done') && (
        <div className="flex flex-col gap-2">
          <Label>{t('file-hash-checker.expected')}</Label>
          <Textarea
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            placeholder={t('file-hash-checker.expectedPlaceholder')}
            rows={2}
            className="font-mono text-xs"
          />
          {expected.trim() && matches && (
            <p className="text-sm flex items-center gap-1.5">
              <Hash className="size-4 text-primary" />
              {matches.length > 0 ? (
                <span className="text-primary">
                  {t('file-hash-checker.match', { algorithm: matches.join(', ') })}
                </span>
              ) : (
                <span className="text-destructive">
                  {t('file-hash-checker.mismatch')}
                </span>
              )}
            </p>
          )}
        </div>
      )}

      <p className="text-muted-foreground text-xs">{t('file-hash-checker.disclaimer')}</p>
    </div>
  )
}
