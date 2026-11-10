import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { contrastRatio, wcagLevel, type WcagLevel } from '@/utils/color'
import { hexToRgba, suggestAltColors } from './service'

const DEFAULT_FOREGROUND = '#1F2937'
const DEFAULT_BACKGROUND = '#FFFFFF'
const DEFAULT_PREVIEW = 'Hello, World! 你好世界\nThe quick brown fox jumps over the lazy dog.\n这是一段用于测试对比度的预览文本。'

const LEVEL_CLASS: Record<WcagLevel, string> = {
  aaa: 'bg-green-500/15 text-green-600 border-green-500/40',
  aa: 'bg-blue-500/15 text-blue-600 border-blue-500/40',
  aaLarge: 'bg-amber-500/15 text-amber-600 border-amber-500/40',
  fail: 'bg-red-500/15 text-red-600 border-red-500/40',
}

const LEVEL_KEYS: Record<WcagLevel, string> = {
  aaa: 'wcag-contrast-checker.level.aaa',
  aa: 'wcag-contrast-checker.level.aa',
  aaLarge: 'wcag-contrast-checker.level.aaLarge',
  fail: 'wcag-contrast-checker.level.fail',
}

export default function WcagContrastChecker() {
  const { t } = useTranslation('tools-development')

  const [foreground, setForeground] = useState(DEFAULT_FOREGROUND)
  const [background, setBackground] = useState(DEFAULT_BACKGROUND)
  const [previewText, setPreviewText] = useState(DEFAULT_PREVIEW)

  const fgRgba = useMemo(() => hexToRgba(foreground), [foreground])
  const bgRgba = useMemo(() => hexToRgba(background), [background])

  const ratio = useMemo(() => {
    if (!fgRgba || !bgRgba) return null
    return contrastRatio(fgRgba, bgRgba)
  }, [fgRgba, bgRgba])

  const level = useMemo(() => (ratio !== null ? wcagLevel(ratio) : null), [ratio])

  const [lighter, darker] = useMemo(
    () => suggestAltColors(foreground),
    [foreground],
  )

  const alternativeRatioLighter = useMemo(() => {
    const altFg = hexToRgba(lighter)
    if (!altFg || !bgRgba) return null
    return contrastRatio(altFg, bgRgba)
  }, [lighter, bgRgba])

  const alternativeRatioDarker = useMemo(() => {
    const altFg = hexToRgba(darker)
    if (!altFg || !bgRgba) return null
    return contrastRatio(altFg, bgRgba)
  }, [darker, bgRgba])

  const isValid = fgRgba !== null && bgRgba !== null

  return (
    <div className="flex flex-col gap-6">
      {/* 颜色输入区 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* 前景色 */}
        <div className="flex flex-col gap-2">
          <Label>{t('wcag-contrast-checker.foreground')}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValid ? foreground : DEFAULT_FOREGROUND}
              onChange={(e) => setForeground(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              aria-label={t('wcag-contrast-checker.foreground')}
            />
            <Input
              value={foreground}
              onChange={(e) => setForeground(e.target.value)}
              placeholder="#1F2937"
              className="font-mono"
            />
          </div>
        </div>

        {/* 背景色 */}
        <div className="flex flex-col gap-2">
          <Label>{t('wcag-contrast-checker.background')}</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={isValid ? background : DEFAULT_BACKGROUND}
              onChange={(e) => setBackground(e.target.value)}
              className="h-10 w-12 cursor-pointer rounded border bg-transparent p-0.5"
              aria-label={t('wcag-contrast-checker.background')}
            />
            <Input
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="#FFFFFF"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* 结果区 */}
      {isValid && ratio !== null && level !== null ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-center">
              <div className="text-3xl font-bold tabular-nums">{ratio.toFixed(2)}:1</div>
              <div className="text-muted-foreground text-xs">
                {t('wcag-contrast-checker.ratio')}
              </div>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-sm font-medium ${LEVEL_CLASS[level]}`}
            >
              {t(LEVEL_KEYS[level])}
            </span>
          </div>

          {/* 字号建议 */}
          <div className="text-muted-foreground text-xs">
            {t('wcag-contrast-checker.sizeHint')}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t('wcag-contrast-checker.invalidColor')}
        </p>
      )}

      {/* 预览文本 */}
      {isValid && (
        <div className="flex flex-col gap-2">
          <Label>{t('wcag-contrast-checker.previewText')}</Label>
          <Textarea
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            rows={3}
          />

          <div
            className="rounded-lg border p-6"
            style={{
              backgroundColor: background,
              color: foreground,
            }}
          >
            <div className="text-base mb-2">
              {previewText.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
            <div className="text-2xl font-bold mb-2">
              {previewText.split('\n').map((line, i) => (
                <div key={`b-${i}`}>{line}</div>
              ))}
            </div>
            <div className="text-xs">
              {previewText.split('\n').map((line, i) => (
                <div key={`s-${i}`}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 备选颜色建议 */}
      {isValid && level !== 'aaa' && ratio !== null && (
        <div className="flex flex-col gap-2">
          <Label>{t('wcag-contrast-checker.suggested')}</Label>
          <div className="flex flex-wrap gap-3">
            {[
              { hex: lighter, altRatio: alternativeRatioLighter, kind: 'lighter' },
              { hex: darker, altRatio: alternativeRatioDarker, kind: 'darker' },
            ].map(({ hex, altRatio, kind }) => {
              if (!altRatio) return null
              const altLevel = wcagLevel(altRatio)
              const levelClass = LEVEL_CLASS[altLevel]
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setForeground(hex)}
                  className="flex items-center gap-2 rounded-lg border p-2 transition-colors hover:bg-muted/50"
                >
                  <span
                    className="size-6 rounded border"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="font-mono text-xs">{hex}</span>
                  <span className="text-muted-foreground text-xs">
                    {t(`wcag-contrast-checker.${kind}`)}
                  </span>
                  <span className="tabular-nums text-xs">{altRatio.toFixed(2)}:1</span>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] ${levelClass}`}
                  >
                    {t(LEVEL_KEYS[altLevel])}
                  </span>
                </button>
              )
            })}
          </div>
          {ratio < 4.5 && (
            <p className="text-muted-foreground text-xs">
              {t('wcag-contrast-checker.suggestHint')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
