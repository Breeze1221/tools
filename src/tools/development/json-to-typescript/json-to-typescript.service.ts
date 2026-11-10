const IDENTIFIER_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/

type PrimitiveName = 'string' | 'number' | 'boolean' | 'null' | 'unknown'

type TypeField = {
  readonly key: string
  readonly type: TypeNode
}

type TypeNode =
  | { readonly kind: 'primitive'; readonly name: PrimitiveName }
  | { readonly kind: 'array'; readonly element: TypeNode }
  | { readonly kind: 'object'; readonly fields: readonly TypeField[] }
  | { readonly kind: 'emptyObject' }
  | { readonly kind: 'union'; readonly members: readonly TypeNode[] }

export type TypescriptMode = 'interface' | 'type' | 'zod'

export type GenerateTypesOptions = {
  readonly mode: TypescriptMode
  readonly rootName: string
  readonly exportKeyword: boolean
}

type Declaration = {
  name: string
  body: string
}

type BuildContext = {
  readonly declarations: Declaration[]
  readonly allocate: (preferred: string) => string
}

/** 把 JSON 值折叠成类型节点：数组取元素并集，对象逐字段递归 */
function buildNode(value: unknown): TypeNode {
  if (value === null) {
    return { kind: 'primitive', name: 'null' }
  }
  if (typeof value === 'string') {
    return { kind: 'primitive', name: 'string' }
  }
  if (typeof value === 'number') {
    return { kind: 'primitive', name: 'number' }
  }
  if (typeof value === 'boolean') {
    return { kind: 'primitive', name: 'boolean' }
  }
  if (Array.isArray(value)) {
    const element: TypeNode =
      value.length === 0 ? { kind: 'primitive', name: 'unknown' } : unionOf(value.map(buildNode))
    return { kind: 'array', element }
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return { kind: 'emptyObject' }
    }
    return {
      kind: 'object',
      fields: entries.map(([key, item]) => ({ key, type: buildNode(item) })),
    }
  }
  return { kind: 'primitive', name: 'unknown' }
}

/** 结构指纹：用于联合类型去重（同形状对象只保留一份） */
function fingerprint(node: TypeNode): string {
  switch (node.kind) {
    case 'primitive':
      return `p:${node.name}`
    case 'emptyObject':
      return 'o:{}'
    case 'array':
      return `a:${fingerprint(node.element)}`
    case 'object':
      return `o:{${node.fields.map((field) => `${field.key}:${fingerprint(field.type)}`).join(',')}}`
    case 'union':
      return `u:${node.members.map(fingerprint).sort().join('|')}`
  }
}

function unionOf(nodes: readonly TypeNode[]): TypeNode {
  const seen = new Map<string, TypeNode>()
  for (const node of nodes) {
    const members = node.kind === 'union' ? node.members : [node]
    for (const member of members) {
      const key = fingerprint(member)
      if (!seen.has(key)) {
        seen.set(key, member)
      }
    }
  }

  const members = [...seen.values()]
  if (members.length === 0) {
    return { kind: 'primitive', name: 'unknown' }
  }
  if (members.length === 1) {
    return members[0]
  }

  // null 统一排到最后，输出 `T | null` 更符合阅读习惯
  const nulls = members.filter((member) => member.kind === 'primitive' && member.name === 'null')
  const rest = members.filter((member) => !nulls.includes(member))
  return { kind: 'union', members: [...rest, ...nulls] }
}

function isIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value)
}

/** 非法标识符（含空格、横线、数字开头等）一律加单引号 */
function formatPropertyKey(key: string): string {
  if (isIdentifier(key)) {
    return key
  }
  return `'${key.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

/** 键名 → 类型名：按非字母数字切分后逐段首字母大写 */
function pascalCase(value: string): string {
  const parts = value.split(/[^A-Za-z0-9]+/).filter((part) => part !== '')
  const joined = parts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('')
  if (joined === '') {
    return 'Type'
  }
  return /^[0-9]/.test(joined) ? `Type${joined}` : joined
}

function normalizeRootName(value: string): string {
  const cleaned = value.trim().replace(/[^A-Za-z0-9_$]/g, '')
  if (cleaned === '') {
    return 'Root'
  }
  return /^[0-9]/.test(cleaned) ? `Root${cleaned}` : cleaned
}

/** 类型名唯一化：重名时追加数字（Foo、Foo2、Foo3…） */
function createNameAllocator(reserved: readonly string[]): (preferred: string) => string {
  const used = new Set(reserved)
  return (preferred: string): string => {
    if (!used.has(preferred)) {
      used.add(preferred)
      return preferred
    }
    let index = 2
    while (used.has(`${preferred}${index}`)) {
      index += 1
    }
    const name = `${preferred}${index}`
    used.add(name)
    return name
  }
}

function indentLines(text: string, spaces: number): string {
  const prefix = ' '.repeat(spaces)
  return text
    .split('\n')
    .map((line) => (line === '' ? line : `${prefix}${line}`))
    .join('\n')
}

function renderTsReference(node: TypeNode, preferred: string, context: BuildContext): string {
  switch (node.kind) {
    case 'primitive':
      return node.name
    case 'emptyObject':
      return 'Record<string, never>'
    case 'array': {
      const element = renderTsReference(node.element, preferred, context)
      return node.element.kind === 'union' ? `(${element})[]` : `${element}[]`
    }
    case 'union':
      return node.members.map((member) => renderTsReference(member, preferred, context)).join(' | ')
    case 'object': {
      const name = context.allocate(preferred)
      // 先占位再渲染字段，保证声明顺序为「外层 → 内层」
      const declaration: Declaration = { name, body: '' }
      context.declarations.push(declaration)
      declaration.body = renderTsFields(node.fields, context)
      return name
    }
  }
}

function renderTsFields(fields: readonly TypeField[], context: BuildContext): string {
  return fields
    .map(
      (field) =>
        `${formatPropertyKey(field.key)}: ${renderTsReference(field.type, pascalCase(field.key), context)}`,
    )
    .join('\n')
}

function renderZodReference(node: TypeNode, preferred: string, context: BuildContext): string {
  switch (node.kind) {
    case 'primitive':
      return `z.${node.name}()`
    case 'emptyObject':
      return 'z.record(z.string(), z.never())'
    case 'array':
      return `z.array(${renderZodReference(node.element, preferred, context)})`
    case 'union':
      return `z.union([${node.members
        .map((member) => renderZodReference(member, preferred, context))
        .join(', ')}])`
    case 'object': {
      const name = context.allocate(preferred)
      const declaration: Declaration = { name, body: '' }
      context.declarations.push(declaration)
      declaration.body = renderZodFields(node.fields, context)
      return `${name}Schema`
    }
  }
}

function renderZodFields(fields: readonly TypeField[], context: BuildContext): string {
  return fields
    .map(
      (field) =>
        `${formatPropertyKey(field.key)}: ${renderZodReference(field.type, pascalCase(field.key), context)},`,
    )
    .join('\n')
}

function renderTsModule(
  root: TypeNode,
  rootName: string,
  mode: Exclude<TypescriptMode, 'zod'>,
  exportKeyword: boolean,
): string {
  const context: BuildContext = {
    declarations: [],
    allocate: createNameAllocator([rootName]),
  }
  const exportPrefix = exportKeyword ? 'export ' : ''
  const renderDeclaration = (declaration: Declaration): string =>
    mode === 'interface'
      ? `${exportPrefix}interface ${declaration.name} {\n${indentLines(declaration.body, 2)}\n}`
      : `${exportPrefix}type ${declaration.name} = {\n${indentLines(declaration.body, 2)}\n}`

  if (root.kind === 'object') {
    const declaration: Declaration = { name: rootName, body: '' }
    context.declarations.push(declaration)
    declaration.body = renderTsFields(root.fields, context)
    return context.declarations.map(renderDeclaration).join('\n\n')
  }

  // 根不是对象：先输出根别名（空对象 / 空数组 / 原始值 / 数组等），再跟嵌套声明
  const reference = renderTsReference(root, `${pascalCase(rootName)}Item`, context)
  const alias = `${exportPrefix}type ${rootName} = ${reference}`
  return [alias, ...context.declarations.map(renderDeclaration)].join('\n\n')
}

function renderZodModule(root: TypeNode, rootName: string, exportKeyword: boolean): string {
  const context: BuildContext = {
    declarations: [],
    allocate: createNameAllocator([rootName]),
  }
  const exportPrefix = exportKeyword ? 'export ' : ''
  const renderDeclaration = (declaration: Declaration): string =>
    `${exportPrefix}const ${declaration.name}Schema = z.object({\n${indentLines(declaration.body, 2)}\n})`

  const rootIsObject = root.kind === 'object'
  let rootExpression = ''
  if (rootIsObject) {
    const declaration: Declaration = { name: rootName, body: '' }
    context.declarations.push(declaration)
    declaration.body = renderZodFields(root.fields, context)
  } else {
    rootExpression = renderZodReference(root, `${pascalCase(rootName)}Item`, context)
  }

  // 嵌套 schema 先于引用它们的父级声明（const 存在 TDZ，顺序反了运行时会报错）
  const schemaBlocks = [...context.declarations].reverse().map(renderDeclaration)
  if (!rootIsObject) {
    schemaBlocks.push(`${exportPrefix}const ${rootName}Schema = ${rootExpression}`)
  }

  const typeAlias = `${exportPrefix}type ${rootName} = z.infer<typeof ${rootName}Schema>`
  return [`import { z } from 'zod'`, schemaBlocks.join('\n\n'), typeAlias].join('\n\n')
}

export function generateTypes(json: string, options: GenerateTypesOptions): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Invalid JSON')
  }

  const root = buildNode(parsed)
  const rootName = normalizeRootName(options.rootName)

  if (options.mode === 'zod') {
    return renderZodModule(root, rootName, options.exportKeyword)
  }
  return renderTsModule(root, rootName, options.mode, options.exportKeyword)
}
