import { markReadAndRefresh } from "../lib/ai";
import { getReadStories, getSeenStories, storyId } from "../lib/stories";

type Input = {
  /**
   * Comma-separated ids of the stories to mark as read, from summarize-unread-stories, e.g. "41234567, 41234568".
   */
  ids: string;
};

/**
 * Mark Hacker News stories as read. Only call this when the user asks to mark stories as read.
 */
export default async function tool({ ids = "" }: Input) {
  const wanted = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!wanted.length) throw new Error("No stories were marked as read: name which stories to mark.");
  const seen = new Map(getSeenStories().map(({ story }) => [storyId(story), story]));
  const missing = wanted.filter((id) => !seen.has(id));
  if (missing.length) {
    throw new Error(`No recent story has the id ${missing.join(", ")}. Use an id from summarize-unread-stories.`);
  }

  const readStories = getReadStories();
  const stories = wanted
    .flatMap((id) => seen.get(id) ?? [])
    .filter(({ external_url }) => !readStories.has(external_url));
  if (stories.length) await markReadAndRefresh(stories.map(({ external_url }) => external_url));
  return { markedAsRead: stories.map(({ title }) => title) };
}
