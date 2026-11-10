import { Minus, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { calculateTip, TIP_PRESETS, type TipResult } from './tip-calculator.service'

type CalculationState =
  { status: 'empty' } | { status: 'invalid' } | { status: 'ok'; result: TipResult }

const MIN_PEOPLE = 1
const MAX_PEOPLE = 100

function formatMoney(value: number): string {
  return value.toFixed(2)
}

/** 小费计算：账单 + 百分比 + 人数，实时给出小费、总额与人均 */
export default function TipCalculator() {
  const { t } = useTranslation('tools-life', { keyPrefix: 'tip-calculator' })

  const [billInput, setBillInput] = useState('100')
  const [tipPercent, setTipPercent] = useState(15)
  const [peopleInput, setPeopleInput] = useState('2')
  const [roundUp, setRoundUp] = useState(false)

  const calculation = useMemo<CalculationState>(() => {
    if (billInput.trim() === '' || peopleInput.trim() === '') {
      return { status: 'empty' }
    }
    try {
      const result = calculateTip({
        bill: Number(billInput),
        tipPercent,
        people: Number(peopleInput),
        roundUp,
      })
      return { status: 'ok', result }
    } catch {
      return { status: 'invalid' }
    }
  }, [billInput, peopleInput, roundUp, tipPercent])

  const result = calculation.status === 'ok' ? calculation.result : null
  const activePreset = TIP_PRESETS.find((preset) => preset === tipPercent)
  const people = Number(peopleInput)

  const handlePeopleStep = (delta: number) => {
    const current = Number.isFinite(people) ? people : 1
    const next = Math.min(MAX_PEOPLE, Math.max(MIN_PEOPLE, Math.round(current) + delta))
    setPeopleInput(String(next))
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">{t('formTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tip-bill">{t('billLabel')}</Label>
            <Input
              id="tip-bill"
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={billInput}
              onChange={(event) => setBillInput(event.target.value)}
              className="font-mono"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="tip-percent">{t('tipPercentLabel')}</Label>
              <span className="font-mono text-sm tabular-nums">
                {t('percentValue', { n: tipPercent })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Slider
                id="tip-percent"
                min={0}
                max={100}
                step={1}
                value={[tipPercent]}
                onValueChange={(values) => setTipPercent(values[0] ?? 0)}
              />
              <Input
                type="number"
                min={0}
                max={100}
                aria-label={t('tipPercentLabel')}
                value={tipPercent}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setTipPercent(Number.isFinite(next) ? Math.min(100, Math.max(0, next)) : 0)
                }}
                className="w-20 shrink-0 font-mono"
              />
            </div>
            <ToggleGroup
              type="single"
              size="sm"
              value={activePreset === undefined ? '' : String(activePreset)}
              onValueChange={(value) => {
                if (value !== '') {
                  setTipPercent(Number(value))
                }
              }}
            >
              {TIP_PRESETS.map((preset) => (
                <ToggleGroupItem key={preset} value={String(preset)}>
                  {t('presetValue', { n: preset })}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="tip-people">{t('peopleLabel')}</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t('decreasePeople')}
                onClick={() => handlePeopleStep(-1)}
              >
                <Minus />
              </Button>
              <Input
                id="tip-people"
                type="number"
                min={MIN_PEOPLE}
                max={MAX_PEOPLE}
                step={1}
                inputMode="numeric"
                value={peopleInput}
                onChange={(event) => setPeopleInput(event.target.value)}
                className="w-24 font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={t('increasePeople')}
                onClick={() => handlePeopleStep(1)}
              >
                <Plus />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="tip-round-up" checked={roundUp} onCheckedChange={setRoundUp} />
            <Label htmlFor="tip-round-up" className="font-normal">
              {t('roundUpLabel')}
            </Label>
          </div>

          {calculation.status === 'empty' && (
            <Alert>
              <AlertDescription>{t('emptyInput')}</AlertDescription>
            </Alert>
          )}
          {calculation.status === 'invalid' && (
            <Alert variant="destructive">
              <AlertDescription>{t('invalidInput')}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">{t('resultLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {result === null ? (
            <div className="bg-muted/40 text-muted-foreground flex min-h-24 items-center justify-center rounded-lg border p-4 text-sm">
              {t('resultEmpty')}
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t('tipAmountLabel')}</span>
                  <span className="font-mono text-xl font-semibold tabular-nums">
                    {formatMoney(result.tip)}
                  </span>
                </div>
                <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t('totalLabel')}</span>
                  <span className="font-mono text-xl font-semibold tabular-nums">
                    {formatMoney(result.total)}
                  </span>
                </div>
                <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">
                    {t('perPersonLabel', { n: people })}
                  </span>
                  <span className="font-mono text-xl font-semibold tabular-nums">
                    {formatMoney(result.perPerson)}
                  </span>
                </div>
              </div>

              {result.roundedTotal !== undefined && result.roundedPerPerson !== undefined && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-muted-foreground text-xs">{t('roundedTotalLabel')}</span>
                    <span className="font-mono text-lg font-semibold tabular-nums">
                      {formatMoney(result.roundedTotal)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-muted-foreground text-xs">
                      {t('roundedPerPersonLabel', { n: people })}
                    </span>
                    <span className="font-mono text-lg font-semibold tabular-nums">
                      {formatMoney(result.roundedPerPerson)}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-muted-foreground text-xs">{t('roundUpHint')}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
