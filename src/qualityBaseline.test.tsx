import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { STORAGE_KEY } from './storage'
import type { AppState } from './types'
import { LIGHT_TOOLTIP_DELAY_MS } from './uiTimings'

const apiContent = `{
  "endpoint": "/api/lightedit",
  "method": "POST",
  "payload": {
    "type": "json",
    "draft": true
  }
}`

function createStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

function createBaselineState(activeProjectName = 'Project 2'): AppState {
  return {
    projects: [
      {
        id: 'project-api',
        name: 'API Test',
        createdAt: 1,
        updatedAt: 1,
        lastOpenedAt: 1,
      },
      {
        id: 'project-2',
        name: activeProjectName,
        createdAt: 2,
        updatedAt: 2,
        lastOpenedAt: 2,
      },
      {
        id: 'project-3',
        name: 'Project 3',
        createdAt: 3,
        updatedAt: 3,
        lastOpenedAt: 3,
      },
    ],
    versions: [
      {
        id: 'project-api-v1',
        projectId: 'project-api',
        versionIndex: 1,
        type: 'json',
        content: apiContent,
        isStarred: false,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'project-2-v2',
        projectId: 'project-2',
        versionIndex: 2,
        type: 'json',
        content: apiContent,
        isStarred: false,
        createdAt: 2,
        updatedAt: 2,
      },
      {
        id: 'project-2-v1',
        projectId: 'project-2',
        versionIndex: 1,
        type: 'text',
        content: '',
        isStarred: false,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'project-3-v1',
        projectId: 'project-3',
        versionIndex: 1,
        type: 'text',
        content: '',
        isStarred: false,
        createdAt: 3,
        updatedAt: 3,
      },
    ],
    openProjectIds: ['project-api', 'project-2', 'project-3'],
    activeProjectId: 'project-2',
    activeVersionId: 'project-2-v2',
    isPinned: false,
  }
}

function renderBaselineApp(state = createBaselineState()) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  return render(<App />)
}

describe('LightEdit quality baseline', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock())
  })

  it('renders the 800x560 visual structure baseline', () => {
    const { container } = renderBaselineApp()

    expect(screen.getByLabelText('LightEdit')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'API Test' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Project 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Project 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New project' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open notes menu' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pin window on top' })).toBeInTheDocument()

    const versionRail = screen.getByLabelText('Versions')
    expect(within(versionRail).getByRole('button', { name: 'v2' })).toBeInTheDocument()
    expect(within(versionRail).getByRole('button', { name: 'v1' })).toBeInTheDocument()

    expect(screen.getByLabelText('Project 2 editor')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('json')
    expect(screen.getByRole('button', { name: /format/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Editor')).toHaveValue(apiContent)
    expect(container.querySelectorAll('.lineNumbers span')).toHaveLength(16)
  })

  it('keeps the Notes menu baseline state available from the top bar', () => {
    renderBaselineApp()

    fireEvent.click(screen.getByRole('button', { name: 'Open notes menu' }))

    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: /API Test/ })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: /Project 2/ })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: /Project 3/ })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /New Project/ })).toBeInTheDocument()
  })

  it('keeps custom context menus for project tabs and versions', () => {
    renderBaselineApp()

    expect(
      fireEvent.contextMenu(screen.getByRole('button', { name: 'Project 2' }), {
        clientX: 260,
        clientY: 34,
      }),
    ).toBe(false)

    let menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Rename Project' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Close Tab' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Delete Project...' })).toBeInTheDocument()

    fireEvent.pointerDown(document.body)

    fireEvent.contextMenu(screen.getByRole('button', { name: 'v1' }), {
      clientX: 42,
      clientY: 160,
    })

    menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: 'Rename Version' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Delete Version...' })).toBeInTheDocument()
  })

  it('keeps the LightEdit tooltip timing for long names', async () => {
    vi.useFakeTimers()
    try {
      const longName = 'Project with a deliberately long visible name'
      renderBaselineApp(createBaselineState(longName))

      fireEvent.mouseEnter(screen.getByRole('button', { name: longName }))
      await act(async () => {
        vi.advanceTimersByTime(LIGHT_TOOLTIP_DELAY_MS - 1)
      })
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

      await act(async () => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.getByRole('tooltip')).toHaveTextContent(longName)
    } finally {
      vi.useRealTimers()
    }
  })
})
