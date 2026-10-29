# @dshx/dsh-client-ui-compact-sidebar

[English](README.md) | 中文

在 *设置 → 通用设置* 里增加两个 **按钮大小** 选项，分别调整侧栏的 **功能栏** 与 **工作区**。

## 能力

侧栏本来有两套互相独立、且无法调整的密度：全局面板条目（插件、任务看板、技能中心、SSH、更多）是 36px，工作区行 34px、会话行 32px。本插件把这两类行分别换成你选的高度，范围 20–48px。

控件位于通用设置里，排在「字号大小」之后、「显示代码工作视图」之前，包含两个独立控件：

- **功能栏** —— 全局面板条目。
- **工作区** —— 工作区行及其下所有会话行。

每个控件既有 − / + 步进（每步 4px），**也有可直接输入的数字框**。改动立即作用于侧栏，不需要刷新、不需要重启。两个高度互相独立，调一个不会带动另一个。

两点实现说明：

- **只有一个样式标签，不碰 shell 的 React。** 这些行属于官方侧栏，插件从不重绘它们：它持有单个 `<style data-dsh-plugin="compact-sidebar">` 元素，每次改动只重写其内容。插件卸载时该标签被移除，密度恢复默认。
- **不用 hash 类名。** 所有规则锚定在 `[data-slot="sidebar"]`、`[data-slot="sidebar.workspaces"]` 与框架的折叠状态上，从不使用 shell 每次构建都会重算的 css-module 类名。

## 安装

```bash
dsh plugin --profile web add @dshx/dsh-client-ui-compact-sidebar
```

从仓库本地安装（开发用）：

```bash
pnpm install && pnpm build
dsh plugin --profile web add link:<路径>/dshX-ui-sidebar
```

bundle patch 会插入 `ui-compact-sidebar` 行，无需手改 `cordis.patch.yml`。安装后刷新一次页面。

## 配置

| 键 | 范围 | 默认 | 含义 |
| --- | --- | --- | --- |
| `panelHeight` | 20–48 | 28 | 功能栏行高（px） |
| `workspaceHeight` | 20–48 | 28 | 工作区与会话行高（px） |

两个取值都存在 Host 设置文档的 `ui-compact-sidebar` 命名空间下，因此会跟随 profile 跨浏览器生效。同时会在 `localStorage` 里缓存一份，刷新时立刻按所选密度绘制，不会先闪一下默认密度再跳变。

范围在每个边界上都被约束——schema、步进按钮的禁用态、以及 `clampRowHeight`——手改设置文件也不会得到不可用的侧栏。手输越界数字会收敛到最近的边界；空值或无法解析的内容视为「不改变」，而不是跳成最小值。

## 已知限制

- 所有规则都以 `[data-dsh-frame]:not([data-sidebar-collapsed])` 为前提：折叠的图标轨道保持自己的 36px 方格，这对纯图标轨道才是合适尺寸。
- 只影响左侧栏。新建会话按钮、工作区区块标题、输入区与右侧面板保持原尺寸。
- 未来 shell 若改名这些 `data-slot` 锚点，密度会静默失效而不会弄坏侧栏：插件只添加 CSS。
