import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { checkRange, type RangeCheck } from './semver-range-checker.service'

const VERSION_EXAMPLES = ['1.2.3', '1.2.3-beta.1', '2.0.0'] as const
const RANGE_EXAMPLES = ['^1.2.3', '~1.2', '>=2 <3', '1.x'] as const

type CheckState = {
  result: RangeCheck | null
  error: string | null
}

function translateError(message: string, t: (key: string) => string): string {
  if (message.includes('Version is empty')) {
    return t('errors.emptyVersion')
  }
  if (message.includes('Invalid semantic version')) {
    return t('errors.invalidVersion')
  }
  if (message.includes('Range is empty')) {
    return t('errors.emptyRange')
  }
  return t('errors.invalidRange')
}

export default function SemverRangeChecker() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'semver-range-checker' })
  const [version, setVersion] = useState('1.2.3')
  const [range, setRange] = useState('^1.2.0')

  const state = useMemo<CheckState>(() => {
    if (version.trim() === '' || range.trim() === '') {
      return { result: null, error: null }
    }
    try {
      return { result: checkRange(version, range), error: null }
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : 'Invalid input',
      }
    }
  }, [version, range])

  const reasonKey =
    state.result === null
      ? null
      : state.result.reason === 'wildcard'
        ? 'reasonWildcard'
        : state.result.reason === 'matched'
          ? 'reasonMatched'
          : 'reasonNoMatch'

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('inputTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="semver-version">{t('versionLabel')}</Label>
              <Input
                id="semver-version"
                value={version}
                onChange={(event) => setVersion(event.target.value)}
                placeholder={t('versionPlaceholder')}
                spellCheck={false}
                className="font-mono"
              />
              <div className="flex flex-wrap gap-1.5">
                {VERSION_EXAMPLES.map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setVersion(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="semver-range">{t('rangeLabel')}</Label>
              <Input
                id="semver-range"
                value={range}
                onChange={(event) => setRange(event.target.value)}
                placeholder={t('rangePlaceholder')}
                spellCheck={false}
                className="font-mono"
              />
              <span className="text-muted-foreground text-xs">{t('rangeExamplesLabel')}</span>
              <div className="flex flex-wrap gap-1.5">
                {RANGE_EXAMPLES.map((example) => (
                  <Button
                    key={example}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRange(example)}
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('resultTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {state.error !== null && (
              <Alert variant="destructive">
                <AlertTitle>{t('errorTitle')}</AlertTitle>
                <AlertDescription>{translateError(state.error, t)}</AlertDescription>
              </Alert>
            )}

            {state.result === null && state.error === null && (
              <p className="text-muted-foreground text-sm">{t('emptyHint')}</p>
            )}

            {state.result !== null && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={state.result.satisfied ? 'default' : 'destructive'}>
                    {state.result.satisfied ? t('satisfied') : t('notSatisfied')}
                  </Badge>
                  <span className="text-muted-foreground font-mono text-xs">
                    {state.result.version}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{t('reasonLabel')}</span>
                  <span className="text-sm">{reasonKey === null ? '' : t(reasonKey)}</span>
                  {state.result.matchedSet !== null && (
                    <span className="font-mono text-xs">{state.result.matchedSet}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{t('normalizedLabel')}</span>
                  <TextareaCopyable value={state.result.normalizedRange} rows={2} className="font-mono" />
                </div>

                {state.result.comparators.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-muted-foreground text-xs">{t('comparatorsLabel')}</span>
                    <ul className="flex flex-col gap-1">
                      {state.result.comparators.map((comparator) => (
                        <li
                          key={comparator.comparator}
                          className="flex items-center gap-2 text-sm"
                        >
                          {comparator.satisfied ? (
                            <Check className="text-primary size-4" />
                          ) : (
                            <X className="text-destructive size-4" />
                          )}
                          <span className="font-mono text-xs">{comparator.comparator}</span>
                          <span className="text-muted-foreground text-xs">
                            {comparator.satisfied ? t('comparatorOk') : t('comparatorFail')}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
