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
    onDeleteVersion: vi.fn(),
  }

  render(<VersionRail {...props} />)
  return props
}

describe('VersionRail', () => {
  it('uses the LightEdit context menu for version actions', () => {
    const props = renderVersionRail()
    const versionButton = screen.getByRole('button', { name: 'v1' })

    expect(fireEvent.contextMenu(versionButton, { clientX: 32, clientY: 180 })).toBe(false)

    fireEvent.click(screen.getByRole('menuitem', { name: 'Switch to Version' }))
    expect(props.onSelectVersion).toHaveBeenCalledWith('version-1')

    fireEvent.contextMenu(versionButton, { clientX: 32, clientY: 180 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Version...' }))
    expect(props.onDeleteVersion).toHaveBeenCalledWith('version-1')
  })

  it('keeps delete disabled when only one version remains', () => {
    render(
      <VersionRail
        versions={[versions[0]]}
        activeVersionId="version-2"
        onSelectVersion={vi.fn()}
        onDeleteVersion={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('button', { name: 'v2' }), { clientX: 32, clientY: 180 })

    expect(screen.getByRole('menuitem', { name: 'Delete Version...' })).toBeDisabled()
  })
})
