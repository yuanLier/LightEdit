import { describe, expect, it } from 'vitest'
import { formatContent, formatJson, formatSql } from './formatters'

describe('formatters', () => {
  it('pretty prints valid JSON with two-space indentation', () => {
    expect(formatJson('{"project":"LightEdit","draft":true}')).toBe(
      '{\n  "project": "LightEdit",\n  "draft": true\n}',
    )
    expect(formatContent('json', '{"draft":true}')).toEqual({
      status: 'formatted',
      content: '{\n  "draft": true\n}',
      message: 'JSON formatted',
    })
  })

  it('returns a recoverable error result for invalid JSON', () => {
    expect(formatContent('json', '{"draft":')).toEqual({
      status: 'error',
      content: '{"draft":',
      message: 'Invalid JSON',
    })
  })

  it('formats simple SQL clauses without adding dependencies', () => {
    expect(formatSql('select id, title from notes where draft = true and pinned = true')).toBe(
      'select id,\n  title\nfrom notes\nwhere draft = true\n  and pinned = true',
    )
    expect(formatContent('sql', 'select * from notes')).toEqual({
      status: 'formatted',
      content: 'select *\nfrom notes',
      message: 'SQL formatted',
    })
  })

  it('treats empty SQL as a no-op', () => {
    expect(formatContent('sql', '   ')).toEqual({
      status: 'noop',
      content: '   ',
      message: 'Nothing to format',
    })
  })

  it('keeps plain text unchanged with a lightweight message', () => {
    expect(formatContent('text', 'quick note')).toEqual({
      status: 'noop',
      content: 'quick note',
      message: 'Text has no formatter',
    })
  })
})
