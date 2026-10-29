# @dshx/dsh-client-ui-compact-sidebar

English | [中文](README.zh.md)

One **Button size** setting in *Settings → General* that resizes every sidebar entry: the global panel rows (Plugins, Task board, Skills, SSH, More) and every workspace and session row.

## What it does

The sidebar ships two independent densities: global panel rows are 36px, workspace rows 34px, session rows 32px. This plugin replaces all of them with one height you pick, from 20px to 48px in 4px steps, defaulting to 28px.

The control lives in the General settings section, between the font size row and the developer-tools row. Dragging it up or down resizes the sidebar immediately — no reload, no restart.

Two implementation notes worth knowing:

- **One style tag, no React in the shell.** The rows belong to the official sidebar, so the plugin never re-renders them: it owns a single `<style data-dsh-plugin="compact-sidebar">` element and rewrites it on every change. Unloading the plugin removes the tag and restores the stock density.
- **No hashed selectors.** Every rule is anchored to `[data-slot="sidebar"]`, `[data-slot="sidebar.workspaces"]` and the frame's collapsed state, never to a css-module class name, which the shell rehashes on every build.

## Install

```bash
dsh plugin --profile web add @dshx/dsh-client-ui-compact-sidebar
```

Or from a checkout, for development:

```bash
pnpm install && pnpm build
dsh plugin --profile web add link:<path>/dshX-ui-sidebar
```

The bundle patch inserts the `ui-compact-sidebar` row, so no manual `cordis.patch.yml` edit is needed. Reload the page once after installing.

## Config

| Key | Range | Default | Meaning |
| --- | --- | --- | --- |
| `rowHeight` | 20–48 (step 4) | 28 | Sidebar row height, in px |

The value is stored in the Host settings document under the `ui-compact-sidebar` namespace, so it follows the profile across browsers. A copy is cached in `localStorage` so a reload paints the chosen density immediately instead of flashing the stock one while the Host round-trip settles.

The range is enforced at three boundaries — the schema, the stepper's disabled states, and `clampRowHeight` — so a hand-edited settings file cannot produce an unusable sidebar.

## Known limitations

- Every rule is gated on `[data-dsh-frame]:not([data-sidebar-collapsed])`: the collapsed rail keeps its own 36px icon tiles, which is the correct size for an icon-only rail.
- Only the left sidebar is affected. The New Session button, the workspace section header, the composer and the right panel keep their stock sizes.
- A future shell that renames the `data-slot` anchors drops the density silently instead of breaking the sidebar: the plugin only adds CSS.
