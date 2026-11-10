import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MorphSelect } from '@/components/select/morph-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  computeCityRows,
  findOverlapSlots,
  MEETING_CITIES,
  parseZonedDateTime,
  toZonedInputValue,
  type MeetingCity,
} from './timezone-meeting-planner.service'

const LOCAL_TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
const DEFAULT_CITY_IDS = ['beijing', 'london', 'dubai']

function createDefaultBaseValue(): string {
  const date = new Date()
  date.setMinutes(0, 0, 0)
  date.setHours(date.getHours() + 1)
  return toZonedInputValue(date, LOCAL_TIME_ZONE)
}

/** 跨时区会议规划：基准时间 + 参会城市，换算当地时间、日差与工作时段，并推荐公共时段 */
export default function TimezoneMeetingPlanner() {
  const { t } = useTranslation('tools-life', { keyPrefix: 'timezone-meeting-planner' })

  const [baseValue, setBaseValue] = useState(createDefaultBaseValue)
  const [baseTimeZone, setBaseTimeZone] = useState(LOCAL_TIME_ZONE)
  const [cityIds, setCityIds] = useState<string[]>(DEFAULT_CITY_IDS)

  const baseDate = useMemo(() => {
    try {
      return parseZonedDateTime(baseValue, baseTimeZone)
    } catch {
      return null
    }
  }, [baseValue, baseTimeZone])

  const selectedCities = useMemo(
    () =>
      cityIds
        .map((id) => MEETING_CITIES.find((city) => city.id === id))
        .filter((city): city is MeetingCity => city !== undefined),
    [cityIds],
  )

  const timeZoneOptions = useMemo(() => {
    const seen = new Map<string, string>()
    MEETING_CITIES.forEach((city) => {
      if (!seen.has(city.timeZone)) {
        seen.set(city.timeZone, t(city.labelKey))
      }
    })
    if (!seen.has(LOCAL_TIME_ZONE)) {
      seen.set(LOCAL_TIME_ZONE, LOCAL_TIME_ZONE)
    }
    return [...seen.entries()].map(([value, label]) => ({
      value,
      label: `${label} · ${value}`,
    }))
  }, [t])

  const cityOptions = useMemo(
    () =>
      MEETING_CITIES.filter((city) => !cityIds.includes(city.id)).map((city) => ({
        value: city.id,
        label: t(city.labelKey),
        meta: city.timeZone,
      })),
    [cityIds, t],
  )

  const rows = useMemo(
    () => (baseDate ? computeCityRows(baseDate, selectedCities, baseTimeZone) : []),
    [baseDate, selectedCities, baseTimeZone],
  )

  const timeZones = useMemo(
    () => [...new Set(selectedCities.map((city) => city.timeZone))],
    [selectedCities],
  )

  const slots = useMemo(
    () => (baseDate ? findOverlapSlots(baseDate, timeZones) : []),
    [baseDate, timeZones],
  )

  const handleShift = (hours: number) => {
    if (!baseDate) return
    setBaseValue(toZonedInputValue(new Date(baseDate.getTime() + hours * 60 * 60 * 1000), baseTimeZone))
  }

  const handleAddCity = (id: string) => {
    setCityIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const handleRemoveCity = (id: string) => {
    setCityIds((prev) => prev.filter((cityId) => cityId !== id))
  }

  const dayDiffLabel = (diff: number): string => {
    if (diff === -1) return t('dayDiff.prev')
    if (diff === 0) return t('dayDiff.same')
    if (diff === 1) return t('dayDiff.next')
    return String(diff)
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">{t('baseSection')}</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="meeting-base-time">{t('baseTime')}</Label>
            <Input
              id="meeting-base-time"
              type="datetime-local"
              value={baseValue}
              onChange={(event) => setBaseValue(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground text-xs">{t('baseTimeZone')}</Label>
            <MorphSelect
              label={t('baseTimeZone')}
              hideLabel
              searchable
              items={timeZoneOptions}
              value={baseTimeZone}
              onValueChange={setBaseTimeZone}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleShift(-1)}>
              {t('shiftBack')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleShift(1)}>
              {t('shiftForward')}
            </Button>
          </div>
        </div>

        {baseDate === null && (
          <Alert variant="destructive">
            <AlertDescription>{t('invalidBase')}</AlertDescription>
          </Alert>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">{t('citiesSection')}</h2>
          <Badge variant="secondary">{selectedCities.length}</Badge>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xs">
            <Label className="text-muted-foreground text-xs">{t('addCity')}</Label>
            <MorphSelect
              label={t('addCity')}
              hideLabel
              searchable
              placeholder={t('cityPlaceholder')}
              items={cityOptions}
              value={null}
              onValueChange={handleAddCity}
            />
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('emptyCities')}</p>
        ) : (
          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columns.city')}</TableHead>
                  <TableHead>{t('columns.localTime')}</TableHead>
                  <TableHead>{t('columns.offset')}</TableHead>
                  <TableHead>{t('columns.dayDiff')}</TableHead>
                  <TableHead>{t('columns.working')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.city.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{t(row.city.labelKey)}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={t('removeCity', { city: t(row.city.labelKey) })}
                          onClick={() => handleRemoveCity(row.city.id)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="tabular-nums">{row.localDateTime}</TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {row.offsetLabel}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {dayDiffLabel(row.dayDiff)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.isWorkingHours ? 'default' : 'outline'}>
                        {row.isWorkingHours ? t('working') : t('offHours')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">{t('recommendTitle')}</h2>
          <p className="text-muted-foreground text-xs">{t('recommendHint')}</p>
        </div>

        {selectedCities.length > 0 && slots.length === 0 && (
          <p className="text-muted-foreground text-sm">{t('noSlot')}</p>
        )}

        {slots.map((slot, index) => (
          <div key={slot.start.getTime()} className="bg-card rounded-xl border p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('slotLabel', { n: index + 1 })}</span>
              <Badge variant="secondary">{t('slotHours', { n: slot.hours })}</Badge>
            </div>
            <dl className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {selectedCities.map((city) => (
                <div key={city.id} className="flex items-center justify-between gap-2 text-sm">
                  <dt className="text-muted-foreground">{t(city.labelKey)}</dt>
                  <dd className="tabular-nums">
                    {slot.times.find((item) => item.timeZone === city.timeZone)?.label ?? '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>
    </div>
  )
}
