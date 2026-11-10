import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useCopy } from '@/composable/use-copy'
import { inspectText, toJson, toTsv, type InspectSummary } from './unicode-inspector.service'

/** 表格一次最多渲染的行数，避免粘贴长文时卡死页面 */
const MAX_ROWS = 500

const SUMMARY_KEYS: Record<keyof InspectSummary, string> = {
  chars: 'chars',
  codePoints: 'codePoints',
  utf8Bytes: 'utf8Bytes',
  utf16Units: 'utf16Units',
}

export default function UnicodeInspector() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'unicode-inspector' })
  const { copy, isCopied } = useCopy()

  const [input, setInput] = useState('')
  const result = useMemo(() => inspectText(input), [input])
  const tsv = useMemo(() => toTsv(result.rows), [result.rows])
  const json = useMemo(() => toJson(result.rows), [result.rows])

  const visibleRows = result.rows.slice(0, MAX_ROWS)

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="unicode-input">{t('inputLabel')}</Label>
            <Textarea
              id="unicode-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('inputPlaceholder')}
              className="min-h-32 font-mono text-sm"
              spellCheck={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(Object.keys(SUMMARY_KEYS) as (keyof InspectSummary)[]).map((key) => (
              <div key={key} className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                <span className="text-muted-foreground text-xs">{t(SUMMARY_KEYS[key])}</span>
                <span className="font-mono text-lg tabular-nums">{result.summary[key]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>{t('output')}</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={result.rows.length === 0}
              onClick={() => void copy(tsv)}
            >
              {isCopied(tsv) ? <Check className="size-4" /> : <Copy className="size-4" />}
              {t('copyTsv')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={result.rows.length === 0}
              onClick={() => void copy(json)}
            >
              {isCopied(json) ? <Check className="size-4" /> : <Copy className="size-4" />}
              {t('copyJson')}
            </Button>
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <div className="bg-muted/40 text-muted-foreground min-h-32 rounded-lg border p-4 text-sm">
            {t('empty')}
          </div>
        ) : (
          <div className="max-h-[28rem] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-card sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-16">{t('columns.char')}</TableHead>
                  <TableHead>{t('columns.codePoint')}</TableHead>
                  <TableHead>{t('columns.decimal')}</TableHead>
                  <TableHead>{t('columns.utf8')}</TableHead>
                  <TableHead>{t('columns.utf16')}</TableHead>
                  <TableHead>{t('columns.category')}</TableHead>
                  <TableHead>{t('columns.surrogatePair')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row, index) => (
                  <TableRow key={`${index}-${row.codePoint}`}>
                    <TableCell className="font-mono">
                      {row.char === ' ' ? '\u2423' : row.char}
                    </TableCell>
                    <TableCell className="font-mono">{row.codePoint}</TableCell>
                    <TableCell className="font-mono tabular-nums">{row.decimal}</TableCell>
                    <TableCell className="font-mono">{row.utf8}</TableCell>
                    <TableCell className="font-mono">{row.utf16}</TableCell>
                    <TableCell>{t(`categoryName.${row.category}`)}</TableCell>
                    <TableCell>{t(row.isSurrogatePair ? 'yes' : 'no')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {result.rows.length > MAX_ROWS && (
          <p className="text-muted-foreground text-xs">
            {t('truncated', { shown: MAX_ROWS, total: result.rows.length })}
          </p>
        )}
      </div>
    </div>
  )
}
