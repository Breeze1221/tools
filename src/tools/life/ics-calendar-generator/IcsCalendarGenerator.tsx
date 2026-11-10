import { Download, Plus, Trash2 } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { TextareaCopyable } from '@/components/copyable/textarea-copyable'
import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { downloadText } from '@/utils/download'
import {
  buildCalendar,
  type IcsEventInput,
  type ReminderMinutes,
} from './ics-calendar-generator.service'

type EventDraft = IcsEventInput & { id: number }

const REMINDER_OPTIONS: readonly ReminderMinutes[] = [0, 5, 15, 30, 60]
const HOUR_MS = 60 * 60 * 1000

function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function createDraft(id: number): EventDraft {
  const start = new Date()
  start.setMinutes(0, 0, 0)
  start.setHours(start.getHours() + 1)
  const end = new Date(start.getTime() + HOUR_MS)
  return {
    id,
    title: '',
    location: '',
    description: '',
    start: toLocalInputValue(start),
    end: toLocalInputValue(end),
    isAllDay: false,
    reminderMinutes: 15,
  }
}

/** ICS 日历事件生成：多事件表单 → 符合 RFC 5545 的 .ics 文件，可复制或下载 */
export default function IcsCalendarGenerator() {
  const { t } = useTranslation('tools-life', { keyPrefix: 'ics-calendar-generator' })
  const nextId = useRef(2)
  const [events, setEvents] = useState<EventDraft[]>(() => [createDraft(1)])

  const result = useMemo(() => {
    try {
      return { value: buildCalendar(events), error: null }
    } catch (error) {
      return { value: '', error: error instanceof Error ? error.message : String(error) }
    }
  }, [events])

  const updateEvent = (id: number, patch: Partial<Omit<EventDraft, 'id'>>) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, ...patch } : event)))
  }

  const handleAddEvent = () => {
    const id = nextId.current
    nextId.current += 1
    setEvents((prev) => [...prev, createDraft(id)])
  }

  const handleRemoveEvent = (id: number) => {
    setEvents((prev) => (prev.length === 1 ? prev : prev.filter((event) => event.id !== id)))
  }

  const handleReminderChange = (id: number, value: string) => {
    const minutes = Number(value)
    if (REMINDER_OPTIONS.some((option) => option === minutes)) {
      updateEvent(id, { reminderMinutes: minutes as ReminderMinutes })
    }
  }

  const handleDownload = () => {
    if (result.value === '') return
    downloadText(result.value, 'events.ics', 'text/calendar')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t('eventsTitle')}</span>
        <Badge variant="secondary">{events.length}</Badge>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto gap-1.5"
          onClick={handleAddEvent}
        >
          <Plus className="size-4" />
          {t('addEvent')}
        </Button>
      </div>

      {events.map((event, index) => (
        <div key={event.id} className="bg-card flex flex-col gap-3 rounded-xl border p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{t('eventLabel', { n: index + 1 })}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              disabled={events.length === 1}
              aria-label={t('removeEvent')}
              onClick={() => handleRemoveEvent(event.id)}
            >
              <Trash2 />
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`ics-title-${event.id}`}>{t('titleLabel')}</Label>
              <Input
                id={`ics-title-${event.id}`}
                value={event.title}
                placeholder={t('titlePlaceholder')}
                onChange={(inputEvent) =>
                  updateEvent(event.id, { title: inputEvent.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`ics-location-${event.id}`}>{t('locationLabel')}</Label>
              <Input
                id={`ics-location-${event.id}`}
                value={event.location}
                placeholder={t('locationPlaceholder')}
                onChange={(inputEvent) =>
                  updateEvent(event.id, { location: inputEvent.target.value })
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`ics-description-${event.id}`}>{t('descriptionLabel')}</Label>
            <Textarea
              id={`ics-description-${event.id}`}
              value={event.description}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              onChange={(inputEvent) =>
                updateEvent(event.id, { description: inputEvent.target.value })
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`ics-start-${event.id}`}>{t('startLabel')}</Label>
              <Input
                id={`ics-start-${event.id}`}
                type="datetime-local"
                value={event.start}
                onChange={(inputEvent) => updateEvent(event.id, { start: inputEvent.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`ics-end-${event.id}`}>{t('endLabel')}</Label>
              <Input
                id={`ics-end-${event.id}`}
                type="datetime-local"
                value={event.end}
                onChange={(inputEvent) => updateEvent(event.id, { end: inputEvent.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <Switch
                id={`ics-all-day-${event.id}`}
                size="sm"
                checked={event.isAllDay}
                onCheckedChange={(checked) => updateEvent(event.id, { isAllDay: checked })}
              />
              <Label htmlFor={`ics-all-day-${event.id}`} className="font-normal">
                {t('allDay')}
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground text-xs">{t('reminderLabel')}</Label>
              <MorphSelect
                label={t('reminderLabel')}
                hideLabel
                size="sm"
                className="w-32"
                items={REMINDER_OPTIONS.map((minutes) => ({
                  value: String(minutes),
                  label:
                    minutes === 0 ? t('reminderNone') : t('reminderMinutes', { n: minutes }),
                }))}
                value={String(event.reminderMinutes)}
                onValueChange={(value) => handleReminderChange(event.id, value)}
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Label>{t('outputLabel')}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5"
            disabled={result.value === ''}
            onClick={handleDownload}
          >
            <Download className="size-4" />
            {t('download')}
          </Button>
        </div>

        {result.error !== null && (
          <Alert variant="destructive">
            <AlertDescription>{t('error', { message: result.error })}</AlertDescription>
          </Alert>
        )}

        <TextareaCopyable
          value={result.value}
          rows={12}
          className="font-mono"
          placeholder={t('outputPlaceholder')}
        />
      </div>
    </div>
  )
}
