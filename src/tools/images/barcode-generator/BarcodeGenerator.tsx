import { Download, QrCode, Copy, Check } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { code128Encode, type Code128EncodeResult, type Code128Variant } from './barcode-generator.service'
import { drawCode128, measureCode128 } from './render'

const MAX_INPUT_LEN = 50
const MIN_INPUT_LEN = 1

type VariantOption = {
  value: Code128Variant
  label: string
}

const VARIANT_OPTIONS: VariantOption[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
]

export default function BarcodeGenerator() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'barcode-generator' })
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [text, setText] = useState('ToolBox-2026')
  const [variant, setVariant] = useState<Code128Variant>('auto')
  const [moduleWidth, setModuleWidth] = useState(2)
  const [height, setHeight] = useState(64)
  const [quietZone, setQuietZone] = useState(10)
  const [showText, setShowText] = useState(true)
  const [fontSize, setFontSize] = useState(14)
  const [copied, setCopied] = useState(false)

  // 编码
  const encodeResult = useMemo<Code128EncodeResult | null>(() => {
    try {
      if (text.length < MIN_INPUT_LEN) return null
      return code128Encode(text, variant)
    } catch {
      return null
    }
  }, [text, variant])

  const encodeError = useMemo<string | null>(() => {
    if (text.length < MIN_INPUT_LEN) return null
    try {
      code128Encode(text, variant)
      return null
    } catch (e) {
      return e instanceof Error ? e.message : 'Unknown error'
    }
  }, [text, variant])

  // 渲染到 canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    if (encodeResult === null || encodeError !== null) {
      // 清空
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      return
    }
    const opts = { moduleWidth, height, quietZone, showText, fontSize }
    const { width, height: canvasHeight } = measureCode128(encodeResult.codes, opts)
    canvas.width = width
    canvas.height = canvasHeight
    const ctx = canvas.getContext('2d')
    if (ctx === null) return
    ctx.imageSmoothingEnabled = false
    drawCode128(ctx, encodeResult.codes, text, opts)
  }, [encodeResult, encodeError, text, moduleWidth, height, quietZone, showText, fontSize])

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (canvas === null || encodeResult === null) return
    const url = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = url
    link.download = `barcode-code128-${encodeResult.subset}-${Date.now()}.png`
    link.click()
  }, [encodeResult])

  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current
    if (canvas === null) return
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
      })
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ])
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 静默失败
    }
  }, [])

  const handleTextChange = (value: string) => {
    if (value.length > MAX_INPUT_LEN) {
      setText(value.slice(0, MAX_INPUT_LEN))
    } else {
      setText(value)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 输入卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inputTitle')}</CardTitle>
          <CardDescription>{t('inputHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Variant 选择 */}
          <div className="flex flex-col gap-2">
            <Label>{t('variantLabel')}</Label>
            <RadioGroup
              value={variant}
              className="flex flex-wrap gap-x-6 gap-y-2"
              onValueChange={(v) => setVariant(v as Code128Variant)}
            >
              {VARIANT_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`variant-${opt.value}`} />
                  <Label htmlFor={`variant-${opt.value}`} className="font-normal">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <p className="text-muted-foreground text-xs">{t(`hint-variant-${variant}`)}</p>
          </div>

          {/* 文本输入 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="barcode-text">
              {t('textLabel')}
              <span className="text-muted-foreground ml-2 text-xs">
                ({text.length}/{MAX_INPUT_LEN})
              </span>
            </Label>
            <Input
              id="barcode-text"
              value={text}
              className="font-mono"
              placeholder={t('textPlaceholder')}
              maxLength={MAX_INPUT_LEN}
              onChange={(e) => handleTextChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 选项卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('optionsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <OptionSlider
            label={t('moduleWidthLabel')}
            value={moduleWidth}
            min={1}
            max={5}
            step={1}
            unit="px"
            onChange={setModuleWidth}
          />
          <OptionSlider
            label={t('heightLabel')}
            value={height}
            min={24}
            max={200}
            step={1}
            unit="px"
            onChange={setHeight}
          />
          <OptionSlider
            label={t('quietZoneLabel')}
            value={quietZone}
            min={0}
            max={20}
            step={1}
            unit={t('quietZoneUnit')}
            onChange={setQuietZone}
          />
          <OptionSlider
            label={t('fontSizeLabel')}
            value={fontSize}
            min={8}
            max={28}
            step={1}
            unit="px"
            disabled={!showText}
            onChange={setFontSize}
          />
          <div className="flex items-center justify-between sm:col-span-2">
            <Label htmlFor="show-text">{t('showTextLabel')}</Label>
            <Switch id="show-text" checked={showText} onCheckedChange={setShowText} />
          </div>
        </CardContent>
      </Card>

      {/* 预览卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="size-4" />
            {t('previewTitle')}
          </CardTitle>
          <CardDescription>{t('previewHint')}</CardDescription>
          <CardAction className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={encodeResult === null || encodeError !== null}
              onClick={handleCopy}
            >
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? t('copied') : t('copyPng')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={encodeResult === null || encodeError !== null}
              onClick={handleDownload}
            >
              <Download className="size-4" />
              {t('downloadPng')}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {encodeError !== null && (
            <Alert variant="destructive">
              <AlertDescription>{encodeError}</AlertDescription>
            </Alert>
          )}

          {text.length < MIN_INPUT_LEN && (
            <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed p-4">
              <p className="text-muted-foreground text-sm">{t('emptyPreview')}</p>
            </div>
          )}

          {text.length >= MIN_INPUT_LEN && encodeResult !== null && encodeError === null && (
            <div className="bg-background flex min-h-40 items-center justify-center rounded-xl border p-4 overflow-auto">
              <canvas
                ref={canvasRef}
                role="img"
                aria-label={t('previewAlt')}
                className="h-auto max-w-full"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}

          {encodeResult !== null && (
            <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
              <span>
                {t('subsetLabel')}: {encodeResult.subset}
              </span>
              <span>
                {t('checkSymbolLabel')}: {encodeResult.check}
              </span>
              <span>
                {t('symbolCountLabel')}: {encodeResult.codes.length}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── 小型 OptionSlider 组件 ────────────────────────────────────────────────

type OptionSliderProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit?: string
  disabled?: boolean
  onChange: (v: number) => void
}

function OptionSlider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  disabled,
  onChange,
}: OptionSliderProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className={disabled ? 'text-muted-foreground' : ''}>{label}</Label>
        <span className="font-mono text-xs tabular-nums">
          {value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  )
}
