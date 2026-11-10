import { describe, expect, it } from 'vitest'

import {
  calculateFuelCost,
  type FuelUnitSystem,
  type MetricConsumptionMode,
} from '@/tools/life/fuel-cost-calculator/fuel-cost-calculator.service'

describe('calculateFuelCost', () => {
  it('calculates a metric trip in L/100km', () => {
    const result = calculateFuelCost({
      unitSystem: 'metric',
      distance: 100,
      consumption: 8,
      price: 8,
    })
    expect(result.totalDistance).toBe(100)
    expect(result.liters).toBe(8)
    expect(result.gallons).toBe(2.11)
    expect(result.cost).toBe(64)
    expect(result.costPerKm).toBe(0.64)
  })

  it('supports the km/L consumption mode', () => {
    const result = calculateFuelCost({
      unitSystem: 'metric',
      distance: 100,
      consumption: 12.5,
      consumptionMode: 'kmPerL',
      price: 7,
    })
    expect(result.liters).toBe(8)
    expect(result.cost).toBe(56)
    expect(result.costPerKm).toBe(0.56)
  })

  it('rounds fuel volumes to two decimals', () => {
    const result = calculateFuelCost({
      unitSystem: 'metric',
      distance: 100,
      consumption: 7.5,
      price: 7.6,
    })
    expect(result.liters).toBe(7.5)
    expect(result.gallons).toBe(1.98)
    expect(result.cost).toBe(57)
  })

  it('doubles the distance for a round trip', () => {
    const result = calculateFuelCost({
      unitSystem: 'metric',
      distance: 100,
      consumption: 8,
      price: 8,
      roundTrip: true,
    })
    expect(result.totalDistance).toBe(200)
    expect(result.liters).toBe(16)
    expect(result.cost).toBe(128)
    expect(result.costPerKm).toBe(0.64)
  })

  it('calculates an imperial trip in miles and gallons', () => {
    const result = calculateFuelCost({
      unitSystem: 'imperial',
      distance: 100,
      consumption: 25,
      price: 4,
    })
    expect(result.totalDistance).toBe(100)
    expect(result.gallons).toBe(4)
    expect(result.liters).toBe(15.14)
    expect(result.cost).toBe(16)
    expect(result.costPerKm).toBe(0.099)
  })

  it('handles an imperial round trip', () => {
    const result = calculateFuelCost({
      unitSystem: 'imperial',
      distance: 60,
      consumption: 30,
      price: 5,
      roundTrip: true,
    })
    expect(result.totalDistance).toBe(120)
    expect(result.gallons).toBe(4)
    expect(result.cost).toBe(20)
    expect(result.costPerKm).toBe(0.104)
  })

  it('accepts the upper boundaries', () => {
    const result = calculateFuelCost({
      unitSystem: 'metric',
      distance: 100000,
      consumption: 200,
      price: 1000,
    })
    expect(result.liters).toBe(200000)
    expect(result.cost).toBe(200000000)
  })

  it('rejects a non-positive or out-of-range distance', () => {
    expect(() =>
      calculateFuelCost({ unitSystem: 'metric', distance: 0, consumption: 8, price: 8 }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({ unitSystem: 'metric', distance: -1, consumption: 8, price: 8 }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({ unitSystem: 'metric', distance: 100001, consumption: 8, price: 8 }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({
        unitSystem: 'metric',
        distance: Number.NaN,
        consumption: 8,
        price: 8,
      }),
    ).toThrow()
  })

  it('rejects invalid consumption and prices', () => {
    expect(() =>
      calculateFuelCost({ unitSystem: 'metric', distance: 100, consumption: 0, price: 8 }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({ unitSystem: 'metric', distance: 100, consumption: 201, price: 8 }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({ unitSystem: 'metric', distance: 100, consumption: 8, price: 0 }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({ unitSystem: 'metric', distance: 100, consumption: 8, price: 1000.01 }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({
        unitSystem: 'imperial',
        distance: 100,
        consumption: Number.NaN,
        price: 4,
      }),
    ).toThrow()
  })

  it('rejects an unknown unit system or consumption mode', () => {
    expect(() =>
      calculateFuelCost({
        unitSystem: 'nautical' as unknown as FuelUnitSystem,
        distance: 100,
        consumption: 8,
        price: 8,
      }),
    ).toThrow()
    expect(() =>
      calculateFuelCost({
        unitSystem: 'metric',
        distance: 100,
        consumption: 8,
        consumptionMode: 'mpg' as unknown as MetricConsumptionMode,
        price: 8,
      }),
    ).toThrow()
  })
})
