export interface FeedItem {
  title: string;
  link: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  description?: string;
}

export interface FilterParams {
  url: string;
  include?: string;
  exclude?: string;
  match?: 'any' | 'all';
  fields?: 'title' | 'description' | 'content' | 'title,description' | 'title,content' | 'description,content' | 'title,description,content';
  case_sensitive?: boolean;
  format?: 'rss' | 'json';
}

export type SearchField = 'title' | 'description' | 'content';
