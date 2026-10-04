import { getPreferenceValues, Tool } from "@raycast/api";
import { markReadForAi } from "../lib/ai";
import { getPointsFromContent, getReadStories, getSeenStories, storyId } from "../lib/stories";

type Input = {
  /**
   * Comma-separated ids of the stories to mark as read, as returned by get-stories, e.g. "41234567, 41234568".
   */
  ids: string;
};

function findUnreadStories(input: string) {
  const ids = input
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (!ids.length) throw new Error("No story ids were given. Call get-stories for the current ids.");
  const seen = new Map(getSeenStories().map(({ story }) => [storyId(story), story]));
  const missing = ids.filter((id) => !seen.has(id));
  if (missing.length) {
    throw new Error(`No recent story has the id ${missing.join(", ")}. Call get-stories for the current ids.`);
  }
  const readStories = getReadStories();
  return ids.flatMap((id) => seen.get(id) ?? []).filter(({ external_url }) => !readStories.has(external_url));
}

export const confirmation: Tool.Confirmation<Input> = async ({ ids }) => {
  const { aiMarkAsRead } = getPreferenceValues<Preferences>();
  if (aiMarkAsRead !== "ask") return undefined;
  const stories = findUnreadStories(ids);
  if (!stories.length) return undefined;
  return {
    message: `Mark ${stories.length === 1 ? "this story" : `these ${stories.length} stories`} as read?`,
    info: stories.map((story) => ({
      name: story.title,
      value: `${getPointsFromContent(story.content_html) ?? "?"} points`,
    })),
  };
};

/**
 * Mark Hacker News stories as read so the menu bar stops showing them as new. Call it before replying, for the unread stories your reply tells the user about, or when they ask.
 */
export default async function tool({ ids }: Input) {
  const { aiMarkAsRead } = getPreferenceValues<Preferences>();
  if (aiMarkAsRead === "never") {
    throw new Error(
      "Raycast AI isn't allowed to mark stories as read. You can change this in the extension's preferences.",
    );
  }
  const stories = findUnreadStories(ids);
  if (stories.length) await markReadForAi(stories.map(({ external_url }) => external_url));
  return { markedAsRead: stories.map(({ title }) => title) };
}
