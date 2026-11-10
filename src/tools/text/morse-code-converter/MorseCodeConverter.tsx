import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCopy } from '@/composable/use-copy'
import { morseToText, textToMorse } from './morse-code-converter.service'

const SAMPLE_TEXT = 'SOS 2026'

export default function MorseCodeConverter() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'morse-code-converter' })
  const { copy, isCopied } = useCopy()

  const [text, setText] = useState('')
  const [morse, setMorse] = useState('')
  const [hasError, setHasError] = useState(false)

  const handleTextChange = (value: string) => {
    setText(value)
    try {
      setMorse(textToMorse(value))
      setHasError(false)
    } catch {
      setMorse('')
      setHasError(true)
    }
  }

  const handleMorseChange = (value: string) => {
    setMorse(value)
    try {
      setText(morseToText(value))
      setHasError(false)
    } catch {
      setText('')
      setHasError(true)
    }
  }

  const handleExample = () => {
    handleTextChange(SAMPLE_TEXT)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="morse-text">{t('textLabel')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                disabled={text === ''}
                onClick={() => void copy(text)}
              >
                {isCopied(text) ? <Check className="size-4" /> : <Copy className="size-4" />}
                {t('copy')}
              </Button>
            </div>
            <Textarea
              id="morse-text"
              value={text}
              onChange={(event) => handleTextChange(event.target.value)}
              placeholder={t('textPlaceholder')}
              className="min-h-40 font-mono text-sm"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="morse-code">{t('morseLabel')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5"
                disabled={morse === ''}
                onClick={() => void copy(morse)}
              >
                {isCopied(morse) ? <Check className="size-4" /> : <Copy className="size-4" />}
                {t('copy')}
              </Button>
            </div>
            <Textarea
              id="morse-code"
              value={morse}
              onChange={(event) => handleMorseChange(event.target.value)}
              placeholder={t('morsePlaceholder')}
              className="min-h-40 font-mono text-sm"
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={handleExample}>
          {t('example')}
        </Button>
        <span className="text-muted-foreground text-xs">{t('formatHint')}</span>
      </div>

      {hasError && <p className="text-destructive text-sm">{t('errorConversion')}</p>}
    </div>
  )
}
