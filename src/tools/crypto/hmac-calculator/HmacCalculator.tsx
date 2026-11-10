import { AlertTriangle, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  computeHmac,
  hmacAlgorithms,
  hmacOutputEncodings,
  keyEncodings,
  matchesExpected,
  parseKeyInput,
  type HmacAlgorithm,
  type HmacOutputEncoding,
  type KeyEncoding,
} from './hmac-calculator.service'

export default function HmacCalculator() {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'hmac-calculator' })

  const [message, setMessage] = useState('')
  const [keyInput, setKeyInput] = useState('')
  const [keyEncoding, setKeyEncoding] = useState<KeyEncoding>('text')
  const [algorithm, setAlgorithm] = useState<HmacAlgorithm>('SHA-256')
  const [outputEncoding, setOutputEncoding] = useState<HmacOutputEncoding>('hex')
  const [output, setOutput] = useState('')
  const [failed, setFailed] = useState(false)
  const [expected, setExpected] = useState('')

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const key = parseKeyInput(keyInput, keyEncoding)
        // 空密钥无法导入 WebCrypto；首次进入页面时不该先亮一个错误
        if (key.length === 0) {
          if (!cancelled) {
            setOutput('')
            setFailed(false)
          }
          return
        }
        const digest = await computeHmac(message, key, algorithm, outputEncoding)
        if (!cancelled) {
          setOutput(digest)
          setFailed(false)
        }
      } catch {
        if (!cancelled) {
          setOutput('')
          setFailed(true)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [message, keyInput, keyEncoding, algorithm, outputEncoding])

  const matches = failed ? null : matchesExpected(output, expected)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-col gap-2">
          <Label>{t('algorithm')}</Label>
          <MorphSelect
            label={t('algorithm')}
            hideLabel
            className="w-40"
            items={hmacAlgorithms.map((item) => ({ value: item, label: item }))}
            value={algorithm}
            onValueChange={(value) => setAlgorithm(value as HmacAlgorithm)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>{t('output-encoding')}</Label>
          <MorphSelect
            label={t('output-encoding')}
            hideLabel
            className="w-40"
            items={hmacOutputEncodings.map((item) => ({
              value: item,
              label: t(`output-${item}`),
            }))}
            value={outputEncoding}
            onValueChange={(value) => setOutputEncoding(value as HmacOutputEncoding)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="hmac-key">{t('key')}</Label>
        <Textarea
          id="hmac-key"
          value={keyInput}
          onChange={(event) => setKeyInput(event.target.value)}
          placeholder={t('key-placeholder')}
          className="min-h-20 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('key-encoding')}</Label>
        <MorphSelect
          label={t('key-encoding')}
          hideLabel
          className="w-40"
          items={keyEncodings.map((item) => ({
            value: item,
            label: t(`encoding-${item}`),
          }))}
          value={keyEncoding}
          onValueChange={(value) => setKeyEncoding(value as KeyEncoding)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="hmac-message">{t('message')}</Label>
        <Textarea
          id="hmac-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t('message-placeholder')}
          className="min-h-24 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      {failed && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{t('error')}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label>{t('output')}</Label>
        <TextareaCopyable value={output} rows={4} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="hmac-expected">{t('expected')}</Label>
        <Input
          id="hmac-expected"
          value={expected}
          onChange={(event) => setExpected(event.target.value)}
          placeholder={t('expected-placeholder')}
          className="font-mono text-sm"
          spellCheck={false}
        />
        <p className="text-muted-foreground text-xs">{t('match-hint')}</p>
        {matches !== null && (
          <p className="flex items-center gap-1.5 text-sm">
            {matches ? (
              <Check className="text-primary size-4 shrink-0" />
            ) : (
              <X className="text-destructive size-4 shrink-0" />
            )}
            <span className={matches ? 'text-primary' : 'text-destructive'}>
              {t(matches ? 'match' : 'mismatch')}
            </span>
          </p>
        )}
      </div>

      <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
    </div>
  )
}
