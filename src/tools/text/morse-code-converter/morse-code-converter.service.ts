/** 摩斯码映射表：字母、数字与常用标点 */
export const MORSE_CODE_MAP: Readonly<Record<string, string>> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
  '0': '-----',
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  _: '..--.-',
  '"': '.-..-.',
  $: '...-..-',
  '@': '.--.-.',
}

const REVERSE_MORSE_CODE_MAP: ReadonlyMap<string, string> = new Map(
  Object.entries(MORSE_CODE_MAP).map(([char, code]) => [code, char]),
)

/** 文本转摩斯码：字母间空格分隔、单词间用 / 分隔；未知字符抛错 */
export function textToMorse(text: string): string {
  const trimmed = text.trim()
  if (trimmed === '') {
    return ''
  }

  return trimmed
    .toUpperCase()
    .split(/\s+/)
    .map((word) =>
      Array.from(word)
        .map((char) => {
          const code = MORSE_CODE_MAP[char]
          if (code === undefined) {
            throw new Error(`Unsupported character: ${char}`)
          }
          return code
        })
        .join(' '),
    )
    .join(' / ')
}

/** 摩斯码转文本：/ 分词、空格分字母；非法码元抛错，输出大写字母 */
export function morseToText(morse: string): string {
  const trimmed = morse.trim()
  if (trimmed === '') {
    return ''
  }

  return trimmed
    .split(/\s*\/\s*/)
    .map((word) =>
      word
        .trim()
        .split(/\s+/)
        .filter((code) => code !== '')
        .map((code) => {
          const char = REVERSE_MORSE_CODE_MAP.get(code)
          if (char === undefined) {
            throw new Error(`Invalid Morse code: ${code}`)
          }
          return char
        })
        .join(''),
    )
    .join(' ')
}
