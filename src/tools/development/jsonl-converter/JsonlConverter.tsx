import { AlertCircle, Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { downloadText } from '@/utils/download'
import { jsonArrayToJsonl, jsonlToJsonArray } from './jsonl-converter.service'

const MAX_LISTED_ERRORS = 20

export default function JsonlConverter() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'jsonl-converter' })

  return (
    <Tabs defaultValue="to-jsonl" className="gap-4">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="to-jsonl">{t('tab-to-jsonl')}</TabsTrigger>
        <TabsTrigger value="to-json">{t('tab-to-json')}</TabsTrigger>
      </TabsList>

      <TabsContent value="to-jsonl" forceMount className="data-[state=inactive]:hidden">
        <JsonToJsonlPanel />
      </TabsContent>
      <TabsContent value="to-json" forceMount className="data-[state=inactive]:hidden">
        <JsonlToJsonPanel />
      </TabsContent>
    </Tabs>
  )
}

/** JSON 数组 → JSONL */
function JsonToJsonlPanel() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'jsonl-converter' })

  const [input, setInput] = useState('')
  const [pretty, setPretty] = useState(false)

  const { output, error, lineCount } = useMemo(() => {
    if (input.trim() === '') {
      return { output: '', error: null as string | null, lineCount: 0 }
    }
    try {
      const text = jsonArrayToJsonl(input, pretty)
      return {
        output: text,
        error: null as string | null,
        lineCount: text === '' ? 0 : text.split('\n').length,
      }
    } catch (err) {
      return {
        output: '',
        error: err instanceof Error ? err.message : 'Conversion failed',
        lineCount: 0,
      }
    }
  }, [input, pretty])

  const errorText =
    error === 'Input is empty'
      ? t('errors.empty')
      : error === 'Input JSON must be an array'
        ? t('errors.notArray')
        : t('errors.invalidJson')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="jsonl-json-input">{t('jsonInputLabel')}</Label>
        <Textarea
          id="jsonl-json-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('jsonInputPlaceholder')}
          spellCheck={false}
          className="min-h-40 font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="jsonl-pretty-one-line" checked={pretty} onCheckedChange={setPretty} />
        <Label htmlFor="jsonl-pretty-one-line" className="cursor-pointer">
          {t('prettyOneLine')}
        </Label>
      </div>

      {error !== null && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{errorText}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>{t('jsonlOutputLabel')}</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">
              {t('stats.lines', { value: lineCount })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={output === ''}
              onClick={() => downloadText(output, 'data.jsonl', 'application/x-ndjson')}
            >
              <Download className="size-4" />
              {t('download')}
            </Button>
          </div>
        </div>
        <TextareaCopyable
          value={output}
          rows={12}
          placeholder={t('jsonlOutputPlaceholder')}
          className="font-mono"
        />
      </div>
    </div>
  )
}

/** JSONL → JSON 数组 */
function JsonlToJsonPanel() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'jsonl-converter' })

  const [input, setInput] = useState('')
  const [pretty, setPretty] = useState(true)

  const { result, error } = useMemo(() => {
    if (input.trim() === '') {
      return { result: null, error: null as string | null }
    }
    try {
      return { result: jsonlToJsonArray(input, pretty), error: null as string | null }
    } catch (err) {
      return {
        result: null,
        error: err instanceof Error ? err.message : 'Conversion failed',
      }
    }
  }, [input, pretty])

  const listedErrors = result?.errors.slice(0, MAX_LISTED_ERRORS) ?? []
  const hiddenErrors = (result?.errors.length ?? 0) - listedErrors.length
  const warningLines = result?.warnings.map((warning) => warning.line) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="jsonl-input">{t('jsonlInputLabel')}</Label>
        <Textarea
          id="jsonl-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('jsonlInputPlaceholder')}
          spellCheck={false}
          className="min-h-40 font-mono text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch id="jsonl-pretty" checked={pretty} onCheckedChange={setPretty} />
        <Label htmlFor="jsonl-pretty" className="cursor-pointer">
          {t('prettyIndent')}
        </Label>
      </div>

      {error !== null && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t('errorTitle')}</AlertTitle>
          <AlertDescription>{t('errors.empty')}</AlertDescription>
        </Alert>
      )}

      {result !== null && (
        <div className="grid grid-cols-3 gap-2">
          <Stat label={t('stats.total')} value={result.lineCount} />
          <Stat label={t('stats.valid')} value={result.validCount} />
          <Stat label={t('stats.invalid')} value={result.errorCount} />
        </div>
      )}

      {listedErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t('lineErrorsTitle')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {listedErrors.map((item) => (
                <li key={item.line}>
                  {t('lineError', { line: item.line })}: {item.message}
                </li>
              ))}
            </ul>
            {hiddenErrors > 0 && <p>{t('moreErrors', { count: hiddenErrors })}</p>}
          </AlertDescription>
        </Alert>
      )}

      {warningLines.length > 0 && (
        <Alert>
          <AlertCircle />
          <AlertTitle>{t('warningTitle')}</AlertTitle>
          <AlertDescription>
            {t('warningNonObject', { lines: warningLines.join(', ') })}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>{t('jsonOutputLabel')}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={result === null}
            onClick={() => downloadText(result?.json ?? '', 'data.json', 'application/json')}
          >
            <Download className="size-4" />
            {t('download')}
          </Button>
        </div>
        <TextareaCopyable
          value={result?.json ?? ''}
          rows={12}
          placeholder={t('jsonOutputPlaceholder')}
          className="font-mono"
        />
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/40 flex flex-col gap-0.5 rounded-lg border px-3 py-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  )
}
