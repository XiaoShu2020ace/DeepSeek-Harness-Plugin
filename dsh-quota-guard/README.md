# dsh-quota-guard

为 DeepSeek Harness 的模型流统计已报告 Token 用量，并在每次请求准入前
同时检查滑动大窗口、小窗口额度。记录与设置保存在
`%DSH_HOME%/plugins/dsh-quota-guard/` 中。

## 安装

将本文件夹作为本地 DSH 插件包添加。包内 `dsh.bundle.patch` 会自动注册宿主
插件，`dsh.client` 会启用 Web 客户端入口；构建后的 `lib/client.js` 已使用
DSH 的 lazy-CJS 模块加载格式。

当前构建针对 DSH `0.2.1-rc.5` 接口。升级 DSH 后，如果它的依赖版本超出本插件
声明的 peer dependency 范围，安装器会拒绝安装；此时需要先按新版本核对 API、
更新插件并重新构建。兼容范围内的版本可继续安装，但安装声明本身不能保证未来
版本一定保持 API 兼容。

## 额度与估算

- 周模式：7 天大窗口，1–24 小时小窗口，默认 5 小时。
- 月模式：30 天大窗口，7 天小窗口。
- 额度费用按 CNY/百万 Token 配置估算，默认为 DeepSeek Flash 非高峰单价的
  CNY 换算值；其他模型或渠道请按实际账单调整 `cordis.patch.yml` 的单价。
- 账户余额接口目前为 `¥51.50` Mock 值。

在当前 DSH 客户端中，可扩展 UI 位于会话标题栏右侧角落；Web 插件没有
窗口最小化按钮旁的专用 Slot。
