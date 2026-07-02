# LightEdit Visual Baseline

这是一套轻量视觉截图基线，不引入 Playwright / 截图像素比对依赖。

目标是把后续 UI 改动最容易误伤的状态固定下来：默认窗口、Notes 菜单、右键菜单、长名称 tooltip。需要做视觉敏感改动时，先按 `scenarios.json` 重截同一组图，再和上一轮基线人工对比。

## 固定环境

- 默认窗口或浏览器视口：`800x560`
- 推荐启动：`NO_PROXY=127.0.0.1,localhost,::1 npm run dev -- --port 5173 --strictPort`
- 如果本地代理返回 `502 Bad Gateway`，先确认 `NO_PROXY/no_proxy` 是否包含 `127.0.0.1,localhost,::1`
- 截图命名和场景以 `qa/visual-baseline/scenarios.json` 为准
- 本地截图建议放在 `harness/visual-baselines/YYYY-MM-DD/`，保持本地对比，不随代码提交

## 和自动化测试的关系

`src/qualityBaseline.test.tsx` 锁定同一批关键 UI 状态的结构与交互入口；它负责防止菜单、tooltip、toolbar、version rail 等状态被代码误伤。截图基线负责判断颜色、圆角、阴影、间距、视觉重量这些 DOM 测试不擅长的细节。

## 当前边界

这不是严格像素回归。等 UI 进入更稳定阶段或开始频繁改视觉时，再考虑接入 Playwright screenshot snapshot；在那之前，保持轻量可以避免截图依赖、浏览器安装、字体渲染差异把小工具开发拖重。
