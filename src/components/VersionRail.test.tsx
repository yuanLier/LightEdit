import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import VersionRail from './VersionRail'
import type { Version } from '../types'

const versions: Version[] = [
  {
    id: 'version-2',
    projectId: 'project-1',
    versionIndex: 2,
    type: 'json',
    content: '{}',
    isStarred: false,
    createdAt: 2,
    updatedAt: 2,
  },
  {
    id: 'version-1',
    projectId: 'project-1',
    versionIndex: 1,
    type: 'json',
    content: '{}',
    isStarred: false,
    createdAt: 1,
    updatedAt: 1,
  },
]

function renderVersionRail() {
  const props = {
    versions,
    activeVersionId: 'version-2',
    onSelectVersion: vi.fn(),
    onRenameVersion: vi.fn(),
    onDeleteVersion: vi.fn(),
  }

  render(<VersionRail {...props} />)
  return props
}

describe('VersionRail', () => {
  it('uses the LightEdit context menu for inline version rename', () => {
    const props = renderVersionRail()
    const versionButton = screen.getByRole('button', { name: 'v1' })

    expect(fireEvent.contextMenu(versionButton, { clientX: 32, clientY: 180 })).toBe(false)

    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename Version' }))

    const input = screen.getByLabelText('Rename v1')
    fireEvent.change(input, { target: { value: 'Before API call' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(props.onRenameVersion).toHaveBeenCalledWith('version-1', 'Before API call')
  })

  it('keeps the compact delete button as the delete entry point', () => {
    const props = renderVersionRail()

    fireEvent.click(screen.getByLabelText('Delete v1'))

    expect(props.onDeleteVersion).toHaveBeenCalledWith('version-1')
  })

  it('renders custom version names in the rail', () => {
    render(
      <VersionRail
        versions={[{ ...versions[0], name: 'Before API call' }]}
        activeVersionId="version-2"
        onSelectVersion={vi.fn()}
        onRenameVersion={vi.fn()}
        onDeleteVersion={vi.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Before API call' })).toBeInTheDocument()
  })
})
