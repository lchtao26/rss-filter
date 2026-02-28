import { parseFeed } from 'feedsmith';

export async function fetchFeed(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch feed: ${response.status}`);
  const xml = await response.text();
  return parseFeed(xml); // returns { format, feed } — feedsmith native types
}
