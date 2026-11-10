/** canvas 渲染相关选项 */
export type Code128RenderOpts = {
  /** 单模块宽度（px），默认 2 */
  moduleWidth?: number
  /** 条形码高度（px），默认 64 */
  height?: number
  /** 左右留白（模块数），默认 10 */
  quietZone?: number
  /** 是否显示文本，默认 true */
  showText?: boolean
  /** 文本字号（px），默认 14 */
  fontSize?: number
  /** 文本与条形码的间距（px），默认 4 */
  textGap?: number
}

const DEFAULT_OPTS: Required<Code128RenderOpts> = {
  moduleWidth: 2,
  height: 64,
  quietZone: 10,
  showText: true,
  fontSize: 14,
  textGap: 4,
}

/** 用 pattern 表把符号数组展开为 0/1 模块流 */
export function expandModulesFromCodes(
  codes: readonly number[],
  patterns: readonly string[],
): number[] {
  const modules: number[] = []
  for (const code of codes) {
    const pattern = patterns[code]
    let isBar = true
    for (const ch of pattern) {
      const width = Number(ch)
      for (let j = 0; j < width; j += 1) {
        modules.push(isBar ? 1 : 0)
      }
      isBar = !isBar
    }
  }
  return modules
}

/**
 * 在给定 CanvasRenderingContext2D 上绘制 Code 128 条形码。
 * 这是唯一接触 DOM/canvas 的层。
 *
 * @param ctx   Canvas 2D 上下文
 * @param codes Code 128 符号数组（[Start, ...data, Check, Stop]）
 * @param text  原始文本（仅用于底部文字绘制）
 * @param opts  渲染选项
 * @returns     实际绘制的总宽度 px
 */
export function drawCode128(
  ctx: CanvasRenderingContext2D,
  codes: readonly number[],
  text: string,
  opts: Code128RenderOpts = {},
): number {
  const {
    moduleWidth,
    height,
    quietZone,
    showText,
    fontSize,
    textGap,
  } = { ...DEFAULT_OPTS, ...opts }

  // 这里用内联 pattern 表避免循环引用，也可以从外部传入
  // 为了与 service.ts 隔离，把 pattern 表复制一份在此文件
  const patterns = CODE128_PATTERNS_INTERNAL
  const modules = expandModulesFromCodes(codes, patterns)

  const totalModules = quietZone + modules.length + quietZone
  const totalWidth = totalModules * moduleWidth

  // 背景
  ctx.fillStyle = '#ffffff'
  const textAreaHeight = showText ? fontSize + textGap : 0
  ctx.fillRect(0, 0, totalWidth, height + textAreaHeight)

  // 条形
  ctx.fillStyle = '#000000'
  const barStartX = quietZone * moduleWidth
  for (let i = 0; i < modules.length; i += 1) {
    if (modules[i] === 1) {
      ctx.fillRect(
        barStartX + i * moduleWidth,
        0,
        moduleWidth,
        height,
      )
    }
  }

  // 文本
  if (showText && text.length > 0) {
    ctx.fillStyle = '#000000'
    ctx.font = `${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(text, totalWidth / 2, height + textGap)
  }

  return totalWidth
}

/** 预计算 Canvas 尺寸 */
export function measureCode128(
  codes: readonly number[],
  opts: Code128RenderOpts = {},
): { width: number; height: number } {
  const { moduleWidth, height, quietZone, showText, fontSize, textGap } = {
    ...DEFAULT_OPTS,
    ...opts,
  }
  const patterns = CODE128_PATTERNS_INTERNAL
  const modules = expandModulesFromCodes(codes, patterns)
  const width = (quietZone + modules.length + quietZone) * moduleWidth
  const textAreaHeight = showText ? fontSize + textGap : 0
  return { width, height: height + textAreaHeight }
}

// ── 内联 pattern 表（与 service.ts 一致但独立，避免循环引用） ────────────────

const CODE128_PATTERNS_INTERNAL: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312',
  '132212', '221213', '221312', '231212', '112232', '122132', '122231', '113222',
  '123122', '123221', '223211', '221132', '221231', '213212', '223112', '312131',
  '311222', '321122', '321221', '312212', '322112', '322211', '212123', '212321',
  '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121',
  '313121', '211331', '231131', '213113', '213311', '213131', '311123', '311321',
  '331121', '312113', '312311', '332111', '314111', '221411', '431111', '111224',
  '111422', '121124', '121421', '141122', '141221', '112214', '112412', '122114',
  '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112',
  '421211', '212141', '214121', '412121', '111143', '111341', '131141', '114113',
  '114311', '411113', '411311', '113141', '114131', '311141', '411131',
  '211412', '211214', '211232', '2331112',
] as const
