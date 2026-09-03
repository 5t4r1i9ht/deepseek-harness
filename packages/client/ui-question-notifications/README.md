---
description: "Browser notifications for pending agent questions, with a General-settings permission control."
kind: "package-bundle"
---

# @deepseek-ai/dsh-client-ui-question-notifications

English | [中文](README.zh.md)

## Summary

Receive a browser notification when an agent needs your answer, including a plan review. Enable notifications in Settings → General, then allow the browser permission request. Clicking a notification opens the requesting Session. The notification contains a generic reminder; question content stays in the conversation.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Further Exploration](#further-exploration)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Dev Note](#dev-note)

-----

<a id="use-this-package"></a>
## Use this package

The source-tree Web profile includes this plugin. For the npm-distributed DSH `0.1.2-rc.1`, use the independent installation guides attached to the [GitHub Release](https://github.com/5t4r1i9ht/deepseek-harness/releases/tag/question-notifications-v0.1.2-rc.1). The guides are separate attachments, outside the plugin archive. In Settings → General, choose **Enable notifications** and accept the browser prompt.

### Profile layer

The package declares `dsh.bundle.patch`, so `dsh plugin` activates its [patch file](cordis.patch.yml) when installed into a Web profile:

```yaml
- insert:
    - id: ui-question-notifications
      name: '@deepseek-ai/dsh-client-ui-question-notifications'
```

There are no plugin configuration fields. Notifications follow browser permission, including permission already granted before the page opens. Revoking that permission disables delivery; unsupported browsers and blocked permission show an explanation in the settings row. Install this layer only when the composition does not already mount the plugin.

### Notification lifetime

Each effective question or plan-review request produces one notification per plugin lifetime, including a request in the currently selected Session. Answering, cancellation, replacement by another effective interaction, or plugin unloading closes the notification. Permission granted while a question is still pending allows that question to notify; completed questions do not notify afterward. Clicking or dismissing a notification does not answer the question.

-----

<a id="understand-the-implementation"></a>
## Understand the implementation

<details>
<summary>Implementation internals — click to expand</summary>

The plugin observes `uiSession.pendingInteractions` and uses `sessions.open()` for navigation. It registers a localized permission row through `settings.general.item`; it neither answers nor intercepts the Host question waterfall. Browser notifications and event listeners belong to the plugin's Cordis effect. Request object identity suppresses duplicate delivery while allowing unrelated Sessions to notify independently.

No runtime invariant companion is published: the package owns browser effects and permission presentation, with no independent runtime observations to reconcile. The notification lifecycle and plugin disposal are covered by the package tests; the assembled question replay exercises the permission gesture, notification content, and click navigation.

Build and pack from the repository root to produce the GitHub Release archive:

```sh
pnpm run build
pnpm --dir packages/client/ui-question-notifications pack --pack-destination ../../../.artifacts/question-notifications
```

The [release workflow](../../../.github/workflows/release-question-notifications.yml) runs when a `question-notifications-v<package-version>` tag is pushed. It checks the tag against the package version, builds the archive, and publishes a prerelease with the `.tgz`, `SHA256SUMS`, and both language files of the [installation guide](../../../docs/user/guide/question-notifications-install.md) as separate attachments. The archive contains the Host entry, browser bundle, type declarations, activation patch, and package READMEs. The browser bundle's module id remains the package name.

</details>

-----

<a id="further-exploration"></a>
## Further Exploration

- [Question UI](../ui-user-questions/README.md) — answer collection.
- [Session UI](../ui-session/README.md) — effective pending interactions.
- [Web Client architecture](../../../docs/subsystems/web-client.md) — plugin composition.
- [Package and install a plugin](../../../docs/user/develop/basic/publish.md) — profile bundle installation.
- [Browser permission requirements](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API) — secure contexts and user gestures.

-----

<a id="model-experience"></a>
## Model Experience

None, as this plugin only presents browser notifications and contributes no model input or tool result.

#### KV Cache effect

No effect: notification permission, delivery, and clicks do not change model requests or Session events.

## Known Limitations and Deferred Work

<a id="known-limitations-and-deferred-work"></a>

Browser and page lifetimes constrain delivery:

- DSH `0.1.2-rc.1` supplies the required Client services. DSH `0.1.1-rc.2` is unsupported.
- The page must remain open. There is no push service, service worker notification, or closed-page delivery.
- Delivery requires a secure context and support for the desktop `Notification` constructor. Browser or operating-system settings may suppress alerts even after permission is granted.
- Deduplication is local to one plugin instance; separate tabs, page reloads, or plugin reloads can notify the same outstanding question again.
- Only effective questions and plan reviews notify. Permission approvals and requests hidden by a higher-precedence interaction are outside this plugin's scope.

<a id="dev-note"></a>
### Dev Note

<details>
<summary>Working context for maintainers — click to expand</summary>

None.

</details>
