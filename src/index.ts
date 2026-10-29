/**
 * Host half: owns the durable row-height preference and nothing else.
 *
 * The browser half writes and reads the same field through the settings form
 * service, so this schema is the single source of truth for the accepted range.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

import type { HostSettingsService } from './core/context.ts'
import { ROW_HEIGHT_DEFAULT, ROW_HEIGHT_FIELD, ROW_HEIGHT_MAX, ROW_HEIGHT_MIN } from './core/rows.ts'

/** Live plugin configuration: one px value the browser half consumes. */
export const Config = z.object({
  [ROW_HEIGHT_FIELD]: z
    .number()
    .step(1)
    .min(ROW_HEIGHT_MIN)
    .max(ROW_HEIGHT_MAX)
    .default(ROW_HEIGHT_DEFAULT)
    .volatile(),
})

/** The host context as this plugin consumes it. */
type HostContext = Context & { settings: HostSettingsService }

/**
 * Apply the host half.
 *
 * `auto: false` keeps this plugin out of the automatic configuration page: its
 * only setting is edited by the General-settings row the browser half
 * registers, which writes through the same form.
 *
 * @param ctx - host plugin context.
 */
export function apply(ctx: Context): void {
  const host = ctx as HostContext
  ctx.inject(['settings'], (child: Context) => {
    const settings = (child as HostContext).settings
    child.effect(() => settings.configure({ auto: false }, ctx.fiber))
  })
}
