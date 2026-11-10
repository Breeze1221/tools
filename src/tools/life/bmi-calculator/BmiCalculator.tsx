import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  BMI_UNIT_SYSTEMS,
  calculateBmi,
  type BmiCategory,
  type BmiResult,
  type BmiUnitSystem,
} from './bmi-calculator.service'

type FormValues = {
  heightCm: string
  weightKg: string
  heightFeet: string
  heightInches: string
  weightLb: string
}

type CalculationState =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ok'; result: BmiResult }

const INITIAL_VALUES: FormValues = {
  heightCm: '170',
  weightKg: '65',
  heightFeet: '5',
  heightInches: '7',
  weightLb: '143',
}

/** BMI 刻度条覆盖 20–40，超出范围时指针贴边 */
const SCALE_MIN = 20
const SCALE_MAX = 40

const CATEGORY_BADGE_VARIANT: Record<
  BmiCategory,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  underweight: 'outline',
  normal: 'default',
  overweight: 'secondary',
  obese: 'destructive',
}

const CATEGORY_TEXT_CLASS: Record<BmiCategory, string> = {
  underweight: 'text-muted-foreground',
  normal: 'text-primary',
  overweight: 'text-foreground',
  obese: 'text-destructive',
}

export default function BmiCalculator() {
  const { t } = useTranslation('tools-life', { keyPrefix: 'bmi-calculator' })

  const [unitSystem, setUnitSystem] = useState<BmiUnitSystem>('metric')
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)

  const updateValue = (field: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const calculation = useMemo<CalculationState>(() => {
    const required =
      unitSystem === 'metric'
        ? [values.heightCm, values.weightKg]
        : [values.heightFeet, values.heightInches, values.weightLb]

    if (required.some((value) => value.trim() === '')) {
      return { status: 'empty' }
    }

    try {
      const result =
        unitSystem === 'metric'
          ? calculateBmi({
              unitSystem: 'metric',
              heightCm: Number(values.heightCm),
              weightKg: Number(values.weightKg),
            })
          : calculateBmi({
              unitSystem: 'imperial',
              heightFeet: Number(values.heightFeet),
              heightInches: Number(values.heightInches),
              weightLb: Number(values.weightLb),
            })
      return { status: 'ok', result }
    } catch {
      return { status: 'invalid' }
    }
  }, [unitSystem, values])

  const result = calculation.status === 'ok' ? calculation.result : null
  const scalePercent = result
    ? Math.min(100, Math.max(0, ((result.bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100))
    : 0

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">{t('unitSystemLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ToggleGroup
            type="single"
            size="sm"
            value={unitSystem}
            onValueChange={(value) => {
              const next = BMI_UNIT_SYSTEMS.find((item) => item === value)
              if (next) {
                setUnitSystem(next)
              }
            }}
          >
            {BMI_UNIT_SYSTEMS.map((item) => (
              <ToggleGroupItem key={item} value={item}>
                {t(`units.${item}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="grid gap-3 sm:grid-cols-2">
            {unitSystem === 'metric' ? (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bmi-height-cm">{t('heightCmLabel')}</Label>
                  <Input
                    id="bmi-height-cm"
                    type="number"
                    min={50}
                    max={260}
                    inputMode="decimal"
                    value={values.heightCm}
                    onChange={(event) => updateValue('heightCm', event.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bmi-weight-kg">{t('weightKgLabel')}</Label>
                  <Input
                    id="bmi-weight-kg"
                    type="number"
                    min={2}
                    max={500}
                    inputMode="decimal"
                    value={values.weightKg}
                    onChange={(event) => updateValue('weightKg', event.target.value)}
                    className="font-mono"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bmi-height-ft">{t('heightFeetLabel')}</Label>
                  <Input
                    id="bmi-height-ft"
                    type="number"
                    min={1}
                    max={8}
                    inputMode="numeric"
                    value={values.heightFeet}
                    onChange={(event) => updateValue('heightFeet', event.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bmi-height-in">{t('heightInchesLabel')}</Label>
                  <Input
                    id="bmi-height-in"
                    type="number"
                    min={0}
                    max={11}
                    inputMode="decimal"
                    value={values.heightInches}
                    onChange={(event) => updateValue('heightInches', event.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bmi-weight-lb">{t('weightLbLabel')}</Label>
                  <Input
                    id="bmi-weight-lb"
                    type="number"
                    min={4}
                    max={1102}
                    inputMode="decimal"
                    value={values.weightLb}
                    onChange={(event) => updateValue('weightLb', event.target.value)}
                    className="font-mono"
                  />
                </div>
              </>
            )}
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
                  <span className="text-muted-foreground text-xs">{t('bmiLabel')}</span>
                  <span className={`font-mono text-4xl font-semibold tabular-nums ${CATEGORY_TEXT_CLASS[result.category]}`}>
                    {result.bmi}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-muted-foreground text-xs">{t('categoryLabel')}</span>
                  <Badge variant={CATEGORY_BADGE_VARIANT[result.category]}>
                    {t(`category.${result.category}`)}
                  </Badge>
                </div>
              </div>

              <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                <span className="text-muted-foreground text-xs">{t('healthyRangeLabel')}</span>
                <span className="font-mono text-sm tabular-nums">
                  {unitSystem === 'metric'
                    ? t('healthyRangeMetric', {
                        min: result.healthyWeightKg.min,
                        max: result.healthyWeightKg.max,
                      })
                    : t('healthyRangeImperial', {
                        min: result.healthyWeightLb.min,
                        max: result.healthyWeightLb.max,
                      })}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-xs">{t('scaleLabel')}</span>
                <div
                  className="relative h-3 w-full overflow-hidden rounded-full"
                  role="img"
                  aria-label={t('scaleAria', { bmi: result.bmi })}
                >
                  <div className="bg-primary/70 absolute inset-y-0 left-0 w-1/4" />
                  <div className="bg-muted-foreground/40 absolute inset-y-0 left-1/4 w-1/4" />
                  <div className="bg-destructive/50 absolute inset-y-0 left-1/2 w-1/2" />
                  <div
                    className="bg-foreground absolute inset-y-0 w-0.5 -translate-x-1/2"
                    style={{ left: `${scalePercent}%` }}
                  />
                </div>
                <div className="text-muted-foreground flex justify-between font-mono text-xs tabular-nums">
                  <span>{SCALE_MIN}</span>
                  <span>{(SCALE_MIN + SCALE_MAX) / 2}</span>
                  <span>{SCALE_MAX}</span>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
