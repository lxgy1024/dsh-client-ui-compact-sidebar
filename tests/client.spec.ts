/** Browser half: one owned style tag, applied, updated and removed. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  CACHE_KEY,
  STYLE_SELECTOR,
  apply,
  applyRowHeight,
  cachedRowHeight,
  heightOf,
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
    push: (patch: Record<string, unknown>) => {
      snapshot = { value: { ...snapshot.value, ...patch } }
      for (const listener of listeners) listener()
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
  it('writes one tag and reuses it on the next value', () => {
    applyRowHeight(24)
    applyRowHeight(32)
    const tags = document.querySelectorAll(STYLE_SELECTOR)
    expect(tags.length).toBe(1)
    expect(tags[0]?.textContent).toBe(buildRowCss(32))
  })

  it('removes the tag on dispose', () => {
    applyRowHeight(24)
    removeRowHeight()
    expect(document.querySelectorAll(STYLE_SELECTOR).length).toBe(0)
  })
})

describe('heightOf', () => {
  it('reads the stored field and falls back when absent', () => {
    expect(heightOf({ value: { rowHeight: 32 } })).toBe(32)
    expect(heightOf({ value: {} })).toBe(28)
    expect(heightOf({})).toBe(28)
  })
})

describe('apply', () => {
  it('applies the persisted height and follows later writes', async () => {
    const form = createForm({ rowHeight: 32 })
    const { ctx } = createContext(form)
    apply(ctx as never)
    expect(document.querySelector(STYLE_SELECTOR)?.textContent).toBe(buildRowCss(32))
    await form.set('rowHeight', 20)
    expect(document.querySelector(STYLE_SELECTOR)?.textContent).toBe(buildRowCss(20))
  })

  it('registers one General-settings row that writes the same field', async () => {
    const form = createForm({ rowHeight: 28 })
    const { ctx, registrations } = createContext(form)
    apply(ctx as never)
    expect(registrations.length).toBe(1)
    expect(registrations[0]?.options).toMatchObject({ name: 'settings.general.item', id: 'compact-sidebar-size' })
    const setRowHeight = registrations[0]?.injected.setRowHeight as (px: number) => void
    setRowHeight(40)
    await Promise.resolve()
    expect(form.getSnapshot().value.rowHeight).toBe(40)
  })

  it('drops the tag when the effect is disposed', () => {
    const form = createForm({ rowHeight: 28 })
    const { ctx, effects } = createContext(form)
    apply(ctx as never)
    expect(document.querySelectorAll(STYLE_SELECTOR).length).toBe(1)
    for (const dispose of effects) dispose()
    expect(document.querySelectorAll(STYLE_SELECTOR).length).toBe(0)
  })

  it('caches the applied height for a flash-free boot', () => {
    const form = createForm({ rowHeight: 24 })
    const { ctx } = createContext(form)
    apply(ctx as never)
    expect(localStorage.getItem(CACHE_KEY)).toBe('24')
    expect(cachedRowHeight()).toBe(24)
  })
})
