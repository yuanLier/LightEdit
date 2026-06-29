import type { TextType } from './types'

const sqlBreaks = /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|JOIN|VALUES|SET)\b/gi
const sqlOperators = /\s+(AND|OR)\s+/gi

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
}

export function formatContent(type: TextType, input: string): string {
  if (type === 'json') return formatJson(input)
  if (type === 'sql') return formatSql(input)
  return input
}
