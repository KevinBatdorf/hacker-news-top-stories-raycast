# Hacker News Top Stories

A menubar extension to view and track top stories from Hacker News

Ask Raycast AI about the latest stories with `@hacker-news-top-stories`, e.g. "summarize my unread stories" or "what are people saying about the top story?". It can also read the linked article, using the open browser tab when the Raycast browser extension is installed. A story is marked read when Raycast AI reads its article or comments; turn off the **Raycast AI** preference to stop that.

Read stories sync between your Macs through a "Raycast Hacker News" folder in iCloud Drive. Turn off the **iCloud Sync** preference to keep them on each Mac.

This extension supports optionally showing native notifications for new stories. For a better experience (story icons, "click to open"), install terminal-notifier. Otherwise, notifications will use a generic notification system via apple script.

```shell
brew install terminal-notifier
```

Note: You may need to restart your Mac for changes to take effect. Alternatively, you can run `killall NotificationCenter` to refresh the notification center.
