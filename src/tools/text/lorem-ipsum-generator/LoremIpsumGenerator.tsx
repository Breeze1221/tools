import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCopy } from '@/composable/use-copy'
import {
  LOREM_COUNT_MAX,
  LOREM_COUNT_MIN,
  generateLorem,
  loremLanguages,
  loremTypes,
  type LoremOptions,
} from './lorem-ipsum-generator.service'

const DEFAULT_OPTIONS: LoremOptions = {
  type: 'paragraph',
  count: 3,
  startWithLorem: true,
  language: 'latin',
}

export default function LoremIpsumGenerator() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'lorem-ipsum-generator' })
  const { t: tCommon } = useTranslation('common')
  const { copy, isCopied } = useCopy()

  const [options, setOptions] = useState<LoremOptions>(DEFAULT_OPTIONS)
  const [output, setOutput] = useState(() => generateLorem(DEFAULT_OPTIONS))

  // 选项一变就立刻重生成；输出留在 state 里，避免每次渲染都换一份随机结果
  const apply = (patch: Partial<LoremOptions>) => {
    const next = { ...options, ...patch }
    setOptions(next)
    setOutput(generateLorem(next))
  }

  const paragraphs = options.type === 'paragraph' ? output.split('\n\n') : []

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>{t('mode')}</Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={options.type}
              onValueChange={(next) => {
                if (next === 'paragraph' || next === 'sentence' || next === 'word') {
                  apply({ type: next })
                }
              }}
            >
              {loremTypes.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {t(`type.${item}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="lorem-count">{t('count')}</Label>
              <span className="text-muted-foreground font-mono text-sm tabular-nums">
                {options.count} {t(`unit.${options.type}`)}
              </span>
            </div>
            <Slider
              id="lorem-count"
              min={LOREM_COUNT_MIN}
              max={LOREM_COUNT_MAX}
              step={1}
              value={[options.count]}
              onValueChange={(values) => apply({ count: values[0] ?? options.count })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('language')}</Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={options.language}
              onValueChange={(next) => {
                if (next === 'latin' || next === 'chinese') {
                  apply({ language: next })
                }
              }}
            >
              {loremLanguages.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {t(`languageName.${item}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {options.language === 'chinese' && (
              <p className="text-muted-foreground text-xs">{t('chineseHint')}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="lorem-start"
              checked={options.startWithLorem}
              onCheckedChange={(checked) => apply({ startWithLorem: checked })}
            />
            <Label htmlFor="lorem-start" className="font-normal">
              {t('startWithLorem')}
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>{t('output')}</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => setOutput(generateLorem(options))}
            >
              <RefreshCw className="size-4" />
              {t('regenerate')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void copy(output)}
            >
              {isCopied(output) ? <Check className="size-4" /> : <Copy className="size-4" />}
              {tCommon('copy')}
            </Button>
          </div>
        </div>

        <div className="bg-muted/40 min-h-48 rounded-lg border p-4 text-sm leading-relaxed">
          {paragraphs.length > 0 ? (
            paragraphs.map((item, index) => (
              <p key={`${index}-${item.slice(0, 16)}`} className="mb-3 break-words last:mb-0">
                {item}
              </p>
            ))
          ) : (
            <p className="break-words whitespace-pre-wrap">{output}</p>
          )}
        </div>
      </div>
    </div>
  )
}
