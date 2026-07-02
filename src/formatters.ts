import type { TextType } from './types'

const sqlBreaks = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|JOIN|VALUES|SET)\b/gi
const sqlOperators = /\s+(AND|OR)\s+/gi

export type FormatResult =
  | { status: 'formatted'; content: string; message: string }
  | { status: 'noop'; content: string; message: string }
  | { status: 'error'; content: string; message: string }

export function formatJson(input: string): string {
  return JSON.stringify(JSON.parse(input), null, 2)
}

export function formatSql(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(sqlBreaks, '\n$1')
    .replace(sqlOperators, '\n  $1 ')
    .replace(/,\s*/g, ',\n  ')
    .trim()
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
}

export function formatContent(type: TextType, input: string): FormatResult {
  if (type === 'text') {
    return {
      status: 'noop',
      content: input,
      message: 'Text has no formatter',
    }
  }

  if (type === 'json') {
    try {
      return {
        status: 'formatted',
        content: formatJson(input),
        message: 'JSON formatted',
      }
    } catch {
      return {
        status: 'error',
        content: input,
        message: 'Invalid JSON',
      }
    }
  }

  const formatted = formatSql(input)
  if (!formatted) {
    return {
      status: 'noop',
      content: input,
      message: 'Nothing to format',
    }
  }

  return {
    status: 'formatted',
    content: formatted,
    message: 'SQL formatted',
  }
}
