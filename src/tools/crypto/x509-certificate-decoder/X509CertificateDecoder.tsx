import { AlertTriangle, Info } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { InputCopyable } from '@/components/copyable/input-copyable'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  formatDn,
  parseCertificate,
  type ParsedCertificate,
} from './x509-certificate-decoder.service'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <span className="text-muted-foreground shrink-0 text-sm">{label}</span>
      <span className="font-mono text-sm break-all sm:text-right">{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-muted-foreground text-xs font-medium">{title}</h2>
      <div className="divide-y rounded-lg border px-3">{children}</div>
    </section>
  )
}

type ParseState =
  { certificate: ParsedCertificate; error: null } | { certificate: null; error: string }

export default function X509CertificateDecoder() {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'x509-certificate-decoder' })
  const [input, setInput] = useState('')

  // 解析失败必须就地收住：渲染期抛错会整页白屏
  const state = useMemo<ParseState | null>(() => {
    if (input.trim() === '') {
      return null
    }
    try {
      return { certificate: parseCertificate(input), error: null }
    } catch (error) {
      return {
        certificate: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }, [input])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="x509-input">{t('input')}</Label>
        <Textarea
          id="x509-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('input-placeholder')}
          className="min-h-36 font-mono text-xs"
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

      {state !== null && state.certificate !== null && (
        <CertificateDetails certificate={state.certificate} />
      )}

      <div className="text-muted-foreground flex items-start gap-1.5 text-xs">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>{t('disclaimer')}</span>
      </div>
    </div>
  )
}

function CertificateDetails({ certificate }: { certificate: ParsedCertificate }) {
  const { t } = useTranslation('tools-crypto', { keyPrefix: 'x509-certificate-decoder' })
  const { validity, subjectAltNames } = certificate

  const status = validity.isExpired
    ? t('status-expired')
    : validity.isNotYetValid
      ? t('status-not-yet-valid')
      : t('status-valid')

  return (
    <div className="flex flex-col gap-6">
      <Section title={t('section-basic')}>
        <InfoRow
          label={t('version')}
          value={t('version-value', { version: certificate.version })}
        />
        <InfoRow label={t('serial')} value={certificate.serialNumber} />
        <InfoRow label={t('signature-algorithm')} value={certificate.signatureAlgorithm} />
      </Section>

      <Section title={t('section-names')}>
        <InfoRow label={t('issuer')} value={formatDn(certificate.issuer)} />
        <InfoRow label={t('subject')} value={formatDn(certificate.subject)} />
      </Section>

      <Section title={t('section-validity')}>
        <InfoRow label={t('not-before')} value={new Date(validity.notBefore).toLocaleString()} />
        <InfoRow label={t('not-after')} value={new Date(validity.notAfter).toLocaleString()} />
        <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <span className="text-muted-foreground shrink-0 text-sm">{t('status')}</span>
          <span
            className={cn(
              'text-sm font-medium',
              validity.isExpired || validity.isNotYetValid ? 'text-destructive' : 'text-primary',
            )}
          >
            {status}
          </span>
        </div>
      </Section>

      <Section title={t('section-key')}>
        <InfoRow label={t('public-key-algorithm')} value={certificate.publicKeyAlgorithm} />
        <InfoRow
          label={t('public-key-bits')}
          value={t('bits-value', { bits: certificate.publicKeyBits })}
        />
        {certificate.curve !== null && <InfoRow label={t('curve')} value={certificate.curve} />}
      </Section>

      <Section title={t('section-extensions')}>
        <InfoRow label={t('san-dns')} value={subjectAltNames.dnsNames.join(', ') || t('none')} />
        <InfoRow label={t('san-ip')} value={subjectAltNames.ipAddresses.join(', ') || t('none')} />
        <InfoRow label={t('is-ca')} value={t(certificate.isCa ? 'yes' : 'no')} />
        <InfoRow
          label={t('key-usages')}
          value={
            certificate.keyUsages.length === 0
              ? t('none')
              : certificate.keyUsages.map((usage) => t(`usage.${usage}`)).join(', ')
          }
        />
      </Section>

      <div className="flex flex-col gap-2">
        <Label htmlFor="x509-fingerprint">{t('fingerprint')}</Label>
        <InputCopyable
          id="x509-fingerprint"
          value={certificate.tbsFingerprint}
          className="font-mono text-xs"
          readOnly
        />
      </div>
    </div>
  )
}
