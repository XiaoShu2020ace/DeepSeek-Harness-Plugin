# DeepSeek Harness 插件

本仓库包含一个 DeepSeek Harness 本地插件：`dsh-quota-guard`。它按滑动时间窗口估算并限制模型请求费用。

## 插件功能

- 在每次模型流请求开始前检查额度，超过任一窗口限制时拒绝请求。
- 提供周额度和月额度两种模式，并将并发请求的预留费用计入额度。
- 在会话标题栏显示剩余比例、已用金额和预计重置时间。
- 本地保存配置与用量记录，不依赖外部额度服务。

## 快速开始

将 `dsh-quota-guard/` 作为本地 DSH 插件包添加。仓库中已包含构建产物；修改源码后，可在该目录重新构建。构建需要 Node.js 22.19.0 或更高版本：

```sh
cd dsh-quota-guard
npm ci
npm run build
```

具体额度算法、配置项、存储位置和兼容范围请见
[插件使用说明](dsh-quota-guard/README.md)。

## 目录结构

- `dsh-quota-guard/src/`：插件与 Web 客户端源码。
- `dsh-quota-guard/lib/`：构建后的插件入口。
- `dsh-quota-guard/cordis.patch.yml`：DSH 插件注册与默认配置。
- `dsh-quota-guard/README.md`：安装、配置和使用说明。
