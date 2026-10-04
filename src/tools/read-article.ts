import { BrowserExtension } from "@raycast/api";
import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { assertStoryId, markOpenedStoryRead } from "../lib/ai";
import { decodeEntities, getItem, htmlToText, truncate } from "../lib/hn-api";

type Input = {
  /**
   * The Hacker News id of the story, e.g. from get-stories.
   */
  id: string;
};

const maxLength = 30_000;

function normalizeUrl(url: string) {
  return url.replace(/#.*$/, "").replace(/\/$/, "");
}

async function readOpenTab(url: string) {
  try {
    const tabs = await BrowserExtension.getTabs();
    const tab = tabs.find((tab) => normalizeUrl(tab.url) === normalizeUrl(url));
    if (!tab) return null;
    return await BrowserExtension.getContent({ tabId: tab.id, format: "markdown" });
  } catch {
    // Fails without the Raycast browser extension, so fetching the page is the fallback
    return null;
  }
}

async function fetchArticle(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`The site returned ${response.status} ${response.statusText}.`);
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("html")) throw new Error(`The link is ${type.split(";")[0] || "not a web page"}, not an article.`);

  const { document } = parseHTML(await response.text());
  const article = new Readability(document as never).parse();
  const text = articleText(article?.content ?? "");
  if (!text) throw new Error("No article text was found on the page.");
  return text;
}

function articleText(html: string) {
  return decodeEntities(
    html
      .replace(/<(br|\/?(p|div|h[1-6]|li|blockquote|pre|tr|figure|section|header|footer))\b[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Read the article a Hacker News story links to. For a text post such as Ask HN, returns the post itself. Use get-comments for the discussion. Needs a story id from get-stories, so call get-stories first rather than at the same time.
 */
export default async function tool({ id }: Input) {
  assertStoryId(id);
  const item = await getItem(id);
  if (!item.url) {
    return {
      title: item.title,
      markedAsRead: await markOpenedStoryRead(id),
      source: "Hacker News post",
      content: htmlToText(item.text ?? ""),
    };
  }

  const fromTab = await readOpenTab(item.url);
  let content = fromTab;
  try {
    content ??= await fetchArticle(item.url);
  } catch (error) {
    throw new Error(`Couldn't read ${item.url}: ${error instanceof Error ? error.message : error}`);
  }
  return {
    title: item.title,
    markedAsRead: await markOpenedStoryRead(id),
    url: item.url,
    source: fromTab ? "open browser tab" : "fetched page",
    truncated: content.length > maxLength,
    content: truncate(content, maxLength),
  };
}
