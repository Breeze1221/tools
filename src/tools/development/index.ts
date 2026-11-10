import type { DefinedTool } from '../define-tool'

import { tool as crontabGenerator } from './crontab-generator'
import { tool as curlGenerator } from './curl-generator'
import { tool as chmodCalculator } from './chmod-calculator'
import { tool as dockerRunToDockerComposeConverter } from './docker-run-to-docker-compose-converter'
import { tool as formatStudio } from './format-studio'
import { tool as githubAccelerator } from './github-accelerator'
import { tool as encoderDecoder } from './encoder-decoder'
import { tool as colorConverter } from './color-converter'
import { tool as dateTimeConverter } from './date-time-converter'
import { tool as regexTester } from './regex-tester'
import { tool as svgToJsx } from './svg-to-jsx'
import { tool as gitignoreGenerator } from './gitignore-generator'
import { tool as wcagContrastChecker } from './wcag-contrast-checker'
import { tool as jsonToTypescript } from './json-to-typescript'
import { tool as fakeDataGenerator } from './fake-data-generator'
import { tool as cssGradientGenerator } from './css-gradient-generator'
import { tool as numberBaseConverter } from './number-base-converter'
import { tool as mimeTypeLookup } from './mime-type-lookup'
import { tool as jsonlConverter } from './jsonl-converter'
import { tool as cssUnitConverter } from './css-unit-converter'
import { tool as dotenvConverter } from './dotenv-converter'
import { tool as cssBoxShadowGenerator } from './css-box-shadow-generator'
import { tool as semverRangeChecker } from './semver-range-checker'
import { tool as cssFlexboxPlayground } from './css-flexbox-playground'
import { tool as cssGridGenerator } from './css-grid-generator'
import { tool as htaccessGenerator } from './htaccess-generator'
import { tool as jsonSchemaGenerator } from './json-schema-generator'
import { tool as tsconfigGenerator } from './tsconfig-generator'

export const developmentTools: readonly DefinedTool[] = [
  formatStudio,
  encoderDecoder,
  crontabGenerator,
  curlGenerator,
  chmodCalculator,
  dockerRunToDockerComposeConverter,
  githubAccelerator,
  colorConverter,
  dateTimeConverter,
  regexTester,
  svgToJsx,
  gitignoreGenerator,
  wcagContrastChecker,
  jsonToTypescript,
  fakeDataGenerator,
  cssGradientGenerator,
  numberBaseConverter,
  mimeTypeLookup,
  jsonlConverter,
  cssUnitConverter,
  dotenvConverter,
  cssBoxShadowGenerator,
  semverRangeChecker,
  cssFlexboxPlayground,
  cssGridGenerator,
  htaccessGenerator,
  jsonSchemaGenerator,
  tsconfigGenerator,
]
