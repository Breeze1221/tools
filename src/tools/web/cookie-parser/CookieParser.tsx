import { CircleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SpanCopyable } from '@/components/copyable/span-copyable'
import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { buildCookie, cookiesToJson, parseCookies, type SameSite } from './cookie-parser.service'

const DEFAULT_INPUT = 'session=abc123; theme=dark; user=%E5%BC%A0%E4%B8%89; lang=zh-CN'
const SAME_SITE_OPTIONS: readonly SameSite[] = ['Lax', 'Strict', 'None']

export default function CookieParser() {
  const { t } = useTranslation('tools-web', { keyPrefix: 'cookie-parser' })
  const [input, setInput] = useState(DEFAULT_INPUT)
  const [name, setName] = useState('session')
  const [cookieValue, setCookieValue] = useState('abc123')
  const [domain, setDomain] = useState('')
  const [path, setPath] = useState('/')
  const [maxAge, setMaxAge] = useState('86400')
  const [expires, setExpires] = useState('')
  const [sameSite, setSameSite] = useState<SameSite>('Lax')
  const [secure, setSecure] = useState(false)
  const [httpOnly, setHttpOnly] = useState(false)

  const parsed = useMemo(() => {
    try {
      return { result: parseCookies(input), failed: false }
    } catch {
      return {
        result: { cookies: [], errors: [], warnings: [] },
        failed: true,
      }
    }
  }, [input])

  const built = useMemo(() => {
    try {
      return {
        value: buildCookie({
          name,
          value: cookieValue,
          domain: domain.trim() === '' ? undefined : domain,
          path: path.trim() === '' ? undefined : path,
          maxAgeSeconds: maxAge.trim() === '' ? undefined : Number(maxAge),
          expires: expires.trim() === '' ? undefined : expires,
          secure,
          httpOnly,
          sameSite,
        }),
        failed: false,
      }
    } catch {
      return { value: '', failed: true }
    }
  }, [name, cookieValue, domain, path, maxAge, expires, secure, httpOnly, sameSite])

  return (
    <Tabs defaultValue="parse" className="gap-4">
      <TabsList>
        <TabsTrigger value="parse">{t('tab-parse')}</TabsTrigger>
        <TabsTrigger value="generate">{t('tab-generate')}</TabsTrigger>
      </TabsList>

      <TabsContent value="parse" className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('parseTitle')}</CardTitle>
            <CardDescription>{t('parseHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Label htmlFor="cookie-input">{t('inputLabel')}</Label>
            <Textarea
              id="cookie-input"
              value={input}
              rows={4}
              spellCheck={false}
              placeholder={t('inputPlaceholder')}
              className="font-mono text-sm"
              onChange={(event) => setInput(event.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('resultTitle')}</CardTitle>
            <CardDescription>{t('resultHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {parsed.failed && (
              <Alert variant="destructive">
                <AlertDescription>{t('parseError')}</AlertDescription>
              </Alert>
            )}

            {parsed.result.errors.length > 0 && (
              <Alert variant="destructive">
                <CircleAlert className="size-4" />
                <AlertDescription>
                  <span className="font-medium">{t('errorsTitle')}</span>
                  <ul className="mt-1 flex flex-col gap-1">
                    {parsed.result.errors.map((error) => (
                      <li key={`${error.segment}:${error.message}`}>
                        <span className="font-mono break-all">{error.segment}</span>
                        {` — ${error.message}`}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parsed.result.warnings.length > 0 && (
              <Alert>
                <CircleAlert className="size-4" />
                <AlertDescription>
                  <span className="font-medium">{t('warningsTitle')}</span>
                  <ul className="mt-1 flex flex-col gap-1">
                    {parsed.result.warnings.map((warning) => (
                      <li key={`${warning.name}:${warning.message}`}>
                        <span className="font-mono break-all">{warning.name}</span>
                        {` — ${warning.message}`}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {parsed.result.cookies.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('noCookies')}</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-1/4">{t('columnName')}</TableHead>
                      <TableHead>{t('columnDecoded')}</TableHead>
                      <TableHead>{t('columnRaw')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.result.cookies.map((cookie) => (
                      <TableRow key={cookie.name}>
                        <TableCell className="font-mono">{cookie.name}</TableCell>
                        <TableCell>
                          <SpanCopyable value={cookie.decodedValue} />
                        </TableCell>
                        <TableCell>
                          <SpanCopyable value={cookie.value} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Label>{t('jsonTitle')}</Label>
                    <span className="text-muted-foreground text-xs">{t('jsonHint')}</span>
                  </div>
                  <TextareaCopyable
                    value={cookiesToJson(parsed.result.cookies)}
                    rows={6}
                    highlight
                    language="json"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="generate" className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('generateTitle')}</CardTitle>
            <CardDescription>{t('generateHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cookie-name">{t('nameLabel')}</Label>
                <Input
                  id="cookie-name"
                  value={name}
                  spellCheck={false}
                  className="font-mono"
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cookie-value">{t('valueLabel')}</Label>
                <Input
                  id="cookie-value"
                  value={cookieValue}
                  spellCheck={false}
                  className="font-mono"
                  onChange={(event) => setCookieValue(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cookie-domain">{t('domainLabel')}</Label>
                <Input
                  id="cookie-domain"
                  value={domain}
                  spellCheck={false}
                  className="font-mono"
                  placeholder=".example.com"
                  onChange={(event) => setDomain(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cookie-path">{t('pathLabel')}</Label>
                <Input
                  id="cookie-path"
                  value={path}
                  spellCheck={false}
                  className="font-mono"
                  placeholder="/"
                  onChange={(event) => setPath(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cookie-max-age">{t('maxAgeLabel')}</Label>
                <Input
                  id="cookie-max-age"
                  type="number"
                  inputMode="numeric"
                  value={maxAge}
                  placeholder="86400"
                  onChange={(event) => setMaxAge(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cookie-expires">{t('expiresLabel')}</Label>
                <Input
                  id="cookie-expires"
                  type="datetime-local"
                  value={expires}
                  onChange={(event) => setExpires(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cookie-same-site">{t('sameSiteLabel')}</Label>
                <Select
                  value={sameSite}
                  onValueChange={(value) => {
                    if (value === 'Lax' || value === 'Strict' || value === 'None') {
                      setSameSite(value)
                    }
                  }}
                >
                  <SelectTrigger id="cookie-same-site" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SAME_SITE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 pt-1 sm:pt-6">
                <div className="flex items-center gap-2">
                  <Switch id="cookie-secure" checked={secure} onCheckedChange={setSecure} />
                  <Label htmlFor="cookie-secure">{t('secureLabel')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="cookie-http-only" checked={httpOnly} onCheckedChange={setHttpOnly} />
                  <Label htmlFor="cookie-http-only">{t('httpOnlyLabel')}</Label>
                </div>
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
            {built.failed && (
              <Alert variant="destructive">
                <AlertDescription>{t('buildError')}</AlertDescription>
              </Alert>
            )}
            <TextareaCopyable value={built.value} rows={4} placeholder={t('outputPlaceholder')} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
