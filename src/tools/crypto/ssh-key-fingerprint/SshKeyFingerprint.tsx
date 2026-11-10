import { AlertTriangle, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  md5Fingerprint,
  parsePublicKey,
  sha256Fingerprint,
  type ParsedSshPublicKey,
} from './ssh-key-fingerprint.service'

type FingerprintResult = {
  parsed: ParsedSshPublicKey
  sha256: string
  md5: string
}

type FingerprintState =
  { result: FingerprintResult; error: null } | { result: null; error: string } | null

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="font-mono text-sm break-all sm:text-right">{value}</span>
    </div>
  )
}

export default function SshKeyFingerprint() {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'ssh-key-fingerprint' })
  const [input, setInput] = useState('')
  const [state, setState] = useState<FingerprintState>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (input.trim() === '') {
        setState(null)
        return
      }
      try {
        const parsed = parsePublicKey(input)
        const sha256 = await sha256Fingerprint(input)
        const md5 = md5Fingerprint(input)
        if (!cancelled) {
          setState({ result: { parsed, sha256, md5 }, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({ result: null, error: error instanceof Error ? error.message : String(error) })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [input])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ssh-key-input">{t('input')}</Label>
        <Textarea
          id="ssh-key-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('input-placeholder')}
          className="min-h-28 font-mono text-xs"
          spellCheck={false}
        />
      </div>

      {state === null && <p className="text-muted-foreground text-sm">{t('empty')}</p>}

      {state !== null && state.error !== null && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>
            <span className="block">{t('error')}</span>
            <span className="block font-mono text-xs break-all">{state.error}</span>
          </AlertDescription>
        </Alert>
      )}

      {state !== null && state.result !== null && (
        <div className="flex flex-col gap-4">
          <div className="divide-y rounded-lg border px-3">
            <InfoRow label={t('key-type')} value={state.result.parsed.keyType} />
            <InfoRow
              label={t('bits')}
              value={t('bits-value', { bits: state.result.parsed.bits })}
            />
            {state.result.parsed.comment !== '' && (
              <InfoRow label={t('comment')} value={state.result.parsed.comment} />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ssh-fingerprint-sha256">{t('sha256')}</Label>
            <InputCopyable
              id="ssh-fingerprint-sha256"
              value={state.result.sha256}
              className="font-mono text-xs"
              readOnly
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="ssh-fingerprint-md5">{t('md5')}</Label>
            <InputCopyable
              id="ssh-fingerprint-md5"
              value={state.result.md5}
              className="font-mono text-xs"
              readOnly
            />
          </div>

          <p className="text-muted-foreground text-xs">{t('copy-hint')}</p>
        </div>
      )}

      <div className="text-muted-foreground flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>{t('disclaimer')}</span>
      </div>
    </div>
  )
}
