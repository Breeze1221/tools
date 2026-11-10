import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
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
import { identifyHash, type HashConfidence } from './hash-identifier.service'

const CONFIDENCE_VARIANTS: Record<HashConfidence, 'default' | 'secondary' | 'outline'> = {
  high: 'default',
  medium: 'secondary',
  low: 'outline',
}

export default function HashIdentifier() {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'hash-identifier' })
  const [input, setInput] = useState('')
  const candidates = useMemo(() => identifyHash(input), [input])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="hash-input">{t('input')}</Label>
        <Textarea
          id="hash-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('input-placeholder')}
          className="min-h-24 font-mono text-xs"
          spellCheck={false}
        />
      </div>

      {input.trim() === '' && <p className="text-muted-foreground text-sm">{t('empty')}</p>}

      {input.trim() !== '' && candidates.length === 0 && (
        <p className="text-muted-foreground text-sm">{t('no-match')}</p>
      )}

      {candidates.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-medium">{t('results')}</h2>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('algorithm')}</TableHead>
                  <TableHead>{t('confidence')}</TableHead>
                  <TableHead>{t('reason')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow key={`${candidate.algorithm}-${candidate.reason}`}>
                    <TableCell className="font-mono text-xs">{candidate.algorithm}</TableCell>
                    <TableCell>
                      <Badge variant={CONFIDENCE_VARIANTS[candidate.confidence]}>
                        {t(`confidences.${candidate.confidence}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs whitespace-normal">
                      {t(`reasons.${candidate.reason}`)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
    </div>
  )
}
