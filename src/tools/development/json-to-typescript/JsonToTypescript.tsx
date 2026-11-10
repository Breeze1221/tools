import { AlertCircle, Download, Wand2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { downloadText } from '@/utils/download'
import { generateTypes, type TypescriptMode } from './json-to-typescript.service'

type GenerationResult = {
  readonly code: string
  readonly error: string | null
}

const MODES: readonly TypescriptMode[] = ['interface', 'type', 'zod']

/** 尝试格式化输入，非法 JSON 时保持原文并提示错误 */
function formatJson(input: string): string {
  const parsed: unknown = JSON.parse(input)
  return JSON.stringify(parsed, null, 2)
}

/** JSON 转 TypeScript：左侧粘贴 JSON，右侧实时生成 interface / type / zod schema */
export default function JsonToTypescript() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'json-to-typescript' })
  const { t: tCommon } = useTranslation('common')

  const [input, setInput] = useState('')
  const [mode, setMode] = useState<TypescriptMode>('interface')
  const [rootName, setRootName] = useState('Root')
  const [exportKeyword, setExportKeyword] = useState(true)
  const [formatError, setFormatError] = useState(false)

  const result = useMemo<GenerationResult>(() => {
    if (input.trim() === '') {
      return { code: '', error: null }
    }
    try {
      return {
        code: generateTypes(input, { mode, rootName, exportKeyword }),
        error: null,
      }
    } catch {
      return { code: '', error: t('invalidJson') }
    }
  }, [input, mode, rootName, exportKeyword, t])

  const handleModeChange = (value: string) => {
    const next = MODES.find((item) => item === value)
    if (next !== undefined) {
      setMode(next)
    }
  }

  const handleFormat = () => {
    if (input.trim() === '') {
      return
    }
    try {
      setInput(formatJson(input))
      setFormatError(false)
    } catch {
      setFormatError(true)
    }
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    setFormatError(false)
  }

  const handleDownload = () => {
    if (result.code === '') {
      return
    }
    downloadText(result.code, 'types.ts', 'text/typescript')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="json-to-typescript-mode">{t('modeLabel')}</Label>
          <Select value={mode} onValueChange={handleModeChange}>
            <SelectTrigger id="json-to-typescript-mode" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interface">{t('mode-interface')}</SelectItem>
              <SelectItem value="type">{t('mode-type')}</SelectItem>
              <SelectItem value="zod">{t('mode-zod')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-44 flex-col gap-2">
          <Label htmlFor="json-to-typescript-root">{t('rootNameLabel')}</Label>
          <Input
            id="json-to-typescript-root"
            value={rootName}
            onChange={(event) => setRootName(event.target.value)}
            placeholder={t('rootNamePlaceholder')}
            spellCheck={false}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex items-center gap-2 pb-1.5">
          <Switch
            id="json-to-typescript-export"
            checked={exportKeyword}
            onCheckedChange={setExportKeyword}
          />
          <Label htmlFor="json-to-typescript-export">{t('exportLabel')}</Label>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t('inputLabel')}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={input.trim() === ''}
                onClick={handleFormat}
              >
                <Wand2 className="size-4" />
                {t('formatButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={input}
              onChange={(event) => handleInputChange(event.target.value)}
              placeholder={t('inputPlaceholder')}
              spellCheck={false}
              className="min-h-80 font-mono text-sm"
            />
            {formatError && <p className="text-destructive text-sm">{t('invalidJson')}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>{t('outputLabel')}</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={result.code === ''}
                onClick={handleDownload}
              >
                <Download className="size-4" />
                {t('download')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.error !== null && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>{tCommon('error')}</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}
            <TextareaCopyable
              value={result.code}
              highlight
              language="typescript"
              rows={20}
              className="font-mono"
              placeholder={input.trim() === '' ? t('emptyInput') : t('outputPlaceholder')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
