import { useLayoutEffect, useRef, type KeyboardEvent } from 'react'
import {
  applyTabEdit,
  getEditorContentWidth,
  getEditorHeight,
  getEditorLineCount,
  highlightedContent,
  type EditorSelection,
} from '../editorModel'
import type { TextType } from '../types'

type EditorPaneProps = {
  type: TextType
  content: string
  onChange: (content: string) => void
}

export default function EditorPane({ type, content, onChange }: EditorPaneProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pendingSelectionRef = useRef<EditorSelection | null>(null)
  const lineCount = getEditorLineCount(content)
  const textHeight = getEditorHeight(content)
  const contentWidth = getEditorContentWidth(content)

  useLayoutEffect(() => {
    const pendingSelection = pendingSelectionRef.current
    if (!pendingSelection) return

    pendingSelectionRef.current = null
    textareaRef.current?.setSelectionRange(pendingSelection.selectionStart, pendingSelection.selectionEnd)
  }, [content])

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    const textarea = event.currentTarget
    const next = applyTabEdit(textarea.value, textarea.selectionStart, textarea.selectionEnd, event.shiftKey)
    pendingSelectionRef.current = {
      selectionStart: next.selectionStart,
      selectionEnd: next.selectionEnd,
    }
    onChange(next.value)
  }

  return (
    <div className="editorPane">
      <div className="lineNumbers" aria-hidden="true" style={{ minHeight: textHeight }}>
        {Array.from({ length: lineCount }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className="codeSurface" style={{ minHeight: textHeight, minWidth: contentWidth }}>
        <pre
          className="syntaxLayer"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedContent(type, content) || ' ' }}
        />
        <textarea
          ref={textareaRef}
          className="codeInput"
          value={content}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          wrap="off"
          style={{ height: textHeight }}
          aria-label="Editor"
          aria-multiline="true"
        />
      </div>
    </div>
  )
}
