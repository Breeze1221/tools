/** 清理 SVG 源码时的可选开关，默认全部开启 */
export type OptimizeSvgOptions = {
  readonly removeXmlDeclaration?: boolean
  readonly removeComments?: boolean
  readonly collapseWhitespace?: boolean
}

/** 生成 React 组件代码时的选项 */
export type SvgToJsxOptions = {
  readonly componentName?: string
  readonly typescript?: boolean
  /** 是否先执行 optimizeSvg（默认 true） */
  readonly optimize?: boolean
}

/** toHtmlEntities 的输出选项 */
export type HtmlEntitiesOptions = {
  /** 组件名，用于生成 SvgComponent 包装 */
  readonly componentName?: string
}

const XML_DECLARATION_PATTERN = /<\?xml[\s\S]*?\?>/gi
const DOCTYPE_PATTERN = /<!DOCTYPE[\s\S]*?>/gi
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g
const SVG_ROOT_PATTERN = /^<svg(?:\s|>)/i
const COMPONENT_NAME_PATTERN = /^[A-Za-z_$][\w$]*$/
const ATTRIBUTE_PATTERN =
  /([A-Za-z_:][-\w:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g
const EMPTY_ELEMENT_PATTERN = /<([A-Za-z][\w:.-]*)((?:[^<>"']|"[^"]*"|'[^']*')*)>\s*<\/\1>/g

/**
 * SVG 属性中存在大写字母但不能简单转小写的名字。
 * 键为小写形式，值为 JSX 中要求的规范写法（如 viewbox → viewBox）。
 */
const ATTRIBUTE_CASE: Readonly<Record<string, string>> = {
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
  gradientunits: 'gradientUnits',
  gradienttransform: 'gradientTransform',
  patternunits: 'patternUnits',
  patterncontentunits: 'patternContentUnits',
  patterntransform: 'patternTransform',
  clippathunits: 'clipPathUnits',
  maskunits: 'maskUnits',
  maskcontentunits: 'maskContentUnits',
  markerunits: 'markerUnits',
  markerwidth: 'markerWidth',
  markerheight: 'markerHeight',
  refx: 'refX',
  refy: 'refY',
  textlength: 'textLength',
  lengthadjust: 'lengthAdjust',
  baseprofile: 'baseProfile',
  filterunits: 'filterUnits',
  stddeviation: 'stdDeviation',
  startoffset: 'startOffset',
  spreadmethod: 'spreadMethod',
  repeatcount: 'repeatCount',
  repeatdur: 'repeatDur',
  keypoints: 'keyPoints',
  keysplines: 'keySplines',
  keytimes: 'keyTimes',
  calcmode: 'calcMode',
  pathlength: 'pathLength',
  attributename: 'attributeName',
  attributetype: 'attributeType',
  zoomandpan: 'zoomAndPan',
  xchannelselector: 'xChannelSelector',
  ychannelselector: 'yChannelSelector',
  surfacescale: 'surfaceScale',
  specularconstant: 'specularConstant',
  specularexponent: 'specularExponent',
  diffuseconstant: 'diffuseConstant',
  kernelmatrix: 'kernelMatrix',
  kernelunitlength: 'kernelUnitLength',
  targetx: 'targetX',
  targety: 'targetY',
}

type ParsedTag = {
  readonly name: string
  readonly attributes: string
  readonly isClosing: boolean
  readonly isSelfClosing: boolean
}

/** 把 XML 属性名转成 JSX camelCase：stroke-width → strokeWidth */
export function camelCase(attr: string): string {
  const trimmed = attr.trim()
  if (trimmed === '') {
    return attr
  }
  if (trimmed.includes('-')) {
    return trimmed
      .split('-')
      .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
      .join('')
  }
  return ATTRIBUTE_CASE[trimmed.toLowerCase()] ?? trimmed
}

/** 把 style="a:b;c:d" 转换成 JS 对象字面量片段 */
export function styleStringToObject(style: string): string {
  const declarations: string[] = []

  for (const chunk of style.split(';')) {
    const declaration = chunk.trim()
    if (declaration === '') {
      continue
    }

    const colon = declaration.indexOf(':')
    if (colon === -1) {
      continue
    }

    const rawProperty = declaration.slice(0, colon).trim()
    const value = declaration.slice(colon + 1).trim()
    if (rawProperty === '' || value === '') {
      continue
    }

    const property = rawProperty.startsWith('--')
      ? `'${escapeSingleQuoted(rawProperty)}'`
      : camelCase(rawProperty)
    declarations.push(`${property}: '${escapeSingleQuoted(value)}'`)
  }

  if (declarations.length === 0) {
    return ''
  }

  return `{ ${declarations.join(', ')} }`
}

function assertSvgRoot(source: string): void {
  if (!SVG_ROOT_PATTERN.test(source)) {
    throw new Error('Invalid SVG: root element must be <svg>')
  }
}

/** 找到标签的结束 `>`，跳过引号内的同名字符 */
function findTagEnd(markup: string, start: number): number {
  let quote: '"' | "'" | null = null
  for (let index = start + 1; index < markup.length; index += 1) {
    const char = markup[index]
    if (quote !== null) {
      if (char === quote) {
        quote = null
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '>') {
      return index
    }
  }
  return -1
}

/** 把标签内部（引号之外）的连续空白压成一个空格，并去掉 `>`、`/>` 前的空格 */
function normalizeTagSpacing(tag: string): string {
  let result = ''
  let quote: '"' | "'" | null = null
  let hasPendingSpace = false

  for (const char of tag) {
    if (quote !== null) {
      result += char
      if (char === quote) {
        quote = null
      }
      continue
    }

    if (char === '"' || char === "'") {
      if (hasPendingSpace && result !== '' && !result.endsWith(' ')) {
        result += ' '
      }
      hasPendingSpace = false
      quote = char
      result += char
      continue
    }

    if (/\s/.test(char)) {
      hasPendingSpace = true
      continue
    }

    if (hasPendingSpace) {
      const shouldSkip =
        result === '' || result.endsWith('<') || char === '>' || char === '/' || char === '='
      if (!shouldSkip && !result.endsWith(' ')) {
        result += ' '
      }
      hasPendingSpace = false
    }

    result += char
  }

  return result
}

type TagConverter = (tag: string) => string

/** 逐段扫描标签并交给 convert 处理，注释交给 convertComment */
function transformTags(
  markup: string,
  convert: TagConverter,
  convertComment: TagConverter = (comment) => comment,
): string {
  let result = ''
  let index = 0

  while (index < markup.length) {
    const open = markup.indexOf('<', index)
    if (open === -1) {
      result += markup.slice(index)
      break
    }

    result += markup.slice(index, open)

    if (markup.startsWith('<!--', open)) {
      const close = markup.indexOf('-->', open + 4)
      if (close === -1) {
        result += markup.slice(open)
        break
      }
      result += convertComment(markup.slice(open, close + 3))
      index = close + 3
      continue
    }

    const end = findTagEnd(markup, open)
    if (end === -1) {
      result += markup.slice(open)
      break
    }

    result += convert(markup.slice(open, end + 1))
    index = end + 1
  }

  return result
}

/** 去掉 BOM、XML 声明、DOCTYPE 与注释，并校验根节点 */
function cleanProlog(svg: string, removeXmlDeclaration: boolean, removeComments: boolean): string {
  let source = svg.replace(/^\uFEFF/, '').trim()
  if (source === '') {
    throw new Error('SVG source is empty')
  }

  if (removeXmlDeclaration) {
    source = source.replace(XML_DECLARATION_PATTERN, '')
  }
  source = source.replace(DOCTYPE_PATTERN, '').trim()

  if (removeComments) {
    source = source.replace(COMMENT_PATTERN, '').trim()
  }

  if (source === '') {
    throw new Error('SVG source is empty')
  }

  assertSvgRoot(source)
  return source
}

/**
 * 校验 SVG 输入，返回清理后的源码。非法 SVG 抛 Error('Invalid SVG input')。
 */
export function parseSvgSource(input: string): string {
  if (!input || input.trim() === '') {
    throw new Error('Invalid SVG input')
  }
  try {
    return cleanProlog(input, true, true)
  } catch {
    throw new Error('Invalid SVG input')
  }
}

/** 压缩 SVG：去声明 / DOCTYPE / 注释，压缩标签间空白与多余属性空白 */
export function optimizeSvg(svg: string, options: OptimizeSvgOptions = {}): string {
  const {
    removeXmlDeclaration = true,
    removeComments = true,
    collapseWhitespace = true,
  } = options

  let source = cleanProlog(svg, removeXmlDeclaration, removeComments)

  if (collapseWhitespace) {
    source = transformTags(source, normalizeTagSpacing)
    source = source.replace(/>\s+</g, '><').trim()
  }

  return source
}

function parseTag(raw: string): ParsedTag | null {
  if (raw.length < 3 || raw[0] !== '<' || raw[raw.length - 1] !== '>') {
    return null
  }

  const content = raw.slice(1, -1)

  if (content.startsWith('/')) {
    const closingMatch = /^\/\s*([A-Za-z][\w:.-]*)/.exec(content)
    if (closingMatch === null) {
      return null
    }
    return { name: closingMatch[1], attributes: '', isClosing: true, isSelfClosing: false }
  }

  if (content.startsWith('!') || content.startsWith('?')) {
    return null
  }

  let body = content.trim()
  let isSelfClosing = false
  if (body.endsWith('/')) {
    isSelfClosing = true
    body = body.slice(0, -1).trimEnd()
  }

  const openingMatch = /^([A-Za-z][\w:.-]*)/.exec(body)
  if (openingMatch === null) {
    return null
  }

  return {
    name: openingMatch[1],
    attributes: body.slice(openingMatch[0].length).trim(),
    isClosing: false,
    isSelfClosing,
  }
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function camelize(value: string): string {
  return value
    .split('-')
    .map((part, index) => (index === 0 ? part : capitalize(part)))
    .join('')
}

/** HTML / SVG 属性名 → JSX 属性名；返回 null 表示丢弃 */
function convertAttributeName(name: string): string | null {
  if (name === 'xmlns' || name.startsWith('xmlns:')) {
    return null
  }
  if (name === 'xlink:href') {
    return 'href'
  }
  if (name === 'class') {
    return 'className'
  }
  if (name.startsWith('data-') || name.startsWith('aria-')) {
    return name
  }
  if (name.includes(':')) {
    const [prefix, ...rest] = name.split(':')
    const suffix = rest.join('-')
    if (suffix === '') {
      return null
    }
    return `${prefix}${capitalize(camelize(suffix))}`
  }
  if (name.includes('-')) {
    return camelize(name)
  }
  return ATTRIBUTE_CASE[name.toLowerCase()] ?? name
}

function escapeSingleQuoted(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")
}

function convertStyle(style: string): string | null {
  const obj = styleStringToObject(style)
  return obj === '' ? null : obj.replace(/^\{/, '{{').replace(/\}$/, '}}')
}

function escapeAttributeValue(value: string): string {
  return value.replaceAll('"', '&quot;')
}

/** 把一段属性源码转换成渲染好的 JSX 属性片段 */
function convertAttributes(source: string): string[] {
  const attributes: string[] = []
  ATTRIBUTE_PATTERN.lastIndex = 0

  let match = ATTRIBUTE_PATTERN.exec(source)
  while (match !== null) {
    const rawName = match[1] ?? ''
    const value = match[2] ?? match[3] ?? match[4]
    const name = convertAttributeName(rawName)

    if (name !== null) {
      if (value === undefined) {
        attributes.push(name)
      } else if (name === 'style') {
        const styleObject = convertStyle(value)
        if (styleObject !== null) {
          attributes.push(`style=${styleObject}`)
        }
      } else {
        attributes.push(`${name}="${escapeAttributeValue(value)}"`)
      }
    }

    match = ATTRIBUTE_PATTERN.exec(source)
  }

  return attributes
}

function renderTag(name: string, attributes: readonly string[], isSelfClosing: boolean): string {
  const head = `<${[name, ...attributes].join(' ')}`
  return isSelfClosing ? `${head} />` : `${head}>`
}

function convertChildTag(raw: string): string {
  const parsed = parseTag(raw)
  if (parsed === null) {
    return raw
  }
  if (parsed.isClosing) {
    return `</${parsed.name}>`
  }
  return renderTag(parsed.name, convertAttributes(parsed.attributes), parsed.isSelfClosing)
}

function convertCommentToJsx(comment: string): string {
  const body = comment.slice(4, -3).replaceAll('*/', '*\\/')
  return `{/*${body}*/}`
}

/** `<tag ...></tag>` → `<tag ... />`，反复处理以覆盖嵌套空元素 */
function collapseEmptyElements(markup: string): string {
  let result = markup
  let previous = ''

  while (result !== previous) {
    previous = result
    result = result.replace(
      EMPTY_ELEMENT_PATTERN,
      (_match, name: string, attributes: string) =>
        renderTag(name, [attributes.trim()].filter((value) => value !== ''), true),
    )
  }

  return result
}

/**
 * 逐个子元素排成多行；只要标签之间存在非空白文本就保持原样，
 * 避免给 `<text>` 之类带文本内容的元素引入多余换行。
 */
function formatChildren(markup: string): string {
  const matches = Array.from(markup.matchAll(/<[^>]*>/g))
  if (matches.length === 0) {
    return markup.trim()
  }

  let cursor = 0
  for (const match of matches) {
    const index = match.index
    if (index === undefined) {
      return markup.trim()
    }
    if (markup.slice(cursor, index).trim() !== '') {
      return markup.trim()
    }
    cursor = index + match[0].length
  }
  if (markup.slice(cursor).trim() !== '') {
    return markup.trim()
  }

  const lines: string[] = []
  let depth = 0
  for (const match of matches) {
    const tag = match[0]
    if (tag.startsWith('</')) {
      depth = Math.max(depth - 1, 0)
    }
    lines.push(`${'  '.repeat(depth)}${tag}`)
    if (!tag.startsWith('</') && !tag.endsWith('/>')) {
      depth += 1
    }
  }

  return lines.join('\n')
}

/**
 * SVG 源码 → React 组件代码（JSX / TSX）。
 *
 * 属性转 camelCase（stroke-width → strokeWidth）、class → className、
 * style 字符串转对象、xlink:href → href、空标签自闭合，保留 data-* / aria-*，
 * 去掉多余的 xmlns 但保留 viewBox，根节点展开 props。
 */
export function toJsxComponent(svg: string, options: SvgToJsxOptions = {}): string {
  const componentName = (options.componentName ?? '').trim() || 'SvgComponent'
  if (!COMPONENT_NAME_PATTERN.test(componentName)) {
    throw new Error(`Invalid component name: "${componentName}" is not a valid identifier`)
  }

  const typescript = options.typescript ?? true
  const source =
    options.optimize === false ? cleanProlog(svg, true, false) : optimizeSvg(svg)

  const rootEnd = findTagEnd(source, 0)
  if (rootEnd === -1) {
    throw new Error('Invalid SVG: unterminated root element')
  }

  const root = parseTag(source.slice(0, rootEnd + 1))
  if (root === null || root.isClosing || root.name.toLowerCase() !== 'svg') {
    throw new Error('Invalid SVG: root element must be <svg>')
  }

  const remainder = source.slice(rootEnd + 1).trim()
  if (root.isSelfClosing && remainder !== '') {
    throw new Error('Invalid SVG: content after a self-closing root element')
  }

  let childrenMarkup = ''
  if (!root.isSelfClosing) {
    const closingMatch = /<\/svg\s*>$/i.exec(remainder)
    if (closingMatch === null || closingMatch.index === undefined) {
      throw new Error('Invalid SVG: missing closing </svg>')
    }
    childrenMarkup = remainder.slice(0, closingMatch.index).trim()
  }

  const rootAttributes = convertAttributes(root.attributes)
  rootAttributes.push('{...props}')
  const rootOpenTag = `<${[root.name, ...rootAttributes].join(' ')}`

  let childMarkup = transformTags(childrenMarkup, convertChildTag, convertCommentToJsx)
  childMarkup = collapseEmptyElements(childMarkup).trim()

  const lines: string[] = []
  if (typescript) {
    lines.push("import type { SVGProps } from 'react'", '')
  }
  lines.push(
    `export function ${componentName}(props${typescript ? ': SVGProps<SVGSVGElement>' : ''}) {`,
    '  return (',
  )

  if (root.isSelfClosing || childMarkup === '') {
    lines.push(`    ${rootOpenTag} />`)
  } else {
    lines.push(`    ${rootOpenTag}>`)
    for (const line of formatChildren(childMarkup).split('\n')) {
      lines.push(`      ${line}`)
    }
    lines.push(`    </${root.name}>`)
  }

  lines.push('  )', '}')
  return lines.join('\n')
}

/**
 * SVG 源码 → 普通 HTML 实体形式（保留原始属性名，去掉 xmlns，压缩空白）。
 * 可用于纯静态 HTML 嵌入。
 */
export function toHtmlEntities(svg: string, options: HtmlEntitiesOptions = {}): string {
  const componentName = (options.componentName ?? '').trim() || 'SvgIcon'
  const optimized = optimizeSvg(svg)

  let source = transformTags(optimized, (tag) => {
    const parsed = parseTag(tag)
    if (parsed === null || parsed.isClosing) {
      return tag
    }
    const attrs = convertAttributes(parsed.attributes).filter((a) => !a.startsWith('xmlns'))
    return renderTag(parsed.name, attrs, parsed.isSelfClosing)
  })

  // 空标签自闭合
  source = collapseEmptyElements(source).trim()

  return `<!-- ${componentName} -->\n${source}`
}

/** @deprecated 请使用 toJsxComponent */
export const svgToJsx = toJsxComponent
