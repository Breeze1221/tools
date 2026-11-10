import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { IoPair } from '@/components/io-pair'
import { MorphSelect } from '@/components/select/morph-select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { buildToc, extractHeadings, type TocOptions } from './markdown-toc-generator.service'

const LEVEL_ITEMS = [1, 2, 3, 4, 5, 6].map((level) => ({
  value: String(level),
  label: `H${level}`,
}))

const DEFAULT_OPTIONS: TocOptions = {
  maxLevel: 6,
  links: true,
  ordered: false,
  nested: true,
}

export default function MarkdownTocGenerator() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'markdown-toc-generator' })
  const { t: tCommon } = useTranslation('common')

  const [input, setInput] = useState('')
  const [options, setOptions] = useState<TocOptions>(DEFAULT_OPTIONS)

  const output = useMemo(() => buildToc(extractHeadings(input), options), [input, options])

  const patch = (next: Partial<TocOptions>) => {
    setOptions((current) => ({ ...current, ...next }))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex items-center gap-2">
          <Label>{t('maxLevel')}</Label>
          <MorphSelect
            label={t('maxLevel')}
            hideLabel
            size="sm"
            className="w-24"
            items={LEVEL_ITEMS}
            value={String(options.maxLevel)}
            onValueChange={(next) => patch({ maxLevel: Number(next) })}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="toc-links"
            size="sm"
            checked={options.links}
            onCheckedChange={(checked) => patch({ links: checked })}
          />
          <Label htmlFor="toc-links" className="font-normal">
            {t('links')}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="toc-ordered"
            size="sm"
            checked={options.ordered}
            onCheckedChange={(checked) => patch({ ordered: checked })}
          />
          <Label htmlFor="toc-ordered" className="font-normal">
            {t('ordered')}
          </Label>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="toc-nested"
            size="sm"
            checked={options.nested}
            onCheckedChange={(checked) => patch({ nested: checked })}
          />
          <Label htmlFor="toc-nested" className="font-normal">
            {t('nested')}
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
          language: 'markdown',
        }}
        fullscreenLabel={tCommon('fullscreen')}
      />
    </div>
  )
}
