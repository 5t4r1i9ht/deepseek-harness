# Install browser question notifications

English | [中文](question-notifications-install.zh.md)

## Summary

Install the prebuilt notification plugin into the Web profile of an npm-distributed DSH installation. The GitHub Release archive includes its browser code and activation patch, so users need neither a source checkout nor a build step. This release supports DSH `0.1.2-rc.1`; DSH `0.1.1-rc.2` lacks the required Client services.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Install and enable](#install-and-enable)
- [Update or remove](#update-or-remove)
- [Troubleshooting](#troubleshooting)

-----

<a id="prerequisites"></a>
## Prerequisites

Use Node.js `^22.19.0 || >=24.0.0`, npm with `npx`, and [pnpm on PATH](https://pnpm.io/installation). Check the available executables:

```sh
node --version
pnpm --version
```

The commands below pin DSH to the supported version for both installation and startup. Stop any running DSH process before changing its plugins. Use the same operating-system account and `DSH_HOME` for both commands; without an override, profiles live under `~/.dsh/profiles/`.

If Settings → General already contains **Question notifications**, the running composition already includes this plugin; skip the independent installation.

-----

<a id="install-and-enable"></a>
## Install and enable

1. Install the versioned asset from the [GitHub Release](https://github.com/5t4r1i9ht/deepseek-harness/releases/tag/question-notifications-v0.1.2-rc.1):

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web add https://github.com/5t4r1i9ht/deepseek-harness/releases/download/question-notifications-v0.1.2-rc.1/deepseek-ai-dsh-client-ui-question-notifications-0.1.2-rc.1.tgz
```

For an offline transfer, download the `.tgz` release asset first, then install it from the download directory:

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web add ./deepseek-ai-dsh-client-ui-question-notifications-0.1.2-rc.1.tgz
```

Only the plugin archive is local in this alternative; the DSH runtime and uncached npm dependencies still require network access. The release's `SHA256SUMS` file records the archive checksum.

2. Confirm that the composed profile includes `ui-question-notifications`:

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 web --dump-config
```

3. Start DSH and open the URL it prints:

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 web --no-open
```

4. Open **Settings → General → Question notifications**, choose **Enable notifications**, and allow the browser prompt. An agent question or plan review then produces a browser notification. Clicking it opens the requesting conversation; answering or cancelling the question closes it.

The installation persists in the Web profile. Future launches need only the startup command above, with the same `DSH_HOME`.

-----

<a id="update-or-remove"></a>
## Update or remove

To update, install the versioned `.tgz` URL from the desired release, follow that release's DSH version requirement, and restart DSH. To remove this independently installed plugin:

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web remove @deepseek-ai/dsh-client-ui-question-notifications
```

Restart DSH after removal. This removes the profile dependency and its bundle layer; browser permission remains a site setting. Removing an external package does not disable a notification plugin supplied by a different DSH composition.

-----

<a id="troubleshooting"></a>
## Troubleshooting

- **The installer cannot find pnpm:** install pnpm and make it available on PATH before retrying.
- **No notification setting appears:** use DSH `0.1.2-rc.1`, verify the profile with `--dump-config`, and restart with the same account and `DSH_HOME` used to install.
- **Permission is blocked:** allow notifications for the DSH site in browser settings, then return to the DSH tab.
- **The browser reports notifications unavailable:** use a supported desktop browser over HTTPS or localhost. Keep the DSH page open; closed-page push delivery is not provided.
- **Permission is granted but no alert appears:** check operating-system notification settings and Do Not Disturb. Notification delivery follows the browser and operating system even when permission is granted.
