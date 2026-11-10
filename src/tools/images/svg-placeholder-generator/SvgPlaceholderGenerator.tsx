import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
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
import { downloadText } from '@/utils/download'
import {
  buildPlaceholderSvg,
  PLACEHOLDER_MAX_SIZE,
  PLACEHOLDER_MIN_SIZE,
  svgToDataUri,
} from './svg-placeholder-generator.service'

export default function SvgPlaceholderGenerator() {
  const { t } = useTranslation('tools-images', { keyPrefix: 'svg-placeholder-generator' })
  const [width, setWidth] = useState(1200)
  const [height, setHeight] = useState(630)
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(48)
  const [fontFamily, setFontFamily] = useState('system-ui, sans-serif')
  const [background, setBackground] = useState('#f1f5f9')
  const [textColor, setTextColor] = useState('#64748b')
  const [radius, setRadius] = useState(12)
  const [borderWidth, setBorderWidth] = useState(2)
  const [borderColor, setBorderColor] = useState('#cbd5e1')

  const built = useMemo(() => {
    try {
      return {
        svg: buildPlaceholderSvg({
          width,
          height,
          background,
          textColor,
          text,
          fontSize,
          radius,
          borderWidth,
          borderColor,
          fontFamily,
        }),
        hasError: false,
      }
    } catch {
      return { svg: null, hasError: true }
    }
  }, [
    width,
    height,
    background,
    textColor,
    text,
    fontSize,
    radius,
    borderWidth,
    borderColor,
    fontFamily,
  ])

  const previewUrl = built.svg === null ? '' : svgToDataUri(built.svg)

  const handleDownload = () => {
    if (built.svg === null) {
      return
    }
    downloadText(built.svg, `placeholder-${width}x${height}.svg`, 'image/svg+xml')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settingsTitle')}</CardTitle>
            <CardDescription>{t('settingsHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="placeholder-width">{t('widthLabel')}</Label>
                <Input
                  id="placeholder-width"
                  type="number"
                  min={PLACEHOLDER_MIN_SIZE}
                  max={PLACEHOLDER_MAX_SIZE}
                  value={width}
                  onChange={(event) => setWidth(Number(event.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="placeholder-height">{t('heightLabel')}</Label>
                <Input
                  id="placeholder-height"
                  type="number"
                  min={PLACEHOLDER_MIN_SIZE}
                  max={PLACEHOLDER_MAX_SIZE}
                  value={height}
                  onChange={(event) => setHeight(Number(event.target.value))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="placeholder-text">{t('textLabel')}</Label>
              <Input
                id="placeholder-text"
                value={text}
                placeholder={t('textPlaceholder')}
                onChange={(event) => setText(event.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="placeholder-font-size">{t('fontSizeLabel')}</Label>
                <Input
                  id="placeholder-font-size"
                  type="number"
                  min={1}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="placeholder-font-family">{t('fontFamilyLabel')}</Label>
                <Input
                  id="placeholder-font-family"
                  value={fontFamily}
                  placeholder={t('fontFamilyPlaceholder')}
                  onChange={(event) => setFontFamily(event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ColorField
                id="placeholder-background"
                label={t('backgroundLabel')}
                value={background}
                onChange={setBackground}
              />
              <ColorField
                id="placeholder-text-color"
                label={t('textColorLabel')}
                value={textColor}
                onChange={setTextColor}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="placeholder-radius">{t('radiusLabel')}</Label>
                <Input
                  id="placeholder-radius"
                  type="number"
                  min={0}
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                />
              </div>
              <ColorField
                id="placeholder-border-color"
                label={t('borderColorLabel')}
                value={borderColor}
                onChange={setBorderColor}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="placeholder-border-width">{t('borderWidthLabel')}</Label>
              <Input
                id="placeholder-border-width"
                type="number"
                min={0}
                value={borderWidth}
                onChange={(event) => setBorderWidth(Number(event.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('previewTitle')}</CardTitle>
            <CardDescription>{t('previewHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {built.hasError && (
              <Alert variant="destructive">
                <AlertDescription>{t('errorBuild')}</AlertDescription>
              </Alert>
            )}
            <div className="bg-muted/40 flex min-h-64 items-center justify-center overflow-auto rounded-xl border p-3">
              {previewUrl === '' ? (
                <p className="text-muted-foreground text-sm">{t('errorBuild')}</p>
              ) : (
                <img
                  src={previewUrl}
                  alt={t('previewAlt')}
                  className="h-auto max-w-full rounded-md"
                />
              )}
            </div>
            <p className="text-muted-foreground font-mono text-xs">
              {width} × {height} px
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('sourceTitle')}</CardTitle>
          <CardDescription>{t('sourceHint')}</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={built.svg === null}
              onClick={handleDownload}
            >
              <Download className="size-4" />
              {t('download')}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <TextareaCopyable value={built.svg ?? ''} rows={12} highlight language="xml" />
        </CardContent>
      </Card>
    </div>
  )
}

type ColorFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

function ColorField({ id, label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          aria-label={label}
          className="h-8 w-12 cursor-pointer rounded border bg-transparent p-0.5"
          onChange={(event) => onChange(event.target.value)}
        />
        <span className="text-muted-foreground font-mono text-xs">{value}</span>
      </div>
    </div>
  )
}
