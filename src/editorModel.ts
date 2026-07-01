import type { TextType } from './types'

export const MIN_EDITOR_LINES = 16
export const EDITOR_VERTICAL_PADDING_PX = 44
export const EDITOR_HORIZONTAL_PADDING_PX = 48
export const EDITOR_INDENT = '  '

export type EditorSelection = {
  selectionStart: number
  selectionEnd: number
}

export type EditorEditResult = EditorSelection & {
  value: string
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function highlightJson(value: string) {
  const escaped = escapeHtml(value)
  return escaped.replace(
    /(?:"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(?=\s*:)|"(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\btrue\b|\bfalse\b|\bnull\b)/g,
    (token, offset: number) => {
      let className = 'tokenNumber'
      if (token.startsWith('"')) {
        const afterToken = escaped.slice(offset + token.length)
        className = /^\s*:/.test(afterToken) ? 'tokenKey' : 'tokenString'
      }
      if (token === 'true' || token === 'false') className = 'tokenBoolean'
      if (token === 'null') className = 'tokenNull'
      return `<span class="${className}">${token}</span>`
    },
  )
}

export function highlightSql(value: string) {
  const escaped = escapeHtml(value)
  return escaped.replace(
    /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|INNER|LEFT|RIGHT|FULL|JOIN|ON|AND|OR|AS|INSERT|UPDATE|DELETE|VALUES|SET|CREATE|TABLE|ALTER|DROP|CASE|WHEN|THEN|ELSE|END)\b/gi,
    '<span class="tokenKey">$1</span>',
  )
}

export function highlightedContent(type: TextType, content: string) {
  if (type === 'json') return highlightJson(content)
  if (type === 'sql') return highlightSql(content)
  return escapeHtml(content)
}

export function getEditorLineCount(content: string, minLines = MIN_EDITOR_LINES) {
  return Math.max(content.split('\n').length, minLines)
}

export function getEditorHeight(content: string) {
  return `calc(${getEditorLineCount(content)} * var(--editor-line-height) + ${EDITOR_VERTICAL_PADDING_PX}px)`
}

export function getEditorContentWidth(content: string) {
  const longestLine = content.split('\n').reduce((max, line) => Math.max(max, line.length), 1)
  return `max(100%, calc(${longestLine + 2}ch + ${EDITOR_HORIZONTAL_PADDING_PX}px))`
}

function selectedLineRange(value: string, selectionStart: number, selectionEnd: number) {
  const start = Math.min(selectionStart, selectionEnd)
  const end = Math.max(selectionStart, selectionEnd)
  const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1
  const effectiveEnd = end > start && value[end - 1] === '\n' ? end - 1 : end
  const nextLineBreak = value.indexOf('\n', effectiveEnd)
  const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak

  return { lineStart, lineEnd }
}

function lineStartOffsets(block: string, baseOffset: number) {
  const offsets = [baseOffset]
  for (let index = 0; index < block.length; index += 1) {
    if (block[index] === '\n') offsets.push(baseOffset + index + 1)
  }
  return offsets
}

function replaceSelectedLines(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  transform: (lines: string[], offsets: number[]) => { lines: string[]; shiftAt: (position: number) => number },
): EditorEditResult {
  const { lineStart, lineEnd } = selectedLineRange(value, selectionStart, selectionEnd)
  const block = value.slice(lineStart, lineEnd)
  const lines = block.split('\n')
  const offsets = lineStartOffsets(block, lineStart)
  const transformed = transform(lines, offsets)
  const nextBlock = transformed.lines.join('\n')

  return {
    value: value.slice(0, lineStart) + nextBlock + value.slice(lineEnd),
    selectionStart: selectionStart + transformed.shiftAt(selectionStart),
    selectionEnd: selectionEnd + transformed.shiftAt(selectionEnd),
  }
}

export function indentSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  indent = EDITOR_INDENT,
): EditorEditResult {
  if (selectionStart === selectionEnd) {
    return {
      value: value.slice(0, selectionStart) + indent + value.slice(selectionEnd),
      selectionStart: selectionStart + indent.length,
      selectionEnd: selectionEnd + indent.length,
    }
  }

  return replaceSelectedLines(value, selectionStart, selectionEnd, (lines, offsets) => ({
    lines: lines.map((line) => `${indent}${line}`),
    shiftAt(position) {
      return offsets.reduce((shift, lineStart) => (lineStart < position ? shift + indent.length : shift), 0)
    },
  }))
}

function removeIndent(line: string, indent: string) {
  if (line.startsWith(indent)) {
    return { line: line.slice(indent.length), removed: indent.length }
  }
  if (line.startsWith('\t')) {
    return { line: line.slice(1), removed: 1 }
  }

  const leadingSpaces = line.match(/^ +/)?.[0].length ?? 0
  const removed = Math.min(leadingSpaces, indent.length)
  return { line: line.slice(removed), removed }
}

export function outdentSelection(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  indent = EDITOR_INDENT,
): EditorEditResult {
  return replaceSelectedLines(value, selectionStart, selectionEnd, (lines, offsets) => {
    const transformed = lines.map((line) => removeIndent(line, indent))

    return {
      lines: transformed.map((item) => item.line),
      shiftAt(position) {
        return -offsets.reduce((shift, lineStart, index) => {
          const distanceIntoLine = Math.max(0, position - lineStart)
          return shift + Math.min(transformed[index].removed, distanceIntoLine)
        }, 0)
      },
    }
  })
}

export function applyTabEdit(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  shiftKey = false,
): EditorEditResult {
  if (shiftKey) return outdentSelection(value, selectionStart, selectionEnd)
  return indentSelection(value, selectionStart, selectionEnd)
}
