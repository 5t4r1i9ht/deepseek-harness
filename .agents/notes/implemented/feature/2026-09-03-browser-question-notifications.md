# Agent Note: Browser question notifications

Status: implemented

English | [中文](2026-09-03-browser-question-notifications.zh.md)

## Problem

An agent can wait for an answer while the user is in another tab or application. Conversation and sidebar indicators require the user to keep watching the Web page.

## Decision

`dsh-client-ui-question-notifications` observes the effective pending-interaction source owned by `ui-session`. It notifies for questions and plan reviews after the browser grants notification permission. A General-settings button requests permission through an explicit user gesture. Permission remains browser-owned because it applies to one origin and browser, independently of other clients sharing the same Harness home.

Notifications contain generic localized text, avoiding publication of question content on the desktop. Clicking opens the requesting Session without answering it. Each request object notifies once per plugin lifetime; settlement, effective-request replacement, or plugin disposal closes the notification. A permission response arriving after disposal has no side effect.

The same package is an installable profile bundle: its patch inserts the notification row, and its prebuilt archive contains both runtime entries. GitHub Release distribution keeps the installation guides as separate attachments. Installation and startup instructions pin DSH `0.1.2-rc.1`, which provides the required Client services; the `0.1.1-rc.2` client is unsupported. Keeping the existing package name preserves the browser module id without a second distribution implementation.

The [pending-interaction ownership decision](../architecture/2026-08-20-client-session-conversation-ownership.md) remains authoritative. This feature adds a consumer and supersedes none of its ownership or lifetime rules.

## Alternatives considered

**Intercept the question waterfall.** A notification does not answer a request. Observing the existing effective UI source avoids depending on answerer order and keeps alerts aligned with the request the user can currently answer.

**Infer questions from assistant text or replayed logs.** Those sources cannot distinguish an actionable live question from prose or completed history. The pending source already records answerability.

**Push notifications and shared Host preferences.** Closed-page delivery would require a separate subscription and service-worker lifecycle. Host preferences cannot grant browser permission, so this plugin keeps its scope to open-page desktop notifications.

## Consequences

The feature composes without agent-loop, model-schema, or Session-log changes. Operating-system and browser policies still control final presentation. Separate tabs and plugin reloads can notify the same outstanding question; deduplication is intentionally local to one plugin instance.

Package tests cover permission failures, late permission completion, question replacement, click navigation, and effect disposal. The recorded question-composer scenario exercises the real Web composition while replacing only the external desktop Notification API with a probe.
