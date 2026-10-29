/**
 * Pure sizing model shared by both halves: the accepted row-height range, the
 * clamp every boundary applies, and the stylesheet generated from one value.
 *
 * The whole plugin is one number. Everything else — the settings row, the
 * persisted field, the style tag — is plumbing around buildRowCss().
 */

/** Settings field carrying the sidebar row height in px. */
export const ROW_HEIGHT_FIELD = 'rowHeight'

/** Smallest accepted row height, in px. */
export const ROW_HEIGHT_MIN = 20

/** Largest accepted row height, in px. */
export const ROW_HEIGHT_MAX = 48

/** Row height used when nothing is stored (the stock panel row is 36px). */
export const ROW_HEIGHT_DEFAULT = 28

/** One step offered by the settings control, in px. */
export const ROW_HEIGHT_STEP = 4

/** Custom property that carries the chosen height into every rule below. */
export const ROW_HEIGHT_VARIABLE = '--dshx-sidebar-row-height'

/** Class name of this plugin's settings row (never hashed: the tag is ours). */
export const ROW_CLASS = 'dshx-compact-sidebar-row'

/** Attribute marking the style element this plugin owns. */
export const STYLE_ATTRIBUTE = 'data-dsh-plugin'

/** Short plugin name carried by STYLE_ATTRIBUTE. */
export const PLUGIN_NAME = 'compact-sidebar'

/** Clamp an arbitrary number onto the accepted range, rounded to whole px. */
export function clampRowHeight(value: number): number {
  if (!Number.isFinite(value)) return ROW_HEIGHT_DEFAULT
  return Math.min(ROW_HEIGHT_MAX, Math.max(ROW_HEIGHT_MIN, Math.round(value)))
}

/**
 * Build the plugin stylesheet for one row height.
 *
 * Every rule is anchored to official shell markup (data-slot wrappers and the
 * frame collapsed state) and never to a css-module class name, which the shell
 * rehashes per build. The collapsed rail keeps its 36px icon tiles, so all
 * sizing is gated on the expanded sidebar.
 *
 * @param height - row height in px; clamped through clampRowHeight.
 * @returns the stylesheet text.
 */
export function buildRowCss(height: number): string {
  const px = `${clampRowHeight(height)}px`
  return `
:root {
  ${ROW_HEIGHT_VARIABLE}: ${px};
}

/* Global panel rows (插件 / 任务看板 / 技能中心 / SSH) and the More launcher,
   whose button sits inside the menu anchor span. */
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar"] nav > button,
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar"] nav > span > button {
  block-size: var(${ROW_HEIGHT_VARIABLE});
  min-block-size: var(${ROW_HEIGHT_VARIABLE});
  max-block-size: var(${ROW_HEIGHT_VARIABLE});
  line-height: var(${ROW_HEIGHT_VARIABLE});
  padding-block: 0;
}

/* Workspace rows and every session row share the one tree-item shape. */
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar.workspaces"] [role="treeitem"] {
  block-size: var(${ROW_HEIGHT_VARIABLE});
  min-block-size: var(${ROW_HEIGHT_VARIABLE});
  max-block-size: var(${ROW_HEIGHT_VARIABLE});
  padding-block: 0;
}

/* Row text keeps a readable line box in the shortest rows. */
[data-dsh-frame]:not([data-sidebar-collapsed]) [data-slot="sidebar.workspaces"] [role="treeitem"] span {
  line-height: min(var(${ROW_HEIGHT_VARIABLE}), 20px);
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
.${ROW_CLASS} .dshx-compact-sidebar-control {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: none;
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
.${ROW_CLASS} .dshx-compact-sidebar-step:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 2px;
}
.${ROW_CLASS} .dshx-compact-sidebar-value {
  min-width: 52px;
  display: inline-flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
.${ROW_CLASS} .dshx-compact-sidebar-unit {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary);
}
`
}
