/** The General-settings row: one stepper, one persisted number. */
import * as react from 'react'

import type { ConfigForm } from '../core/context.ts'
import {
  ROW_CLASS,
  ROW_HEIGHT_MAX,
  ROW_HEIGHT_MIN,
  ROW_HEIGHT_STEP,
  clampRowHeight,
} from '../core/rows.ts'
import { heightOf } from './index.ts'

/** Props the settings slot supplies besides the injected face. */
export interface RowHeightRowProps {
  t: (key: string) => string
  form: ConfigForm
  setRowHeight: (px: number) => void
}

/**
 * Render the button-size control.
 *
 * The displayed value follows the Host settings form, never the click echo, so
 * a refused write visibly snaps back.
 *
 * @param props - composed slot props.
 * @returns the settings row element.
 */
export function RowHeightRow({ t, form, setRowHeight }: RowHeightRowProps): react.ReactElement {
  const [height, setHeight] = react.useState(() => heightOf(form.getSnapshot()))
  react.useEffect(() => {
    const sync = (): void => {
      setHeight(heightOf(form.getSnapshot()))
    }
    sync()
    return form.subscribe(sync)
  }, [form])
  const step = (delta: number): void => {
    const next = clampRowHeight(height + delta)
    if (next === height) return
    setRowHeight(next)
  }
  return react.createElement(
    'div',
    { className: ROW_CLASS, 'data-dsh-part': 'row' },
    react.createElement(
      'div',
      { className: 'dshx-compact-sidebar-text' },
      react.createElement('div', { className: 'dshx-compact-sidebar-title' }, t('row.title')),
      react.createElement('div', { className: 'dshx-compact-sidebar-desc' }, t('row.description')),
    ),
    react.createElement(
      'div',
      { className: 'dshx-compact-sidebar-control' },
      react.createElement('button', {
        type: 'button',
        className: 'dshx-compact-sidebar-step',
        'aria-label': t('row.decrease'),
        disabled: height <= ROW_HEIGHT_MIN,
        onClick: () => step(-ROW_HEIGHT_STEP),
      }, '\u2212'),
      react.createElement(
        'span',
        { className: 'dshx-compact-sidebar-value', 'aria-live': 'polite' },
        String(height),
        react.createElement('span', { className: 'dshx-compact-sidebar-unit' }, t('row.unit')),
      ),
      react.createElement('button', {
        type: 'button',
        className: 'dshx-compact-sidebar-step',
        'aria-label': t('row.increase'),
        disabled: height >= ROW_HEIGHT_MAX,
        onClick: () => step(ROW_HEIGHT_STEP),
      }, '+'),
    ),
  )
}
