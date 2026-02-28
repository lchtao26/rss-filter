export interface FeedItem {
  title?: string;
  link?: string;
  description?: string;
  content?: string; // maps to content:encoded in RSS
  pubDate?: string;
}

export type SearchField = 'title' | 'description' | 'content';
