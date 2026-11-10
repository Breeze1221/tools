import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IoPair } from '@/components/io-pair'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DOTENV_FORMATS,
  convertEnvFormat,
  parseDotenv,
  type DotenvError,
  type DotenvFormat,
  type DotenvWarning,
} from './dotenv-converter.service'

const SAMPLE = `# Application settings
export NODE_ENV=development
PORT=3000
API_URL="https://api.example.com/v1"
APP_NAME='Breeze Toolbox'
GREETING="Hello\\tworld"
`

const OUTPUT_LANGUAGES: Record<DotenvFormat, string> = {
  env: 'bash',
  json: 'json',
  yaml: 'yaml',
}

type FormatSelectProps = {
  id: string
  label: string
  value: DotenvFormat
  onValueChange: (value: DotenvFormat) => void
}

function FormatSelect({ id, label, value, onValueChange }: FormatSelectProps) {
  const { t } = useTranslation('tools-development', { keyPrefix: 'dotenv-converter' })

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={id} className="text-muted-foreground shrink-0 text-xs">
        {label}
      </Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const format = DOTENV_FORMATS.find((item) => item === next)
          if (format) {
            onValueChange(format)
          }
        }}
      >
        <SelectTrigger id={id} size="sm" className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DOTENV_FORMATS.map((format) => (
            <SelectItem key={format} value={format}>
              {t(`format-${format}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function DotenvConverter() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'dotenv-converter' })

  const [from, setFrom] = useState<DotenvFormat>('env')
  const [to, setTo] = useState<DotenvFormat>('json')
  const [input, setInput] = useState(SAMPLE)

  const envResult = useMemo((): {
    errors: DotenvError[]
    warnings: DotenvWarning[]
  } => {
    if (from !== 'env' || input.trim() === '') {
      return { errors: [], warnings: [] }
    }
    const { errors, warnings } = parseDotenv(input)
    return { errors, warnings }
  }, [from, input])

  const { output, failed, detail } = useMemo(() => {
    try {
      return { output: convertEnvFormat(input, from, to), failed: false, detail: '' }
    } catch (error) {
      return {
        output: '',
        failed: true,
        detail: error instanceof Error ? error.message : '',
      }
    }
  }, [input, from, to])

  return (
    <div className="flex flex-col gap-3">
      {envResult.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t('parseErrorsTitle')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {envResult.errors.map((item) => (
                <li key={`${item.line}-${item.message}`}>
                  {t('lineError', { line: item.line })}: {item.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {envResult.warnings.length > 0 && (
        <Alert>
          <AlertCircle />
          <AlertTitle>{t('warningsTitle')}</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {envResult.warnings.map((item) => (
                <li key={`${item.line}-${item.message}`}>
                  {t('lineError', { line: item.line })}: {item.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {from !== 'env' && failed && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>{t('parseErrorsTitle')}</AlertTitle>
          <AlertDescription>
            <p>{t('invalidInput', { format: t(`format-${from}`) })}</p>
            {detail !== '' && <p className="font-mono text-xs">{detail}</p>}
          </AlertDescription>
        </Alert>
      )}

      <IoPair
        input={{
          value: input,
          placeholder: t('inputPlaceholder'),
          onValueChange: setInput,
          head: (
            <FormatSelect
              id="dotenv-converter-from"
              label={t('fromLabel')}
              value={from}
              onValueChange={setFrom}
            />
          ),
        }}
        output={{
          value: output,
          placeholder: t('outputPlaceholder'),
          language: OUTPUT_LANGUAGES[to],
          head: (
            <FormatSelect
              id="dotenv-converter-to"
              label={t('toLabel')}
              value={to}
              onValueChange={setTo}
            />
          ),
        }}
      />
    </div>
  )
}
