# Hacker News Top Stories

A menubar extension to view and track top stories from Hacker News

Ask Raycast AI about the latest stories with `@hacker-news-top-stories`, e.g. "summarize my unread stories". The **Raycast AI** preference controls whether it can mark stories as read after summarizing them.

This extension supports optionally showing native notifications for new stories. For a better experience (story icons, "click to open"), install terminal-notifier. Otherwise, notifications will use a generic notification system via apple script.

```shell
brew install terminal-notifier
```

Note: You may need to restart your Mac for changes to take effect. Alternatively, you can run `killall NotificationCenter` to refresh the notification center.
