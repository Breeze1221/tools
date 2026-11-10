export const FUEL_UNIT_SYSTEMS = ['metric', 'imperial'] as const
export type FuelUnitSystem = (typeof FUEL_UNIT_SYSTEMS)[number]

/** 公制油耗口径：L/100km 或 km/L */
export const METRIC_CONSUMPTION_MODES = ['lPer100km', 'kmPerL'] as const
export type MetricConsumptionMode = (typeof METRIC_CONSUMPTION_MODES)[number]

export const KM_PER_MILE = 1.609344
export const LITERS_PER_GALLON = 3.785411784

const MAX_DISTANCE = 100000
const MAX_CONSUMPTION = 200
const MAX_PRICE = 1000

export type FuelCostInput = {
  readonly unitSystem: FuelUnitSystem
  /** 距离：metric 为公里，imperial 为英里 */
  readonly distance: number
  /** 油耗：metric 为 L/100km 或 km/L，imperial 为 MPG */
  readonly consumption: number
  /** 仅公制使用，默认 lPer100km */
  readonly consumptionMode?: MetricConsumptionMode
  /** 油价：metric 为每升，imperial 为每加仑 */
  readonly price: number
  /** 是否为往返行程（距离翻倍） */
  readonly roundTrip?: boolean
}

export type FuelCostResult = {
  /** 实际行驶距离（含往返），metric 为公里、imperial 为英里 */
  readonly totalDistance: number
  /** 消耗燃油（升），保留 2 位 */
  readonly liters: number
  /** 消耗燃油（美制加仑），保留 2 位 */
  readonly gallons: number
  /** 总油费，保留 2 位 */
  readonly cost: number
  /** 每公里成本，保留 3 位 */
  readonly costPerKm: number
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits
  return Math.round((value + Number.EPSILON) * factor) / factor
}

function requireInRange(value: number, min: number, max: number, label: string): number {
  if (!Number.isFinite(value) || value <= min || value > max) {
    throw new Error(`${label} must be greater than ${min} and at most ${max}`)
  }
  return value
}

/** 计算燃油消耗量与油费，支持公制/英制单位；非法输入抛英文 Error */
export function calculateFuelCost(input: FuelCostInput): FuelCostResult {
  const distance = requireInRange(input.distance, 0, MAX_DISTANCE, 'Distance')
  const consumption = requireInRange(input.consumption, 0, MAX_CONSUMPTION, 'Consumption')
  const price = requireInRange(input.price, 0, MAX_PRICE, 'Price')

  const totalDistance = round(input.roundTrip ? distance * 2 : distance, 2)

  let liters: number
  let gallons: number
  let cost: number

  if (input.unitSystem === 'metric') {
    const mode = input.consumptionMode ?? 'lPer100km'
    if (mode === 'lPer100km') {
      liters = (totalDistance / 100) * consumption
    } else if (mode === 'kmPerL') {
      liters = totalDistance / consumption
    } else {
      throw new Error(`Unknown consumption mode: ${String(mode)}`)
    }
    gallons = liters / LITERS_PER_GALLON
    cost = liters * price
  } else if (input.unitSystem === 'imperial') {
    gallons = totalDistance / consumption
    liters = gallons * LITERS_PER_GALLON
    cost = gallons * price
  } else {
    throw new Error(`Unknown unit system: ${String(input.unitSystem)}`)
  }

  const distanceKm = input.unitSystem === 'metric' ? totalDistance : totalDistance * KM_PER_MILE

  return {
    totalDistance,
    liters: round(liters, 2),
    gallons: round(gallons, 2),
    cost: round(cost, 2),
    costPerKm: round(cost / distanceKm, 3),
  }
}
