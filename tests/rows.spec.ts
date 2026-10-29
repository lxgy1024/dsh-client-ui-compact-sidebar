/** The pure model: clamping and the generated stylesheet contract. */
import { describe, expect, it } from 'vitest'

import {
  ROW_HEIGHT_DEFAULT,
  ROW_HEIGHT_MAX,
  ROW_HEIGHT_MIN,
  buildRowCss,
  clampRowHeight,
} from '../src/core/rows.ts'

/** Split a stylesheet into selector/body pairs with comments stripped. */
function rulesOf(css: string): Array<{ selector: string; body: string }> {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
  return [...stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].trim(),
    body: match[2].trim(),
  }))
}

describe('clampRowHeight', () => {
  it('keeps values inside the accepted range', () => {
    expect(clampRowHeight(28)).toBe(28)
    expect(clampRowHeight(ROW_HEIGHT_MIN - 10)).toBe(ROW_HEIGHT_MIN)
    expect(clampRowHeight(ROW_HEIGHT_MAX + 10)).toBe(ROW_HEIGHT_MAX)
  })

  it('rounds to whole px and falls back for non-finite input', () => {
    expect(clampRowHeight(27.6)).toBe(28)
    expect(clampRowHeight(Number.NaN)).toBe(ROW_HEIGHT_DEFAULT)
    expect(clampRowHeight(Number.POSITIVE_INFINITY)).toBe(ROW_HEIGHT_DEFAULT)
  })
})

describe('buildRowCss', () => {
  it('carries the height through the one custom property', () => {
    expect(buildRowCss(32)).toContain('--dshx-sidebar-row-height: 32px')
    expect(buildRowCss(999)).toContain(`--dshx-sidebar-row-height: ${ROW_HEIGHT_MAX}px`)
  })

  it('sizes both the panel rows and the workspace tree rows', () => {
    const css = buildRowCss(24)
    expect(css).toContain('[data-slot="sidebar"] nav > button')
    expect(css).toContain('[data-slot="sidebar"] nav > span > button')
    expect(css).toContain('[data-slot="sidebar.workspaces"] [role="treeitem"]')
  })

  it('never uses a hashed class name as an anchor', () => {
    const selectors = rulesOf(buildRowCss(24))
      .map((rule) => rule.selector)
      .join(' ')
    // The plugin's own row classes are stable (it owns them); official anchors
    // must be attribute/slot selectors only.
    expect(selectors).not.toMatch(/_\w+_\d/)
  })

  it('keeps every sizing rule scoped to the expanded sidebar', () => {
    const sizing = rulesOf(buildRowCss(24)).filter((rule) => rule.body.includes('block-size'))
    expect(sizing.length).toBeGreaterThan(0)
    for (const rule of sizing) {
      for (const part of rule.selector.split(',').map((value) => value.trim())) {
        // Both the sidebar slot and its sidebar.workspaces child are official anchors.
        expect(part.startsWith('[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar')).toBe(true)
      }
    }
  })
})
