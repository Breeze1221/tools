import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'

import { IoPair } from '@/components/io-pair'
import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  detectDelimiter,
  markdownTableToCsv,
  parseRows,
  tableAligns,
  toMarkdownTable,
  type TableAlign,
} from './markdown-table-generator.service'

type Direction = 'toMarkdown' | 'toCsv'

interface ConversionResult {
  value: string
  error: string | null
  delimiter: string | null
}

/** 识别出的分隔符 → i18n 键 */
const DELIMITER_LABEL_KEYS: Record<string, string> = {
  '\t': 'delimiterTab',
  ',': 'delimiterComma',
  ';': 'delimiterSemicolon',
  '|': 'delimiterPipe',
  ' ': 'delimiterSpace',
}

const EMPTY_RESULT: ConversionResult = { value: '', error: null, delimiter: null }

function convert(
  input: string,
  direction: Direction,
  align: TableAlign,
  header: boolean,
  escapePipe: boolean,
): ConversionResult {
  if (input.trim() === '') {
    return EMPTY_RESULT
  }
  try {
    if (direction === 'toCsv') {
      return { value: markdownTableToCsv(input), error: null, delimiter: null }
    }
    const delimiter = detectDelimiter(input)
    const rows = parseRows(input, delimiter)
    return {
      value: toMarkdownTable(rows, { align, header, escapePipe }),
      error: null,
      delimiter,
    }
  } catch (error) {
    return {
      value: '',
      error: error instanceof Error ? error.message : String(error),
      delimiter: null,
    }
  }
}

export default function MarkdownTableGenerator() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'markdown-table-generator' })
  const { t: tCommon } = useTranslation('common')

  const [direction, setDirection] = useState<Direction>('toMarkdown')
  const [input, setInput] = useState('')
  const [align, setAlign] = useState<TableAlign>('none')
  const [header, setHeader] = useState(true)
  const [escapePipe, setEscapePipe] = useState(true)

  const result = useMemo(
    () => convert(input, direction, align, header, escapePipe),
    [input, direction, align, header, escapePipe],
  )

  const alignItems = tableAligns.map((item) => ({
    value: item,
    label: t(`alignValue.${item}`),
  }))

  const handleDownload = () => {
    const isMarkdown = direction === 'toMarkdown'
    const url = URL.createObjectURL(
      new Blob([result.value], { type: isMarkdown ? 'text/markdown' : 'text/csv' }),
    )
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = isMarkdown ? 'table.md' : 'table.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <ToggleGroup
          type="single"
          size="sm"
          value={direction}
          onValueChange={(next) => {
            if (next === 'toMarkdown' || next === 'toCsv') {
              setDirection(next)
            }
          }}
        >
          <ToggleGroupItem value="toMarkdown">{t('toMarkdown')}</ToggleGroupItem>
          <ToggleGroupItem value="toCsv">{t('toCsv')}</ToggleGroupItem>
        </ToggleGroup>

        {direction === 'toMarkdown' && (
          <>
            <div className="flex items-center gap-2">
              <Label>{t('align')}</Label>
              <MorphSelect
                label={t('align')}
                hideLabel
                size="sm"
                className="w-32"
                items={alignItems}
                value={align}
                onValueChange={(next) => {
                  if (next === 'none' || next === 'left' || next === 'center' || next === 'right') {
                    setAlign(next)
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch id="table-header" size="sm" checked={header} onCheckedChange={setHeader} />
              <Label htmlFor="table-header" className="font-normal">
                {t('header')}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="table-escape-pipe"
                size="sm"
                checked={escapePipe}
                onCheckedChange={setEscapePipe}
              />
              <Label htmlFor="table-escape-pipe" className="font-normal">
                {t('escapePipe')}
              </Label>
            </div>

            {result.delimiter !== null && (
              <Badge variant="secondary">
                {t('detected', {
                  delimiter: t(DELIMITER_LABEL_KEYS[result.delimiter] ?? 'delimiterComma'),
                })}
              </Badge>
            )}
          </>
        )}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto gap-1.5"
          disabled={result.value === ''}
          onClick={handleDownload}
        >
          <Download className="size-4" />
          {t('download')}
        </Button>
      </div>

      {result.error !== null && (
        <Alert variant="destructive">
          <AlertDescription>{t('error', { message: result.error })}</AlertDescription>
        </Alert>
      )}

      <IoPair
        input={{
          value: input,
          placeholder: direction === 'toMarkdown' ? t('inputPlaceholder') : t('mdInputPlaceholder'),
          onValueChange: setInput,
        }}
        output={{
          value: result.value,
          placeholder: t('outputPlaceholder'),
        }}
        fullscreenLabel={tCommon('fullscreen')}
      />
    </div>
  )
}
