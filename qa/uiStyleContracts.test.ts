import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const styles = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8')

function cssBlock(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, 'm'))
  expect(match, `Missing CSS block for ${selector}`).not.toBeNull()
  return match?.[1] ?? ''
}

describe('UI style contracts', () => {
  it('keeps project tab inline rename visually borderless', () => {
    const renameBlock = cssBlock('.projectTabRename')
    const focusBlock = cssBlock('.projectTabRename:focus')

    expect(renameBlock).toMatch(/border:\s*0;/)
    expect(renameBlock).toMatch(/background:\s*transparent;/)
    expect(focusBlock).toMatch(/box-shadow:\s*none;/)
  })

  it('keeps floating menus above toolbar and editor layers', () => {
    expect(cssBlock('.contextMenu')).toMatch(/z-index:\s*1000;/)
    expect(cssBlock('.lightTooltip')).toMatch(/z-index:\s*1100;/)
  })

  it('uses the custom LightEdit type menu instead of the native select styling', () => {
    expect(cssBlock('.typeSelectButton')).toMatch(/background:\s*transparent;/)
    expect(cssBlock('.contextMenu.typeMenu')).toMatch(/width:\s*116px;/)
    expect(styles).not.toMatch(/\.typeSelect\s*\{/)
  })
})
