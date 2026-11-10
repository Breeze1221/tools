import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  TSCONFIG_JSX,
  TSCONFIG_LIBS,
  TSCONFIG_MODULES,
  TSCONFIG_MODULE_RESOLUTIONS,
  TSCONFIG_PRESETS,
  TSCONFIG_TARGETS,
  generateTsconfig,
  type TsconfigLib,
  type TsconfigOptions,
} from './tsconfig-generator.service'

function formatPaths(paths: TsconfigOptions['paths']): string {
  return Object.entries(paths)
    .map(([key, targets]) => `${key}=${targets.join(', ')}`)
    .join('\n')
}

function parsePaths(text: string): Record<string, string[]> {
  const paths: Record<string, string[]> = {}
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '') {
      continue
    }
    const separator = line.indexOf('=')
    if (separator === -1) {
      paths[line.trim()] = []
      continue
    }
    paths[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .split(',')
      .map((target) => target.trim())
      .filter((target) => target !== '')
  }
  return paths
}

function libKey(lib: TsconfigLib): string {
  return `lib-${lib.toLowerCase().replaceAll('.', '-')}`
}

type SelectFieldProps<T extends string> = {
  id: string
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}

function SelectField<T extends string>({ id, label, value, options, onChange }: SelectFieldProps<T>) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const match = options.find((item) => item === next)
          if (match !== undefined) {
            onChange(match)
          }
        }}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function TsconfigGenerator() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'tsconfig-generator' })
  const [options, setOptions] = useState<TsconfigOptions>(TSCONFIG_PRESETS[0].options)
  const [pathsText, setPathsText] = useState(() => formatPaths(TSCONFIG_PRESETS[0].options.paths))

  const update = (patch: Partial<TsconfigOptions>) => {
    setOptions((current) => ({ ...current, ...patch }))
  }

  const applyPreset = (preset: TsconfigOptions) => {
    setOptions(preset)
    setPathsText(formatPaths(preset.paths))
  }

  const toggleLib = (lib: TsconfigLib) => {
    const hasLib = options.lib.includes(lib)
    update({
      lib: hasLib ? options.lib.filter((item) => item !== lib) : [...options.lib, lib],
    })
  }

  const { output, error } = useMemo(() => {
    try {
      return { output: generateTsconfig(options), error: null as string | null }
    } catch (err) {
      return {
        output: '',
        error: err instanceof Error ? err.message : 'Invalid options',
      }
    }
  }, [options])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground text-xs">{t('presetsLabel')}</span>
        {TSCONFIG_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset(preset.options)}
          >
            {t(`preset-${preset.id}`)}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('compilerTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                id="tsconfig-target"
                label={t('targetLabel')}
                value={options.target}
                options={TSCONFIG_TARGETS}
                onChange={(target) => update({ target })}
              />
              <SelectField
                id="tsconfig-module"
                label={t('moduleLabel')}
                value={options.module}
                options={TSCONFIG_MODULES}
                onChange={(module) => update({ module })}
              />
              <SelectField
                id="tsconfig-module-resolution"
                label={t('moduleResolutionLabel')}
                value={options.moduleResolution}
                options={TSCONFIG_MODULE_RESOLUTIONS}
                onChange={(moduleResolution) => update({ moduleResolution })}
              />
              <SelectField
                id="tsconfig-jsx"
                label={t('jsxLabel')}
                value={options.jsx}
                options={TSCONFIG_JSX}
                onChange={(jsx) => update({ jsx })}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>{t('libLabel')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {TSCONFIG_LIBS.map((lib) => (
                  <Button
                    key={lib}
                    type="button"
                    size="sm"
                    variant={options.lib.includes(lib) ? 'default' : 'outline'}
                    onClick={() => toggleLib(lib)}
                  >
                    {t(libKey(lib))}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="tsconfig-strict"
                  checked={options.strict}
                  onCheckedChange={(strict) => update({ strict })}
                />
                <Label htmlFor="tsconfig-strict" className="cursor-pointer">
                  {t('strictLabel')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tsconfig-es-module-interop"
                  checked={options.esModuleInterop}
                  onCheckedChange={(esModuleInterop) => update({ esModuleInterop })}
                />
                <Label htmlFor="tsconfig-es-module-interop" className="cursor-pointer">
                  {t('esModuleInteropLabel')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tsconfig-skip-lib-check"
                  checked={options.skipLibCheck}
                  onCheckedChange={(skipLibCheck) => update({ skipLibCheck })}
                />
                <Label htmlFor="tsconfig-skip-lib-check" className="cursor-pointer">
                  {t('skipLibCheckLabel')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tsconfig-declaration"
                  checked={options.declaration}
                  onCheckedChange={(declaration) => update({ declaration })}
                />
                <Label htmlFor="tsconfig-declaration" className="cursor-pointer">
                  {t('declarationLabel')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="tsconfig-source-map"
                  checked={options.sourceMap}
                  onCheckedChange={(sourceMap) => update({ sourceMap })}
                />
                <Label htmlFor="tsconfig-source-map" className="cursor-pointer">
                  {t('sourceMapLabel')}
                </Label>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tsconfig-base-url">{t('baseUrlLabel')}</Label>
                <Input
                  id="tsconfig-base-url"
                  value={options.baseUrl}
                  onChange={(event) => update({ baseUrl: event.target.value })}
                  placeholder={t('baseUrlPlaceholder')}
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="tsconfig-out-dir">{t('outDirLabel')}</Label>
                <Input
                  id="tsconfig-out-dir"
                  value={options.outDir}
                  onChange={(event) => update({ outDir: event.target.value })}
                  placeholder={t('outDirPlaceholder')}
                  spellCheck={false}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="tsconfig-paths">{t('pathsLabel')}</Label>
              <Textarea
                id="tsconfig-paths"
                value={pathsText}
                onChange={(event) => {
                  const text = event.target.value
                  setPathsText(text)
                  update({ paths: parsePaths(text) })
                }}
                placeholder={t('pathsPlaceholder')}
                spellCheck={false}
                className="min-h-24 font-mono text-sm"
              />
              <span className="text-muted-foreground text-xs">{t('pathsHint')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-w-0 flex-col">
          <CardHeader>
            <CardTitle className="text-base">{t('outputTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3">
            {error !== null && (
              <Alert variant="destructive">
                <AlertDescription>{t('invalidOptions')}</AlertDescription>
              </Alert>
            )}
            <TextareaCopyable
              value={output}
              rows={22}
              highlight
              language="json"
              className="font-mono"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
