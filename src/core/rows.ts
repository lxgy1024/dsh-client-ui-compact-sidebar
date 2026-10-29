/**
 * Pure sizing model shared by both halves: the accepted range, the clamp every
 * boundary applies, and the stylesheet generated from the two chosen heights.
 *
 * The plugin is two numbers — the functional bar (功能栏: the global panel rows)
 * and the workspace tree (工作区: workspace and session rows). Everything else —
 * the settings row, the persisted fields, the style tag — is plumbing.
 */

/** Settings field carrying the functional-bar row height, in px. */
export const PANEL_FIELD = 'panelHeight'

/** Settings field carrying the workspace/session row height, in px. */
export const WORKSPACE_FIELD = 'workspaceHeight'

/** Smallest accepted row height, in px. */
export const ROW_HEIGHT_MIN = 20

/** Largest accepted row height, in px. */
export const ROW_HEIGHT_MAX = 48

/** Functional-bar height used when nothing is stored (stock is 36px). */
export const PANEL_DEFAULT = 28

/** Workspace-row height used when nothing is stored (stock is 34px/32px). */
export const WORKSPACE_DEFAULT = 28

/** One step offered by the settings control, in px. */
export const ROW_HEIGHT_STEP = 4

/** Custom property carrying the functional-bar height. */
export const PANEL_VARIABLE = '--dshx-sidebar-panel-height'

/** Custom property carrying the workspace-row height. */
export const WORKSPACE_VARIABLE = '--dshx-sidebar-workspace-height'

/** Class name of this plugin's settings row (never hashed: the tag is ours). */
export const ROW_CLASS = 'dshx-compact-sidebar-row'

/** Attribute marking the style element this plugin owns. */
export const STYLE_ATTRIBUTE = 'data-dsh-plugin'

/** Short plugin name carried by STYLE_ATTRIBUTE. */
export const PLUGIN_NAME = 'compact-sidebar'

/** Clamp an arbitrary number onto the accepted range, rounded to whole px. */
export function clampRowHeight(value: number): number {
  if (!Number.isFinite(value)) return ROW_HEIGHT_MIN
  return Math.min(ROW_HEIGHT_MAX, Math.max(ROW_HEIGHT_MIN, Math.round(value)))
}

/**
 * Parse what a person typed into the number field.
 *
 * An empty or unreadable entry is "no change" rather than the range minimum:
 * clearing the field to retype must never resize the sidebar to 20px.
 *
 * @param raw - the field text.
 * @returns the clamped value, or undefined when the text carries no number.
 */
export function parseRowHeight(raw: string): number | undefined {
  const text = raw.trim()
  if (text === '') return undefined
  const value = Number(text)
  if (!Number.isFinite(value)) return undefined
  return clampRowHeight(value)
}

/**
 * Build the plugin stylesheet for the two chosen heights.
 *
 * Every rule is anchored to official shell markup (data-slot wrappers and the
 * frame collapsed state) and never to a css-module class name, which the shell
 * rehashes per build. The collapsed rail keeps its 36px icon tiles, so all
 * sizing is gated on the expanded sidebar.
 *
 * @param panel - functional-bar row height in px.
 * @param workspace - workspace/session row height in px.
 * @returns the stylesheet text.
 */
export function buildRowCss(panel: number, workspace: number): string {
  return `
:root {
  ${PANEL_VARIABLE}: ${clampRowHeight(panel)}px;
  ${WORKSPACE_VARIABLE}: ${clampRowHeight(workspace)}px;
}

/* 功能栏: the global panel rows (插件 / 任务看板 / 技能中心 / SSH) and the More
   launcher, whose button sits inside the menu anchor span. */
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar"] nav > button,
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar"] nav > span > button {
  block-size: var(${PANEL_VARIABLE});
  min-block-size: var(${PANEL_VARIABLE});
  max-block-size: var(${PANEL_VARIABLE});
  line-height: var(${PANEL_VARIABLE});
  padding-block: 0;
}

/* 工作区: workspace rows and every session row under them. */
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar.workspaces"] [role="treeitem"] {
  block-size: var(${WORKSPACE_VARIABLE});
  min-block-size: var(${WORKSPACE_VARIABLE});
  max-block-size: var(${WORKSPACE_VARIABLE});
  padding-block: 0;
}

/* Row text keeps a readable line box in the shortest rows. */
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar.workspaces"] [role="treeitem"] span {
  line-height: min(var(${WORKSPACE_VARIABLE}), 20px);
}

/* The General-settings row this plugin registers. */
.${ROW_CLASS} {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 0;
  border-bottom: .5px solid var(--dsw-alias-border-l2);
}
.${ROW_CLASS} .dshx-compact-sidebar-text { min-width: 0; }
.${ROW_CLASS} .dshx-compact-sidebar-title { font-size: 14px; line-height: 20px; }
.${ROW_CLASS} .dshx-compact-sidebar-desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}
.${ROW_CLASS} .dshx-compact-sidebar-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: none;
}
.${ROW_CLASS} .dshx-compact-sidebar-control {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.${ROW_CLASS} .dshx-compact-sidebar-label {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-secondary);
}
.${ROW_CLASS} .dshx-compact-sidebar-stepper {
  display: flex;
  align-items: center;
  gap: 2px;
}
.${ROW_CLASS} .dshx-compact-sidebar-step {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1;
  cursor: pointer;
}
.${ROW_CLASS} .dshx-compact-sidebar-step:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}
.${ROW_CLASS} .dshx-compact-sidebar-step:disabled { cursor: default; opacity: .45; }
.${ROW_CLASS} .dshx-compact-sidebar-step:focus-visible,
.${ROW_CLASS} .dshx-compact-sidebar-input:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
.${ROW_CLASS} .dshx-compact-sidebar-input {
  width: 48px;
  height: 26px;
  box-sizing: border-box;
  border: 1px solid var(--dsw-alias-border-l3);
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  text-align: center;
  padding: 0 4px;
  -moz-appearance: textfield;
  appearance: textfield;
}
.${ROW_CLASS} .dshx-compact-sidebar-input::-webkit-outer-spin-button,
.${ROW_CLASS} .dshx-compact-sidebar-input::-webkit-inner-spin-button {
  appearance: none;
  margin: 0;
}
.${ROW_CLASS} .dshx-compact-sidebar-unit {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
`
}
