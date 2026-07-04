[English](README_en.md) | 中文

# LightEdit

一个可被快捷键唤醒的 macOS 轻量 scratch editor，用来临时编辑、格式化和保留 `Text` / `JSON` / `SQL` 片段。

![version](https://img.shields.io/badge/version-0.4.0-orange)
![platform](https://img.shields.io/badge/platform-macOS%20first-lightgrey)
![stack](https://img.shields.io/badge/stack-Tauri%202%20%2B%20React-blue)

LightEdit 的目标不是成为一个完整 IDE，而是做成一个安静、顺手、可以长期放在桌面边上的小工具：需要时一键唤醒，用完后自然隐藏。

## 功能

- **快速编辑** — 保存临时 `Text`、`JSON`、`SQL` 片段
- **轻量代码区** — `textarea + syntax overlay`，包含行号与低饱和语法高亮
- **格式化** — JSON pretty print 与轻量 SQL formatter
- **Project Tabs** — 在多个片段之间快速切换
- **Version Rail** — 为同一个 Project 保留多个草稿版本
- **Notes 菜单** — 重新打开、重命名、删除 Project
- **内联命名** — 新建 Project 后直接进入命名
- **Undo Toast** — 删除 Project / Version 后可快速撤销
- **全局快捷键** — 在 macOS 任意位置唤醒或隐藏 LightEdit
- **Pin 模式** — 需要常驻时保持窗口浮在其他应用之上

## 桌面体验

LightEdit V0 聚焦 macOS 小浮窗体验：

- 默认窗口尺寸约 `800 x 560`
- 全局快捷键：`Cmd+Shift+L`
- 未 Pin 时，点击其他应用或桌面会自动隐藏
- Pin 后，窗口会常驻并浮在其他应用上方
- 唤醒位置跟随当前鼠标所在显示器
- 支持在 fullscreen app 的 Space 上方唤醒
- 保留 macOS 原生圆角窗口和 traffic lights

## 快速开始

```bash
npm install
npm run tauri:dev
```

常用命令：

```bash
npm run dev           # Web 预览，仅用于 UI 调试
npm run build         # 前端构建
npm run qa            # unit + build + cargo check + cargo test
npm run tauri:build   # 构建 macOS .app
```

构建后的 macOS app 位于：

```text
src-tauri/target/release/bundle/macos/LightEdit.app
```

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面壳 | Tauri 2 + Rust |
| 前端 | React 19 + TypeScript + Vite |
| 图标 | lucide-react |
| 编辑器 | textarea + syntax overlay |
| 存储 | localStorage |
| 测试 | Vitest + React Testing Library + cargo test |

## 本地数据

V0 使用 `localStorage` 保存本地状态。

当前 key：

```text
lightedit:v0.4:reference
```

如果需要清空本地验证数据，可以在开发者工具中执行：

```js
localStorage.removeItem('lightedit:v0.4:reference')
location.reload()
```

## V0 范围

V0 已实现：

- 单窗口轻量编辑器
- Project / Version 生命周期
- Text / JSON / SQL 类型切换
- JSON / SQL 格式化
- Notes 全局 Project 入口
- 删除 Undo
- 全局快捷键唤醒
- Pin 常驻与未 Pin 失焦隐藏
- macOS fullscreen Space 覆盖与跨显示器唤醒

V0 明确不包含：

- 后端同步和账号系统
- 导入 / 导出
- AI 摘要、分类或搜索
- DMG、签名、公证、自动更新
- CodeMirror / Monaco 编辑器内核

## 发布检查

V0 发布前检查见 [docs/release-checklist.md](docs/release-checklist.md)。
