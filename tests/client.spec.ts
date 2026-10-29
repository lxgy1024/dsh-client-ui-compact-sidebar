/** Browser half: one owned style tag, two independent heights, persistence. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  CACHE_KEY,
  STYLE_SELECTOR,
  apply,
  applyRowHeight,
  cacheHeights,
  cachedHeights,
  heightsOf,
  removeRowHeight,
} from '../src/client/index.ts'
import { buildRowCss } from '../src/core/rows.ts'

/** Minimal settings form double the plugin consumes. */
function createForm(initial: Record<string, unknown>) {
  let snapshot = { value: { ...initial } }
  const listeners = new Set<() => void>()
  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    set: async (field: string, value: unknown) => {
      snapshot = { value: { ...snapshot.value, [field]: value } }
      for (const listener of listeners) listener()
      return true
    },
  }
}

/** Minimal cordis context double. */
function createContext(form: ReturnType<typeof createForm>) {
  const effects: Array<() => void> = []
  const registrations: Array<{ options: Record<string, unknown>; injected: Record<string, unknown> }> = []
  const ctx = {
    effect: (factory: () => (() => void) | void) => {
      const disposer = factory()
      if (typeof disposer === 'function') effects.push(disposer)
    },
    locale: { register: () => () => {} },
    configForms: { get: () => form },
    slots: {
      inject: (_name: string, register: () => () => void) => register(),
      register: (options: Record<string, unknown>, _component: unknown) => {
        registrations.push({ options, injected: (options.inject as () => Record<string, unknown>)() })
        return () => {}
      },
    },
  }
  return { ctx, effects, registrations }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  removeRowHeight()
  localStorage.clear()
})

describe('style tag ownership', () => {
  it('writes one tag and reuses it on the next values', () => {
    applyRowHeight(24, 24)
    applyRowHeight(32, 20)
    const tags = document.querySelectorAll(STYLE_SELECTOR)
    expect(tags.length).toBe(1)
    expect(tags[0]?.textContent).toBe(buildRowCss(32, 20))
  })

  it('removes the tag on dispose', () => {
    applyRowHeight(24, 24)
    removeRowHeight()
    expect(document.querySelectorAll(STYLE_SELECTOR).length).toBe(0)
  })
})

describe('heightsOf', () => {
  it('reads both fields and falls back per field', () => {
    expect(heightsOf({ value: { panelHeight: 32, workspaceHeight: 24 } })).toEqual({ panel: 32, workspace: 24 })
    expect(heightsOf({ value: { panelHeight: 40 } })).toEqual({ panel: 40, workspace: 28 })
    expect(heightsOf({})).toEqual({ panel: 28, workspace: 28 })
  })
})

describe('height cache', () => {
  it('round-trips and survives unusable entries', () => {
    cacheHeights({ panel: 36, workspace: 22 })
    expect(cachedHeights()).toEqual({ panel: 36, workspace: 22 })
    localStorage.setItem(CACHE_KEY, 'not json')
    expect(cachedHeights()).toEqual({ panel: 28, workspace: 28 })
    localStorage.setItem(CACHE_KEY, JSON.stringify({ panel: 999 }))
    expect(cachedHeights()).toEqual({ panel: 48, workspace: 28 })
  })
})

describe('apply', () => {
  it('applies both persisted heights and follows later writes', async () => {
    const form = createForm({ panelHeight: 32, workspaceHeight: 22 })
    const { ctx } = createContext(form)
    apply(ctx as never)
    expect(document.querySelector(STYLE_SELECTOR)?.textContent).toBe(buildRowCss(32, 22))
    await form.set('workspaceHeight', 40)
    expect(document.querySelector(STYLE_SELECTOR)?.textContent).toBe(buildRowCss(32, 40))
  })

  it('registers one General-settings row exposing both writers', async () => {
    const form = createForm({ panelHeight: 28, workspaceHeight: 28 })
    const { ctx, registrations } = createContext(form)
    apply(ctx as never)
    expect(registrations.length).toBe(1)
    expect(registrations[0]?.options).toMatchObject({ name: 'settings.general.item', id: 'compact-sidebar-size' })
    const injected = registrations[0]?.injected as {
      setPanelHeight: (px: number) => void
      setWorkspaceHeight: (px: number) => void
    }
    injected.setPanelHeight(40)
    injected.setWorkspaceHeight(24)
    await Promise.resolve()
    await Promise.resolve()
    expect(form.getSnapshot().value).toMatchObject({ panelHeight: 40, workspaceHeight: 24 })
  })

  it('keeps the two settings independent', async () => {
    const form = createForm({ panelHeight: 28, workspaceHeight: 28 })
    const { ctx, registrations } = createContext(form)
    apply(ctx as never)
    const injected = registrations[0]?.injected as { setPanelHeight: (px: number) => void }
    injected.setPanelHeight(44)
    await Promise.resolve()
    await Promise.resolve()
    expect(form.getSnapshot().value).toMatchObject({ panelHeight: 44, workspaceHeight: 28 })
  })

  it('drops the tag when the effect is disposed', () => {
    const form = createForm({ panelHeight: 28, workspaceHeight: 28 })
    const { ctx, effects } = createContext(form)
    apply(ctx as never)
    expect(document.querySelectorAll(STYLE_SELECTOR).length).toBe(1)
    for (const dispose of effects) dispose()
    expect(document.querySelectorAll(STYLE_SELECTOR).length).toBe(0)
  })

  it('caches the applied heights for a flash-free boot', () => {
    const form = createForm({ panelHeight: 24, workspaceHeight: 30 })
    const { ctx } = createContext(form)
    apply(ctx as never)
    expect(JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')).toEqual({ panel: 24, workspace: 30 })
  })
})
