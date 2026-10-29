/**
 * Host half: owns the two durable row-height preferences and nothing else.
 *
 * The browser half writes and reads the same fields through the settings form
 * service, so this schema is the single source of truth for the accepted range.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'

import type { HostSettingsService } from './core/context.ts'
import {
  PANEL_DEFAULT,
  PANEL_FIELD,
  ROW_HEIGHT_MAX,
  ROW_HEIGHT_MIN,
  WORKSPACE_DEFAULT,
  WORKSPACE_FIELD,
} from './core/rows.ts'

/** Integer px schema for one row category. */
const heightField = (fallback: number) => z
  .number()
  .step(1)
  .min(ROW_HEIGHT_MIN)
  .max(ROW_HEIGHT_MAX)
  .default(fallback)
  .volatile()

/** Live plugin configuration: the two heights the browser half consumes. */
export const Config = z.object({
  [PANEL_FIELD]: heightField(PANEL_DEFAULT),
  [WORKSPACE_FIELD]: heightField(WORKSPACE_DEFAULT),
})

/** The host context as this plugin consumes it. */
type HostContext = Context & { settings: HostSettingsService }

/**
 * Apply the host half.
 *
 * `auto: false` keeps this plugin out of the automatic configuration page: its
 * two settings are edited by the General-settings row the browser half
 * registers, which writes through the same form.
 *
 * @param ctx - host plugin context.
 */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (child: Context) => {
    const settings = (child as HostContext).settings
    child.effect(() => settings.configure({ auto: false }, ctx.fiber))
  })
}
