import { useRef, useState } from 'react'
import { AlignLeft, Check, ChevronDown, Plus, Star } from 'lucide-react'
import type { TextType, Version } from '../types'
import ContextMenu from './ContextMenu'

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
  const typeButtonRef = useRef<HTMLButtonElement>(null)
  const [typeMenuPosition, setTypeMenuPosition] = useState<{ x: number; y: number } | null>(null)
  const activeType = typeOptions.find((option) => option.value === version.type) ?? typeOptions[0]

  function openTypeMenu() {
    const rect = typeButtonRef.current?.getBoundingClientRect()
    if (!rect) return
    setTypeMenuPosition({
      x: Math.max(8, Math.min(rect.left, window.innerWidth - 122)),
      y: Math.max(8, Math.min(rect.bottom + 6, window.innerHeight - 130)),
    })
  }

  function selectType(type: TextType) {
    setTypeMenuPosition(null)
    if (type !== version.type) onTypeChange(type)
  }

  return (
    <div className="editorToolbar">
      <div className="toolbarLeft">
        <div className="typeSelectWrap">
          <button
            ref={typeButtonRef}
            className="typeSelectButton"
            aria-label={`Content type: ${activeType.label}`}
            aria-haspopup="menu"
            aria-expanded={Boolean(typeMenuPosition)}
            onClick={openTypeMenu}
          >
            <span>{activeType.label}</span>
            <ChevronDown size={17} strokeWidth={1.8} />
          </button>
          {typeMenuPosition && (
            <ContextMenu
              position={typeMenuPosition}
              onClose={() => setTypeMenuPosition(null)}
              className="typeMenu"
            >
              {typeOptions.map((option) => (
                <button
                  key={option.value}
                  role="menuitemradio"
                  aria-checked={option.value === version.type}
                  onClick={() => selectType(option.value)}
                >
                  <Check
                    className="typeMenuCheck"
                    size={14}
                    strokeWidth={1.9}
                    aria-hidden="true"
                    data-visible={option.value === version.type}
                  />
                  <span>{option.label}</span>
                </button>
              ))}
            </ContextMenu>
          )}
        </div>
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
