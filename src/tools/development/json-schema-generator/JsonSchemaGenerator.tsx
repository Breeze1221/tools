import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  JSON_SCHEMA_DRAFTS,
  generateJsonSchema,
  type JsonSchemaDraft,
} from './json-schema-generator.service'

const SAMPLE_JSON = `{
  "id": 1,
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "active": true,
  "tags": ["math", "code"],
  "address": {
    "city": "London",
    "zip": "12345"
  }
}`

export default function JsonSchemaGenerator() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'json-schema-generator' })
  const [input, setInput] = useState(SAMPLE_JSON)
  const [draft, setDraft] = useState<JsonSchemaDraft>('2020-12')
  const [required, setRequired] = useState(true)

  const { output, error } = useMemo(() => {
    if (input.trim() === '') {
      return { output: '', error: null as string | null }
    }
    try {
      return {
        output: generateJsonSchema(input, { draft, required }),
        error: null as string | null,
      }
    } catch (err) {
      return {
        output: '',
        error: err instanceof Error ? err.message : 'Invalid JSON',
      }
    }
  }, [input, draft, required])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('inputLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('inputPlaceholder')}
              spellCheck={false}
              className="min-h-72 font-mono text-sm"
            />
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex flex-col gap-2">
                <Label>{t('draftLabel')}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {JSON_SCHEMA_DRAFTS.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      size="sm"
                      variant={draft === item ? 'default' : 'outline'}
                      onClick={() => setDraft(item)}
                    >
                      {t(`draft-${item}`)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <Switch id="json-schema-required" checked={required} onCheckedChange={setRequired} />
                <Label htmlFor="json-schema-required" className="cursor-pointer">
                  {t('requiredLabel')}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle className="text-base">{t('outputLabel')}</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            {error !== null && (
              <Alert variant="destructive">
                <AlertTitle>{t('errorTitle')}</AlertTitle>
                <AlertDescription>
                  {error.includes('Input is empty') ? t('errors.empty') : t('errors.invalidJson')}
                </AlertDescription>
              </Alert>
            )}
            <TextareaCopyable
              value={output}
              rows={18}
              highlight
              language="json"
              placeholder={t('outputPlaceholder')}
              className="font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
