---
description: "为待回答的 agent 问题发送浏览器通知，并在通用设置中提供权限控制。"
kind: "package-bundle"
---

# @deepseek-ai/dsh-client-ui-question-notifications

[English](README.md) | 中文

## 概述

agent（智能体）需要你回答问题时，接收浏览器通知，包括计划审阅。先在“设置 → 通用设置”中启用通知，再允许浏览器权限请求。点击通知会打开发起提问的 Session（会话）。通知只包含通用提醒，问题内容保留在对话中。

## 目录

- [使用本包](#use-this-package)
- [了解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与待办工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

源码树的 Web profile（配置档）包含此插件。使用通过 npm 分发的 DSH `0.1.2-rc.1` 时，请使用 [GitHub Release](https://github.com/5t4r1i9ht/deepseek-harness/releases/tag/question-notifications-v0.1.2-rc.1) 附件中的独立安装指南。指南作为单独附件提供，不在插件压缩包内。在“设置 → 通用设置”中选择**启用通知**，并接受浏览器提示。

### Profile 层

本包声明了 `dsh.bundle.patch`，因此通过 `dsh plugin` 安装到 Web profile 时，会启用它的 [patch 文件](cordis.patch.yml)：

```yaml
- insert:
    - id: ui-question-notifications
      name: '@deepseek-ai/dsh-client-ui-question-notifications'
```

本插件没有配置字段。通知遵循浏览器权限，包括页面打开前已经授予的权限。撤销权限会停止发送通知；不支持的浏览器和被屏蔽的权限会在设置项中显示说明。仅在组合尚未挂载此插件时安装该层。

### 通知生命周期

每个当前生效的问题或计划审阅请求在一次插件生命周期内产生一条通知，包括当前选中 Session 中的请求。回答、取消、被另一个生效交互替代或插件卸载都会关闭通知。问题仍在等待回答时授予权限，会允许为该问题发送通知；已经完成的问题不会随后发送通知。点击或关闭通知不会回答问题。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现细节——点击展开</summary>

插件观察 `uiSession.pendingInteractions`，并使用 `sessions.open()` 导航。它通过 `settings.general.item` 注册本地化权限设置项；它不回答或拦截 Host（宿主）的提问 waterfall（瀑布链）。浏览器通知和事件监听器属于插件的 Cordis effect（副作用）。请求对象身份抑制重复发送，同时允许不同 Session 独立发送通知。

本包不发布运行时 invariant（不变量）伴随入口：它拥有浏览器副作用和权限呈现，没有需要相互核对的独立运行时观测。包内测试覆盖通知生命周期和插件资源释放；完整提问回放覆盖权限点击、通知内容和点击导航。

从仓库根目录构建并打包，生成 GitHub Release 压缩包：

```sh
pnpm run build
pnpm --dir packages/client/ui-question-notifications pack --pack-destination ../../../.artifacts/question-notifications
```

推送 `question-notifications-v<package-version>` 标签会运行[发布工作流](../../../.github/workflows/release-question-notifications.yml)。它核对标签与包版本、构建压缩包，并创建预发布版本，将 `.tgz`、`SHA256SUMS` 和[安装指南](../../../docs/user/guide/question-notifications-install.zh.md)的两种语言文件作为独立附件发布。压缩包包含 Host（宿主）入口、浏览器 bundle、类型声明、启用 patch 和包 README。浏览器 bundle 的模块 id 与包名一致。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [提问 UI](../ui-user-questions/README.zh.md)——收集回答。
- [Session UI](../ui-session/README.zh.md)——当前生效的待处理交互。
- [Web Client 架构](../../../docs/subsystems/web-client.zh.md)——插件组合。
- [打包与安装插件](../../../docs/user/develop/basic/publish.zh.md)——profile 组合包安装。
- [浏览器权限要求](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API)——安全上下文和用户操作。

-----

<a id="model-experience"></a>
## 模型体验

无，因为此插件仅呈现浏览器通知，不贡献模型输入或工具结果。

#### KV Cache 影响

没有影响：通知权限、发送和点击不会改变模型请求或 Session 事件。

## 已知限制与待办工作

<a id="known-limitations-and-deferred-work"></a>

浏览器与页面生命周期限制通知发送：

- DSH `0.1.2-rc.1` 提供所需的 Client（客户端）服务。DSH `0.1.1-rc.2` 不受支持。
- 页面必须保持打开。本插件没有推送服务、service worker 通知或关闭页面后的通知发送。
- 发送通知需要安全上下文，并支持桌面 `Notification` 构造函数。即使已经授权，浏览器或操作系统设置仍可能抑制提醒。
- 去重仅作用于单个插件实例；不同标签页、页面重载或插件重载可能再次提醒同一个未回答问题。
- 仅当前生效的问题和计划审阅发送通知。权限审批和被更高优先级交互遮挡的请求不在此插件范围内。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者工作上下文——点击展开</summary>

无。

</details>
