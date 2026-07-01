import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EditorPane from './EditorPane'
import type { TextType } from '../types'

function EditorHarness({ initialContent = '', type = 'text' }: { initialContent?: string; type?: TextType }) {
  const [content, setContent] = useState(initialContent)

  return <EditorPane type={type} content={content} onChange={setContent} />
}

describe('EditorPane', () => {
  it('renders the minimum line-number gutter for empty content', () => {
    const { container } = render(<EditorHarness />)
    const gutter = container.querySelector('.lineNumbers')

    expect(gutter).not.toBeNull()
    expect(within(gutter as HTMLElement).getAllByText(/\d+/)).toHaveLength(16)
  })

  it('renders one line number per content line after the minimum is exceeded', () => {
    const content = Array.from({ length: 18 }, (_, index) => `line-${index}`).join('\n')
    const { container } = render(<EditorHarness initialContent={content} />)
    const gutter = container.querySelector('.lineNumbers')

    expect(gutter).not.toBeNull()
    expect(within(gutter as HTMLElement).getAllByText(/\d+/)).toHaveLength(18)
  })

  it('updates the controlled textarea value when content changes', () => {
    render(<EditorHarness />)
    const editor = screen.getByLabelText('Editor')

    fireEvent.change(editor, { target: { value: 'hello\nworld' } })

    expect(editor).toHaveValue('hello\nworld')
  })

  it('preserves paste-style multi-line replacement content', () => {
    render(<EditorHarness initialContent="replace me" />)
    const editor = screen.getByLabelText('Editor') as HTMLTextAreaElement

    editor.setSelectionRange(0, editor.value.length)
    fireEvent.change(editor, {
      target: {
        value: '{\n  "pasted": true\n}',
      },
    })

    expect(editor).toHaveValue('{\n  "pasted": true\n}')
  })

  it('keeps json syntax markup behind the editable textarea', () => {
    const { container } = render(<EditorHarness type="json" initialContent='{"draft":true}' />)
    const syntaxLayer = container.querySelector('.syntaxLayer')

    expect(syntaxLayer).not.toBeNull()
    expect(syntaxLayer?.querySelector('.tokenKey')).toHaveTextContent('"draft"')
    expect(syntaxLayer?.querySelector('.tokenBoolean')).toHaveTextContent('true')
  })

  it('uses a shared content width for long lines', () => {
    const { container } = render(<EditorHarness initialContent="0123456789" />)
    const codeSurface = container.querySelector('.codeSurface')

    expect(codeSurface).toHaveStyle({ minWidth: 'max(100%, calc(12ch + 48px))' })
  })

  it('inserts spaces on tab and restores the caret after render', () => {
    render(<EditorHarness initialContent="ab" />)
    const editor = screen.getByLabelText('Editor') as HTMLTextAreaElement

    editor.focus()
    editor.setSelectionRange(1, 1)
    fireEvent.keyDown(editor, { key: 'Tab' })

    expect(editor).toHaveValue('a  b')
    expect(editor.selectionStart).toBe(3)
    expect(editor.selectionEnd).toBe(3)
  })

  it('outdents the current line on shift tab', () => {
    render(<EditorHarness initialContent="  a" />)
    const editor = screen.getByLabelText('Editor') as HTMLTextAreaElement

    editor.focus()
    editor.setSelectionRange(3, 3)
    fireEvent.keyDown(editor, { key: 'Tab', shiftKey: true })

    expect(editor).toHaveValue('a')
    expect(editor.selectionStart).toBe(1)
    expect(editor.selectionEnd).toBe(1)
  })
})
