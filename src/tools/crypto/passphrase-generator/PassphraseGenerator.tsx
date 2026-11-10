import { Check, Copy, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useCopy } from '@/composable/use-copy'
import {
  DEFAULT_PASSPHRASE_OPTIONS,
  PASSPHRASE_COUNT_RANGE,
  PASSPHRASE_WORD_COUNT_RANGE,
  estimatePassphraseEntropy,
  generatePassphrases,
  isPassphraseSeparator,
  passphraseSeparators,
  type PassphraseOptions,
} from './passphrase-generator.service'
import { WORDLIST } from './wordlist'

const DEFAULT_RESULT_COUNT = 3

function toBoundedNumber(raw: string, min: number, max: number): number {
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    return min
  }
  return Math.min(max, Math.max(min, Math.trunc(parsed)))
}

export default function PassphraseGenerator() {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'passphrase-generator' })
  const { copy, isCopied } = useCopy()
  const [options, setOptions] = useState<PassphraseOptions>(DEFAULT_PASSPHRASE_OPTIONS)
  const [resultCount, setResultCount] = useState(DEFAULT_RESULT_COUNT)
  const [results, setResults] = useState<string[]>(() =>
    generatePassphrases(DEFAULT_PASSPHRASE_OPTIONS, DEFAULT_RESULT_COUNT),
  )
  const [failed, setFailed] = useState(false)

  const entropy = useMemo(
    () => estimatePassphraseEntropy(options.wordCount, WORDLIST.length, options.includeDigit),
    [options.wordCount, options.includeDigit],
  )

  const separatorItems = passphraseSeparators.map((separator) => ({
    value: separator,
    label: t(`separator.${separator}`),
  }))
  const allValue = results.join('\n')

  const update = (patch: Partial<PassphraseOptions>) =>
    setOptions((previous) => ({ ...previous, ...patch }))

  const handleGenerate = () => {
    try {
      setResults(generatePassphrases(options, resultCount))
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="order-2 flex flex-col gap-3 xl:order-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">{t('results')}</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={results.length === 0}
            onClick={() => void copy(allValue)}
          >
            {isCopied(allValue) ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t('copyAll')}
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {results.map((passphrase) => (
            <InputCopyable key={passphrase} value={passphrase} readOnly className="font-mono" />
          ))}
        </div>

        <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
      </div>

      <div className="order-1 xl:order-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('params')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="passphrase-word-count">{t('wordCount')}</Label>
                <span className="text-muted-foreground font-mono text-sm">{options.wordCount}</span>
              </div>
              <Slider
                id="passphrase-word-count"
                min={PASSPHRASE_WORD_COUNT_RANGE.min}
                max={PASSPHRASE_WORD_COUNT_RANGE.max}
                step={1}
                value={[options.wordCount]}
                onValueChange={(values) => update({ wordCount: values[0] ?? options.wordCount })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="passphrase-separator">{t('separator.label')}</Label>
              <MorphSelect
                label={t('separator.label')}
                hideLabel
                triggerId="passphrase-separator"
                className="w-full"
                items={separatorItems}
                value={options.separator}
                onValueChange={(value) => {
                  if (isPassphraseSeparator(value)) {
                    update({ separator: value })
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="passphrase-capitalize"
                checked={options.capitalize}
                onCheckedChange={(checked) => update({ capitalize: checked })}
              />
              <Label htmlFor="passphrase-capitalize" className="font-normal">
                {t('capitalize')}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="passphrase-digit"
                checked={options.includeDigit}
                onCheckedChange={(checked) => update({ includeDigit: checked })}
              />
              <Label htmlFor="passphrase-digit" className="font-normal">
                {t('includeDigit')}
              </Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="passphrase-count">{t('count')}</Label>
              <Input
                id="passphrase-count"
                type="number"
                min={PASSPHRASE_COUNT_RANGE.min}
                max={PASSPHRASE_COUNT_RANGE.max}
                value={resultCount}
                onChange={(event) =>
                  setResultCount(
                    toBoundedNumber(
                      event.target.value,
                      PASSPHRASE_COUNT_RANGE.min,
                      PASSPHRASE_COUNT_RANGE.max,
                    ),
                  )
                }
              />
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <span className="text-muted-foreground text-sm">{t('entropy')}</span>
              <span className="font-mono text-sm">{t('entropyValue', { bits: entropy })}</span>
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">
              {t('entropyHint', { words: options.wordCount, size: WORDLIST.length })}
            </p>

            {failed && (
              <Alert variant="destructive">
                <AlertDescription>{t('error')}</AlertDescription>
              </Alert>
            )}

            <Button onClick={handleGenerate} className="w-full gap-2">
              <RefreshCw className="size-4" />
              {t('regenerate')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
