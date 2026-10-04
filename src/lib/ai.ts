import { getPreferenceValues, launchCommand, LaunchType } from "@raycast/api";
import { getReadStories, getSeenStories, markStoriesRead, storyId } from "./stories";

export function assertStoryId(id: string) {
  if (!/^[1-9]\d*$/.test(id.trim())) {
    throw new Error(`"${id}" isn't a Hacker News story id. Call get-stories first and use an id from its results.`);
  }
}

// Reading one story's article or comments means the user is reading that story
export async function markOpenedStoryRead(id: string) {
  if (!getPreferenceValues<Preferences>().markReadByAi) return false;
  const story = getSeenStories().find((seen) => storyId(seen.story) === id.trim())?.story;
  if (!story) return false;
  if (getReadStories().has(story.external_url)) return true;

  markStoriesRead([story.external_url]);
  // Otherwise the menu bar icon counts it unread until its next refresh
  await launchCommand({ name: "view-top-stories", type: LaunchType.Background }).catch(() => undefined);
  return true;
}
