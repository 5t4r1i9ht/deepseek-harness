---
description: "为待回答的 agent 问题发送浏览器通知，并在通用设置中提供权限控制。"
kind: "package-reference"
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

Web profile（配置档）包含此插件。在“设置 → 通用设置”中选择**启用通知**，并接受浏览器提示。浏览器设置管理此网站的权限；撤销权限会停止通知发送。不支持的浏览器和被屏蔽的权限会在同一设置项中显示说明。

### 最小配置

将以下条目与 Web 提问 UI 及标准 Client（客户端）服务一起挂载：

```yaml
- name: '@deepseek-ai/dsh-client-ui-question-notifications'
```

本插件没有配置字段。通知遵循浏览器权限，包括页面打开前已经授予的权限。

### 通知生命周期

每个当前生效的问题或计划审阅请求在一次插件生命周期内产生一条通知，包括当前选中 Session 中的请求。回答、取消、被另一个生效交互替代或插件卸载都会关闭通知。问题仍在等待回答时授予权限，会允许为该问题发送通知；已经完成的问题不会随后发送通知。点击或关闭通知不会回答问题。

-----

<a id="understand-the-implementation"></a>
## 了解实现

<details>
<summary>实现细节——点击展开</summary>

插件观察 `uiSession.pendingInteractions`，并使用 `sessions.open()` 导航。它通过 `settings.general.item` 注册本地化权限设置项；它不回答或拦截 Host（宿主）的提问 waterfall（瀑布链）。浏览器通知和事件监听器属于插件的 Cordis effect（副作用）。请求对象身份抑制重复发送，同时允许不同 Session 独立发送通知。

本包不发布运行时 invariant（不变量）伴随入口：它拥有浏览器副作用和权限呈现，没有需要相互核对的独立运行时观测。包内测试覆盖通知生命周期和插件资源释放；完整提问回放覆盖权限点击、通知内容和点击导航。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

- [提问 UI](../ui-user-questions/README.zh.md)——收集回答。
- [Session UI](../ui-session/README.zh.md)——当前生效的待处理交互。
- [Web Client 架构](../../../docs/subsystems/web-client.zh.md)——插件组合。
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
