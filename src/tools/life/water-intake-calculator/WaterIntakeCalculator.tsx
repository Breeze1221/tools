import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  calculateWaterIntake,
  lbToKg,
  WATER_CLIMATES,
  type WaterClimate,
  type WaterIntakeResult,
} from './water-intake-calculator.service'

type WeightUnit = 'kg' | 'lb'

const WEIGHT_UNITS: readonly WeightUnit[] = ['kg', 'lb']
/** 进度条满格参考值（毫升） */
const PROGRESS_MAX_ML = 3000

type CalculationState =
  { status: 'empty' } | { status: 'invalid' } | { status: 'ok'; result: WaterIntakeResult }

/** 饮水量计算：体重 + 运动时长 + 气候，给出毫升、升与杯数 */
export default function WaterIntakeCalculator() {
  const { t } = useTranslation('tools-life', { keyPrefix: 'water-intake-calculator' })

  const [weightInput, setWeightInput] = useState('65')
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg')
  const [activityInput, setActivityInput] = useState('30')
  const [climate, setClimate] = useState<WaterClimate>('temperate')

  const calculation = useMemo<CalculationState>(() => {
    if (weightInput.trim() === '' || activityInput.trim() === '') {
      return { status: 'empty' }
    }
    try {
      const weight = Number(weightInput)
      const weightKg = weightUnit === 'kg' ? weight : lbToKg(weight)
      const result = calculateWaterIntake({
        weightKg,
        activityMinutes: Number(activityInput),
        climate,
      })
      return { status: 'ok', result }
    } catch {
      return { status: 'invalid' }
    }
  }, [activityInput, climate, weightInput, weightUnit])

  const result = calculation.status === 'ok' ? calculation.result : null
  const progress = result ? Math.min(100, (result.milliliters / PROGRESS_MAX_ML) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">{t('formTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t('weightUnitLabel')}</Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={weightUnit}
              onValueChange={(value) => {
                const next = WEIGHT_UNITS.find((item) => item === value)
                if (next) {
                  setWeightUnit(next)
                }
              }}
            >
              {WEIGHT_UNITS.map((unit) => (
                <ToggleGroupItem key={unit} value={unit}>
                  {t(`units.${unit}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="water-weight">
                {weightUnit === 'kg' ? t('weightKgLabel') : t('weightLbLabel')}
              </Label>
              <Input
                id="water-weight"
                type="number"
                min={weightUnit === 'kg' ? 20 : 44}
                max={weightUnit === 'kg' ? 400 : 882}
                step="0.1"
                inputMode="decimal"
                value={weightInput}
                onChange={(event) => setWeightInput(event.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="water-activity">{t('activityLabel')}</Label>
              <Input
                id="water-activity"
                type="number"
                min={0}
                max={1440}
                step={30}
                inputMode="numeric"
                value={activityInput}
                onChange={(event) => setActivityInput(event.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('climateLabel')}</Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={climate}
              onValueChange={(value) => {
                const next = WATER_CLIMATES.find((item) => item === value)
                if (next) {
                  setClimate(next)
                }
              }}
            >
              {WATER_CLIMATES.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {t(`climates.${item}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
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
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{t('millilitersLabel')}</span>
                  <span className="font-mono text-4xl font-semibold tabular-nums">
                    {result.milliliters}
                    <span className="text-muted-foreground ml-1 text-base font-normal">ml</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-muted-foreground text-xs">{t('litersLabel')}</span>
                    <span className="font-mono text-lg font-semibold tabular-nums">
                      {result.liters}
                    </span>
                  </div>
                  <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                    <span className="text-muted-foreground text-xs">{t('cupsLabel')}</span>
                    <span className="font-mono text-lg font-semibold tabular-nums">
                      {result.cups}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground text-xs">{t('progressLabel')}</span>
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {result.milliliters} / {PROGRESS_MAX_ML} ml
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
