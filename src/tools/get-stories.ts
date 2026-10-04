import { getPreferenceValues } from "@raycast/api";
import {
  getCommentsFromContent,
  getPointsFromContent,
  getReadStories,
  getSeenStories,
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
 * Get the current top Hacker News stories, newest first. Use it for any question about Hacker News or its stories: the latest, newest, top or unread ones, what's on HN, or a story by name. These are the stories that reached the user's minimum points in the past 24 hours, the same list as their menu bar. Each story has the id the other tools need, its title, link, points, comment count, when it was posted (published), when it reached the minimum points (cameIn, which sets the order), and whether the user has read it.
 */
export default async function tool({ status = "all" }: Input) {
  const { points } = getPreferenceValues<Preferences>();
  resetIfPointsChanged(points);
  const { recent } = await refreshStories(points);

  const readStories = getReadStories();
  const cameIn = new Map(getSeenStories().map(({ story, seen }) => [story.external_url, seen]));
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
      cameIn: new Date(cameIn.get(story.external_url) ?? Date.now()).toISOString(),
      read: readStories.has(story.external_url),
    }))
    .filter(({ read }) => status === "all" || (status === "read") === read);

  return { minimumPoints: Number(points) || 500, stories };
}
