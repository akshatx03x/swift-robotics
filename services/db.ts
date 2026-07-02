import { createClient } from '@supabase/supabase-js';

// Types representing our database objects
export interface Topic {
  id: string;
  name: string;
  enabled: boolean;
  created_at?: string;
}

export interface Competitor {
  id: string;
  name: string;
  enabled: boolean;
  created_at?: string;
}

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  priority: 'High' | 'Medium' | 'Low';
  created_at?: string;
}

export interface Article {
  id: string;
  title: string;
  source: string;
  url: string;
  published_at: string;
  importance: 'High' | 'Medium' | 'Low';
  summary: string;
  topic: string;
  competitors: string[];
  reason: string;
  relevant: boolean;
  created_at?: string;
}

// Default Seed Data
export const DEFAULT_TOPICS: Topic[] = [
  { id: '1', name: 'Fashion', enabled: true },
  { id: '2', name: 'Luxury Fashion', enabled: true },
  { id: '3', name: 'Textile Industry', enabled: true },
  { id: '4', name: 'Cotton Prices', enabled: true },
  { id: '5', name: 'Sustainability', enabled: true },
  { id: '6', name: 'Retail', enabled: true },
  { id: '7', name: 'Ecommerce', enabled: true },
];

export const DEFAULT_COMPETITORS: Competitor[] = [
  { id: '1', name: 'Nike', enabled: true },
  { id: '2', name: 'Adidas', enabled: true },
  { id: '3', name: 'Puma', enabled: true },
  { id: '4', name: 'Zara', enabled: true },
  { id: '5', name: 'H&M', enabled: true },
  { id: '6', name: 'Uniqlo', enabled: true },
  { id: '7', name: 'Lululemon', enabled: true },
];

export const DEFAULT_SOURCES: NewsSource[] = [
  { id: '1', name: 'Google News RSS - Fashion Retail', url: 'https://news.google.com/rss/search?q=fashion+retail+industry', enabled: true, priority: 'High' },
  { id: '2', name: 'Google News RSS - Textile Industry', url: 'https://news.google.com/rss/search?q=textile+cotton+prices', enabled: true, priority: 'Medium' },
  { id: '3', name: 'GNews - Fashion Economy', url: 'https://gnews.io/api/v4/search?q=fashion+economy', enabled: false, priority: 'Medium' },
  { id: '4', name: 'NewsAPI - Apparel Business', url: 'https://newsapi.org/v2/everything?q=apparel+retail+business', enabled: false, priority: 'High' },
];

// Helper to check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Initialize Supabase client if keys are present
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// LocalStorage key constants
const KEYS = {
  TOPICS: 'fashion_agent_topics',
  COMPETITORS: 'fashion_agent_competitors',
  SOURCES: 'fashion_agent_sources',
  ARTICLES: 'fashion_agent_articles',
  COUNTRY: 'fashion_agent_country',
  GEMINI_KEY: 'fashion_agent_gemini_key',
};

// Safe localStorage access wrapper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
  },
};

// DATABASE OPERATIONS IMPLEMENTATION
export const db = {
  // --- TOPICS ---
  async getTopics(): Promise<Topic[]> {
    if (supabase) {
      const { data, error } = await supabase.from('topics').select('*').order('name');
      if (!error && data) return data;
    }
    const local = safeLocalStorage.getItem(KEYS.TOPICS);
    if (!local) {
      safeLocalStorage.setItem(KEYS.TOPICS, JSON.stringify(DEFAULT_TOPICS));
      return DEFAULT_TOPICS;
    }
    return JSON.parse(local);
  },

  async saveTopics(topics: Topic[]): Promise<void> {
    if (supabase) {
      // For Supabase, we can upsert or rewrite depending on requirements,
      // but to keep it simple and robust, we upsert them.
      for (const t of topics) {
        await supabase.from('topics').upsert({ id: t.id.length > 5 ? t.id : undefined, name: t.name, enabled: t.enabled });
      }
    }
    safeLocalStorage.setItem(KEYS.TOPICS, JSON.stringify(topics));
  },

  async addTopic(name: string): Promise<Topic> {
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      name,
      enabled: true,
    };
    if (supabase) {
      const { data, error } = await supabase.from('topics').insert({ name, enabled: true }).select().single();
      if (!error && data) return data;
    }
    const current = await this.getTopics();
    const updated = [...current, newTopic];
    safeLocalStorage.setItem(KEYS.TOPICS, JSON.stringify(updated));
    return newTopic;
  },

  async updateTopic(id: string, updates: Partial<Omit<Topic, 'id'>>): Promise<void> {
    if (supabase && id.length > 5) {
      await supabase.from('topics').update(updates).eq('id', id);
    }
    const current = await this.getTopics();
    const updated = current.map(t => (t.id === id ? { ...t, ...updates } : t));
    safeLocalStorage.setItem(KEYS.TOPICS, JSON.stringify(updated));
  },

  async deleteTopic(id: string): Promise<void> {
    if (supabase && id.length > 5) {
      await supabase.from('topics').delete().eq('id', id);
    }
    const current = await this.getTopics();
    const updated = current.filter(t => t.id !== id);
    safeLocalStorage.setItem(KEYS.TOPICS, JSON.stringify(updated));
  },

  // --- COMPETITORS ---
  async getCompetitors(): Promise<Competitor[]> {
    if (supabase) {
      const { data, error } = await supabase.from('competitors').select('*').order('name');
      if (!error && data) return data;
    }
    const local = safeLocalStorage.getItem(KEYS.COMPETITORS);
    if (!local) {
      safeLocalStorage.setItem(KEYS.COMPETITORS, JSON.stringify(DEFAULT_COMPETITORS));
      return DEFAULT_COMPETITORS;
    }
    return JSON.parse(local);
  },

  async addCompetitor(name: string): Promise<Competitor> {
    const newCompetitor: Competitor = {
      id: crypto.randomUUID(),
      name,
      enabled: true,
    };
    if (supabase) {
      const { data, error } = await supabase.from('competitors').insert({ name, enabled: true }).select().single();
      if (!error && data) return data;
    }
    const current = await this.getCompetitors();
    const updated = [...current, newCompetitor];
    safeLocalStorage.setItem(KEYS.COMPETITORS, JSON.stringify(updated));
    return newCompetitor;
  },

  async updateCompetitor(id: string, updates: Partial<Omit<Competitor, 'id'>>): Promise<void> {
    if (supabase && id.length > 5) {
      await supabase.from('competitors').update(updates).eq('id', id);
    }
    const current = await this.getCompetitors();
    const updated = current.map(c => (c.id === id ? { ...c, ...updates } : c));
    safeLocalStorage.setItem(KEYS.COMPETITORS, JSON.stringify(updated));
  },

  async deleteCompetitor(id: string): Promise<void> {
    if (supabase && id.length > 5) {
      await supabase.from('competitors').delete().eq('id', id);
    }
    const current = await this.getCompetitors();
    const updated = current.filter(c => c.id !== id);
    safeLocalStorage.setItem(KEYS.COMPETITORS, JSON.stringify(updated));
  },

  // --- SOURCES ---
  async getSources(): Promise<NewsSource[]> {
    if (supabase) {
      const { data, error } = await supabase.from('sources').select('*').order('name');
      if (!error && data) return data;
    }
    const local = safeLocalStorage.getItem(KEYS.SOURCES);
    if (!local) {
      safeLocalStorage.setItem(KEYS.SOURCES, JSON.stringify(DEFAULT_SOURCES));
      return DEFAULT_SOURCES;
    }
    return JSON.parse(local);
  },

  async addSource(name: string, url: string, priority: 'High' | 'Medium' | 'Low'): Promise<NewsSource> {
    const newSource: NewsSource = {
      id: crypto.randomUUID(),
      name,
      url,
      enabled: true,
      priority,
    };
    if (supabase) {
      const { data, error } = await supabase.from('sources').insert({ name, url, enabled: true, priority }).select().single();
      if (!error && data) return data;
    }
    const current = await this.getSources();
    const updated = [...current, newSource];
    safeLocalStorage.setItem(KEYS.SOURCES, JSON.stringify(updated));
    return newSource;
  },

  async updateSource(id: string, updates: Partial<Omit<NewsSource, 'id'>>): Promise<void> {
    if (supabase && id.length > 5) {
      await supabase.from('sources').update(updates).eq('id', id);
    }
    const current = await this.getSources();
    const updated = current.map(s => (s.id === id ? { ...s, ...updates } : s));
    safeLocalStorage.setItem(KEYS.SOURCES, JSON.stringify(updated));
  },

  async deleteSource(id: string): Promise<void> {
    if (supabase && id.length > 5) {
      await supabase.from('sources').delete().eq('id', id);
    }
    const current = await this.getSources();
    const updated = current.filter(s => s.id !== id);
    safeLocalStorage.setItem(KEYS.SOURCES, JSON.stringify(updated));
  },

  // --- ARTICLES ---
  async getArticles(): Promise<Article[]> {
    if (supabase) {
      const { data, error } = await supabase.from('articles').select('*').order('published_at', { ascending: false });
      if (!error && data) return data;
    }
    const local = safeLocalStorage.getItem(KEYS.ARTICLES);
    return local ? JSON.parse(local) : [];
  },

  async addArticles(articles: Article[]): Promise<void> {
    if (supabase) {
      // Upsert to ignore duplicates by URL
      for (const article of articles) {
        // Prepare object mapping array to pg-array format for postgres
        const dbArticle = {
          title: article.title,
          source: article.source,
          url: article.url,
          published_at: article.published_at,
          importance: article.importance,
          summary: article.summary,
          topic: article.topic,
          competitors: article.competitors,
          reason: article.reason,
          relevant: article.relevant
        };
        await supabase.from('articles').upsert(dbArticle, { onConflict: 'url' });
      }
    }
    const current = await this.getArticles();
    // Filter duplicates by URL in LocalStorage mode
    const existingUrls = new Set(current.map(a => a.url));
    const newArticles = articles.filter(a => !existingUrls.has(a.url));
    const updated = [...newArticles, ...current].sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
    safeLocalStorage.setItem(KEYS.ARTICLES, JSON.stringify(updated));
  },

  async clearArticles(): Promise<void> {
    if (supabase) {
      await supabase.from('articles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }
    safeLocalStorage.setItem(KEYS.ARTICLES, JSON.stringify([]));
  },

  // --- SETTINGS (COUNTRY & GEMINI KEY) ---
  getCountry(): string {
    return safeLocalStorage.getItem(KEYS.COUNTRY) || 'USA';
  },

  setCountry(country: string): void {
    safeLocalStorage.setItem(KEYS.COUNTRY, country);
  },

  getGeminiKey(): string {
    return safeLocalStorage.getItem(KEYS.GEMINI_KEY) || '';
  },

  setGeminiKey(key: string): void {
    safeLocalStorage.setItem(KEYS.GEMINI_KEY, key);
  }
};
