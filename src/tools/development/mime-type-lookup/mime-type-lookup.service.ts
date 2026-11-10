export const MIME_CATEGORIES = [
  'document',
  'image',
  'audio',
  'video',
  'archive',
  'font',
  'code',
  'data',
] as const

export type MimeCategory = (typeof MIME_CATEGORIES)[number]

export type MimeEntry = {
  readonly mime: string
  readonly extensions: readonly string[]
  readonly category: MimeCategory
  readonly isText: boolean
  readonly isCompressed: boolean
}

/** 常见扩展名 ↔ MIME 映射表；扩展名一律小写、不带点 */
export const MIME_TABLE = [
  // 文档
  {
    mime: 'application/pdf',
    extensions: ['pdf'],
    category: 'document',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/msword',
    extensions: ['doc'],
    category: 'document',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extensions: ['docx'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.ms-excel',
    extensions: ['xls'],
    category: 'document',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extensions: ['xlsx'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.ms-powerpoint',
    extensions: ['ppt'],
    category: 'document',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extensions: ['pptx'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.oasis.opendocument.text',
    extensions: ['odt'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.oasis.opendocument.spreadsheet',
    extensions: ['ods'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.oasis.opendocument.presentation',
    extensions: ['odp'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/rtf',
    extensions: ['rtf'],
    category: 'document',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'text/plain',
    extensions: ['txt', 'text', 'log'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/markdown',
    extensions: ['md', 'markdown'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/html',
    extensions: ['html', 'htm'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/css',
    extensions: ['css'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/csv',
    extensions: ['csv'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/calendar',
    extensions: ['ics'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/vcard',
    extensions: ['vcf'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/epub+zip',
    extensions: ['epub'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-mobipocket-ebook',
    extensions: ['mobi'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-tex',
    extensions: ['tex'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/ld+json',
    extensions: ['jsonld'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/manifest+json',
    extensions: ['webmanifest'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/rss+xml',
    extensions: ['rss'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/atom+xml',
    extensions: ['atom'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/xhtml+xml',
    extensions: ['xhtml'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/vnd.google-earth.kml+xml',
    extensions: ['kml'],
    category: 'document',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/vnd.google-earth.kmz',
    extensions: ['kmz'],
    category: 'document',
    isText: false,
    isCompressed: true,
  },

  // 代码 / 配置
  {
    mime: 'application/json',
    extensions: ['json'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/xml',
    extensions: ['xml'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/xml',
    extensions: ['xml'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/yaml',
    extensions: ['yaml', 'yml'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/toml',
    extensions: ['toml'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/x-ndjson',
    extensions: ['jsonl', 'ndjson'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/javascript',
    extensions: ['js', 'mjs', 'cjs'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/typescript',
    extensions: ['ts', 'mts', 'cts'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/graphql',
    extensions: ['graphql', 'gql'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/sql',
    extensions: ['sql'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/x-httpd-php',
    extensions: ['php'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/x-sh',
    extensions: ['sh'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/x-powershell',
    extensions: ['ps1'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/x-bat',
    extensions: ['bat', 'cmd'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-python',
    extensions: ['py'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-java-source',
    extensions: ['java'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-c',
    extensions: ['c', 'h'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-c++src',
    extensions: ['cpp', 'cc', 'cxx', 'hpp'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-csharp',
    extensions: ['cs'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-go',
    extensions: ['go'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/rust',
    extensions: ['rs'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-ruby',
    extensions: ['rb'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-kotlin',
    extensions: ['kt', 'kts'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-swift',
    extensions: ['swift'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-scala',
    extensions: ['scala'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-perl',
    extensions: ['pl', 'pm'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-lua',
    extensions: ['lua'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-r',
    extensions: ['r'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-julia',
    extensions: ['jl'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-dart',
    extensions: ['dart'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-diff',
    extensions: ['diff', 'patch'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-vue',
    extensions: ['vue'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-svelte',
    extensions: ['svelte'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-scss',
    extensions: ['scss'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-sass',
    extensions: ['sass'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/less',
    extensions: ['less'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-handlebars-template',
    extensions: ['hbs'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-pug',
    extensions: ['pug', 'jade'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'text/x-ini',
    extensions: ['ini', 'cfg', 'conf'],
    category: 'code',
    isText: true,
    isCompressed: false,
  },

  // 图片
  {
    mime: 'image/png',
    extensions: ['png'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/jpeg',
    extensions: ['jpg', 'jpeg', 'jpe'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/gif',
    extensions: ['gif'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/webp',
    extensions: ['webp'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/avif',
    extensions: ['avif'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/svg+xml',
    extensions: ['svg'],
    category: 'image',
    isText: true,
    isCompressed: true,
  },
  {
    mime: 'image/bmp',
    extensions: ['bmp'],
    category: 'image',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'image/tiff',
    extensions: ['tif', 'tiff'],
    category: 'image',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'image/x-icon',
    extensions: ['ico'],
    category: 'image',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'image/vnd.microsoft.icon',
    extensions: ['ico'],
    category: 'image',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'image/heic',
    extensions: ['heic'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/heif',
    extensions: ['heif'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/jp2',
    extensions: ['jp2'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/apng',
    extensions: ['apng'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/x-xcf',
    extensions: ['xcf'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.adobe.photoshop',
    extensions: ['psd'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/x-portable-pixmap',
    extensions: ['ppm'],
    category: 'image',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'image/x-tga',
    extensions: ['tga'],
    category: 'image',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'image/x-dds',
    extensions: ['dds'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'image/ktx2',
    extensions: ['ktx2'],
    category: 'image',
    isText: false,
    isCompressed: true,
  },

  // 音频
  {
    mime: 'audio/mpeg',
    extensions: ['mp3', 'mpga'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/wav',
    extensions: ['wav'],
    category: 'audio',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'audio/ogg',
    extensions: ['ogg', 'oga'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/opus',
    extensions: ['opus'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/aac',
    extensions: ['aac'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/flac',
    extensions: ['flac'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/midi',
    extensions: ['mid', 'midi'],
    category: 'audio',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'audio/webm',
    extensions: ['weba'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/mp4',
    extensions: ['m4a'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/x-ms-wma',
    extensions: ['wma'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'audio/amr',
    extensions: ['amr'],
    category: 'audio',
    isText: false,
    isCompressed: true,
  },

  // 视频
  {
    mime: 'video/mp4',
    extensions: ['mp4', 'm4v'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/webm',
    extensions: ['webm'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/ogg',
    extensions: ['ogv'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/quicktime',
    extensions: ['mov'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/x-msvideo',
    extensions: ['avi'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/x-matroska',
    extensions: ['mkv'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/mpeg',
    extensions: ['mpg', 'mpeg'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/3gpp',
    extensions: ['3gp'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/x-flv',
    extensions: ['flv'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/x-ms-wmv',
    extensions: ['wmv'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'video/mp2t',
    extensions: ['m2ts'],
    category: 'video',
    isText: false,
    isCompressed: true,
  },

  // 压缩包 / 安装包
  {
    mime: 'application/zip',
    extensions: ['zip'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.rar',
    extensions: ['rar'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-7z-compressed',
    extensions: ['7z'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-tar',
    extensions: ['tar'],
    category: 'archive',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/gzip',
    extensions: ['gz', 'gzip'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-bzip2',
    extensions: ['bz2'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-xz',
    extensions: ['xz'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/zstd',
    extensions: ['zst'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-apple-diskimage',
    extensions: ['dmg'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-iso9660-image',
    extensions: ['iso'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.debian.binary-package',
    extensions: ['deb'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-rpm',
    extensions: ['rpm'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/java-archive',
    extensions: ['jar'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.android.package-archive',
    extensions: ['apk'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-msdownload',
    extensions: ['exe', 'dll'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-bittorrent',
    extensions: ['torrent'],
    category: 'archive',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/x-shockwave-flash',
    extensions: ['swf'],
    category: 'archive',
    isText: false,
    isCompressed: true,
  },

  // 字体
  {
    mime: 'font/woff',
    extensions: ['woff'],
    category: 'font',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'font/woff2',
    extensions: ['woff2'],
    category: 'font',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'font/ttf',
    extensions: ['ttf'],
    category: 'font',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'font/otf',
    extensions: ['otf'],
    category: 'font',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'font/collection',
    extensions: ['ttc'],
    category: 'font',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/font-woff',
    extensions: ['woff'],
    category: 'font',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/vnd.ms-fontobject',
    extensions: ['eot'],
    category: 'font',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'font/sfnt',
    extensions: ['ttf'],
    category: 'font',
    isText: false,
    isCompressed: false,
  },

  // 数据 / 证书
  {
    mime: 'application/octet-stream',
    extensions: ['bin', 'dat'],
    category: 'data',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/x-sqlite3',
    extensions: ['sqlite', 'sqlite3', 'db'],
    category: 'data',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/geo+json',
    extensions: ['geojson'],
    category: 'data',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/pkcs12',
    extensions: ['p12', 'pfx'],
    category: 'data',
    isText: false,
    isCompressed: true,
  },
  {
    mime: 'application/x-pem-file',
    extensions: ['pem'],
    category: 'data',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/pkix-cert',
    extensions: ['cer'],
    category: 'data',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/x-x509-ca-cert',
    extensions: ['crt', 'der'],
    category: 'data',
    isText: false,
    isCompressed: false,
  },
  {
    mime: 'application/vnd.apple.mpegurl',
    extensions: ['m3u8'],
    category: 'data',
    isText: true,
    isCompressed: false,
  },
  {
    mime: 'application/x-mpegurl',
    extensions: ['m3u8'],
    category: 'data',
    isText: true,
    isCompressed: false,
  },
] as const satisfies readonly MimeEntry[]

const TABLE: readonly MimeEntry[] = MIME_TABLE

/** 去掉前导点与空白，统一小写 */
export function normalizeExtension(value: string): string {
  return value.trim().toLowerCase().replace(/^\.+/, '')
}

/** 去掉参数（;charset=…）与空白，统一小写 */
export function normalizeMime(value: string): string {
  return value.trim().toLowerCase().split(';')[0]?.trim() ?? ''
}

/** 按扩展名查 MIME，带不带点均可；未命中返回空数组 */
export function lookupByExtension(extension: string): MimeEntry[] {
  const ext = normalizeExtension(extension)
  if (ext === '') {
    return []
  }
  return TABLE.filter((entry) => entry.extensions.includes(ext))
}

/** 按 MIME 查扩展名，忽略大小写与 ;charset 参数；未命中返回空数组 */
export function lookupByMime(mime: string): MimeEntry[] {
  const normalized = normalizeMime(mime)
  if (normalized === '') {
    return []
  }
  return TABLE.filter((entry) => entry.mime === normalized)
}

/** 模糊搜索 MIME、扩展名与类别；可按类别过滤，空查询返回全部 */
export function searchMime(query: string, category?: MimeCategory): MimeEntry[] {
  const keyword = query.trim().toLowerCase()
  const candidates = category ? TABLE.filter((entry) => entry.category === category) : TABLE
  if (keyword === '') {
    return [...candidates]
  }
  return candidates.filter(
    (entry) =>
      entry.mime.includes(keyword) ||
      entry.category.includes(keyword) ||
      entry.extensions.some((extension) => extension.includes(keyword)),
  )
}
