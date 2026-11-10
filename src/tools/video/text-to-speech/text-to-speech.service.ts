/** 单次朗读的字数上限：再长就交给用户分段，避免部分浏览器静默截断 */
export const MAX_TTS_TEXT_LENGTH = 5000

/** 音色的最小结构：`SpeechSynthesisVoice` 天然满足 */
export type VoiceLike = {
  readonly name: string
  readonly lang: string
  readonly default?: boolean
}

const SENTENCE_END = new Set(['。', '！', '？', '!', '?', '；', ';', '…'])
const CLOSERS = new Set(['”', '’', '"', "'", '）', ')', '】', ']'])

/**
 * 按中英文句末标点与换行分句。
 * 英文句点只在其后是空白或文本末尾时才算句末，避免把 `3.14`、`v1.2` 拆开。
 */
export function splitIntoSentences(text: string): string[] {
  const source = text.replace(/\r\n?/g, '\n').trim()
  if (!source) return []

  const sentences: string[] = []
  let buffer = ''

  const flush = () => {
    const sentence = buffer.trim()
    if (sentence) sentences.push(sentence)
    buffer = ''
  }

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (char === '\n') {
      flush()
      continue
    }

    buffer += char

    if (SENTENCE_END.has(char)) {
      // 连续的句末标点与右引号/右括号归到同一句
      while (index + 1 < source.length) {
        const next = source[index + 1]
        if (!SENTENCE_END.has(next) && !CLOSERS.has(next)) break
        index += 1
        buffer += next
      }
      flush()
      continue
    }

    if (char === '.' && (index + 1 === source.length || /\s/.test(source[index + 1]))) {
      flush()
    }
  }

  flush()
  return sentences
}

/** 校验待朗读文本：空白或超过上限抛 Error，返回去掉首尾空白的文本 */
export function validateText(text: string): string {
  const value = text.trim()
  if (!value) {
    throw new Error('Text is empty')
  }
  if (value.length > MAX_TTS_TEXT_LENGTH) {
    throw new Error(`Text exceeds ${MAX_TTS_TEXT_LENGTH} characters`)
  }
  return value
}

/** 挑选默认音色：优先中文（zh-CN 先于其他中文），其次是系统默认音色，最后取第一个 */
export function pickDefaultVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  if (voices.length === 0) return null

  const langOf = (voice: T) => voice.lang.toLowerCase().replace('_', '-')

  return (
    voices.find((voice) => langOf(voice).startsWith('zh-cn')) ??
    voices.find((voice) => langOf(voice).startsWith('zh')) ??
    voices.find((voice) => voice.default) ??
    voices[0]
  )
}
