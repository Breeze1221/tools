import { CircleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SpanCopyable } from '@/components/copyable/span-copyable'
import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { headersToJson, parseHeaderBlock } from './http-header-parser.service'

const DEFAULT_INPUT = [
  'GET /api/users?page=1 HTTP/1.1',
  'Host: example.com',
  'Accept: application/json',
  'Accept: text/plain',
  'User-Agent: ToolBox',
].join('\n')

export default function HttpHeaderParser() {
  const { t } = useTranslation('tools-web', { keyPrefix: 'http-header-parser' })
  const [input, setInput] = useState(DEFAULT_INPUT)

  const parsed = useMemo(() => parseHeaderBlock(input), [input])
  const startLine = parsed.startLine

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('inputTitle')}</CardTitle>
          <CardDescription>{t('inputHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Label htmlFor="header-input">{t('inputLabel')}</Label>
          <Textarea
            id="header-input"
            value={input}
            rows={8}
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
          {startLine === null ? (
            <p className="text-muted-foreground text-sm">{t('noStartLine')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {startLine.type === 'request' ? t('requestLine') : t('statusLine')}
              </Badge>
              {startLine.type === 'request' ? (
                <span className="font-mono text-sm">
                  {`${startLine.method} ${startLine.target} ${startLine.protocol}`}
                </span>
              ) : (
                <span className="font-mono text-sm">
                  {`${startLine.protocol} ${startLine.statusCode} ${startLine.statusText}`.trim()}
                </span>
              )}
            </div>
          )}

          {parsed.errors.length > 0 && (
            <Alert variant="destructive">
              <CircleAlert className="size-4" />
              <AlertDescription>
                <span className="font-medium">{t('errorsTitle')}</span>
                <ul className="mt-1 flex flex-col gap-1">
                  {parsed.errors.map((error) => (
                    <li key={`${error.line}-${error.content}`}>
                      <span className="font-mono">
                        {t('errorLine', { line: error.line, message: error.message })}
                      </span>
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {parsed.headers.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t('noHeaders')}</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">{t('columnName')}</TableHead>
                    <TableHead>{t('columnValue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.headers.map((header) => (
                    <TableRow key={header.name}>
                      <TableCell className="align-top font-mono">{header.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {header.values.map((value, index) => (
                            <SpanCopyable
                              key={`${header.name}-${index}`}
                              value={value}
                              className="max-w-full"
                            />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex flex-col gap-0.5">
                <Label>{t('jsonTitle')}</Label>
                <span className="text-muted-foreground text-xs">{t('jsonHint')}</span>
              </div>
              <TextareaCopyable
                value={headersToJson(parsed.headers)}
                rows={6}
                highlight
                language="json"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
