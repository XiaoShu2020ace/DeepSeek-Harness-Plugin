# dsh-quota-guard

`dsh-quota-guard` 是 DeepSeek Harness（DSH）的本地额度守卫插件。它在模型请求开始前估算费用，并同时检查两个滑动时间窗口，避免累计用量超过配置的额度。

## 功能概览

- 支持周额度和月额度两种模式。
- 在 `llm/stream` 请求准入时检查预计费用，并将进行中的请求计入额度，避免并发请求绕过限制。
- 模型流上报 Token 用量时按上报数据记账；未上报时按输入和输出文本估算。
- 在会话标题栏右侧提供 Web 入口，可查看用量、调整额度和清空用量记录。
- 配置和用量记录保存在本机 DSH 数据目录中。

## 额度模式

所有时间窗口均为**滑动窗口**，不会在固定的周一或每月 1 日统一清零。记录随时间移出窗口后，额度相应恢复。

### 周模式（默认）

- 大窗口：最近 7 天，额度由 `bigLimitCny` 设置。
- 小窗口：最近 1–24 小时，由 `smallWindowHours` 设置，默认 5 小时。
- 小窗口额度按公式计算：`bigLimitCny × smallWindowHours ÷ 70`。
- 默认大额度为 ¥200，因此默认 5 小时小额度约为 ¥14.29。周模式不使用 `smallLimitCny`。

### 月模式

- 大窗口：最近 30 天，额度由 `bigLimitCny` 设置。
- 小窗口：最近 7 天，额度由 `smallLimitCny` 设置，默认 ¥46.67。

## Token 计价与估算

单价单位为人民币/百万 Token。默认输入、缓存读取输入和输出单价分别为 ¥1.08、¥0.02 和 ¥4.32。这组默认值按源码注释中的 DeepSeek Flash 非高峰价格折算；其他模型或渠道请按实际账单调整。

准入检查会根据输入内容估算 Token，并使用请求的 `maxTokens`；未指定时使用 `reservationOutputTokens` 作为输出预留量。输入估算约按每 4 个字符 1 个 Token 计算，并对消息、工具调用和附件增加余量。请求结束后：

- 如果模型上报用量，使用上报的输入、输出及缓存 Token 数重新计算费用。
- 如果没有上报用量，则根据生成的文字、推理内容和工具参数估算输出 Token 数。

因此，额度金额是本插件的费用估算值。估算精度取决于模型是否上报用量，以及配置单价是否符合实际使用渠道。

## 客户端界面

- 标题栏图标的内外环分别显示小窗口和大窗口剩余比例。
- 悬停可查看已用金额、剩余金额和预计额度恢复时间。
- 点击图标可切换周/月模式、调整额度或重置已记录的用量。
- 周模式的小额度由大额度与小时数自动计算；月模式可直接设置 7 天小额度。
- 入口位于会话标题栏右侧角落；当前 Web 插件没有窗口最小化按钮旁的专用 Slot。
- 界面显示的账户余额目前是固定的 **¥51.50 模拟值**，尚未连接真实账户余额接口。

## 安装与构建

将本目录作为本地 DSH 插件包添加。插件通过 `package.json` 中的 `dsh.bundle.patch` 注册，Web 客户端入口由 `dsh.client` 声明。若从源码构建：

```sh
npm ci
npm run build
```

构建要求 Node.js 22.19.0 或更高版本。构建后会生成插件运行入口 `lib/index.js` 和客户端入口 `lib/client.js`；插件包还包含 `cordis.patch.yml`。客户端构建会包装为 DSH 使用的 lazy-CJS 加载格式。

当前适配目标为 DSH `0.2.1-rc.5` 接口。依赖声明范围为 Cordis `~4.0.5`、DSH 相关包 `^0.2.1-rc.5`、Schemastery `~3.18.5`。超出这些范围的宿主版本应先核对 API，再更新和重新构建插件；范围内也不代表未来版本一定保持接口兼容。

## 配置项

初始默认值定义在 `cordis.patch.yml` 中。第一次启动后，插件会把有效配置写入数据目录中的 `config.json`；已保存配置会覆盖插件包中的默认值。设置弹窗可修改额度模式与额度字段，价格字段可通过配置文件调整。

| 字段 | 默认值 | 说明 |
| --- | ---: | --- |
| `mode` | `week` | `week` 周模式；`month` 月模式 |
| `bigLimitCny` | 200 | 大窗口额度，人民币 |
| `smallWindowHours` | 5 | 周模式小窗口时长，1–24 小时整数 |
| `smallLimitCny` | 46.67 | 月模式最近 7 天小窗口额度；周模式忽略 |
| `inputCnyPerMillion` | 1.08 | 普通输入单价，人民币/百万 Token |
| `cachedInputCnyPerMillion` | 0.02 | 缓存读取输入单价，人民币/百万 Token |
| `outputCnyPerMillion` | 4.32 | 输出单价，人民币/百万 Token |
| `reservationOutputTokens` | 8192 | 请求未指定 `maxTokens` 时使用的预留输出 Token 数 |

额度模式和金额也可在 Web 设置弹窗中修改。价格单价及预留输出 Token 数不在弹窗中显示，可编辑数据目录中的 `config.json` 后重启插件使其生效。

## 本地数据

默认数据目录为：

- 设置了 `DSH_HOME` 时：`<DSH_HOME>/plugins/dsh-quota-guard/`。
- 未设置时：`~/.dsh/plugins/dsh-quota-guard/`（Windows 下通常位于 `%USERPROFILE%\.dsh\plugins\dsh-quota-guard\`）。

目录包含 `config.json`（配置）和 `usage.jsonl`（用量记录）。插件只统计最近 30 天的记录，并会定期清理过期行。界面中的“重置已用额度”会清空用量记录，不会修改额度设置。

## 开发结构

- `src/index.ts`：插件注册、请求准入、费用记录和本地 API。
- `src/shared.ts`：额度配置、窗口计算及共享类型。
- `src/client/`：会话标题栏入口与设置界面。
- `cordis.patch.yml`：插件清单中的注册信息和默认值。
- `lib/`：发布包使用的构建产物。

本地 API 路径：

- `GET /api/dsh-quota-guard/state`：读取额度状态。
- `POST /api/dsh-quota-guard/config`：校验并保存额度配置。
- `POST /api/dsh-quota-guard/reset`：清空用量记录。
