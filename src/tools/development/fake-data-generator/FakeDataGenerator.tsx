import { Download, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { downloadText } from '@/utils/download'
import {
  FAKE_DATA_COUNT_RANGE,
  fakeDataFields,
  generateRecords,
  type FakeDataField,
} from './fake-data-generator.service'

type OutputFormat = 'json' | 'csv'

const DEFAULT_FIELDS: readonly FakeDataField[] = ['id', 'firstName', 'lastName', 'email']
const DEFAULT_COUNT = 10

/** 假数据生成器：勾选字段批量生成 JSON / CSV，数据全部在本地随机生成 */
export default function FakeDataGenerator() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'fake-data-generator' })
  const { t: tCommon } = useTranslation('common')

  const [selected, setSelected] = useState<readonly FakeDataField[]>(DEFAULT_FIELDS)
  const [count, setCount] = useState(DEFAULT_COUNT)
  const [format, setFormat] = useState<OutputFormat>('json')
  const [header, setHeader] = useState(true)
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isAllSelected = selected.length === fakeDataFields.length

  const describeError = (cause: unknown): string => {
    const message = cause instanceof Error ? cause.message : ''
    if (message.startsWith('No fields')) {
      return t('errors.noFields')
    }
    if (message.startsWith('Unknown field')) {
      return t('errors.unknownField')
    }
    if (message.startsWith('Count')) {
      return t('errors.count')
    }
    return t('errors.failed')
  }

  const handleToggle = (field: FakeDataField, checked: boolean) => {
    setSelected((current) => {
      if (checked) {
        return current.includes(field) ? current : [...current, field]
      }
      return current.filter((item) => item !== field)
    })
    setOutput('')
  }

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? fakeDataFields : [])
    setOutput('')
  }

  const handleGenerate = () => {
    try {
      setOutput(generateRecords({ fields: selected, count, format, header }))
      setError(null)
    } catch (cause) {
      setOutput('')
      setError(describeError(cause))
    }
  }

  const handleDownload = () => {
    if (output === '') {
      return
    }
    if (format === 'json') {
      downloadText(output, 'fake-data.json', 'application/json')
      return
    }
    downloadText(output, 'fake-data.csv', 'text/csv')
  }

  const handleCountChange = (value: string) => {
    const next = Number(value)
    if (!Number.isFinite(next)) {
      return
    }
    setCount(
      Math.min(FAKE_DATA_COUNT_RANGE.max, Math.max(FAKE_DATA_COUNT_RANGE.min, Math.trunc(next))),
    )
    setOutput('')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{t('fieldsLabel')}</CardTitle>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-xs">
                {t('selectedCount', { total: selected.length })}
              </span>
              <Label htmlFor="fake-data-select-all" className="cursor-pointer">
                <Checkbox
                  id="fake-data-select-all"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => handleSelectAll(checked === true)}
                />
                {t('selectAll')}
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={selected.length === 0}
                onClick={() => handleSelectAll(false)}
              >
                {t('clearAll')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fakeDataFields.map((field) => {
            const id = `fake-data-field-${field}`
            return (
              <Label key={field} htmlFor={id} className="cursor-pointer">
                <Checkbox
                  id={id}
                  checked={selected.includes(field)}
                  onCheckedChange={(checked) => handleToggle(field, checked === true)}
                />
                {t(`fields.${field}`)}
              </Label>
            )
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
        <div className="flex min-w-64 flex-1 flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="fake-data-count">{t('countLabel')}</Label>
            <Input
              id="fake-data-count"
              type="number"
              min={FAKE_DATA_COUNT_RANGE.min}
              max={FAKE_DATA_COUNT_RANGE.max}
              value={count}
              onChange={(event) => handleCountChange(event.target.value)}
              className="w-20"
            />
          </div>
          <Slider
            id="fake-data-count-slider"
            min={FAKE_DATA_COUNT_RANGE.min}
            max={FAKE_DATA_COUNT_RANGE.max}
            step={1}
            value={[count]}
            onValueChange={(values) => {
              setCount(values[0] ?? count)
              setOutput('')
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t('formatLabel')}</Label>
          <ToggleGroup
            type="single"
            size="sm"
            value={format}
            onValueChange={(next) => {
              if (next === 'json' || next === 'csv') {
                setFormat(next)
                setOutput('')
              }
            }}
          >
            <ToggleGroupItem value="json">{t('format-json')}</ToggleGroupItem>
            <ToggleGroupItem value="csv">{t('format-csv')}</ToggleGroupItem>
          </ToggleGroup>
        </div>

        {format === 'csv' && (
          <div className="flex items-center gap-2 pb-1.5">
            <Switch id="fake-data-header" checked={header} onCheckedChange={setHeader} />
            <Label htmlFor="fake-data-header">{t('headerLabel')}</Label>
          </div>
        )}

        <Button type="button" disabled={selected.length === 0} onClick={handleGenerate}>
          <RefreshCw className="size-4" />
          {t('generate')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{t('outputLabel')}</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={output === ''}
              onClick={handleDownload}
            >
              <Download className="size-4" />
              {t('download')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error !== null && (
            <Alert variant="destructive">
              <AlertTitle>{tCommon('error')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <TextareaCopyable
            value={output}
            highlight
            language={format === 'json' ? 'json' : 'plaintext'}
            rows={18}
            className="font-mono"
            placeholder={t('outputPlaceholder')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
