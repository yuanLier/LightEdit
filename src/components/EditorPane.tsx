import type { TextType } from '../types'

type EditorPaneProps = {
  type: TextType
  content: string
  onChange: (content: string) => void
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function highlightJson(value: string) {
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

function highlightSql(value: string) {
  const escaped = escapeHtml(value)
  return escaped.replace(
    /\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|INNER|LEFT|RIGHT|FULL|JOIN|ON|AND|OR|AS|INSERT|UPDATE|DELETE|VALUES|SET|CREATE|TABLE|ALTER|DROP|CASE|WHEN|THEN|ELSE|END)\b/gi,
    '<span class="tokenKey">$1</span>',
  )
}

function highlightedContent(type: TextType, content: string) {
  if (type === 'json') return highlightJson(content)
  if (type === 'sql') return highlightSql(content)
  return escapeHtml(content)
}

export default function EditorPane({ type, content, onChange }: EditorPaneProps) {
  const lines = content.split('\n')
  const lineCount = Math.max(lines.length, 16)
  const textHeight = `calc(${lineCount} * var(--editor-line-height) + 44px)`

  return (
    <div className="editorPane">
      <div className="lineNumbers" aria-hidden="true" style={{ minHeight: textHeight }}>
        {Array.from({ length: lineCount }, (_, index) => (
          <span key={index}>{index + 1}</span>
        ))}
      </div>
      <div className="codeSurface" style={{ minHeight: textHeight }}>
        <pre
          className="syntaxLayer"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedContent(type, content) || ' ' }}
        />
        <textarea
          className="codeInput"
          value={content}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          style={{ height: textHeight }}
          aria-label="Editor"
        />
      </div>
    </div>
  )
}
