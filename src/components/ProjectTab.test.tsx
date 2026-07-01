import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProjectTab from './ProjectTab'
import type { Project } from '../types'

const project: Project = {
  id: 'project-1',
  name: 'API Test',
  createdAt: 1,
  updatedAt: 1,
  lastOpenedAt: 1,
}

function renderProjectTab({
  renaming = false,
  tabProject = project,
}: {
  renaming?: boolean
  tabProject?: Project
} = {}) {
  const props = {
    project: tabProject,
    active: true,
    renaming,
    onSelect: vi.fn(),
    onStartRename: vi.fn(),
    onRename: vi.fn(),
    onCancelRename: vi.fn(),
    onClose: vi.fn(),
    onDelete: vi.fn(),
  }

  render(<ProjectTab {...props} />)
  return props
}

describe('ProjectTab', () => {
  it('uses the close button to close the tab instead of deleting the project', () => {
    const props = renderProjectTab()

    fireEvent.click(screen.getByLabelText('Close API Test'))

    expect(props.onClose).toHaveBeenCalledTimes(1)
    expect(props.onDelete).not.toHaveBeenCalled()
  })

  it('replaces the browser context menu with project actions', () => {
    const props = renderProjectTab()
    const tabButton = screen.getByRole('button', { name: 'API Test' })

    expect(fireEvent.contextMenu(tabButton, { clientX: 140, clientY: 32 })).toBe(false)

    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename Project' }))
    expect(props.onStartRename).toHaveBeenCalledTimes(1)

    fireEvent.contextMenu(tabButton, { clientX: 140, clientY: 32 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Close Tab' }))
    expect(props.onClose).toHaveBeenCalledTimes(1)

    fireEvent.contextMenu(tabButton, { clientX: 140, clientY: 32 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Project...' }))
    expect(props.onDelete).toHaveBeenCalledTimes(1)
  })

  it('commits an inline rename from the tab label', () => {
    const props = renderProjectTab({ renaming: true })
    const input = screen.getByLabelText('Rename API Test')

    fireEvent.change(input, { target: { value: 'Project Mercury' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(props.onRename).toHaveBeenCalledWith('Project Mercury')
    expect(props.onCancelRename).not.toHaveBeenCalled()
  })

  it('uses a LightEdit tooltip for long tab names', async () => {
    vi.useFakeTimers()
    try {
      const longName = 'Test R en a a a a a a me'
      renderProjectTab({ tabProject: { ...project, name: longName } })

      fireEvent.mouseEnter(screen.getByRole('button', { name: longName }))
      await act(async () => {
        vi.advanceTimersByTime(1100)
      })

      expect(screen.getByRole('tooltip')).toHaveTextContent(longName)
    } finally {
      vi.useRealTimers()
    }
  })
})
