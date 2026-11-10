import { Pause, Play, Square, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'

import {
  MAX_TTS_TEXT_LENGTH,
  pickDefaultVoice,
  splitIntoSentences,
  validateText,
} from './text-to-speech.service'

type ErrorKey = 'empty' | 'too-long'

/** 文字转语音：把文本按句切块交给浏览器 SpeechSynthesis 朗读，全程不联网 */
export default function TextToSpeech() {
  const { t } = useTranslation('tools-video', { keyPrefix: 'text-to-speech' })
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)
  const [text, setText] = useState('')
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [voiceUri, setVoiceUri] = useState('')
  const [rate, setRate] = useState(1)
  const [pitch, setPitch] = useState(1)
  const [volume, setVolume] = useState(1)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null)
  /** 每次开始/停止都换一代，旧的 utterance 回调不能改写新一代的状态 */
  const sessionRef = useRef(0)

  useEffect(() => {
    if (!isSupported) return
    const synth = window.speechSynthesis
    const syncVoices = () => {
      const list = synth.getVoices()
      setVoices(list)
      setVoiceUri((current) => current || pickDefaultVoice(list)?.voiceURI || '')
    }
    syncVoices()
    synth.addEventListener('voiceschanged', syncVoices)
    return () => {
      synth.removeEventListener('voiceschanged', syncVoices)
      sessionRef.current += 1
      synth.cancel()
    }
  }, [isSupported])

  const voiceOptions = useMemo(
    () =>
      voices.map((voice) => ({
        value: voice.voiceURI,
        label: voice.name,
        meta: voice.lang,
      })),
    [voices],
  )

  const stop = () => {
    sessionRef.current += 1
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }

  const play = () => {
    if (!isSupported) return
    const synth = window.speechSynthesis
    if (synth.paused) {
      synth.resume()
      setIsPaused(false)
      return
    }

    let value: string
    try {
      value = validateText(text)
    } catch {
      setErrorKey(text.trim() ? 'too-long' : 'empty')
      return
    }

    synth.cancel()
    sessionRef.current += 1
    const session = sessionRef.current
    setErrorKey(null)

    const selected = voices.find((voice) => voice.voiceURI === voiceUri)
    const utterances = splitIntoSentences(value).map((sentence) => {
      const utterance = new SpeechSynthesisUtterance(sentence)
      if (selected) {
        utterance.voice = selected
        utterance.lang = selected.lang
      }
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume
      return utterance
    })

    utterances.forEach((utterance, index) => {
      const finish = () => {
        if (sessionRef.current !== session) return
        if (index === utterances.length - 1) {
          setIsSpeaking(false)
          setIsPaused(false)
        }
      }
      utterance.onend = finish
      utterance.onerror = finish
      synth.speak(utterance)
    })

    setIsSpeaking(true)
    setIsPaused(false)
  }

  const pause = () => {
    if (!isSupported || !isSpeaking || isPaused) return
    window.speechSynthesis.pause()
    setIsPaused(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {!isSupported && (
        <Alert variant="destructive">
          <AlertTitle>{t('unsupported-title')}</AlertTitle>
          <AlertDescription>{t('unsupported')}</AlertDescription>
        </Alert>
      )}

      {errorKey && (
        <Alert variant="destructive">
          <AlertDescription>{t(`error-${errorKey}`)}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="size-4" />
            {t('input-title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              if (errorKey) setErrorKey(null)
            }}
            maxLength={MAX_TTS_TEXT_LENGTH}
            placeholder={t('input-placeholder')}
            className="min-h-44 resize-y"
            aria-label={t('input-title')}
          />
          <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>{t('char-count', { count: text.length, max: MAX_TTS_TEXT_LENGTH })}</span>
            <span>{t('voice-count', { count: voices.length })}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t('voice-label')}</Label>
            <MorphSelect
              label={t('voice-label')}
              hideLabel
              items={voiceOptions}
              value={voiceUri || null}
              onValueChange={setVoiceUri}
              placeholder={t('voice-placeholder')}
              searchable="auto"
              disabled={!isSupported || voices.length === 0}
              className="w-full"
            />
            {voices.length === 0 && (
              <p className="text-muted-foreground text-xs">{t('no-voices')}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="tts-rate">{t('rate-label')}</Label>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {rate.toFixed(1)}×
                </span>
              </div>
              <Slider
                id="tts-rate"
                min={0.5}
                max={2}
                step={0.1}
                value={[rate]}
                onValueChange={(values) => setRate(values[0] ?? rate)}
                disabled={!isSupported}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="tts-pitch">{t('pitch-label')}</Label>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {pitch.toFixed(1)}
                </span>
              </div>
              <Slider
                id="tts-pitch"
                min={0}
                max={2}
                step={0.1}
                value={[pitch]}
                onValueChange={(values) => setPitch(values[0] ?? pitch)}
                disabled={!isSupported}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="tts-volume">{t('volume-label')}</Label>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <Slider
                id="tts-volume"
                min={0}
                max={1}
                step={0.05}
                value={[volume]}
                onValueChange={(values) => setVolume(values[0] ?? volume)}
                disabled={!isSupported}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(!isSpeaking || isPaused) && (
              <Button onClick={play} disabled={!isSupported || !text.trim()}>
                <Play className="size-4" />
                {isPaused ? t('resume') : t('play')}
              </Button>
            )}
            {isSpeaking && !isPaused && (
              <Button variant="outline" onClick={pause}>
                <Pause className="size-4" />
                {t('pause')}
              </Button>
            )}
            <Button variant="outline" onClick={stop} disabled={!isSpeaking}>
              <Square className="size-4" />
              {t('stop')}
            </Button>
            <Badge variant={isSpeaking ? (isPaused ? 'outline' : 'default') : 'secondary'}>
              {isSpeaking ? (isPaused ? t('state-paused') : t('state-speaking')) : t('state-idle')}
            </Badge>
          </div>

          <p className="text-muted-foreground text-xs">{t('privacy-note')}</p>
        </CardContent>
      </Card>
    </div>
  )
}
