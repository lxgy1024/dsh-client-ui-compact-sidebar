# @dshx/dsh-client-ui-compact-sidebar

English | [中文](README.zh.md)

Two **Button size** settings in *Settings → General* that size the sidebar independently: the **functional bar** (功能栏) and the **workspace** tree.

## What it does

The sidebar ships two independent densities: the global panel rows (Plugins, Task board, Skills, SSH, More) are 36px, and workspace rows are 34px with 32px session rows. Both are stock sizes you cannot change. This plugin replaces each of them with a height you pick, from 20px to 48px.

The control lives in the General settings section, between the font size row and the developer-tools row, and holds two separate controls:

- **功能栏 / Functional bar** — the global panel entries.
- **工作区 / Workspace** — workspace rows and every session row under them.

Each control has − / + steppers in 4px steps **and** an editable number field, so a specific value can be typed directly. Changes apply to the sidebar immediately — no reload, no restart. The two heights are independent: setting one never moves the other.

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
| `panelHeight` | 20–48 | 28 | Functional-bar row height, in px |
| `workspaceHeight` | 20–48 | 28 | Workspace and session row height, in px |

Both values live in the Host settings document under the `ui-compact-sidebar` namespace, so they follow the profile across browsers. A copy is cached in `localStorage` so a reload paints the chosen density immediately instead of flashing the stock one while the Host round-trip settles.

The range is enforced at every boundary — the schema, the steppers' disabled states, and `clampRowHeight` — so a hand-edited settings file cannot produce an unusable sidebar. Typed out-of-range numbers clamp to the nearest bound; an empty or unreadable entry is treated as "no change" rather than as a jump to the minimum.

## Known limitations

- Every rule is gated on `[data-dsh-frame]:not([data-sidebar-collapsed])`: the collapsed rail keeps its own 36px icon tiles, which is the correct size for an icon-only rail.
- Only the left sidebar is affected. The New Session button, the workspace section header, the composer and the right panel keep their stock sizes.
- A future shell that renames the `data-slot` anchors drops the density silently instead of breaking the sidebar: the plugin only adds CSS.
