# 独立安装浏览器提问通知插件

[English](question-notifications-install.md) | 中文

## 概述

将预构建的通知插件安装到通过 npm 分发的 DSH 的 Web profile（配置档）中。GitHub Release 压缩包包含浏览器代码和启用 patch（补丁），用户无需下载源码仓库或执行构建。本次发布支持 DSH `0.1.2-rc.1`；DSH `0.1.1-rc.2` 缺少所需的 Client（客户端）服务。

## 目录

- [准备条件](#prerequisites)
- [安装并启用](#install-and-enable)
- [更新或卸载](#update-or-remove)
- [排查问题](#troubleshooting)

-----

<a id="prerequisites"></a>
## 准备条件

使用 Node.js `^22.19.0 || >=24.0.0`、带有 `npx` 的 npm，以及 [PATH 上可用的 pnpm](https://pnpm.io/installation)。检查可用的命令：

```sh
node --version
pnpm --version
```

以下安装和启动命令均固定到受支持的 DSH 版本。修改插件前，先停止正在运行的 DSH 进程。两类命令应使用相同的操作系统账户与 `DSH_HOME`；未覆盖该变量时，profile 位于 `~/.dsh/profiles/` 下。

如果“设置 → 通用设置”中已经存在**提问通知**，说明当前组合已包含此插件，可跳过独立安装。

-----

<a id="install-and-enable"></a>
## 安装并启用

1. 安装 [GitHub Release](https://github.com/5t4r1i9ht/deepseek-harness/releases/tag/question-notifications-v0.1.2-rc.1) 中带版本号的发布文件：

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web add https://github.com/5t4r1i9ht/deepseek-harness/releases/download/question-notifications-v0.1.2-rc.1/deepseek-ai-dsh-client-ui-question-notifications-0.1.2-rc.1.tgz
```

需要离线传递插件时，先下载 `.tgz` 发布文件，再从下载目录安装：

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web add ./deepseek-ai-dsh-client-ui-question-notifications-0.1.2-rc.1.tgz
```

此方式仅将插件压缩包放在本地；DSH 运行时和尚未缓存的 npm 依赖仍需联网获取。发布文件中的 `SHA256SUMS` 记录了压缩包的校验和。

2. 确认组合后的 profile 包含 `ui-question-notifications`：

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 web --dump-config
```

3. 启动 DSH，并打开命令输出的网址：

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 web --no-open
```

4. 打开**设置 → 通用设置 → 提问通知**，选择**启用通知**，并允许浏览器权限请求。agent（智能体）提问或请求计划审阅时，就会发送浏览器通知。点击通知会打开发起提问的会话；回答或取消问题会关闭通知。

安装结果保存在 Web profile 中。后续只需使用上面的启动命令，并保持相同的 `DSH_HOME`。

-----

<a id="update-or-remove"></a>
## 更新或卸载

更新时，安装目标版本 Release 中带版本号的 `.tgz` URL，遵循该版本要求的 DSH 版本，然后重启 DSH。卸载独立安装的插件：

```sh
npx --yes @deepseek-ai/dsh@0.1.2-rc.1 plugin --profile web remove @deepseek-ai/dsh-client-ui-question-notifications
```

卸载后重启 DSH。此操作移除 profile 中的依赖及其 bundle（组合包）层；浏览器权限仍由网站设置保留。移除外部包不会禁用由其他 DSH 组合提供的通知插件。

-----

<a id="troubleshooting"></a>
## 排查问题

- **安装器找不到 pnpm：**先安装 pnpm 并确保 PATH 能找到它，再重试。
- **没有通知设置项：**使用 DSH `0.1.2-rc.1`，通过 `--dump-config` 检查 profile，再用安装时的账户与 `DSH_HOME` 重启。
- **权限被屏蔽：**在浏览器设置中允许 DSH 网站发送通知，再回到 DSH 标签页。
- **浏览器提示不支持通知：**通过 HTTPS 或 localhost 使用支持通知的桌面浏览器。保持 DSH 页面打开；本插件不提供关闭页面后的推送。
- **已经授权但没有提醒：**检查操作系统通知设置及勿扰模式。即使已经授予权限，通知发送仍遵循浏览器和操作系统的设置。
