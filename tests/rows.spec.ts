/** The pure model: clamping, numeric entry and the stylesheet contract. */
import { describe, expect, it } from 'vitest'

import {
  PANEL_DEFAULT,
  PANEL_FIELD,
  ROW_HEIGHT_MAX,
  ROW_HEIGHT_MIN,
  WORKSPACE_DEFAULT,
  WORKSPACE_FIELD,
  buildRowCss,
  clampRowHeight,
  parseRowHeight,
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

  it('rounds to whole px and clamps non-finite input to the minimum', () => {
    expect(clampRowHeight(27.6)).toBe(28)
    expect(clampRowHeight(Number.NaN)).toBe(ROW_HEIGHT_MIN)
    expect(clampRowHeight(Number.POSITIVE_INFINITY)).toBe(ROW_HEIGHT_MIN)
  })
})

describe('parseRowHeight', () => {
  it('accepts what a person types and clamps it', () => {
    expect(parseRowHeight('32')).toBe(32)
    expect(parseRowHeight('  30 ')).toBe(30)
    expect(parseRowHeight('999')).toBe(ROW_HEIGHT_MAX)
    expect(parseRowHeight('1')).toBe(ROW_HEIGHT_MIN)
  })

  it('reports no change for empty or unreadable text', () => {
    expect(parseRowHeight('')).toBeUndefined()
    expect(parseRowHeight('   ')).toBeUndefined()
    expect(parseRowHeight('abc')).toBeUndefined()
    expect(parseRowHeight('-')).toBeUndefined()
  })
})

describe('buildRowCss', () => {
  it('carries each height through its own custom property', () => {
    const css = buildRowCss(32, 24)
    expect(css).toContain('--dshx-sidebar-panel-height: 32px')
    expect(css).toContain('--dshx-sidebar-workspace-height: 24px')
  })

  it('clamps both values independently', () => {
    const css = buildRowCss(999, 1)
    expect(css).toContain(`--dshx-sidebar-panel-height: ${ROW_HEIGHT_MAX}px`)
    expect(css).toContain(`--dshx-sidebar-workspace-height: ${ROW_HEIGHT_MIN}px`)
  })

  it('sizes the functional bar and the workspace tree from different properties', () => {
    const css = buildRowCss(32, 24)
    const panelRule = rulesOf(css).find((rule) => rule.selector.includes('nav > button'))
    const workspaceRule = rulesOf(css).find((rule) => rule.selector.includes('[role="treeitem"]'))
    expect(panelRule?.body).toContain('var(--dshx-sidebar-panel-height)')
    expect(panelRule?.body).not.toContain('workspace-height')
    expect(workspaceRule?.body).toContain('var(--dshx-sidebar-workspace-height)')
    expect(workspaceRule?.body).not.toContain('panel-height')
  })

  it('never uses a hashed class name as an anchor', () => {
    const selectors = rulesOf(buildRowCss(28, 28)).map((rule) => rule.selector).join(' ')
    expect(selectors).not.toMatch(/_\w+_\d/)
  })

  it('keeps every sizing rule scoped to the expanded sidebar', () => {
    const sizing = rulesOf(buildRowCss(28, 28)).filter((rule) => rule.body.includes('block-size'))
    expect(sizing.length).toBeGreaterThan(0)
    for (const rule of sizing) {
      for (const part of rule.selector.split(',').map((value) => value.trim())) {
        expect(part.startsWith('[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar')).toBe(true)
      }
    }
  })

  it('defaults stay distinct per field so the two settings cannot share a key', () => {
    expect(PANEL_FIELD).not.toBe(WORKSPACE_FIELD)
    expect(PANEL_DEFAULT).toBe(28)
    expect(WORKSPACE_DEFAULT).toBe(28)
  })
})
