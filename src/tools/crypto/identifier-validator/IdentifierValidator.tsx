import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { validateIdentifier } from './identifier-validator.service'

export default function IdentifierValidator() {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'identifier-validator' })
  const [input, setInput] = useState('')
  const checks = useMemo(() => validateIdentifier(input), [input])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="identifier-input">{t('input')}</Label>
        <Textarea
          id="identifier-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('input-placeholder')}
          className="min-h-20 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      {input.trim() === '' && <p className="text-muted-foreground text-sm">{t('empty')}</p>}

      {input.trim() !== '' && checks.length === 0 && (
        <p className="text-muted-foreground text-sm">{t('no-match')}</p>
      )}

      {checks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-xs font-medium">{t('results')}</h2>
          <ul className="flex flex-col gap-3">
            {checks.map((check) => (
              <li key={check.kind} className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{t(`kinds.${check.kind}`)}</span>
                  <Badge variant={check.valid ? 'default' : 'destructive'}>
                    {t(check.valid ? 'valid' : 'invalid')}
                  </Badge>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground text-xs">{t('normalized')}</span>
                  <InputCopyable value={check.normalized} className="font-mono text-xs" readOnly />
                </div>

                {check.brand !== undefined && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-muted-foreground text-xs">{t('brand')}</span>
                    <span className="text-sm">{t(`brands.${check.brand}`)}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
    </div>
  )
}
