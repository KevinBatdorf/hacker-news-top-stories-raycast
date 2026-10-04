import { getPreferenceValues, launchCommand, LaunchType, Tool } from "@raycast/api";
import { getPointsFromContent, getSeenStories, markStoriesRead, storyId } from "../lib/stories";

type Input = {
  /**
   * Comma-separated ids of the stories to mark as read, as returned by get-stories, e.g. "41234567, 41234568".
   */
  ids: string;
};

function findStories(input: string) {
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
  return ids.flatMap((id) => seen.get(id) ?? []);
}

export const confirmation: Tool.Confirmation<Input> = async ({ ids }) => {
  const { aiMarkAsRead } = getPreferenceValues<Preferences>();
  if (aiMarkAsRead !== "ask") return undefined;
  const stories = findStories(ids);
  return {
    message: `Mark ${stories.length === 1 ? "this story" : `these ${stories.length} stories`} as read?`,
    info: stories.map((story) => ({
      name: story.title,
      value: `${getPointsFromContent(story.content_html) ?? "?"} points`,
    })),
  };
};

/**
 * Mark Hacker News stories as read so the menu bar stops showing them as new. Only call it after summarizing the stories for the user, or when they ask.
 */
export default async function tool({ ids }: Input) {
  const { aiMarkAsRead } = getPreferenceValues<Preferences>();
  if (aiMarkAsRead === "never") {
    throw new Error(
      "Raycast AI isn't allowed to mark stories as read. You can change this in the extension's preferences.",
    );
  }
  const stories = findStories(ids);
  markStoriesRead(stories.map(({ external_url }) => external_url));

  // Otherwise the menu bar icon counts them unread until its next refresh
  await launchCommand({ name: "view-top-stories", type: LaunchType.Background }).catch(() => undefined);

  return { markedAsRead: stories.map(({ title }) => title) };
}
