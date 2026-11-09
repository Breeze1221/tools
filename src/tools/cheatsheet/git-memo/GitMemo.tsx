import { useTranslation } from 'react-i18next'

import { SpanCopyable } from '@/components/copyable/span-copyable'
import { InstallGuide } from '@/components/install-guide'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { gitInstallGuide, gitMemoGroups } from './git-memo.service'

export default function GitMemo() {
  const { t } = useTranslation('tools-cheatsheet')

  return (
    <div className="flex flex-col gap-4">
      <InstallGuide
        ns="tools-cheatsheet"
        scope="git-memo"
        title={t('git-memo.group-install')}
        steps={gitInstallGuide}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {gitMemoGroups.map((group) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle className="text-base">{t(`git-memo.group-${group.id}`)}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {group.items.map((item) => (
                <div
                  key={item.descriptionKey}
                  className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
                >
                  <SpanCopyable value={item.command} className="shrink-0 sm:w-64" />
                  <span className="text-muted-foreground text-sm">
                    {t(`git-memo.${item.descriptionKey}`)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
