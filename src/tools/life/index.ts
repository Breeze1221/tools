import type { DefinedTool } from '../define-tool'

import { tool as barbecuePlanner } from './barbecue-planner'
import { tool as bmiCalculator } from './bmi-calculator'
import { tool as chineseKinshipCalculator } from './chinese-kinship-calculator'
import { tool as fortuneDraw } from './fortune-draw'
import { tool as fuelCostCalculator } from './fuel-cost-calculator'
import { tool as icsCalendarGenerator } from './ics-calendar-generator'
import { tool as randomTeamGenerator } from './random-team-generator'
import { tool as timezoneMeetingPlanner } from './timezone-meeting-planner'
import { tool as tipCalculator } from './tip-calculator'
import { tool as unitConverter } from './unit-converter'
import { tool as waterIntakeCalculator } from './water-intake-calculator'

export const lifeTools: readonly DefinedTool[] = [
  barbecuePlanner,
  chineseKinshipCalculator,
  fortuneDraw,
  unitConverter,
  icsCalendarGenerator,
  timezoneMeetingPlanner,
  bmiCalculator,
  tipCalculator,
  randomTeamGenerator,
  waterIntakeCalculator,
  fuelCostCalculator,
]
