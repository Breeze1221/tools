import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { buildBasicAuthHeader } from './basic-auth-generator.service'

export default function BasicAuthGenerator() {
  const { t } = useTranslation('tools-web', { keyPrefix: 'basic-auth-generator' })
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('s3cret')

  const result = useMemo(() => {
    if (username === '') {
      return { header: '', curl: '', failed: true }
    }
    try {
      const header = buildBasicAuthHeader(username, password)
      return {
        header,
        curl: `curl -H "Authorization: ${header}" https://api.example.com/resource`,
        failed: false,
      }
    } catch {
      return { header: '', curl: '', failed: true }
    }
  }, [username, password])

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('credentialsTitle')}</CardTitle>
          <CardDescription>{t('credentialsHint')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="basic-auth-username">{t('usernameLabel')}</Label>
            <Input
              id="basic-auth-username"
              value={username}
              spellCheck={false}
              placeholder={t('usernamePlaceholder')}
              className="font-mono"
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="basic-auth-password">{t('passwordLabel')}</Label>
            <Input
              id="basic-auth-password"
              value={password}
              spellCheck={false}
              placeholder={t('passwordPlaceholder')}
              className="font-mono"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('headerTitle')}</CardTitle>
          <CardDescription>{t('headerHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {result.failed && (
            <Alert variant="destructive">
              <AlertDescription>{t('emptyUsername')}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <Label>{t('headerLabel')}</Label>
            <TextareaCopyable
              value={result.header}
              rows={2}
              className="font-mono"
              placeholder={t('headerPlaceholder')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t('curlLabel')}</Label>
            <TextareaCopyable value={result.curl} rows={3} className="font-mono" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
