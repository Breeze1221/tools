import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { buildRobotsTxt } from './robots-txt-generator.service'

type GroupDraft = {
  id: number
  userAgent: string
  allow: string
  disallow: string
  crawlDelay: string
}

function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

function createGroup(id: number): GroupDraft {
  return { id, userAgent: '*', allow: '', disallow: '', crawlDelay: '' }
}

export default function RobotsTxtGenerator() {
  const { t } = useTranslation('tools-web', { keyPrefix: 'robots-txt-generator' })
  const nextId = useRef(2)
  const [groups, setGroups] = useState<GroupDraft[]>(() => [
    { ...createGroup(1), disallow: '/admin\n/private' },
  ])
  const [sitemaps, setSitemaps] = useState('https://example.com/sitemap.xml')
  const [host, setHost] = useState('')

  const result = useMemo(() => {
    try {
      return {
        value: buildRobotsTxt({
          groups: groups.map((group) => ({
            userAgent: group.userAgent,
            allow: toLines(group.allow),
            disallow: toLines(group.disallow),
            crawlDelay: group.crawlDelay.trim() === '' ? undefined : Number(group.crawlDelay),
          })),
          sitemaps: toLines(sitemaps),
          host,
        }),
        failed: false,
      }
    } catch {
      return { value: '', failed: true }
    }
  }, [groups, sitemaps, host])

  const updateGroup = (id: number, patch: Partial<Omit<GroupDraft, 'id'>>) => {
    setGroups((previous) =>
      previous.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    )
  }

  const handleAddGroup = () => {
    const id = nextId.current
    nextId.current += 1
    setGroups((previous) => [...previous, createGroup(id)])
  }

  const handleRemoveGroup = (id: number) => {
    setGroups((previous) =>
      previous.length === 1 ? previous : previous.filter((g) => g.id !== id),
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('groupsTitle')}</CardTitle>
          <CardDescription>{t('groupsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('groupCount', { count: groups.length })}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={handleAddGroup}
            >
              <Plus className="size-4" />
              {t('addGroup')}
            </Button>
          </div>

          {groups.map((group, index) => (
            <div key={group.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t('groupLabel', { n: index + 1 })}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto"
                  disabled={groups.length === 1}
                  aria-label={t('removeGroup')}
                  onClick={() => handleRemoveGroup(group.id)}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`robots-user-agent-${group.id}`}>{t('userAgentLabel')}</Label>
                  <Input
                    id={`robots-user-agent-${group.id}`}
                    value={group.userAgent}
                    spellCheck={false}
                    placeholder={t('userAgentPlaceholder')}
                    className="font-mono"
                    onChange={(event) => updateGroup(group.id, { userAgent: event.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`robots-crawl-delay-${group.id}`}>{t('crawlDelayLabel')}</Label>
                  <Input
                    id={`robots-crawl-delay-${group.id}`}
                    value={group.crawlDelay}
                    inputMode="numeric"
                    placeholder={t('crawlDelayPlaceholder')}
                    onChange={(event) => updateGroup(group.id, { crawlDelay: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`robots-allow-${group.id}`}>{t('allowLabel')}</Label>
                  <Textarea
                    id={`robots-allow-${group.id}`}
                    value={group.allow}
                    rows={3}
                    spellCheck={false}
                    placeholder="/"
                    className="font-mono text-sm"
                    onChange={(event) => updateGroup(group.id, { allow: event.target.value })}
                  />
                  <span className="text-muted-foreground text-xs">{t('pathHint')}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor={`robots-disallow-${group.id}`}>{t('disallowLabel')}</Label>
                  <Textarea
                    id={`robots-disallow-${group.id}`}
                    value={group.disallow}
                    rows={3}
                    spellCheck={false}
                    placeholder="/admin"
                    className="font-mono text-sm"
                    onChange={(event) => updateGroup(group.id, { disallow: event.target.value })}
                  />
                  <span className="text-muted-foreground text-xs">{t('pathHint')}</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('sitemapsTitle')}</CardTitle>
          <CardDescription>{t('sitemapsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="robots-sitemaps">{t('sitemapsLabel')}</Label>
            <Textarea
              id="robots-sitemaps"
              value={sitemaps}
              rows={3}
              spellCheck={false}
              placeholder="https://example.com/sitemap.xml"
              className="font-mono text-sm"
              onChange={(event) => setSitemaps(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="robots-host">{t('hostLabel')}</Label>
            <Input
              id="robots-host"
              value={host}
              spellCheck={false}
              placeholder={t('hostPlaceholder')}
              className="font-mono text-sm"
              onChange={(event) => setHost(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('outputTitle')}</CardTitle>
          <CardDescription>{t('outputHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {result.failed && (
            <Alert variant="destructive">
              <AlertDescription>{t('buildError')}</AlertDescription>
            </Alert>
          )}
          <TextareaCopyable
            value={result.value}
            rows={12}
            className="font-mono"
            placeholder={t('outputPlaceholder')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
