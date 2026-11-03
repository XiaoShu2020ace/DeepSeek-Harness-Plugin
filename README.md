# DeepSeek Harness 插件

本仓库包含 DeepSeek Harness 本地插件：

- [`dsh-quota-guard`](dsh-quota-guard/README.md)：按滑动窗口估算并限制模型请求费用。
- [`dsh-clock-lunar`](dsh-clock-lunar/README.md)：在会话标题栏显示时间、农历、节气、节日和假期状态。

将所需插件目录作为本地 DSH 插件包添加。两个插件目录内均包含构建产物和各自的使用说明。

## 目录结构

- `dsh-quota-guard/src/`：插件与 Web 客户端源码。
- `dsh-quota-guard/lib/`：构建后的插件入口。
- `dsh-quota-guard/cordis.patch.yml`：DSH 插件注册与默认配置。
- `dsh-quota-guard/README.md`：安装、配置和使用说明。
- `dsh-clock-lunar/src/`：时钟与农历插件源码。
- `dsh-clock-lunar/lib/`：编译后的时钟插件入口。
- `dsh-clock-lunar/README.md`：时钟插件构建与日期数据说明。
