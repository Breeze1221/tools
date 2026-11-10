import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { chineseToNumber, numberToChinese } from './chinese-number-converter.service'

type Direction = 'toNumber' | 'toChinese'

const CHINESE_EXAMPLES = ['一百零五', '三千五百万', '九千九百九十九亿'] as const
const NUMBER_EXAMPLES = ['105', '1234.56', '999900000000'] as const

export default function ChineseNumberConverter() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'chinese-number-converter' })

  const [direction, setDirection] = useState<Direction>('toNumber')
  const [chineseInput, setChineseInput] = useState('')
  const [numberInput, setNumberInput] = useState('')
  const [financial, setFinancial] = useState(false)

  const chineseResult = useMemo(() => {
    if (chineseInput.trim() === '') {
      return { value: '', hasError: false }
    }
    try {
      return { value: String(chineseToNumber(chineseInput)), hasError: false }
    } catch {
      return { value: '', hasError: true }
    }
  }, [chineseInput])

  const numberResult = useMemo(() => {
    if (numberInput.trim() === '') {
      return { value: '', hasError: false }
    }
    try {
      return { value: numberToChinese(numberInput, { financial }), hasError: false }
    } catch {
      return { value: '', hasError: true }
    }
  }, [numberInput, financial])

  return (
    <Tabs
      value={direction}
      onValueChange={(value) => {
        if (value === 'toNumber' || value === 'toChinese') {
          setDirection(value)
        }
      }}
    >
      <TabsList>
        <TabsTrigger value="toNumber">{t('toNumberTab')}</TabsTrigger>
        <TabsTrigger value="toChinese">{t('toChineseTab')}</TabsTrigger>
      </TabsList>

      <TabsContent value="toNumber">
        <Card size="sm">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="chinese-number-input">{t('chineseInputLabel')}</Label>
              <Input
                id="chinese-number-input"
                value={chineseInput}
                onChange={(event) => setChineseInput(event.target.value)}
                placeholder={t('chineseInputPlaceholder')}
                className="font-mono"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('examplesLabel')}</Label>
              <div className="flex flex-wrap gap-2">
                {CHINESE_EXAMPLES.map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setChineseInput(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chinese-number-output">{t('resultLabel')}</Label>
              <InputCopyable
                id="chinese-number-output"
                value={chineseResult.value}
                readOnly
                placeholder={t('resultPlaceholder')}
                className="font-mono"
              />
              {chineseResult.hasError && (
                <p className="text-destructive text-sm">{t('errorInvalid')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="toChinese">
        <Card size="sm">
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="chinese-number-arabic-input">{t('numberInputLabel')}</Label>
              <Input
                id="chinese-number-arabic-input"
                value={numberInput}
                onChange={(event) => setNumberInput(event.target.value)}
                placeholder={t('numberInputPlaceholder')}
                className="font-mono"
                inputMode="decimal"
                spellCheck={false}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('examplesLabel')}</Label>
              <div className="flex flex-wrap gap-2">
                {NUMBER_EXAMPLES.map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-mono"
                    onClick={() => setNumberInput(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="chinese-number-financial"
                size="sm"
                checked={financial}
                onCheckedChange={setFinancial}
              />
              <Label htmlFor="chinese-number-financial" className="font-normal">
                {t('financial')}
              </Label>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="chinese-number-arabic-output">{t('resultLabel')}</Label>
              <InputCopyable
                id="chinese-number-arabic-output"
                value={numberResult.value}
                readOnly
                placeholder={t('resultPlaceholder')}
                className="font-mono"
              />
              {numberResult.hasError && (
                <p className="text-destructive text-sm">{t('errorInvalid')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
