import { getPreferenceValues } from "@raycast/api";
import { markReadAndRefresh } from "../lib/ai";
import { readStoryContent } from "../lib/article";
import { getItem, getTopComments, HnItem, truncate } from "../lib/hn-api";
import {
  getCommentsFromContent,
  getPointsFromContent,
  getReadStories,
  refreshStories,
  resetIfPointsChanged,
  storyId,
} from "../lib/stories";
import { Story } from "../types";

const maxArticleLength = 5_000;
const maxCommentLength = 800;

async function prepareStory(story: Story) {
  const id = storyId(story);
  const item: HnItem = await getItem(id).catch(() => ({ id: Number(id), type: "story", url: story.url }));
  const [article, topComments] = await Promise.all([
    readStoryContent(item).then(
      ({ content }) => ({ text: truncate(content, maxArticleLength), error: undefined }),
      (error: Error) => ({ text: undefined, error: error.message }),
    ),
    getTopComments(item, 2).catch(() => []),
  ]);
  return {
    id,
    title: story.title,
    points: Number(getPointsFromContent(story.content_html)) || undefined,
    commentCount: Number(getCommentsFromContent(story.content_html)) || 0,
    articleUrl: story.url,
    discussionUrl: story.external_url,
    article: article.text,
    articleError: article.error,
    topComments: topComments.map((comment) => ({ ...comment, text: truncate(comment.text, maxCommentLength) })),
  };
}

/**
 * Get the user's unread Hacker News stories, newest first, ready to summarize: each comes with the text of its article, its top two comments, and links to the article and the discussion. Use it for any question about Hacker News, what's new, or the user's stories. moreUnread is how many unread stories were left out.
 */
export default async function tool() {
  const { points, summaryLimit, markReadByAi } = getPreferenceValues<Preferences>();
  resetIfPointsChanged(points);
  const { recent } = await refreshStories(points);
  const readStories = getReadStories();
  const unread = recent.filter(({ external_url }) => !readStories.has(external_url));
  const batch = unread.slice(0, Number(summaryLimit) || 3);

  const stories = await Promise.all(batch.map(prepareStory));
  if (markReadByAi && batch.length) await markReadAndRefresh(batch.map(({ external_url }) => external_url));
  return { stories, moreUnread: unread.length - batch.length };
}
