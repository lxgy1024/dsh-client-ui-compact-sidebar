/**
 * Browser half: one General-settings row plus the stylesheet it drives.
 *
 * Both pieces read and write the same Host settings field, so the row, the
 * stylesheet and the persisted value can never disagree: the row subscribes to
 * the settings form, and every accepted value re-renders the single style tag.
 *
 * The last accepted height is also cached in localStorage and applied
 * synchronously at mount, so a page load paints the chosen density instead of
 * flashing the stock one while the Host settings round-trip settles.
 */
import type { ClientContext, ConfigForm } from '../core/context.ts'
import {
  PLUGIN_NAME,
  ROW_HEIGHT_DEFAULT,
  ROW_HEIGHT_FIELD,
  STYLE_ATTRIBUTE,
  buildRowCss,
  clampRowHeight,
} from '../core/rows.ts'
import { RowHeightRow } from './RowHeightRow.tsx'
import { en, zh } from './locales.ts'

/** Settings namespace the row writes to; equals the loader row id. */
export const SETTINGS_NAMESPACE = 'ui-compact-sidebar'

/** Dictionary namespace owned by this plugin. */
export const LOCALE_NAMESPACE = 'compact-sidebar'

/** localStorage key caching the last applied height for a flash-free boot. */
export const CACHE_KEY = 'dshx-compact-sidebar:rowHeight'

/** Selector of the style element this plugin owns. */
export const STYLE_SELECTOR = `style[${STYLE_ATTRIBUTE}="${PLUGIN_NAME}"]`

/** Required client services. */
export const inject = ['slots', 'locale', 'configForms']

/** Read the cached height, or the default when nothing is cached. */
export function cachedRowHeight(): number {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw === null) return ROW_HEIGHT_DEFAULT
    return clampRowHeight(Number(raw))
  } catch {
    return ROW_HEIGHT_DEFAULT
  }
}

/** Remember the applied height for the next page load. */
export function cacheRowHeight(height: number): void {
  try {
    localStorage.setItem(CACHE_KEY, String(height))
  } catch {
    // Storage unavailable (private mode, quota): the Host value still applies.
  }
}

/**
 * Write the stylesheet for one height into the owned style tag.
 *
 * @param height - row height in px.
 * @returns the owned style element.
 */
export function applyRowHeight(height: number): HTMLStyleElement {
  const existing = document.querySelector<HTMLStyleElement>(STYLE_SELECTOR)
  const style = existing ?? document.createElement('style')
  style.setAttribute(STYLE_ATTRIBUTE, PLUGIN_NAME)
  style.textContent = buildRowCss(height)
  if (existing === null) document.head.append(style)
  return style
}

/** Remove the owned style tag, restoring stock density. */
export function removeRowHeight(): void {
  for (const style of document.querySelectorAll(STYLE_SELECTOR)) style.remove()
}

/** Read the height a settings snapshot carries, falling back to the default. */
export function heightOf(snapshot: { value?: Record<string, unknown> }): number {
  const height = snapshot.value?.[ROW_HEIGHT_FIELD]
  return typeof height === 'number' ? clampRowHeight(height) : ROW_HEIGHT_DEFAULT
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
    applyRowHeight(cachedRowHeight())
    let applied = -1
    const render = (): void => {
      const height = heightOf(form.getSnapshot())
      if (height === applied) return
      applied = height
      applyRowHeight(height)
      cacheRowHeight(height)
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
          setRowHeight: (px: number) => {
            void form.set(ROW_HEIGHT_FIELD, clampRowHeight(px))
          },
        }),
      },
      RowHeightRow,
    ),
  )
}
