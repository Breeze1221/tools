import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SpanCopyable } from '@/components/copyable/span-copyable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MIME_CATEGORIES,
  lookupByExtension,
  lookupByMime,
  searchMime,
  type MimeCategory,
  type MimeEntry,
} from './mime-type-lookup.service'

const ALL = 'all'

export default function MimeTypeLookup() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'mime-type-lookup' })

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>(ALL)

  const results = useMemo(() => {
    const keyword = query.trim()
    const filter = category === ALL ? undefined : (category as MimeCategory)

    if (keyword === '') {
      return searchMime('', filter)
    }

    // 含斜杠按 MIME 精确反查，否则按扩展名精确查询；都没命中再退回模糊搜索
    const exact = keyword.includes('/')
      ? lookupByMime(keyword)
      : lookupByExtension(keyword.replace(/^\.+/, ''))
    const matched = exact.length > 0 ? exact : searchMime(keyword, filter)
    return filter === undefined ? matched : matched.filter((entry) => entry.category === filter)
  }, [query, category])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('searchLabel')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Label htmlFor="mime-query">{t('queryLabel')}</Label>
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  id="mime-query"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('queryPlaceholder')}
                  spellCheck={false}
                  autoComplete="off"
                  className="pl-9 font-mono"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:w-44">
              <Label htmlFor="mime-category">{t('categoryLabel')}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="mime-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>{t('category-all')}</SelectItem>
                  {MIME_CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {t(`categories.${item}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">{t('hint')}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t('resultsLabel')}
            <span className="text-muted-foreground ml-2 text-xs font-normal">
              {t('resultCount', { count: results.length })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">{t('noResults')}</p>
          ) : (
            <ul className="divide-y">
              {results.map((entry) => (
                <MimeRow key={`${entry.mime}-${entry.extensions.join('-')}`} entry={entry} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MimeRow({ entry }: { entry: MimeEntry }) {
  const { t } = useTranslation('tools-development', { keyPrefix: 'mime-type-lookup' })

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <SpanCopyable value={entry.mime} className="self-start" />
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.extensions.map((extension) => (
            <SpanCopyable key={extension} value={`.${extension}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">
          {t(`categories.${entry.category}`)}
        </span>
        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">
          {entry.isText ? t('textType') : t('binaryType')}
        </span>
        <span className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs">
          {entry.isCompressed ? t('compressed') : t('uncompressed')}
        </span>
      </div>
    </li>
  )
}
