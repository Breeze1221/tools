import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IoPair } from '@/components/io-pair'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { slugifyLines, type SlugOptions, type SlugSeparator } from './url-slug-generator.service'

type SeparatorValue = 'dash' | 'underscore' | 'none'

const SEPARATOR_VALUES: Record<SeparatorValue, SlugSeparator> = {
  dash: '-',
  underscore: '_',
  none: '',
}

const DEFAULT_OPTIONS: SlugOptions = {
  separator: '-',
  lowercase: true,
  dedupe: false,
  keepChinese: true,
  asciiOnly: false,
}

export default function UrlSlugGenerator() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'url-slug-generator' })
  const { t: tCommon } = useTranslation('common')

  const [input, setInput] = useState('')
  const [options, setOptions] = useState<SlugOptions>(DEFAULT_OPTIONS)

  const separatorValue = (Object.keys(SEPARATOR_VALUES) as SeparatorValue[]).find(
    (key) => SEPARATOR_VALUES[key] === options.separator,
  )

  const output = useMemo(() => slugifyLines(input, options), [input, options])

  const patch = (next: Partial<SlugOptions>) => {
    setOptions((current) => ({ ...current, ...next }))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <Label>{t('separator')}</Label>
          <ToggleGroup
            type="single"
            size="sm"
            value={separatorValue}
            onValueChange={(next) => {
              if (next === 'dash' || next === 'underscore' || next === 'none') {
                patch({ separator: SEPARATOR_VALUES[next] })
              }
            }}
          >
            <ToggleGroupItem value="dash">{t('separatorDash')}</ToggleGroupItem>
            <ToggleGroupItem value="underscore">{t('separatorUnderscore')}</ToggleGroupItem>
            <ToggleGroupItem value="none">{t('separatorNone')}</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="slug-lowercase"
            size="sm"
            checked={options.lowercase}
            onCheckedChange={(checked) => patch({ lowercase: checked })}
          />
          <Label htmlFor="slug-lowercase" className="font-normal">
            {t('lowercase')}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="slug-dedupe"
            size="sm"
            checked={options.dedupe}
            onCheckedChange={(checked) => patch({ dedupe: checked })}
          />
          <Label htmlFor="slug-dedupe" className="font-normal">
            {t('dedupe')}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="slug-keep-chinese"
            size="sm"
            checked={options.keepChinese}
            disabled={options.asciiOnly}
            onCheckedChange={(checked) => patch({ keepChinese: checked })}
          />
          <Label htmlFor="slug-keep-chinese" className="font-normal">
            {t('keepChinese')}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="slug-ascii-only"
            size="sm"
            checked={options.asciiOnly}
            onCheckedChange={(checked) => patch({ asciiOnly: checked })}
          />
          <Label htmlFor="slug-ascii-only" className="font-normal">
            {t('asciiOnly')}
          </Label>
        </div>
      </div>

      <IoPair
        input={{
          value: input,
          placeholder: t('inputPlaceholder'),
          onValueChange: setInput,
        }}
        output={{
          value: output,
          placeholder: t('outputPlaceholder'),
        }}
        fullscreenLabel={tCommon('fullscreen')}
      />
    </div>
  )
}
