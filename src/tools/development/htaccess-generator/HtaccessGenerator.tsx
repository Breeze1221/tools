import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  HTACCESS_STATUS_CODES,
  buildHtaccess,
  type HtaccessStatus,
} from './htaccess-generator.service'

type RedirectRow = {
  readonly id: string
  from: string
  to: string
  status: HtaccessStatus
}

export default function HtaccessGenerator() {
  const { t } = useTranslation('tools-development', { keyPrefix: 'htaccess-generator' })
  const [forceHttps, setForceHttps] = useState(true)
  const [forceWww, setForceWww] = useState(false)
  const [enableRewrite, setEnableRewrite] = useState(true)
  const [customRules, setCustomRules] = useState('')
  const [redirects, setRedirects] = useState<RedirectRow[]>([])
  const [nextId, setNextId] = useState(1)

  const { output, error } = useMemo(() => {
    try {
      return {
        output: buildHtaccess({ forceHttps, forceWww, enableRewrite, customRules, redirects }),
        error: null as string | null,
      }
    } catch (err) {
      return {
        output: '',
        error: err instanceof Error ? err.message : 'Invalid configuration',
      }
    }
  }, [forceHttps, forceWww, enableRewrite, customRules, redirects])

  const updateRedirect = (id: string, patch: Partial<Omit<RedirectRow, 'id'>>) => {
    setRedirects((current) =>
      current.map((redirect) => (redirect.id === id ? { ...redirect, ...patch } : redirect)),
    )
  }

  const handleAddRedirect = () => {
    setRedirects((current) => [
      ...current,
      { id: `redirect-${nextId}`, from: '/old-path', to: '/new-path', status: 301 },
    ])
    setNextId(nextId + 1)
  }

  const handleRemoveRedirect = (id: string) => {
    setRedirects((current) => current.filter((redirect) => redirect.id !== id))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('optionsTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="htaccess-force-https"
                  checked={forceHttps}
                  onCheckedChange={setForceHttps}
                />
                <Label htmlFor="htaccess-force-https" className="cursor-pointer">
                  {t('forceHttps')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="htaccess-force-www" checked={forceWww} onCheckedChange={setForceWww} />
                <Label htmlFor="htaccess-force-www" className="cursor-pointer">
                  {t('forceWww')}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="htaccess-enable-rewrite"
                  checked={enableRewrite}
                  onCheckedChange={setEnableRewrite}
                />
                <Label htmlFor="htaccess-enable-rewrite" className="cursor-pointer">
                  {t('enableRewrite')}
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t('redirectsTitle')}</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={handleAddRedirect}>
                  <Plus className="size-4" />
                  {t('addRedirect')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {redirects.length === 0 && (
                <p className="text-muted-foreground text-sm">{t('redirectsEmpty')}</p>
              )}
              {redirects.map((redirect, index) => (
                <div
                  key={redirect.id}
                  className="bg-muted/30 flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-xs">
                      {t('redirectTitle', { index: index + 1 })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('removeRedirect', { index: index + 1 })}
                      onClick={() => handleRemoveRedirect(redirect.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`${redirect.id}-from`} className="text-xs">
                        {t('redirectFrom')}
                      </Label>
                      <Input
                        id={`${redirect.id}-from`}
                        value={redirect.from}
                        onChange={(event) =>
                          updateRedirect(redirect.id, { from: event.target.value })
                        }
                        placeholder={t('redirectFromPlaceholder')}
                        spellCheck={false}
                        className="font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor={`${redirect.id}-to`} className="text-xs">
                        {t('redirectTo')}
                      </Label>
                      <Input
                        id={`${redirect.id}-to`}
                        value={redirect.to}
                        onChange={(event) => updateRedirect(redirect.id, { to: event.target.value })}
                        placeholder={t('redirectToPlaceholder')}
                        spellCheck={false}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`${redirect.id}-status`} className="text-xs">
                      {t('statusLabel')}
                    </Label>
                    <Select
                      value={String(redirect.status)}
                      onValueChange={(next) => {
                        const status = HTACCESS_STATUS_CODES.find((code) => String(code) === next)
                        if (status !== undefined) {
                          updateRedirect(redirect.id, { status })
                        }
                      }}
                    >
                      <SelectTrigger id={`${redirect.id}-status`} className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HTACCESS_STATUS_CODES.map((status) => (
                          <SelectItem key={status} value={String(status)}>
                            {t(`status-${status}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('customTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Textarea
                value={customRules}
                onChange={(event) => setCustomRules(event.target.value)}
                placeholder={t('customPlaceholder')}
                spellCheck={false}
                className="min-h-36 font-mono text-sm"
              />
              <span className="text-muted-foreground text-xs">{t('customHint')}</span>
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{t('outputTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {error !== null && (
              <Alert variant="destructive">
                <AlertDescription>{t('invalid')}</AlertDescription>
              </Alert>
            )}
            <TextareaCopyable value={output} rows={24} className="font-mono" />
            <p className="text-muted-foreground text-xs">{t('outputHint')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
