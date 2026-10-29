/**
 * Browser half: one General-settings row plus the stylesheet it drives.
 *
 * Both pieces read and write the same Host settings fields, so the row, the
 * stylesheet and the persisted values can never disagree: the row subscribes to
 * the settings form, and every accepted value re-renders the single style tag.
 *
 * The last accepted heights are also cached in localStorage and applied
 * synchronously at mount, so a page load paints the chosen density instead of
 * flashing the stock one while the Host settings round-trip settles.
 */
import type { ClientContext, ConfigForm } from '../core/context.ts'
import {
  PANEL_DEFAULT,
  PANEL_FIELD,
  PLUGIN_NAME,
  STYLE_ATTRIBUTE,
  WORKSPACE_DEFAULT,
  WORKSPACE_FIELD,
  buildRowCss,
  clampRowHeight,
} from '../core/rows.ts'
import { RowHeightRow } from './RowHeightRow.tsx'
import { en, zh } from './locales.ts'

/** Settings namespace the row writes to; equals the loader row id. */
export const SETTINGS_NAMESPACE = 'ui-compact-sidebar'

/** Dictionary namespace owned by this plugin. */
export const LOCALE_NAMESPACE = 'compact-sidebar'

/** localStorage key caching the last applied heights for a flash-free boot. */
export const CACHE_KEY = 'dshx-compact-sidebar:heights'

/** Selector of the style element this plugin owns. */
export const STYLE_SELECTOR = `style[${STYLE_ATTRIBUTE}="${PLUGIN_NAME}"]`

/** Required client services. */
export const inject = ['slots', 'locale', 'configForms']

/** The two heights this plugin drives. */
export interface Heights {
  panel: number
  workspace: number
}

/** Read cached heights, or the defaults when nothing usable is cached. */
export function cachedHeights(): Heights {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw === null) return { panel: PANEL_DEFAULT, workspace: WORKSPACE_DEFAULT }
    const parsed = JSON.parse(raw) as Partial<Heights>
    return {
      panel: typeof parsed.panel === 'number' ? clampRowHeight(parsed.panel) : PANEL_DEFAULT,
      workspace: typeof parsed.workspace === 'number' ? clampRowHeight(parsed.workspace) : WORKSPACE_DEFAULT,
    }
  } catch {
    return { panel: PANEL_DEFAULT, workspace: WORKSPACE_DEFAULT }
  }
}

/** Remember the applied heights for the next page load. */
export function cacheHeights(heights: Heights): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(heights))
  } catch {
    // Storage unavailable (private mode, quota): the Host values still apply.
  }
}

/**
 * Write the stylesheet for two heights into the owned style tag.
 *
 * @param panel - functional-bar row height in px.
 * @param workspace - workspace/session row height in px.
 * @returns the owned style element.
 */
export function applyRowHeight(panel: number, workspace: number): HTMLStyleElement {
  const existing = document.querySelector<HTMLStyleElement>(STYLE_SELECTOR)
  const style = existing ?? document.createElement('style')
  style.setAttribute(STYLE_ATTRIBUTE, PLUGIN_NAME)
  style.textContent = buildRowCss(panel, workspace)
  if (existing === null) document.head.append(style)
  return style
}

/** Remove the owned style tag, restoring stock density. */
export function removeRowHeight(): void {
  for (const style of document.querySelectorAll(STYLE_SELECTOR)) style.remove()
}

/** Read the heights a settings snapshot carries, falling back per field. */
export function heightsOf(snapshot: { value?: Record<string, unknown> }): Heights {
  const panel = snapshot.value?.[PANEL_FIELD]
  const workspace = snapshot.value?.[WORKSPACE_FIELD]
  return {
    panel: typeof panel === 'number' ? clampRowHeight(panel) : PANEL_DEFAULT,
    workspace: typeof workspace === 'number' ? clampRowHeight(workspace) : WORKSPACE_DEFAULT,
  }
}

/**
 * Mount the browser half.
 *
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(LOCALE_NAMESPACE, { zh, en }), 'compact-sidebar: dictionaries')
  const form: ConfigForm = ctx.configForms.get(SETTINGS_NAMESPACE)
  ctx.effect(() => {
    const cached = cachedHeights()
    applyRowHeight(cached.panel, cached.workspace)
    let appliedPanel = -1
    let appliedWorkspace = -1
    const render = (): void => {
      const heights = heightsOf(form.getSnapshot())
      if (heights.panel === appliedPanel && heights.workspace === appliedWorkspace) return
      appliedPanel = heights.panel
      appliedWorkspace = heights.workspace
      applyRowHeight(heights.panel, heights.workspace)
      cacheHeights(heights)
    }
    render()
    const unsubscribe = form.subscribe(render)
    return () => {
      unsubscribe()
      removeRowHeight()
    }
  }, 'compact-sidebar: stylesheet')
  ctx.slots.inject('settings.general.item', () =>
    ctx.slots.register(
      {
        name: 'settings.general.item',
        id: 'compact-sidebar-size',
        order: 13,
        locale: LOCALE_NAMESPACE,
        inject: () => ({
          form,
          setPanelHeight: (px: number) => {
            void form.set(PANEL_FIELD, clampRowHeight(px))
          },
          setWorkspaceHeight: (px: number) => {
            void form.set(WORKSPACE_FIELD, clampRowHeight(px))
          },
        }),
      },
      RowHeightRow,
    ),
  )
}
