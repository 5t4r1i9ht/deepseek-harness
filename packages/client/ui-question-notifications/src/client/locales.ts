/** Browser notification permission controls and notification copy. */
export const en = {
  title: 'Question notifications',
  description: 'Get a browser notification when an agent needs your answer.',
  enable: 'Enable notifications',
  enabled: 'Enabled',
  requesting: 'Waiting for permission',
  denied: 'Blocked in browser settings',
  unsupported: 'Unavailable in this browser',
  grantedDescription: 'Notifications are allowed for this site. Change permission in your browser settings.',
  deniedDescription: 'Allow notifications for this site in your browser settings to receive question alerts.',
  unsupportedDescription: 'Use a browser with desktop notification support on HTTPS or localhost.',
  failed: 'The browser could not deliver notifications. Check its notification settings and try again.',
  retry: 'Try again',
  notificationTitle: 'An agent needs your answer',
  notificationBody: 'Open the session to answer the question.',
}

/** Keys shared by both shipped dictionaries. */
export type NotificationKey = keyof typeof en

/** Chinese notification copy. */
export const zh: Record<NotificationKey, string> = {
  title: '提问通知',
  description: 'Agent 需要你回答问题时，接收浏览器通知。',
  enable: '启用通知',
  enabled: '已启用',
  requesting: '等待授权',
  denied: '已在浏览器中屏蔽',
  unsupported: '此浏览器不可用',
  grantedDescription: '已允许此网站发送通知。可在浏览器设置中更改权限。',
  deniedDescription: '请在浏览器设置中允许此网站发送通知，以接收提问提醒。',
  unsupportedDescription: '请通过 HTTPS 或 localhost 使用支持桌面通知的浏览器。',
  failed: '浏览器无法发送通知。请检查通知设置后重试。',
  retry: '重试',
  notificationTitle: 'Agent 需要你回答问题',
  notificationBody: '打开会话回答问题。',
}
