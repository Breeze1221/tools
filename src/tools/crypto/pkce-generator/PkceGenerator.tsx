import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  createCodeChallenge,
  generateCodeVerifier,
  PKCE_METHODS,
  type PkceMethod,
} from './pkce-generator.service'

export default function PkceGenerator() {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'pkce-generator' })
  const [method, setMethod] = useState<PkceMethod>('S256')
  const [verifier, setVerifier] = useState(() => generateCodeVerifier())
  const [challenge, setChallenge] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const value = await createCodeChallenge(verifier, method)
        if (!cancelled) {
          setChallenge(value)
          setFailed(false)
        }
      } catch {
        if (!cancelled) {
          setChallenge('')
          setFailed(true)
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [verifier, method])

  const methodItems = PKCE_METHODS.map((item) => ({
    value: item,
    label: t(item === 'S256' ? 'method-s256' : 'method-plain'),
  }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
        <div className="flex flex-col gap-2">
          <Label>{t('method')}</Label>
          <MorphSelect
            label={t('method')}
            hideLabel
            className="w-52"
            items={methodItems}
            value={method}
            onValueChange={(value) => setMethod(value === 'plain' ? 'plain' : 'S256')}
          />
        </div>

        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => setVerifier(generateCodeVerifier())}
        >
          <RefreshCw className="size-4" />
          {t('generate')}
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="pkce-verifier">{t('verifier')}</Label>
        <InputCopyable
          id="pkce-verifier"
          value={verifier}
          onValueChange={setVerifier}
          className="font-mono text-xs"
          spellCheck={false}
        />
      </div>

      {failed && (
        <Alert variant="destructive">
          <AlertDescription>{t('error')}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="pkce-challenge">{t('challenge')}</Label>
        <InputCopyable
          id="pkce-challenge"
          value={challenge}
          className="font-mono text-xs"
          readOnly
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-xs">{t('hint')}</p>
        <p className="text-muted-foreground text-xs">
          {t(method === 'S256' ? 'method-hint-s256' : 'method-hint-plain')}
        </p>
      </div>

      <p className="text-muted-foreground text-xs">{t('disclaimer')}</p>
    </div>
  )
}
