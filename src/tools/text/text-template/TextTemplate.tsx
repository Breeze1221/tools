import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { detectVariables, fillTemplate } from './text-template.service'

type VariableRow = {
  readonly id: number
  readonly key: string
  readonly value: string
}

export default function TextTemplate() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'text-template' })

  const [template, setTemplate] = useState('')
  const [rows, setRows] = useState<VariableRow[]>([{ id: 0, key: '', value: '' }])
  const nextIdRef = useRef(1)

  const variables = useMemo(() => detectVariables(template), [template])

  const values = useMemo(() => {
    const record: Record<string, string> = {}
    for (const row of rows) {
      const key = row.key.trim()
      if (key !== '') {
        record[key] = row.value
      }
    }
    return record
  }, [rows])

  const result = useMemo(() => fillTemplate(template, values), [template, values])

  const handleAddRow = () => {
    const id = nextIdRef.current
    nextIdRef.current += 1
    setRows((current) => [...current, { id, key: '', value: '' }])
  }

  const handleRemoveRow = (id: number) => {
    setRows((current) => (current.length <= 1 ? current : current.filter((row) => row.id !== id)))
  }

  const handleChangeRow = (id: number, field: 'key' | 'value', nextValue: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: nextValue } : row)),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="text-template-input">{t('templateLabel')}</Label>
            <Textarea
              id="text-template-input"
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
              placeholder={t('templatePlaceholder')}
              className="min-h-36 font-mono text-sm"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('variablesLabel')}</Label>
            {variables.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noVariables')}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {variables.map((variable) => (
                  <Badge key={variable} variant="outline" className="font-mono">
                    {variable}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label>{t('valuesLabel')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleAddRow}
              >
                <Plus className="size-4" />
                {t('addRow')}
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <Input
                    value={row.key}
                    onChange={(event) => handleChangeRow(row.id, 'key', event.target.value)}
                    placeholder={t('keyPlaceholder')}
                    aria-label={t('keyPlaceholder')}
                    className="min-w-0 flex-1 font-mono"
                    spellCheck={false}
                  />
                  <Input
                    value={row.value}
                    onChange={(event) => handleChangeRow(row.id, 'value', event.target.value)}
                    placeholder={t('valuePlaceholder')}
                    aria-label={t('valuePlaceholder')}
                    className="min-w-0 flex-1 font-mono"
                    spellCheck={false}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('removeRow')}
                    disabled={rows.length <= 1}
                    onClick={() => handleRemoveRow(row.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>

            {result.missing.length > 0 && (
              <p className="text-destructive text-sm">
                {t('missingWarning', { variables: result.missing.join(', ') })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Label>{t('outputLabel')}</Label>
        <TextareaCopyable
          value={result.output}
          rows={8}
          className="font-mono"
          placeholder={t('outputPlaceholder')}
        />
      </div>
    </div>
  )
}
