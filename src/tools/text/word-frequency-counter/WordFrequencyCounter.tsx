import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { downloadText } from '@/utils/download'
import {
  SORT_MODES,
  countWords,
  toCsv,
  toJson,
  type WordSortMode,
} from './word-frequency-counter.service'

type OutputFormat = 'csv' | 'json'

const LIMIT_OPTIONS = ['10', '25', '50', '100', 'all'] as const
type LimitOption = (typeof LIMIT_OPTIONS)[number]

export default function WordFrequencyCounter() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'word-frequency-counter' })

  const [input, setInput] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [minLengthInput, setMinLengthInput] = useState('1')
  const [ignoreStopwords, setIgnoreStopwords] = useState(false)
  const [ignoreNumbers, setIgnoreNumbers] = useState(false)
  const [sort, setSort] = useState<WordSortMode>('count')
  const [limit, setLimit] = useState<LimitOption>('50')
  const [format, setFormat] = useState<OutputFormat>('csv')

  const minLength = Math.max(1, Math.floor(Number(minLengthInput) || 1))

  const result = useMemo(
    () =>
      countWords(input, {
        caseSensitive,
        minLength,
        ignoreStopwords,
        ignoreNumbers,
        sort,
        limit: limit === 'all' ? undefined : Number(limit),
      }),
    [input, caseSensitive, minLength, ignoreStopwords, ignoreNumbers, sort, limit],
  )

  const output = useMemo(
    () => (format === 'csv' ? toCsv(result.items) : toJson(result.items)),
    [format, result.items],
  )

  const hasResult = result.items.length > 0

  const handleDownload = () => {
    if (!hasResult) {
      return
    }
    if (format === 'csv') {
      downloadText(output, 'word-frequency.csv', 'text/csv')
    } else {
      downloadText(output, 'word-frequency.json', 'application/json')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="word-frequency-input">{t('inputLabel')}</Label>
            <Textarea
              id="word-frequency-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('inputPlaceholder')}
              className="min-h-36 font-mono text-sm"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label>{t('optionsLabel')}</Label>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="word-frequency-case"
                  size="sm"
                  checked={caseSensitive}
                  onCheckedChange={setCaseSensitive}
                />
                <Label htmlFor="word-frequency-case" className="font-normal">
                  {t('caseSensitive')}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="word-frequency-stopwords"
                  size="sm"
                  checked={ignoreStopwords}
                  onCheckedChange={setIgnoreStopwords}
                />
                <Label htmlFor="word-frequency-stopwords" className="font-normal">
                  {t('ignoreStopwords')}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="word-frequency-numbers"
                  size="sm"
                  checked={ignoreNumbers}
                  onCheckedChange={setIgnoreNumbers}
                />
                <Label htmlFor="word-frequency-numbers" className="font-normal">
                  {t('ignoreNumbers')}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="word-frequency-min-length" className="font-normal">
                  {t('minLengthLabel')}
                </Label>
                <Input
                  id="word-frequency-min-length"
                  type="number"
                  min={1}
                  value={minLengthInput}
                  onChange={(event) => setMinLengthInput(event.target.value)}
                  className="w-20 font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label>{t('sortLabel')}</Label>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={sort}
                  onValueChange={(value) => {
                    const next = SORT_MODES.find((item) => item === value)
                    if (next) {
                      setSort(next)
                    }
                  }}
                >
                  {SORT_MODES.map((mode) => (
                    <ToggleGroupItem key={mode} value={mode}>
                      {t(`sortOptions.${mode}`)}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="word-frequency-limit">{t('limitLabel')}</Label>
                <Select
                  value={limit}
                  onValueChange={(value) => {
                    const next = LIMIT_OPTIONS.find((item) => item === value)
                    if (next) {
                      setLimit(next)
                    }
                  }}
                >
                  <SelectTrigger id="word-frequency-limit" size="sm" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIMIT_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === 'all' ? t('limitAll') : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-muted-foreground text-xs">{t('totalWords')}</span>
              <span className="font-mono text-lg tabular-nums">{result.totalWords}</span>
            </div>
            <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-muted-foreground text-xs">{t('uniqueWords')}</span>
              <span className="font-mono text-lg tabular-nums">{result.uniqueWords}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Label>{t('resultsLabel')}</Label>
        {!hasResult ? (
          <div className="bg-muted/40 text-muted-foreground flex min-h-32 items-center justify-center rounded-lg border p-4 text-sm">
            {t('empty')}
          </div>
        ) : (
          <div className="max-h-[28rem] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="bg-card sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-16">{t('columns.rank')}</TableHead>
                  <TableHead>{t('columns.word')}</TableHead>
                  <TableHead className="w-24 text-right">{t('columns.count')}</TableHead>
                  <TableHead className="w-40">{t('columns.percent')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((item, index) => (
                  <TableRow key={item.word}>
                    <TableCell className="text-muted-foreground font-mono tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-mono break-all">{item.word}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{item.count}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="bg-muted h-1.5 w-20 overflow-hidden rounded-full">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${Math.min(100, item.percent)}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {item.percent}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>{t('outputLabel')}</Label>
          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              value={format}
              onValueChange={(value) => {
                if (value === 'csv' || value === 'json') {
                  setFormat(value)
                }
              }}
            >
              <ToggleGroupItem value="csv">{t('formatCsv')}</ToggleGroupItem>
              <ToggleGroupItem value="json">{t('formatJson')}</ToggleGroupItem>
            </ToggleGroup>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              disabled={!hasResult}
              onClick={handleDownload}
            >
              <Download className="size-4" />
              {t('download')}
            </Button>
          </div>
        </div>
        <TextareaCopyable value={output} rows={8} className="font-mono" />
      </div>
    </div>
  )
}
