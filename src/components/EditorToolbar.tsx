import { AlignLeft, Plus, Star } from 'lucide-react'
import type { TextType, Version } from '../types'

type EditorToolbarProps = {
  version: Version
  onTypeChange: (type: TextType) => void
  onAddVersion: () => void
  onFormat: () => void
  onToggleStar: () => void
}

const typeOptions: Array<{ value: TextType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'sql', label: 'SQL' },
  { value: 'json', label: 'JSON' },
]

export default function EditorToolbar({
  version,
  onTypeChange,
  onAddVersion,
  onFormat,
  onToggleStar,
}: EditorToolbarProps) {
  return (
    <div className="editorToolbar">
      <div className="toolbarLeft">
        <label className="typeSelectWrap">
          <select
            className="typeSelect"
            value={version.type}
            onChange={(event) => onTypeChange(event.target.value as TextType)}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="toolbarRight">
        <button className="toolbarAction" title="Add version from current content" onClick={onAddVersion}>
          <Plus size={20} strokeWidth={1.7} />
          <span>Add</span>
        </button>
        <div className="toolbarDivider" />
        <button className="toolbarAction" title="Format current content" onClick={onFormat}>
          <AlignLeft size={20} strokeWidth={1.7} />
          <span>Format</span>
        </button>
        <button
          className={`starAction ${version.isStarred ? 'active' : ''}`}
          aria-label={version.isStarred ? 'Unstar version' : 'Star version'}
          title="Keep this version"
          onClick={onToggleStar}
        >
          <Star size={19} strokeWidth={1.65} fill={version.isStarred ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  )
}
