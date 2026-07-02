import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsFromSource } from '../../../services/news';
import { analyzeArticle } from '../../../services/ai';
import { Article } from '../../../services/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sources, topics, competitors, country, geminiApiKey } = body;

    if (!sources || !Array.isArray(sources)) {
      return NextResponse.json({ error: 'Invalid sources array' }, { status: 400 });
    }

    const activeTopics = (topics || []).filter((t: any) => t.enabled).map((t: any) => t.name);
    const activeCompetitors = (competitors || []).filter((c: any) => c.enabled).map((c: any) => c.name);

    console.log(`Starting news fetch for country: ${country}. Sources: ${sources.length}`);

    const allArticles: Article[] = [];
    const seenUrls = new Set<string>();

    for (const source of sources) {
      if (!source.enabled) continue;
      
      const rawArticles = await fetchNewsFromSource(source.name, source.url, country, {});
      
      for (const raw of rawArticles) {
        if (seenUrls.has(raw.url)) continue;
        seenUrls.add(raw.url);

        // Run AI Analysis for this article
        const aiAnalysis = await analyzeArticle(
          raw.title,
          raw.content,
          geminiApiKey || '',
          activeTopics,
          activeCompetitors
        );

        // Only include relevant articles on dashboard
        if (aiAnalysis.relevant) {
          allArticles.push({
            id: crypto.randomUUID(),
            title: raw.title,
            source: raw.source,
            url: raw.url,
            published_at: raw.published_at,
            importance: aiAnalysis.importance,
            summary: aiAnalysis.summary,
            topic: aiAnalysis.topic,
            competitors: aiAnalysis.competitors,
            reason: aiAnalysis.reason,
            relevant: true,
          });
        }
      }
    }

    console.log(`Fetched and analyzed. Found ${allArticles.length} relevant articles.`);
    return NextResponse.json({ articles: allArticles });
  } catch (error: any) {
    console.error('Fetch news API route error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
