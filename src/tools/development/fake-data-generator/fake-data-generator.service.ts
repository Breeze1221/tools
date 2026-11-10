export const fakeDataFields = [
  'id',
  'firstName',
  'lastName',
  'fullName',
  'email',
  'phone',
  'company',
  'jobTitle',
  'city',
  'country',
  'address',
  'zipCode',
  'ipv4',
  'url',
  'avatarUrl',
  'date',
  'boolean',
  'price',
  'sentence',
] as const

export type FakeDataField = (typeof fakeDataFields)[number]

export const FAKE_DATA_COUNT_RANGE = { min: 1, max: 500 } as const

const FIRST_NAMES = [
  'Ada',
  'Alan',
  'Grace',
  'Linus',
  'Margaret',
  'Dennis',
  'Barbara',
  'Ken',
  'Frances',
  'Tim',
  'Radia',
  'Vint',
  'James',
  'Katherine',
  'Donald',
  'Anita',
  'Bjarne',
  'Sophie',
  'Guido',
  'Yukihiro',
  'Anders',
  'Rasmus',
  'John',
  'Brendan',
  'Hedy',
  'Claude',
] as const

const LAST_NAMES = [
  'Lovelace',
  'Turing',
  'Hopper',
  'Torvalds',
  'Hamilton',
  'Ritchie',
  'Liskov',
  'Thompson',
  'Allen',
  'Berners-Lee',
  'Perlman',
  'Cerf',
  'Gosling',
  'Johnson',
  'Knuth',
  'Borg',
  'Stroustrup',
  'Wilson',
  'van Rossum',
  'Matsumoto',
  'Hejlsberg',
  'Lerdorf',
  'Carmack',
  'Eich',
  'Lamarr',
  'Shannon',
] as const

const CITIES = [
  'Amsterdam',
  'Barcelona',
  'Berlin',
  'Boston',
  'Bristol',
  'Chicago',
  'Copenhagen',
  'Dublin',
  'Edinburgh',
  'Helsinki',
  'Lisbon',
  'London',
  'Madrid',
  'Melbourne',
  'Montreal',
  'Munich',
  'New York',
  'Oslo',
  'Paris',
  'Prague',
  'Rome',
  'Seattle',
  'Stockholm',
  'Sydney',
  'Tokyo',
  'Toronto',
  'Vienna',
  'Zurich',
] as const

const COUNTRIES = [
  'Australia',
  'Austria',
  'Belgium',
  'Brazil',
  'Canada',
  'China',
  'Denmark',
  'Finland',
  'France',
  'Germany',
  'India',
  'Ireland',
  'Italy',
  'Japan',
  'Mexico',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Poland',
  'Portugal',
  'Singapore',
  'South Korea',
  'Spain',
  'Sweden',
  'Switzerland',
  'United Kingdom',
  'United States',
] as const

const COMPANIES = [
  'Acme Corp',
  'Blue Horizon',
  'Cedar Labs',
  'Delta Systems',
  'Evergreen Tech',
  'Falcon Media',
  'Granite Works',
  'Harbor Analytics',
  'Ironclad Software',
  'Juniper Health',
  'Keystone Data',
  'Lighthouse AI',
  'Meridian Cloud',
  'Northwind Traders',
  'Oakridge Studio',
  'Pioneer Robotics',
  'Quartz Finance',
  'Riverstone Energy',
  'Summit Logistics',
  'Titan Networks',
  'Umbrella Digital',
  'Vertex Solutions',
  'Willow & Co',
  'Zephyr Motors',
] as const

const JOB_TITLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'Data Analyst',
  'Product Manager',
  'Project Manager',
  'UX Designer',
  'UI Designer',
  'QA Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Security Analyst',
  'Cloud Architect',
  'Technical Writer',
  'Support Specialist',
  'Marketing Manager',
  'Sales Representative',
  'Accountant',
  'HR Specialist',
  'Operations Manager',
  'Research Scientist',
  'Solutions Consultant',
] as const

const STREETS = [
  'Maple Avenue',
  'Oak Street',
  'Pine Road',
  'Cedar Lane',
  'Birch Court',
  'Elm Drive',
  'Willow Way',
  'Sunset Boulevard',
  'Lakeview Terrace',
  'Hillcrest Road',
  'Riverside Drive',
  'Park Avenue',
  'Chestnut Street',
  'Sycamore Lane',
  'Aspen Trail',
  'Magnolia Place',
  'Juniper Court',
  'Redwood Road',
  'Seaview Drive',
  'Meadow Lane',
  'Valley Road',
  'Spring Street',
  'Highland Avenue',
  'Forest Way',
] as const

const SENTENCE_WORDS = [
  'the',
  'quick',
  'brown',
  'fox',
  'jumps',
  'over',
  'lazy',
  'dog',
  'bright',
  'ideas',
  'travel',
  'faster',
  'than',
  'light',
  'small',
  'steps',
  'lead',
  'to',
  'big',
  'changes',
  'quiet',
  'minds',
  'build',
  'great',
  'things',
  'simple',
  'code',
  'scales',
  'well',
  'across',
  'teams',
  'every',
  'day',
] as const

const DOMAINS = [
  'example.com',
  'mail.test',
  'acme.dev',
  'inbox.test',
  'fake.email',
  'sample.org',
] as const

function pick<const T>(pool: readonly T[]): T {
  return pool[Math.floor(Math.random() * pool.length)]
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function padded(value: number, width: number): string {
  return String(value).padStart(width, '0')
}

function randomUuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function randomSentence(): string {
  const length = randomInt(6, 12)
  const words = Array.from({ length }, () => pick(SENTENCE_WORDS))
  const first = words[0]
  return `${first.charAt(0).toUpperCase()}${first.slice(1)} ${words.slice(1).join(' ')}.`
}

function isFakeDataField(value: string): value is FakeDataField {
  return (fakeDataFields as readonly string[]).includes(value)
}

function assertFields(fields: readonly string[]): FakeDataField[] {
  if (fields.length === 0) {
    throw new Error('No fields selected')
  }

  const unique: FakeDataField[] = []
  for (const field of fields) {
    if (!isFakeDataField(field)) {
      throw new Error(`Unknown field: ${field}`)
    }
    if (!unique.includes(field)) {
      unique.push(field)
    }
  }
  return unique
}

function pickNames(): { firstName: string; lastName: string } {
  return { firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES) }
}

export function generateRecord(fields: readonly string[]): Record<string, unknown> {
  const selected = assertFields(fields)
  const { firstName, lastName } = pickNames()
  const city = pick(CITIES)
  const record: Record<string, unknown> = {}

  for (const field of selected) {
    switch (field) {
      case 'id':
        record[field] = randomUuid()
        break
      case 'firstName':
        record[field] = firstName
        break
      case 'lastName':
        record[field] = lastName
        break
      case 'fullName':
        record[field] = `${firstName} ${lastName}`
        break
      case 'email':
        record[field] =
          `${firstName}.${lastName}${randomInt(1, 999)}@${pick(DOMAINS)}`.toLowerCase()
        break
      case 'phone':
        record[field] =
          `+1-${randomInt(200, 999)}-${randomInt(100, 999)}-${padded(randomInt(0, 9999), 4)}`
        break
      case 'company':
        record[field] = pick(COMPANIES)
        break
      case 'jobTitle':
        record[field] = pick(JOB_TITLES)
        break
      case 'city':
        record[field] = city
        break
      case 'country':
        record[field] = pick(COUNTRIES)
        break
      case 'address':
        record[field] = `${randomInt(1, 9999)} ${pick(STREETS)}, ${city}`
        break
      case 'zipCode':
        record[field] = padded(randomInt(0, 99999), 5)
        break
      case 'ipv4':
        record[field] = Array.from({ length: 4 }, () => randomInt(0, 255)).join('.')
        break
      case 'url':
        record[field] = `https://www.${pick(DOMAINS)}/${randomUuid().slice(0, 8)}`
        break
      case 'avatarUrl':
        record[field] = `https://i.pravatar.cc/150?img=${randomInt(1, 70)}`
        break
      case 'date':
        record[field] = new Date(Date.now() - randomInt(0, 5 * 365) * 86_400_000)
          .toISOString()
          .slice(0, 10)
        break
      case 'boolean':
        record[field] = Math.random() < 0.5
        break
      case 'price':
        record[field] = Number((Math.random() * 1000).toFixed(2))
        break
      case 'sentence':
        record[field] = randomSentence()
        break
    }
  }

  return record
}

export type GenerateRecordsOptions = {
  readonly fields: readonly string[]
  readonly count: number
  readonly format: 'json' | 'csv'
  readonly header: boolean
}

/** CSV 单元格转义：含逗号、引号或换行时整体加引号，内部引号双写 */
export function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function toCsv(
  records: readonly Record<string, unknown>[],
  fields: readonly FakeDataField[],
  header: boolean,
): string {
  const rows = records.map((record) =>
    fields.map((field) => escapeCsvCell(record[field])).join(','),
  )
  return (header ? [fields.join(','), ...rows] : rows).join('\n')
}

export function generateRecords(options: GenerateRecordsOptions): string {
  const fields = assertFields(options.fields)
  const { count } = options

  if (
    !Number.isInteger(count) ||
    count < FAKE_DATA_COUNT_RANGE.min ||
    count > FAKE_DATA_COUNT_RANGE.max
  ) {
    throw new Error(
      `Count must be between ${FAKE_DATA_COUNT_RANGE.min} and ${FAKE_DATA_COUNT_RANGE.max}`,
    )
  }

  const records = Array.from({ length: count }, () => generateRecord(fields))
  if (options.format === 'json') {
    return JSON.stringify(records, null, 2)
  }
  return toCsv(records, fields, options.header)
}
