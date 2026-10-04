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
 * Get the latest Hacker News stories that reached the user's minimum points in the past 24 hours — the same list the menu bar shows — each marked read or unread. Stories are ordered newest first by cameIn, when the story reached the user's minimum points; published is when it was posted. Call this before any tool that takes a story id.
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
