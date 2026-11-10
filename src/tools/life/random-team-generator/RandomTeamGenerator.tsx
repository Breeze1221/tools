import { Check, Copy, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCopy } from '@/composable/use-copy'
import { parseNameList, splitTeams, type SplitTeamsResult } from './random-team-generator.service'

type GroupMode = 'teamCount' | 'teamSize'

const MODES: readonly GroupMode[] = ['teamCount', 'teamSize']

/** 随机分队：名单 + 队数/队长，洗牌后均分并展示每队成员 */
export default function RandomTeamGenerator() {
  const { t } = useTranslation('tools-life', { keyPrefix: 'random-team-generator' })
  const { copy, isCopied } = useCopy()

  const [namesText, setNamesText] = useState('')
  const [mode, setMode] = useState<GroupMode>('teamCount')
  const [teamCountInput, setTeamCountInput] = useState('3')
  const [teamSizeInput, setTeamSizeInput] = useState('4')
  const [result, setResult] = useState<SplitTeamsResult | null>(null)
  const [hasError, setHasError] = useState(false)

  const names = useMemo(() => parseNameList(namesText), [namesText])

  const copyText = useMemo(
    () =>
      result === null
        ? ''
        : result.teams.map((team) => `${team.name}: ${team.members.join(', ')}`).join('\n'),
    [result],
  )

  const handleGenerate = () => {
    const teamNames = Array.from({ length: names.length }, (_, index) =>
      t('teamName', { n: index + 1 }),
    )
    try {
      const next = splitTeams(
        names,
        mode === 'teamCount'
          ? { teamCount: Number(teamCountInput), teamNames }
          : { teamSize: Number(teamSizeInput), teamNames },
      )
      setResult(next)
      setHasError(false)
    } catch {
      setResult(null)
      setHasError(true)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-base">{t('formTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="team-names">{t('namesLabel')}</Label>
              <span className="text-muted-foreground text-xs">
                {t('nameCount', { n: names.length })}
              </span>
            </div>
            <Textarea
              id="team-names"
              rows={6}
              value={namesText}
              placeholder={t('namesPlaceholder')}
              onChange={(event) => setNamesText(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t('namesHint')}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('modeLabel')}</Label>
            <ToggleGroup
              type="single"
              size="sm"
              value={mode}
              onValueChange={(value) => {
                const next = MODES.find((item) => item === value)
                if (next) {
                  setMode(next)
                }
              }}
            >
              {MODES.map((item) => (
                <ToggleGroupItem key={item} value={item}>
                  {t(`mode.${item}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="flex flex-col gap-2 sm:max-w-48">
            <Label htmlFor="team-size-input">
              {mode === 'teamCount' ? t('teamCountLabel') : t('teamSizeLabel')}
            </Label>
            <Input
              id="team-size-input"
              type="number"
              min={mode === 'teamCount' ? 2 : 1}
              max={Math.max(2, names.length)}
              step={1}
              inputMode="numeric"
              value={mode === 'teamCount' ? teamCountInput : teamSizeInput}
              onChange={(event) => {
                if (mode === 'teamCount') {
                  setTeamCountInput(event.target.value)
                } else {
                  setTeamSizeInput(event.target.value)
                }
              }}
              className="font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" className="gap-1.5" onClick={handleGenerate}>
              <Shuffle className="size-4" />
              {t('generate')}
            </Button>
            {hasError && (
              <Alert variant="destructive" className="w-full">
                <AlertDescription>{t('invalidInput')}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{t('resultLabel')}</CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto gap-1.5"
              disabled={copyText === ''}
              onClick={() => void copy(copyText)}
            >
              {isCopied(copyText) ? <Check className="size-4" /> : <Copy className="size-4" />}
              {isCopied(copyText) ? t('copied') : t('copy')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {result === null ? (
            <div className="bg-muted/40 text-muted-foreground flex min-h-24 items-center justify-center rounded-lg border p-4 text-center text-sm">
              {t('resultEmpty')}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.teams.map((team) => (
                <div
                  key={team.index}
                  className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{team.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {t('memberCount', { n: team.members.length })}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {team.members.map((member) => (
                      <Badge key={member} variant="outline">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
