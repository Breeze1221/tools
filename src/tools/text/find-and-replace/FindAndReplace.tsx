import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  countMatches,
  findAndReplace,
  type FindAndReplaceOptions,
} from './find-and-replace.service'

export default function FindAndReplace() {
  const { t } = useTranslation('tools-text', { keyPrefix: 'find-and-replace' })

  const [input, setInput] = useState('')
  const [find, setFind] = useState('')
  const [replacement, setReplacement] = useState('')
  const [useRegex, setUseRegex] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [replaceAll, setReplaceAll] = useState(true)

  const options = useMemo<FindAndReplaceOptions>(
    () => ({ find, replacement, useRegex, caseSensitive, wholeWord, replaceAll }),
    [find, replacement, useRegex, caseSensitive, wholeWord, replaceAll],
  )

  const result = useMemo(() => {
    if (find === '') {
      return { output: input, matches: 0, hasError: false }
    }
    try {
      return {
        output: findAndReplace(input, options).output,
        matches: countMatches(input, options),
        hasError: false,
      }
    } catch {
      return { output: '', matches: 0, hasError: true }
    }
  }, [input, find, options])

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="find-replace-input">{t('inputLabel')}</Label>
            <Textarea
              id="find-replace-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t('inputPlaceholder')}
              className="min-h-40 font-mono text-sm"
              spellCheck={false}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="find-replace-find">{t('findLabel')}</Label>
              <Input
                id="find-replace-find"
                value={find}
                onChange={(event) => setFind(event.target.value)}
                placeholder={t('findPlaceholder')}
                className="font-mono"
                spellCheck={false}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="find-replace-replacement">{t('replacementLabel')}</Label>
              <Input
                id="find-replace-replacement"
                value={replacement}
                onChange={(event) => setReplacement(event.target.value)}
                placeholder={t('replacementPlaceholder')}
                className="font-mono"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>{t('optionsLabel')}</Label>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="find-replace-regex"
                  size="sm"
                  checked={useRegex}
                  onCheckedChange={setUseRegex}
                />
                <Label htmlFor="find-replace-regex" className="font-normal">
                  {t('useRegex')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="find-replace-case"
                  size="sm"
                  checked={caseSensitive}
                  onCheckedChange={setCaseSensitive}
                />
                <Label htmlFor="find-replace-case" className="font-normal">
                  {t('caseSensitive')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="find-replace-word"
                  size="sm"
                  checked={wholeWord}
                  onCheckedChange={setWholeWord}
                />
                <Label htmlFor="find-replace-word" className="font-normal">
                  {t('wholeWord')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="find-replace-all"
                  size="sm"
                  checked={replaceAll}
                  onCheckedChange={setReplaceAll}
                />
                <Label htmlFor="find-replace-all" className="font-normal">
                  {t('replaceAll')}
                </Label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-sm">{t('matchesLabel')}</span>
            <Badge variant="secondary" className="font-mono tabular-nums">
              {result.matches}
            </Badge>
            {result.hasError && <span className="text-destructive text-sm">{t('errorInvalid')}</span>}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        <Label>{t('outputLabel')}</Label>
        <TextareaCopyable
          value={result.output}
          rows={10}
          className="font-mono"
          placeholder={t('outputPlaceholder')}
        />
      </div>
    </div>
  )
}
