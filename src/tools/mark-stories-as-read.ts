import { markReadAndRefresh } from "../lib/ai";
import { getReadStories, getRecentStories, getSeenStories, storyId } from "../lib/stories";

type Input = {
  /**
   * Comma-separated ids of the stories to mark as read, from get-stories, e.g. "41234567, 41234568". Leave it out to mark every story in the list as read.
   */
  ids?: string;
};

/**
 * Mark Hacker News stories as read. Only call this when the user asks to mark stories as read.
 */
export default async function tool({ ids = "" }: Input) {
  const wanted = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const seen = new Map(getSeenStories().map(({ story }) => [storyId(story), story]));
  const missing = wanted.filter((id) => !seen.has(id));
  if (missing.length) {
    throw new Error(`No recent story has the id ${missing.join(", ")}. Call get-stories for the current ids.`);
  }

  const readStories = getReadStories();
  const stories = (wanted.length ? wanted.flatMap((id) => seen.get(id) ?? []) : getRecentStories()).filter(
    ({ external_url }) => !readStories.has(external_url),
  );
  if (stories.length) await markReadAndRefresh(stories.map(({ external_url }) => external_url));
  return { markedAsRead: stories.map(({ title }) => title) };
}
