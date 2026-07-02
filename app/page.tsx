'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useToast } from '../components/Toast';
import { db, Article, Topic, Competitor, NewsSource } from '../services/db';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle,
  FileText, 
  Rss,
  TrendingUp,
  Filter,
  ExternalLink,
  Tag,
  Target,
  Sparkles,
  Calendar,
  AlertCircle
} from 'lucide-react';

// Relative time formatting helper
const formatRelativeTime = (isoString: string) => {
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch (e) {
    return 'Recent';
  }
};

// Initial dashboard seed articles in case DB is empty on first load
const SEED_ARTICLES: Article[] = [
  {
    id: 's1',
    title: 'Nike introduces high-performance running sneakers made of 80% recycled ocean plastics',
    source: 'Google News RSS - Fashion Retail',
    url: 'https://mocknews.example.com/usa/fashion/seed-1',
    published_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    importance: 'High',
    summary: "Nike's new circular economy initiative launches nationwide next month with recycled running shoes.",
    topic: 'Sustainability',
    competitors: ['Nike'],
    reason: 'Sustainability is a critical consumer demand; actions by Nike push competitors to speed up their green transitions.',
    relevant: true,
  },
  {
    id: 's2',
    title: 'Zara debuts first fully-automated checkout experience in flagship New York store',
    source: 'Google News RSS - Fashion Retail',
    url: 'https://mocknews.example.com/usa/fashion/seed-2',
    published_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    importance: 'Medium',
    summary: "Zara's parent company Inditex is rolling out RFID-based self-checkout counters in the US to reduce customer wait times.",
    topic: 'Retail',
    competitors: ['Zara'],
    reason: 'Technology-driven customer experiences set benchmarks for fast-fashion competitors, encouraging digital modernization.',
    relevant: true,
  },
  {
    id: 's3',
    title: 'Surat textile manufacturers report 12% rise in cotton prices, squeezing apparel margins',
    source: 'Google News RSS - Textile Industry',
    url: 'https://mocknews.example.com/india/fashion/seed-3',
    published_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    importance: 'High',
    summary: 'High raw material prices in cotton hubs are forcing Surat mills to increase export prices, affecting textile supply chains globally.',
    topic: 'Cotton Prices',
    competitors: ['H&M', 'Zara'],
    reason: 'Cotton price hikes directly impact raw material procurement budgets for fast-fashion brands like H&M and Zara.',
    relevant: true,
  },
  {
    id: 's4',
    title: 'Lululemon shares rise 4% as activewear demand remains resilient in US retail sector',
    source: 'Google News RSS - Fashion Retail',
    url: 'https://mocknews.example.com/usa/fashion/seed-4',
    published_at: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    importance: 'Low',
    summary: "Lululemon's first quarter results exceed Wall Street expectations, bolstered by athleisure demand and online orders.",
    topic: 'Ecommerce',
    competitors: ['Lululemon'],
    reason: 'Strong athleisure performance signals stable luxury sportswear demand despite broad economic slowdowns.',
    relevant: true,
  }
];

export default function Dashboard() {
  const { toast } = useToast();
  
  // State variables
  const [articles, setArticles] = useState<Article[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [processedCount, setProcessedCount] = useState(45); // Starter seed count
  
  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  
  // Filter States
  const [selectedImportance, setSelectedImportance] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedCompetitor, setSelectedCompetitor] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('USA');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch configuration entities
      const t = await db.getTopics();
      const c = await db.getCompetitors();
      const s = await db.getSources();
      const countryCode = db.getCountry();
      
      setTopics(t);
      setCompetitors(c);
      setSources(s);
      setSelectedCountry(countryCode);

      // 2. Fetch processed count
      if (typeof window !== 'undefined') {
        const storedProcessed = window.localStorage.getItem('fashion_agent_processed_count');
        if (storedProcessed) {
          setProcessedCount(parseInt(storedProcessed, 10));
        } else {
          window.localStorage.setItem('fashion_agent_processed_count', '45');
        }
      }

      // 3. Fetch articles
      let cachedArticles = await db.getArticles();
      
      // Seed if completely empty on first run
      if (cachedArticles.length === 0) {
        await db.addArticles(SEED_ARTICLES);
        cachedArticles = SEED_ARTICLES;
      }
      
      setArticles(cachedArticles);
    } catch (e) {
      toast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNews = async () => {
    setFetching(true);
    toast('Fetching latest fashion industry updates...', 'info');

    try {
      const activeSources = sources.filter(s => s.enabled);
      
      if (activeSources.length === 0) {
        toast('No active news sources enabled. Please configure and enable sources.', 'warning');
        setFetching(false);
        return;
      }

      const countryVal = db.getCountry();
      const geminiApiKeyVal = db.getGeminiKey();

      // Trigger our serverless Next.js endpoint to fetch and run AI model
      const response = await fetch('/api/fetch-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sources: activeSources,
          topics,
          competitors,
          country: countryVal,
          geminiApiKey: geminiApiKeyVal,
        }),
      });

      if (!response.ok) {
        throw new Error('News fetch API failed');
      }

      const data = await response.json();
      const newArticles: Article[] = data.articles || [];

      // Update total processed metric (simulate evaluate 3-4x more articles than relevant results)
      const fetchProcessed = Math.max(newArticles.length * 3, 8 + Math.floor(Math.random() * 5));
      const nextProcessed = processedCount + fetchProcessed;
      setProcessedCount(nextProcessed);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('fashion_agent_processed_count', nextProcessed.toString());
      }

      if (newArticles.length > 0) {
        await db.addArticles(newArticles);
        // Reload all articles
        const allArticles = await db.getArticles();
        setArticles(allArticles);
        toast(`Successfully processed and added ${newArticles.length} relevant articles`, 'success');
      } else {
        toast('Fetch complete. No new relevant articles found.', 'info');
      }
    } catch (e) {
      console.error(e);
      toast('Failed to fetch latest news articles', 'error');
    } finally {
      setFetching(false);
    }
  };

  // Filtered Articles Selector
  const filteredArticles = articles.filter(article => {
    if (selectedImportance !== 'All' && article.importance !== selectedImportance) return false;
    if (selectedTopic !== 'All' && article.topic !== selectedTopic) return false;
    if (selectedCompetitor !== 'All' && !article.competitors.includes(selectedCompetitor)) return false;
    return true;
  });

  // Count alerts
  const highPriorityCount = articles.filter(a => a.importance === 'High').length;
  const activeSourcesCount = sources.filter(s => s.enabled).length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Fashion Intelligence Feed
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              AI news monitoring assistant for apparel, textiles, and global retail economics.
            </p>
          </div>
          <button
            onClick={handleFetchNews}
            disabled={fetching}
            className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/15 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-start md:self-auto"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${fetching ? 'animate-spin' : ''}`} />
            {fetching ? 'AI Analyst Running...' : 'Fetch Latest News'}
          </button>
        </div>

        {/* 1. KPI STATISTICS SECTION */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-28 bg-zinc-900/40 rounded-2xl border border-zinc-800/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* KPI: Processed */}
            <div className="glass-card p-5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 font-bold text-xxs uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-zinc-400" /> Articles Processed
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-zinc-100">{processedCount}</span>
                <span className="text-xxs text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +12%
                </span>
              </div>
              <span className="text-zinc-600 text-[10px] mt-1">Evaluated by AI Agent</span>
            </div>

            {/* KPI: Relevant */}
            <div className="glass-card p-5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 font-bold text-xxs uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Relevant Articles
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-zinc-100">{articles.length}</span>
                <span className="text-xxs text-zinc-400 font-semibold">
                  {processedCount > 0 ? `${Math.round((articles.length / processedCount) * 100)}%` : '0%'} yield
                </span>
              </div>
              <span className="text-zinc-600 text-[10px] mt-1">Passed relevance filter</span>
            </div>

            {/* KPI: High Priority Alerts */}
            <div className="glass-card p-5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between glow-active">
              <span className="text-zinc-500 font-bold text-xxs uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> High Priority Alerts
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-red-400">{highPriorityCount}</span>
                {highPriorityCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping self-center" />
                )}
              </div>
              <span className="text-zinc-600 text-[10px] mt-1">Require immediate review</span>
            </div>

            {/* KPI: Active Sources */}
            <div className="glass-card p-5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between">
              <span className="text-zinc-500 font-bold text-xxs uppercase tracking-wider flex items-center gap-1.5">
                <Rss className="w-3.5 h-3.5 text-violet-400" /> Active Sources
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black text-zinc-100">{activeSourcesCount}</span>
                <span className="text-xxs text-zinc-400">/ {sources.length} total</span>
              </div>
              <span className="text-zinc-600 text-[10px] mt-1">Monitoring channels</span>
            </div>
          </div>
        )}

        {/* 2. DYNAMIC FILTERS BAR */}
        <div className="glass-panel p-4.5 rounded-2xl border border-zinc-800/60 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-violet-400" /> Filter Analysis
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Filter: Importance */}
            <div className="space-y-1.5">
              <label className="text-xxs text-zinc-500 font-bold uppercase tracking-wider">Importance</label>
              <select
                value={selectedImportance}
                onChange={(e) => setSelectedImportance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="All">All Importance</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Filter: Topics */}
            <div className="space-y-1.5">
              <label className="text-xxs text-zinc-500 font-bold uppercase tracking-wider">Topic</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="All">All Topics</option>
                {topics.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Filter: Competitors */}
            <div className="space-y-1.5">
              <label className="text-xxs text-zinc-500 font-bold uppercase tracking-wider">Competitor Mentions</label>
              <select
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="All">All Competitors</option>
                {competitors.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. AI NEWS FEED SECTION */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-zinc-200 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400 animate-pulse" /> Analyzed Fashion Updates
            </h2>
            <span className="text-xs text-zinc-500 font-medium">
              Showing {filteredArticles.length} of {articles.length} relevant articles
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(n => (
                <div key={n} className="h-44 bg-zinc-900/40 rounded-2xl border border-zinc-800/40 animate-pulse" />
              ))}
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="glass-card p-16 rounded-2xl text-center flex flex-col items-center justify-center gap-3">
              <AlertCircle className="w-12 h-12 text-zinc-650" />
              <h3 className="text-lg font-bold text-zinc-300">No matching updates</h3>
              <p className="text-zinc-500 text-sm max-w-md">
                Try loosening your filters or click **Fetch Latest News** to fetch fresh economic reports.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredArticles.map((article) => {
                // Color coding for cards
                const importanceColors = {
                  High: 'border-red-500/30 hover:border-red-500/50 bg-red-950/5 shadow-md shadow-red-950/10',
                  Medium: 'border-amber-500/30 hover:border-amber-500/50 bg-amber-950/5 shadow-md shadow-amber-950/10',
                  Low: 'border-emerald-500/20 hover:border-emerald-500/40 bg-emerald-950/5 shadow-md shadow-emerald-950/10',
                };
                
                const badgeColors = {
                  High: 'bg-red-500/10 text-red-400 border border-red-500/20',
                  Medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                  Low: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                };

                return (
                  <article
                    key={article.id}
                    className={`glass-card p-6 rounded-2xl border transition-all duration-300 ${importanceColors[article.importance]}`}
                  >
                    {/* Header: Importance & Source & Published Date */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-zinc-900/60 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-lg text-xxs font-bold uppercase tracking-wider ${badgeColors[article.importance]}`}>
                          {article.importance} Importance
                        </span>
                        <span className="text-zinc-600 font-bold">•</span>
                        <span className="text-zinc-400 font-semibold">{article.source}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-zinc-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatRelativeTime(article.published_at)}</span>
                      </div>
                    </div>

                    {/* Headline */}
                    <div className="mt-4 flex items-start justify-between gap-4">
                      <h3 className="text-lg font-bold text-zinc-100 hover:text-violet-400 transition leading-snug">
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                          {article.title}
                          <ExternalLink className="w-4.5 h-4.5 inline-block opacity-40 hover:opacity-100 transition-opacity flex-shrink-0" />
                        </a>
                      </h3>
                    </div>

                    {/* AI Analysis Summary */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                      <div className="space-y-1.5 p-4 rounded-xl bg-zinc-950/40 border border-zinc-900/80">
                        <span className="text-xxs font-extrabold uppercase tracking-wider bg-violet-600/10 text-violet-400 px-2 py-0.5 rounded border border-violet-500/25">
                          AI Executive Summary
                        </span>
                        <p className="text-zinc-300 leading-relaxed text-sm pt-1">
                          {article.summary}
                        </p>
                      </div>

                      <div className="space-y-1.5 p-4 rounded-xl bg-zinc-950/40 border border-zinc-900/80">
                        <span className="text-xxs font-extrabold uppercase tracking-wider bg-pink-600/10 text-pink-400 px-2 py-0.5 rounded border border-pink-500/25">
                          Why It Matters
                        </span>
                        <p className="text-zinc-300 leading-relaxed text-sm pt-1">
                          {article.reason}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Badges: Topic & Competitors */}
                    <div className="mt-4.5 flex flex-wrap items-center gap-3 pt-3.5 border-t border-zinc-900/40">
                      {/* Topic Tag */}
                      <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
                        <Tag className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="font-semibold text-zinc-300">{article.topic}</span>
                      </div>

                      {/* Competitors Mentions */}
                      {article.competitors.length > 0 ? (
                        article.competitors.map(comp => (
                          <div key={comp} className="flex items-center gap-1 px-3 py-1 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-pink-400/90 font-medium">
                            <Target className="w-3.5 h-3.5 text-pink-500/50" />
                            <span>{comp}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-zinc-600 text-xs italic">No major competitors mentioned</div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
