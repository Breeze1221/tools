import { CircleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  buildMetaTags,
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  type MetaTagOptions,
  type MetaWarning,
} from './meta-tag-generator.service'

type BuildState = {
  html: string
  warnings: MetaWarning[]
  failed: boolean
}

const OG_TYPES = ['website', 'article', 'product', 'profile'] as const
type OgType = (typeof OG_TYPES)[number]

const TWITTER_CARDS = ['summary', 'summary_large_image'] as const
type TwitterCard = (typeof TWITTER_CARDS)[number]

function isOgType(value: string): value is OgType {
  return OG_TYPES.some((option) => option === value)
}

function isTwitterCard(value: string): value is TwitterCard {
  return TWITTER_CARDS.some((option) => option === value)
}

function countChars(value: string): number {
  return Array.from(value).length
}

export default function MetaTagGenerator() {
  const { t } = useTranslation('tools-web', { keyPrefix: 'meta-tag-generator' })
  const [title, setTitle] = useState(() => t('sampleTitle'))
  const [description, setDescription] = useState(() => t('sampleDescription'))
  const [canonicalUrl, setCanonicalUrl] = useState('https://example.com/')
  const [imageUrl, setImageUrl] = useState('')
  const [robots, setRobots] = useState('index, follow')
  const [ogType, setOgType] = useState<OgType>('website')
  const [twitterCard, setTwitterCard] = useState<TwitterCard>('summary')
  const [themeColor, setThemeColor] = useState('#0f172a')

  const titleLength = countChars(title.trim())
  const descriptionLength = countChars(description.trim())

  const result = useMemo<BuildState>(() => {
    const options: MetaTagOptions = {
      title,
      description,
      canonicalUrl,
      imageUrl,
      robots,
      ogType,
      twitterCard,
      themeColor,
    }
    try {
      return { ...buildMetaTags(options), failed: false }
    } catch {
      return { html: '', warnings: [], failed: true }
    }
  }, [title, description, canonicalUrl, imageUrl, robots, ogType, twitterCard, themeColor])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('formTitle')}</CardTitle>
          <CardDescription>{t('formHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="meta-title">{t('titleLabel')}</Label>
              <span
                className={cn(
                  'text-xs',
                  titleLength > TITLE_MAX_LENGTH ? 'text-destructive' : 'text-muted-foreground',
                )}
              >
                {t('charCount', { count: titleLength, limit: TITLE_MAX_LENGTH })}
              </span>
            </div>
            <Input
              id="meta-title"
              value={title}
              placeholder={t('titlePlaceholder')}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="meta-description">{t('descriptionLabel')}</Label>
              <span
                className={cn(
                  'text-xs',
                  descriptionLength > DESCRIPTION_MAX_LENGTH
                    ? 'text-destructive'
                    : 'text-muted-foreground',
                )}
              >
                {t('charCount', { count: descriptionLength, limit: DESCRIPTION_MAX_LENGTH })}
              </span>
            </div>
            <Textarea
              id="meta-description"
              value={description}
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-canonical">{t('canonicalLabel')}</Label>
              <Input
                id="meta-canonical"
                value={canonicalUrl}
                spellCheck={false}
                placeholder={t('canonicalPlaceholder')}
                className="font-mono text-sm"
                onChange={(event) => setCanonicalUrl(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-image">{t('imageLabel')}</Label>
              <Input
                id="meta-image"
                value={imageUrl}
                spellCheck={false}
                placeholder={t('imagePlaceholder')}
                className="font-mono text-sm"
                onChange={(event) => setImageUrl(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-robots">{t('robotsLabel')}</Label>
              <Input
                id="meta-robots"
                value={robots}
                spellCheck={false}
                placeholder="index, follow"
                className="font-mono text-sm"
                onChange={(event) => setRobots(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-theme-color">{t('themeColorLabel')}</Label>
              <Input
                id="meta-theme-color"
                value={themeColor}
                spellCheck={false}
                placeholder={t('themeColorPlaceholder')}
                className="font-mono text-sm"
                onChange={(event) => setThemeColor(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-og-type">{t('ogTypeLabel')}</Label>
              <Select
                value={ogType}
                onValueChange={(value) => {
                  if (isOgType(value)) {
                    setOgType(value)
                  }
                }}
              >
                <SelectTrigger id="meta-og-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OG_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`ogTypeOptions.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-twitter-card">{t('twitterCardLabel')}</Label>
              <Select
                value={twitterCard}
                onValueChange={(value) => {
                  if (isTwitterCard(value)) {
                    setTwitterCard(value)
                  }
                }}
              >
                <SelectTrigger id="meta-twitter-card" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TWITTER_CARDS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`twitterCardOptions.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {result.warnings.length > 0 && (
            <Alert>
              <CircleAlert className="size-4" />
              <AlertDescription>
                <span className="font-medium">{t('warningsTitle')}</span>
                <ul className="mt-1 flex flex-col gap-1">
                  {result.warnings.map((warning) => (
                    <li key={warning.field}>
                      {warning.field === 'title'
                        ? t('warningTitleTooLong', {
                            length: warning.length,
                            limit: warning.limit,
                          })
                        : t('warningDescriptionTooLong', {
                            length: warning.length,
                            limit: warning.limit,
                          })}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <TextareaCopyable
            value={result.html}
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
