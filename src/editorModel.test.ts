import { describe, expect, it } from 'vitest'
import {
  applyTabEdit,
  escapeHtml,
  getEditorContentWidth,
  getEditorHeight,
  getEditorLineCount,
  highlightedContent,
} from './editorModel'

describe('editor model', () => {
  it('keeps a useful minimum line count for empty notes', () => {
    expect(getEditorLineCount('')).toBe(16)
    expect(getEditorHeight('')).toBe('calc(16 * var(--editor-line-height) + 44px)')
  })

  it('grows line count and content width from real content', () => {
    const seventeenLines = Array.from({ length: 17 }, (_, index) => `line-${index}`).join('\n')

    expect(getEditorLineCount(seventeenLines)).toBe(17)
    expect(getEditorContentWidth('abc\n123456')).toBe('max(100%, calc(8ch + 48px))')
  })

  it('escapes unsafe text before rendering syntax markup', () => {
    expect(escapeHtml('<script>&</script>')).toBe('&lt;script&gt;&amp;&lt;/script&gt;')
    expect(highlightedContent('text', '<b>hello</b>')).toBe('&lt;b&gt;hello&lt;/b&gt;')
  })

  it('adds stable token classes for json and sql content', () => {
    const json = highlightedContent('json', '{"name":"LightEdit","draft":true,"count":2}')
    const sql = highlightedContent('sql', 'select * from notes where id = 1')

    expect(json).toContain('<span class="tokenKey">"name"</span>')
    expect(json).toContain('<span class="tokenString">"LightEdit"</span>')
    expect(json).toContain('<span class="tokenBoolean">true</span>')
    expect(json).toContain('<span class="tokenNumber">2</span>')
    expect(sql).toContain('<span class="tokenKey">select</span>')
    expect(sql).toContain('<span class="tokenKey">from</span>')
  })

  it('inserts two spaces for a tab at the caret', () => {
    expect(applyTabEdit('ab', 1, 1)).toEqual({
      value: 'a  b',
      selectionStart: 3,
      selectionEnd: 3,
    })
  })

  it('indents and outdents selected lines without reordering text', () => {
    const indented = applyTabEdit('a\nb\nc', 0, 3)
    const outdented = applyTabEdit(indented.value, indented.selectionStart, indented.selectionEnd, true)

    expect(indented).toEqual({
      value: '  a\n  b\nc',
      selectionStart: 0,
      selectionEnd: 7,
    })
    expect(outdented).toEqual({
      value: 'a\nb\nc',
      selectionStart: 0,
      selectionEnd: 3,
    })
  })

  it('outdents the current line when shift tab is pressed without a selection', () => {
    expect(applyTabEdit('  a', 3, 3, true)).toEqual({
      value: 'a',
      selectionStart: 1,
      selectionEnd: 1,
    })
  })
})
