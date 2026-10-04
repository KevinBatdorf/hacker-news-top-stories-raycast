import { getPreferenceValues } from "@raycast/api";
import {
  getCommentsFromContent,
  getPointsFromContent,
  getReadStories,
  refreshStories,
  resetIfPointsChanged,
  storyId,
} from "../lib/stories";

type Input = {
  /**
   * Which stories to return: "unread" for stories the user has not opened yet, "read" for ones they have, or "all" for both. Defaults to "all".
   */
  status?: "unread" | "read" | "all";
};

/**
 * Get the latest Hacker News stories that reached the user's minimum points in the past 24 hours — the same list the menu bar shows — each marked read or unread.
 */
export default async function tool({ status = "all" }: Input) {
  const { points, aiMarkAsRead } = getPreferenceValues<Preferences>();
  resetIfPointsChanged(points);
  const { recent } = await refreshStories(points);

  const readStories = getReadStories();
  const stories = recent
    .map((story) => ({
      id: storyId(story),
      title: story.title,
      url: story.url,
      discussionUrl: story.external_url,
      points: Number(getPointsFromContent(story.content_html)) || undefined,
      comments: Number(getCommentsFromContent(story.content_html)) || 0,
      author: story.author.name,
      published: story.date_published,
      read: readStories.has(story.external_url),
    }))
    .filter(({ read }) => status === "all" || (status === "read") === read);

  const unreadIds = stories.filter(({ read }) => !read).map(({ id }) => id);
  return {
    minimumPoints: Number(points) || 500,
    stories,
    ...(aiMarkAsRead !== "never" && unreadIds.length
      ? {
          afterSummarizing: `Once you have summarized the unread stories for the user, call mark-stories-as-read with the ids of the ones you summarized (unread ids: ${unreadIds.join(", ")}).`,
        }
      : {}),
  };
}
