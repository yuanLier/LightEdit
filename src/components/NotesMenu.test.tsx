import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NotesMenu from './NotesMenu'
import type { Project } from '../types'

const projects: Project[] = [
  {
    id: 'project-1',
    name: 'API Test',
    createdAt: 1,
    updatedAt: 1,
    lastOpenedAt: 1,
  },
  {
    id: 'project-2',
    name: 'Project 2',
    createdAt: 2,
    updatedAt: 2,
    lastOpenedAt: 2,
  },
]

function renderNotesMenu() {
  const props = {
    projects,
    activeProjectId: 'project-1',
    onOpenProject: vi.fn(),
    onRenameProject: vi.fn(),
    onDeleteProject: vi.fn(),
    onNewProject: vi.fn(),
  }

  render(<NotesMenu {...props} />)
  return props
}

describe('NotesMenu', () => {
  it('uses the LightEdit context menu for project actions', () => {
    const props = renderNotesMenu()
    const item = screen.getByRole('menuitem', { name: /Project 2/ })

    expect(fireEvent.contextMenu(item, { clientX: 320, clientY: 140 })).toBe(false)

    expect(screen.getByRole('menuitem', { name: 'Open Project' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open Project' }))
    expect(props.onOpenProject).toHaveBeenCalledWith('project-2')

    fireEvent.contextMenu(item, { clientX: 320, clientY: 140 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete Project...' }))
    expect(props.onDeleteProject).toHaveBeenCalledWith('project-2')
  })

  it('renames a project inline from the Notes menu context action', () => {
    const props = renderNotesMenu()
    const item = screen.getByRole('menuitem', { name: /API Test/ })

    fireEvent.contextMenu(item, { clientX: 320, clientY: 140 })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename Project' }))

    const input = screen.getByLabelText('Rename API Test')
    fireEvent.change(input, { target: { value: 'Renamed API' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(props.onRenameProject).toHaveBeenCalledWith('project-1', 'Renamed API')
  })
})
