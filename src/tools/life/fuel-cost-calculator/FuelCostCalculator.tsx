import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  calculateFuelCost,
  FUEL_UNIT_SYSTEMS,
  METRIC_CONSUMPTION_MODES,
  type FuelCostResult,
  type FuelUnitSystem,
  type MetricConsumptionMode,
} from './fuel-cost-calculator.service'

type CalculationState =
  { status: 'empty' } | { status: 'invalid' } | { status: 'ok'; result: FuelCostResult }

function format(value: number, digits: number): string {
  return value.toFixed(digits)
}

/** 油费计算：距离 + 油耗 + 油价，支持公制与英制单位组合 */
export default function FuelCostCalculator() {
  const { t } = useTranslation('tools-life', { keyPrefix: 'fuel-cost-calculator' })

  const [unitSystem, setUnitSystem] = useState<FuelUnitSystem>('metric')
  const [consumptionMode, setConsumptionMode] = useState<MetricConsumptionMode>('lPer100km')
  const [distanceInput, setDistanceInput] = useState('100')
  const [consumptionInput, setConsumptionInput] = useState('8')
  const [priceInput, setPriceInput] = useState('8')
  const [roundTrip, setRoundTrip] = useState(false)

  const isMetric = unitSystem === 'metric'

  const calculation = useMemo<CalculationState>(() => {
    if (distanceInput.trim() === '' || consumptionInput.trim() === '' || priceInput.trim() === '') {
      return { status: 'empty' }
    }
    try {
      const result = calculateFuelCost({
        unitSystem,
        distance: Number(distanceInput),
        consumption: Number(consumptionInput),
        consumptionMode,
        price: Number(priceInput),
        roundTrip,
      })
      return { status: 'ok', result }
    } catch {
      return { status: 'invalid' }
    }
  }, [consumptionInput, consumptionMode, distanceInput, priceInput, roundTrip, unitSystem])

  const result = calculation.status === 'ok' ? calculation.result : null

  const distanceLabel = isMetric ? t('distanceLabelMetric') : t('distanceLabelImperial')
  const consumptionLabel = isMetric
    ? consumptionMode === 'lPer100km'
      ? t('consumptionLabelPer100km')
      : t('consumptionLabelPerLiter')
    : t('consumptionLabelImperial')
  const priceLabel = isMetric ? t('priceLabelMetric') : t('priceLabelImperial')
  const distanceUnit = isMetric ? 'km' : 'mi'

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">{t('formTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>{t('unitSystemLabel')}</Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={unitSystem}
              onValueChange={(value) => {
                const next = FUEL_UNIT_SYSTEMS.find((item) => item === value)
                if (next) {
                  setUnitSystem(next)
                }
              }}
            >
              {FUEL_UNIT_SYSTEMS.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {t(`units.${item}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {isMetric && (
            <div className="flex flex-col gap-2">
              <Label>{t('consumptionModeLabel')}</Label>
              <ToggleGroup
                type="single"
                size="sm"
                value={consumptionMode}
                onValueChange={(value) => {
                  const next = METRIC_CONSUMPTION_MODES.find((item) => item === value)
                  if (next) {
                    setConsumptionMode(next)
                  }
                }}
              >
                {METRIC_CONSUMPTION_MODES.map((item) => (
                  <ToggleGroupItem key={item} value={item}>
                    {t(`modes.${item}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fuel-distance">{distanceLabel}</Label>
              <Input
                id="fuel-distance"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={distanceInput}
                onChange={(event) => setDistanceInput(event.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fuel-consumption">{consumptionLabel}</Label>
              <Input
                id="fuel-consumption"
                type="number"
                min={0}
                step="0.1"
                inputMode="decimal"
                value={consumptionInput}
                onChange={(event) => setConsumptionInput(event.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="fuel-price">{priceLabel}</Label>
              <Input
                id="fuel-price"
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={priceInput}
                onChange={(event) => setPriceInput(event.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="fuel-round-trip" checked={roundTrip} onCheckedChange={setRoundTrip} />
            <Label htmlFor="fuel-round-trip" className="font-normal">
              {t('roundTripLabel')}
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t('costLabel')}</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    {format(result.cost, 2)}
                  </span>
                </div>
                <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t('costPerKmLabel')}</span>
                  <span className="font-mono text-2xl font-semibold tabular-nums">
                    {format(result.costPerKm, 3)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t('litersLabel')}</span>
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {format(result.liters, 2)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t('gallonsLabel')}</span>
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {format(result.gallons, 2)}
                  </span>
                </div>
                <div className="flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t('totalDistanceLabel')}</span>
                  <span className="font-mono text-lg font-semibold tabular-nums">
                    {format(result.totalDistance, 2)}{' '}
                    <span className="text-muted-foreground text-xs">{distanceUnit}</span>
                  </span>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">{t('resultHint')}</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
