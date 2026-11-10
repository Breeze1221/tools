import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  commonPrefixLength,
  jaccardSimilarity,
  levenshteinDistance,
  similarityRatio,
} from './text-similarity.service'

export default function TextSimilarity() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'text-similarity' })

  const [first, setFirst] = useState('')
  const [second, setSecond] = useState('')

  const result = useMemo(
    () => ({
      distance: levenshteinDistance(first, second),
      similarity: similarityRatio(first, second),
      jaccard: jaccardSimilarity(first, second),
      prefix: commonPrefixLength(first, second),
    }),
    [first, second],
  )

  const isBothEmpty = first.trim() === '' && second.trim() === ''

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="text-similarity-first">{t('firstLabel')}</Label>
            <Textarea
              id="text-similarity-first"
              value={first}
              onChange={(event) => setFirst(event.target.value)}
              placeholder={t('firstPlaceholder')}
              className="min-h-40 font-mono text-sm"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="text-similarity-second">{t('secondLabel')}</Label>
            <Textarea
              id="text-similarity-second"
              value={second}
              onChange={(event) => setSecond(event.target.value)}
              placeholder={t('secondPlaceholder')}
              className="min-h-40 font-mono text-sm"
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
          <span className="text-muted-foreground text-xs">{t('distance')}</span>
          <span className="font-mono text-lg tabular-nums">{result.distance}</span>
        </div>

        <div className="bg-muted/40 col-span-2 flex flex-col gap-2 rounded-lg border p-3 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs">{t('similarity')}</span>
            <span className="font-mono text-lg tabular-nums">{result.similarity}%</span>
          </div>
          <Progress value={result.similarity} />
        </div>

        <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
          <span className="text-muted-foreground text-xs">{t('jaccard')}</span>
          <span className="font-mono text-lg tabular-nums">{result.jaccard}%</span>
        </div>

        <div className="bg-muted/40 flex flex-col gap-1 rounded-lg border p-3">
          <span className="text-muted-foreground text-xs">{t('commonPrefix')}</span>
          <span className="font-mono text-lg tabular-nums">{result.prefix}</span>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">{isBothEmpty ? t('empty') : t('hint')}</p>
    </div>
  )
}
