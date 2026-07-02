import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import VersionRail from './VersionRail'
import type { Version } from '../types'
import { LIGHT_TOOLTIP_DELAY_MS } from '../uiTimings'

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

  it('keeps delete in the context menu instead of a compact row button', () => {
    const props = renderVersionRail()
    const versionButton = screen.getByRole('button', { name: 'v1' })

    expect(screen.queryByLabelText('Delete v1')).not.toBeInTheDocument()

    fireEvent.contextMenu(versionButton, { clientX: 32, clientY: 180 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Version...' }))

    expect(props.onDeleteVersion).toHaveBeenCalledWith('version-1')
  })

  it('keeps context menu delete disabled when only one version remains', () => {
    render(
      <VersionRail
        versions={[versions[0]]}
        activeVersionId="version-2"
        onSelectVersion={vi.fn()}
        onRenameVersion={vi.fn()}
        onDeleteVersion={vi.fn()}
      />,
    )

    fireEvent.contextMenu(screen.getByRole('button', { name: 'v2' }), { clientX: 32, clientY: 180 })

    expect(screen.getByRole('menuitem', { name: 'Delete Version...' })).toBeDisabled()
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

  it('uses a LightEdit tooltip for long version names', async () => {
    vi.useFakeTimers()
    try {
      const longName = 'vvv before API call'
      render(
        <VersionRail
          versions={[{ ...versions[0], name: longName }]}
          activeVersionId="version-2"
          onSelectVersion={vi.fn()}
          onRenameVersion={vi.fn()}
          onDeleteVersion={vi.fn()}
        />,
      )

      fireEvent.mouseEnter(screen.getByRole('button', { name: longName }))
      await act(async () => {
        vi.advanceTimersByTime(LIGHT_TOOLTIP_DELAY_MS)
      })

      expect(screen.getByRole('tooltip')).toHaveTextContent(longName)
    } finally {
      vi.useRealTimers()
    }
  })
})
