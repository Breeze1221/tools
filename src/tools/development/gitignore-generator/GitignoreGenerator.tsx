import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { downloadText } from '@/utils/download'
import {
  buildGitignore,
  gitignoreTemplateGroups,
  gitignoreTemplates,
} from './gitignore-generator.service'

/** .gitignore 生成器：分组勾选模板，实时合成并支持复制 / 下载 / 自定义追加 */
export default function GitignoreGenerator() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'gitignore-generator' })

  const [selected, setSelected] = useState<readonly string[]>([])
  const [extra, setExtra] = useState('')
  const [query, setQuery] = useState('')

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') {
      return gitignoreTemplates
    }
    return gitignoreTemplates.filter((template) => {
      const id = template.id.toLowerCase()
      const label = template.label.toLowerCase()
      const i18nLabel = t(template.labelKey).toLowerCase()
      return id.includes(q) || label.includes(q) || i18nLabel.includes(q)
    })
  }, [query, t])

  const output = useMemo(() => {
    if (selected.length === 0 && extra.trim() === '') {
      return ''
    }
    try {
      return buildGitignore(selected, extra)
    } catch {
      return ''
    }
  }, [selected, extra])

  const handleToggle = (id: string, checked: boolean) => {
    setSelected((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id]
      }
      return current.filter((item) => item !== id)
    })
  }

  const handleDownload = () => {
    if (output === '') {
      return
    }
    downloadText(output, '.gitignore')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          className="pl-9"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {gitignoreTemplateGroups.map((group) => {
          const groupTemplates = filteredTemplates.filter((template) => template.group === group)
          return (
            <Card key={group}>
              <CardHeader>
                <CardTitle className="text-base">{t(`groups.${group}`)}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {groupTemplates.length === 0 ? (
                  <p className="text-muted-foreground col-span-full text-sm">
                    {t('noMatch')}
                  </p>
                ) : (
                  groupTemplates.map((template) => {
                    const id = `gitignore-${template.id}`
                    return (
                      <Label key={template.id} htmlFor={id} className="cursor-pointer">
                        <Checkbox
                          id={id}
                          checked={selected.includes(template.id)}
                          onCheckedChange={(checked) =>
                            handleToggle(template.id, checked === true)
                          }
                        />
                        {t(template.labelKey)}
                      </Label>
                    )
                  })
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t('extraLabel')}</Label>
        <textarea
          value={extra}
          onChange={(event) => setExtra(event.target.value)}
          placeholder={t('extraPlaceholder')}
          rows={3}
          className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[72px] w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>{t('outputLabel')}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={output === ''}
          >
            <Download className="size-4" />
            {t('download')}
          </Button>
        </div>
        <TextareaCopyable
          value={output}
          rows={14}
          placeholder={t('outputPlaceholder')}
          className="font-mono"
        />
      </div>
    </div>
  )
}
