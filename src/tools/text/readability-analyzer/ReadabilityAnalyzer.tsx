import { Check, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCopy } from '@/composable/use-copy'
import { analyzeReadability } from './readability-analyzer.service'

export default function ReadabilityAnalyzer() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'readability-analyzer' })
  const { copy, isCopied } = useCopy()

  const [input, setInput] = useState('')
  const result = useMemo(() => analyzeReadability(input), [input])
  const isEmpty = result.stats.words === 0

  const report = useMemo(
    () =>
      [
        t('report.title'),
        `${t('words')}: ${result.stats.words}`,
        `${t('sentences')}: ${result.stats.sentences}`,
        `${t('syllables')}: ${result.stats.syllables}`,
        `${t('complexWords')}: ${result.stats.complexWords}`,
        `${t('chars')}: ${result.stats.chars}`,
        `${t('fleschReadingEase')}: ${result.scores.fleschReadingEase}`,
        `${t('fleschKincaidGrade')}: ${result.scores.fleschKincaidGrade}`,
        `${t('gunningFog')}: ${result.scores.gunningFog}`,
        `${t('levelLabel')}: ${t(`level.${result.level}`)}`,
      ].join('\n'),
    [result, t],
  )

  const statItems = [
    { key: 'words', value: result.stats.words },
    { key: 'sentences', value: result.stats.sentences },
    { key: 'syllables', value: result.stats.syllables },
    { key: 'complexWords', value: result.stats.complexWords },
    { key: 'chars', value: result.stats.chars },
  ] as const

  const scoreItems = [
    { key: 'fleschReadingEase', value: result.scores.fleschReadingEase },
    { key: 'fleschKincaidGrade', value: result.scores.fleschKincaidGrade },
    { key: 'gunningFog', value: result.scores.gunningFog },
  ] as const

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="readability-input">{t('inputLabel')}</Label>
            <Textarea
              id="readability-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('inputPlaceholder')}
              className="min-h-40 font-mono text-sm"
              spellCheck={false}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('statsLabel')}</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {statItems.map((item) => (
                <div key={item.key} className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
                  <span className="text-muted-foreground text-xs">{t(item.key)}</span>
                  <span className="font-mono text-lg tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Label>{t('scoresLabel')}</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {scoreItems.map((item) => (
            <div key={item.key} className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-muted-foreground text-xs">{t(item.key)}</span>
              <span className="font-mono text-2xl tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{t('levelLabel')}</span>
              <span className="font-medium">{t(`level.${result.level}`)}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={isEmpty}
              onClick={() => void copy(report)}
            >
              {isCopied(report) ? <Check className="text-primary size-4" /> : <Copy className="size-4" />}
              {t('copyReport')}
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            {isEmpty ? t('empty') : t(`levelDescription.${result.level}`)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
