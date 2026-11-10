import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { downloadText } from '@/utils/download'
import {
  buildSitemap,
  SITEMAP_CHANGEFREQS,
  type SitemapChangeFreq,
} from './sitemap-generator.service'

type ChangefreqChoice = SitemapChangeFreq | 'none'

function isChangefreq(value: string): value is SitemapChangeFreq {
  return SITEMAP_CHANGEFREQS.some((option) => option === value)
}

function toLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
}

const DEFAULT_URLS = ['https://example.com/', 'https://example.com/about'].join('\n')

export default function SitemapGenerator() {
  const { t } = useTranslation('tools-web', { keyPrefix: 'sitemap-generator' })
  const [urls, setUrls] = useState(DEFAULT_URLS)
  const [changefreq, setChangefreq] = useState<ChangefreqChoice>('weekly')
  const [priority, setPriority] = useState('0.8')

  const urlCount = toLines(urls).length

  const result = useMemo(() => {
    try {
      const entries = toLines(urls).map((loc) => ({
        loc,
        changefreq: changefreq === 'none' ? undefined : changefreq,
        priority: priority.trim() === '' ? undefined : Number(priority),
      }))
      return { value: buildSitemap(entries), failed: false }
    } catch {
      return { value: '', failed: true }
    }
  }, [urls, changefreq, priority])

  const handleDownload = () => {
    if (result.value === '') {
      return
    }
    downloadText(result.value, 'sitemap.xml', 'application/xml')
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('urlsTitle')}</CardTitle>
          <CardDescription>{t('urlsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="sitemap-urls">{t('urlsLabel')}</Label>
            <Badge variant="secondary" className="ml-auto">
              {t('urlCount', { count: urlCount })}
            </Badge>
          </div>
          <Textarea
            id="sitemap-urls"
            value={urls}
            rows={8}
            spellCheck={false}
            placeholder={t('urlsPlaceholder')}
            className="font-mono text-sm"
            onChange={(event) => setUrls(event.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('optionsTitle')}</CardTitle>
          <CardDescription>{t('optionsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sitemap-changefreq">{t('changefreqLabel')}</Label>
            <Select
              value={changefreq}
              onValueChange={(value) => {
                if (value === 'none') {
                  setChangefreq('none')
                } else if (isChangefreq(value)) {
                  setChangefreq(value)
                }
              }}
            >
              <SelectTrigger id="sitemap-changefreq" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('noChangefreq')}</SelectItem>
                {SITEMAP_CHANGEFREQS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sitemap-priority">{t('priorityLabel')}</Label>
            <Input
              id="sitemap-priority"
              value={priority}
              inputMode="decimal"
              placeholder={t('priorityPlaceholder')}
              className="font-mono"
              onChange={(event) => setPriority(event.target.value)}
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

          <div className="flex items-center gap-2">
            <Label>{t('outputLabel')}</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto gap-1.5"
              disabled={result.value === ''}
              onClick={handleDownload}
            >
              <Download className="size-4" />
              {t('download')}
            </Button>
          </div>

          <TextareaCopyable
            value={result.value}
            rows={14}
            highlight
            language="xml"
            placeholder={t('outputPlaceholder')}
          />
        </CardContent>
      </Card>
    </div>
  )
}
