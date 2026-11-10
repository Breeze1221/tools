import { AlertCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SpanCopyable } from '@/components/copyable/span-copyable'
import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  findMatches,
  highlightSegments,
  regexFlags,
  replaceMatches,
  type RegexFlag,
  type RegexMatch,
} from './regex-tester.service'

/** 单次最多渲染的匹配条数，避免超大文本把页面卡死 */
const MAX_RENDERED_MATCHES = 500

type RegexState = {
  readonly matches: readonly RegexMatch[]
  readonly replaced: string
  readonly error: string | null
}

/** 匹配的捕获组：先列编号组，再列命名组 */
function MatchGroups({ match }: { match: RegexMatch }) {
  const { t } = useTranslation('tools-development', { keyPrefix: 'regex-tester' })
  const named = Object.entries(match.namedGroups)

  if (match.groups.length === 0 && named.length === 0) {
    return <span className="text-muted-foreground">{t('emptyGroup')}</span>
  }

  const chip =
    'bg-muted inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs'

  return (
    <div className="flex flex-wrap items-center gap-1">
      {match.groups.map((value, index) => (
        <span key={`group-${index + 1}`} className={chip} title={value ?? undefined}>
          <span className="text-muted-foreground shrink-0">
            {t('groupLabel', { index: index + 1 })}
          </span>
          <span className="truncate">{value ?? t('emptyGroup')}</span>
        </span>
      ))}
      {named.map(([name, value]) => (
        <span key={`named-${name}`} className={chip} title={value ?? undefined}>
          <span className="text-muted-foreground shrink-0">{name}</span>
          <span className="truncate">{value ?? t('emptyGroup')}</span>
        </span>
      ))}
    </div>
  )
}

/** 正则表达式测试器：实时高亮匹配、列出捕获组并预览替换结果 */
export default function RegexTester() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'regex-tester' })

  const [pattern, setPattern] = useState('')
  const [flags, setFlags] = useState<RegexFlag[]>(['g'])
  const [text, setText] = useState('')
  const [replacement, setReplacement] = useState('')

  const activeFlags = flags.join('')

  const state = useMemo<RegexState>(() => {
    if (pattern === '') {
      return { matches: [], replaced: '', error: null }
    }
    try {
      return {
        matches: findMatches(pattern, activeFlags, text),
        replaced: replaceMatches(pattern, activeFlags, text, replacement),
        error: null,
      }
    } catch (error) {
      return {
        matches: [],
        replaced: '',
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }, [pattern, activeFlags, text, replacement])

  const visibleMatches = state.matches.slice(0, MAX_RENDERED_MATCHES)
  const segments = useMemo(
    () => highlightSegments(text, state.matches.slice(0, MAX_RENDERED_MATCHES)),
    [text, state.matches],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="regex-tester-pattern">{t('patternLabel')}</Label>
        <Input
          id="regex-tester-pattern"
          value={pattern}
          onChange={(event) => setPattern(event.target.value)}
          placeholder={t('patternPlaceholder')}
          spellCheck={false}
          aria-invalid={state.error !== null}
          className="font-mono text-sm"
        />

        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-muted-foreground text-xs">{t('flagsLabel')}</Label>
          <ToggleGroup
            type="multiple"
            variant="outline"
            size="sm"
            value={flags}
            onValueChange={(next) => setFlags(regexFlags.filter((flag) => next.includes(flag)))}
          >
            {regexFlags.map((flag) => (
              <ToggleGroupItem
                key={flag}
                value={flag}
                title={t(`flags.${flag}`)}
                aria-label={t(`flags.${flag}`)}
                className="font-mono"
              >
                {flag}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <p className="text-muted-foreground text-xs">{t('flagsHint')}</p>

        {state.error !== null && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription className="flex flex-col gap-1">
              <span>{t('invalidPattern')}</span>
              <code className="font-mono text-xs break-all">{state.error}</code>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="regex-tester-text">{t('textLabel')}</Label>
        <Textarea
          id="regex-tester-text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t('textPlaceholder')}
          spellCheck={false}
          className="min-h-32 font-mono text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('highlightLabel')}</Label>
        <div className="bg-muted/40 min-h-20 rounded-lg border p-3 font-mono text-sm leading-relaxed break-all whitespace-pre-wrap">
          {text === '' ? (
            <span className="text-muted-foreground">{t('highlightEmpty')}</span>
          ) : (
            segments.map((segment, index) =>
              segment.matched ? (
                <mark key={index} className="bg-primary/20 text-foreground rounded-sm">
                  {segment.text}
                </mark>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>{t('matchesLabel')}</Label>
          <span className="text-muted-foreground text-xs tabular-nums">
            {t('matchCount', { count: state.matches.length })}
          </span>
        </div>

        {state.matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {pattern === '' ? t('matchesEmpty') : t('noMatches')}
          </p>
        ) : (
          <>
            <div className="max-h-80 min-h-0 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">{t('colIndex')}</TableHead>
                    <TableHead className="w-16">{t('colPosition')}</TableHead>
                    <TableHead>{t('colText')}</TableHead>
                    <TableHead>{t('colGroups')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMatches.map((match, index) => (
                    <TableRow key={`${match.index}-${index}`}>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {match.index}
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <SpanCopyable value={match.text} className="max-w-[16rem] align-middle" />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <MatchGroups match={match} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {state.matches.length > MAX_RENDERED_MATCHES && (
              <p className="text-muted-foreground text-xs">
                {t('truncated', { max: MAX_RENDERED_MATCHES })}
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="regex-tester-replacement">{t('replacementLabel')}</Label>
        <Input
          id="regex-tester-replacement"
          value={replacement}
          onChange={(event) => setReplacement(event.target.value)}
          placeholder={t('replacementPlaceholder')}
          spellCheck={false}
          className="font-mono text-sm"
        />
        <p className="text-muted-foreground text-xs">{t('replacementHint')}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('resultLabel')}</Label>
        <TextareaCopyable value={state.replaced} rows={4} placeholder={t('resultPlaceholder')} />
      </div>
    </div>
  )
}
