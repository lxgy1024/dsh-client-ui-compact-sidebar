/** The General-settings row: two independent steppers plus direct entry. */
import * as react from 'react'

import type { ConfigForm } from '../core/context.ts'
import {
  ROW_CLASS,
  ROW_HEIGHT_MAX,
  ROW_HEIGHT_MIN,
  ROW_HEIGHT_STEP,
  clampRowHeight,
  parseRowHeight,
} from '../core/rows.ts'
import { heightsOf, type Heights } from './index.ts'

/** One steppable, typeable height control. */
interface HeightControlProps {
  label: string
  value: number
  decrease: string
  increase: string
  unit: string
  onChange: (px: number) => void
}

/**
 * Render one height control: − / editable number / +.
 *
 * The field keeps its own draft while focused so a partial entry ("4" on the
 * way to "40") is not clamped under the typist; the draft commits on blur or
 * Enter and reverts on Escape or on any unreadable text.
 *
 * @param props - label, value, copy and the change sink.
 * @returns the control element.
 */
function HeightControl({ label, value, decrease, increase, unit, onChange }: HeightControlProps): react.ReactElement {
  const [draft, setDraft] = react.useState<string | null>(null)
  const commit = (raw: string): void => {
    setDraft(null)
    const next = parseRowHeight(raw)
    if (next !== undefined && next !== value) onChange(next)
  }
  return react.createElement(
    'div',
    { className: 'dshx-compact-sidebar-control', 'data-dsh-part': 'control' },
    react.createElement('span', { className: 'dshx-compact-sidebar-label' }, label),
    react.createElement(
      'div',
      { className: 'dshx-compact-sidebar-stepper' },
      react.createElement('button', {
        type: 'button',
        className: 'dshx-compact-sidebar-step',
        'aria-label': `${decrease} ${label}`,
        disabled: value <= ROW_HEIGHT_MIN,
        onClick: () => onChange(clampRowHeight(value - ROW_HEIGHT_STEP)),
      }, '\u2212'),
      react.createElement('input', {
        type: 'number',
        className: 'dshx-compact-sidebar-input',
        'aria-label': label,
        min: ROW_HEIGHT_MIN,
        max: ROW_HEIGHT_MAX,
        step: 1,
        value: draft ?? String(value),
        onChange: (event: react.ChangeEvent<HTMLInputElement>) => setDraft(event.currentTarget.value),
        onBlur: (event: react.FocusEvent<HTMLInputElement>) => commit(event.currentTarget.value),
        onKeyDown: (event: react.KeyboardEvent<HTMLInputElement>) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === 'Enter') {
            event.preventDefault()
            commit(event.currentTarget.value)
            event.currentTarget.blur()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setDraft(null)
            event.currentTarget.blur()
          }
        },
      }),
      react.createElement('button', {
        type: 'button',
        className: 'dshx-compact-sidebar-step',
        'aria-label': `${increase} ${label}`,
        disabled: value >= ROW_HEIGHT_MAX,
        onClick: () => onChange(clampRowHeight(value + ROW_HEIGHT_STEP)),
      }, '+'),
    ),
    react.createElement('span', { className: 'dshx-compact-sidebar-unit' }, unit),
  )
}

/** Props the settings slot supplies besides the injected face. */
export interface RowHeightRowProps {
  t: (key: string) => string
  form: ConfigForm
  setPanelHeight: (px: number) => void
  setWorkspaceHeight: (px: number) => void
}

/**
 * Render the button-size settings row.
 *
 * Both values follow the Host settings form, never the click echo, so a refused
 * write visibly snaps back.
 *
 * @param props - composed slot props.
 * @returns the settings row element.
 */
export function RowHeightRow({ t, form, setPanelHeight, setWorkspaceHeight }: RowHeightRowProps): react.ReactElement {
  const [heights, setHeights] = react.useState<Heights>(() => heightsOf(form.getSnapshot()))
  react.useEffect(() => {
    const sync = (): void => {
      setHeights(heightsOf(form.getSnapshot()))
    }
    sync()
    return form.subscribe(sync)
  }, [form])
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
      { className: 'dshx-compact-sidebar-controls' },
      react.createElement(HeightControl, {
        label: t('row.panel'),
        value: heights.panel,
        decrease: t('row.decrease'),
        increase: t('row.increase'),
        unit: t('row.unit'),
        onChange: setPanelHeight,
      }),
      react.createElement(HeightControl, {
        label: t('row.workspace'),
        value: heights.workspace,
        decrease: t('row.decrease'),
        increase: t('row.increase'),
        unit: t('row.unit'),
        onChange: setWorkspaceHeight,
      }),
    ),
  )
}
