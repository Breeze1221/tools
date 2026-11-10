import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { optimizeSvg, svgToJsx } from './svg-to-jsx.service'

type OutputFormat = 'ts' | 'js'

type ConversionResult = {
  readonly code: string
  readonly error: string | null
}

/** SVG 转 JSX：左侧粘贴源码并预览，右侧生成可直接使用的 React 组件 */
export default function SvgToJsx() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'svg-to-jsx' })
  const { t: tCommon } = useTranslation('common')

  const [input, setInput] = useState('')
  const [componentName, setComponentName] = useState('SvgComponent')
  const [format, setFormat] = useState<OutputFormat>('ts')
  const [optimize, setOptimize] = useState(true)

  const result = useMemo<ConversionResult>(() => {
    if (input.trim() === '') {
      return { code: '', error: null }
    }
    try {
      return {
        code: svgToJsx(input, {
          componentName,
          typescript: format === 'ts',
          optimize,
        }),
        error: null,
      }
    } catch (error) {
      return { code: '', error: error instanceof Error ? error.message : String(error) }
    }
  }, [input, componentName, format, optimize])

  const previewSrc = useMemo(() => {
    if (input.trim() === '') {
      return null
    }
    try {
      const optimized = optimizeSvg(input)
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(optimized)}`
    } catch {
      return null
    }
  }, [input])

  const handleFormatChange = (value: string) => {
    if (value === 'ts' || value === 'js') {
      setFormat(value)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-48 flex-col gap-2">
          <Label htmlFor="svg-to-jsx-name">{t('componentNameLabel')}</Label>
          <Input
            id="svg-to-jsx-name"
            value={componentName}
            onChange={(event) => setComponentName(event.target.value)}
            placeholder={t('componentNamePlaceholder')}
            spellCheck={false}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="svg-to-jsx-format">{t('outputFormatLabel')}</Label>
          <Select value={format} onValueChange={handleFormatChange}>
            <SelectTrigger id="svg-to-jsx-format" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ts">{t('format-ts')}</SelectItem>
              <SelectItem value="js">{t('format-js')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pb-1.5">
          <Switch id="svg-to-jsx-optimize" checked={optimize} onCheckedChange={setOptimize} />
          <Label htmlFor="svg-to-jsx-optimize">{t('optimizeLabel')}</Label>
        </div>
      </div>
      <p className="text-muted-foreground -mt-2 text-xs">{t('optimizeHint')}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('inputLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('inputPlaceholder')}
              spellCheck={false}
              className="min-h-64 font-mono text-sm"
            />

            <div className="flex flex-col gap-2">
              <Label>{t('previewLabel')}</Label>
              <div className="bg-muted/40 flex min-h-32 items-center justify-center rounded-lg border p-3">
                {previewSrc === null ? (
                  <span className="text-muted-foreground text-sm">{t('previewEmpty')}</span>
                ) : (
                  <img src={previewSrc} alt={t('previewAlt')} className="max-h-40 max-w-full" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('outputLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.error !== null && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>{tCommon('error')}</AlertTitle>
                <AlertDescription className="break-all">{result.error}</AlertDescription>
              </Alert>
            )}
            <TextareaCopyable
              value={result.code}
              highlight
              language={format === 'ts' ? 'typescript' : 'javascript'}
              rows={18}
              placeholder={input.trim() === '' ? t('emptyInput') : t('outputPlaceholder')}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
