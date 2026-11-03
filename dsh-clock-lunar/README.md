# dsh-clock-lunar

DeepSeek Harness 的时钟与农历 Web 插件，在会话标题栏右侧显示实时时间、农历、节气和节日信息。

## 开发与构建

需要 Node.js 22.19.0 或更高版本。

```sh
npm install
npm run build
```

将本目录作为本地 DSH 插件包添加。客户端挂载到当前 DSH 提供的标题栏最右侧 Slot `conversation.session.header.corner`。构建会生成 `lib/index.js` 与 `lib/client.js`，并将农历计算代码内置到客户端产物中。

## 日期说明

- 农历、干支、节气和节日由 `lunar-typescript` 计算。
- `HolidayUtil` 内置中国大陆假期数据截至 2025 年；插件另含国务院公布的 2026 年放假和调休日期。
- 后续年份如尚未加入官方调休表，状态按法定节日日期和周末规则估算，并在界面提示调休信息未收录。
- 2026 年安排依据 [国务院办公厅关于 2026 年部分节假日安排的通知](https://www.gov.cn/gongbao/2025/issue_12406/material/gwygb202532.pdf)。
- “距离下一个大节日”计算到节日当天，不等同于连休假期开始日。

## 目录结构

- `src/index.ts`：宿主侧占位入口。
- `src/client/`：标题栏组件、日期计算和样式。
- `cordis.patch.yml`：DSH 插件注册信息。
- `lib/`：构建产物。
