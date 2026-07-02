export interface RawArticle {
  title: string;
  source: string;
  url: string;
  published_at: string;
  content: string;
}

/**
 * Parses a Google News RSS feed XML using a regex-based approach.
 * This is robust, dependency-free, and works seamlessly in Next.js Server Components.
 */
function parseRSSFeed(xmlText: string): RawArticle[] {
  const articles: RawArticle[] = [];
  // Match each <item> block
  const itemMatches = xmlText.match(/<item>([\s\S]*?)<\/item>/g);
  
  if (!itemMatches) return [];

  for (const item of itemMatches) {
    try {
      const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);

      const rawTitle = titleMatch ? titleMatch[1] : '';
      const url = linkMatch ? linkMatch[1] : '';
      const published_at = pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString();
      let source = sourceMatch ? sourceMatch[1] : 'Google News';

      // Clean CDATA and HTML entities if present
      const cleanText = (str: string) => {
        return str
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
      };

      let title = cleanText(rawTitle);
      source = cleanText(source);

      // Often RSS titles have the format "Headline - Source". Strip the source from title if duplicate.
      if (title.endsWith(` - ${source}`)) {
        title = title.substring(0, title.length - ` - ${source}`.length).trim();
      }

      if (title && url) {
        articles.push({
          title,
          source,
          url,
          published_at,
          content: title, // Use title as initial content/snippet
        });
      }
    } catch (e) {
      console.warn('Failed to parse RSS item:', e);
    }
  }

  return articles;
}

/**
 * Fetches news from a given source URL.
 * Detects if it's a Google News RSS feed, GNews API, or NewsAPI, and falls back to Mock Data if needed.
 */
export async function fetchNewsFromSource(
  sourceName: string,
  sourceUrl: string,
  country: string,
  apiKeys: { gnews?: string; newsapi?: string } = {}
): Promise<RawArticle[]> {
  try {
    // 1. Google News RSS Feed (No API keys needed, free, CORS-bypassed on server side!)
    if (sourceUrl.includes('news.google.com/rss') || sourceUrl.includes('/rss')) {
      // Append country to search query if not already there
      const urlObj = new URL(sourceUrl);
      const query = urlObj.searchParams.get('q') || '';
      if (country && !query.toLowerCase().includes(country.toLowerCase())) {
        urlObj.searchParams.set('q', `${query} ${country}`);
      }
      
      const response = await fetch(urlObj.toString(), {
        next: { revalidate: 600 }, // Cache for 10 minutes
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
      });

      if (response.ok) {
        const xml = await response.text();
        const parsed = parseRSSFeed(xml);
        if (parsed.length > 0) return parsed.slice(0, 10); // Limit to 10 articles per fetch
      }
    }

    // 2. GNews API
    if (sourceUrl.includes('gnews.io') && apiKeys.gnews) {
      const url = `${sourceUrl}&token=${apiKeys.gnews}&country=${getCountryCode(country)}`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        return (json.articles || []).map((art: any) => ({
          title: art.title,
          source: art.source?.name || 'GNews',
          url: art.url,
          published_at: art.publishedAt || new Date().toISOString(),
          content: art.description || art.title,
        }));
      }
    }

    // 3. NewsAPI
    if (sourceUrl.includes('newsapi.org') && apiKeys.newsapi) {
      const url = `${sourceUrl}&apiKey=${apiKeys.newsapi}&q=${encodeURIComponent(country)}`;
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        return (json.articles || []).map((art: any) => ({
          title: art.title,
          source: art.source?.name || 'NewsAPI',
          url: art.url,
          published_at: art.publishedAt || new Date().toISOString(),
          content: art.description || art.content || art.title,
        }));
      }
    }
  } catch (error) {
    console.error(`Error fetching news from source ${sourceName}:`, error);
  }

  // Fallback to high-quality country-specific mock data
  return getMockArticlesForCountry(country, sourceName);
}

// Convert country name to two-letter code for GNews
function getCountryCode(country: string): string {
  const codes: Record<string, string> = {
    'India': 'in',
    'USA': 'us',
    'UK': 'gb',
    'Germany': 'de',
    'China': 'cn',
  };
  return codes[country] || 'us';
}

/**
 * Generates realistic mock fashion industry articles matching selected country and sources.
 */
export function getMockArticlesForCountry(country: string, sourceName: string): RawArticle[] {
  const date = new Date();
  
  // Custom mock database grouped by country
  const mocksByCountry: Record<string, Array<{ title: string; content: string; offsetMinutes: number }>> = {
    India: [
      {
        title: "Reliance Retail in talks to expand Zara flagship stores in New Delhi and Mumbai",
        content: "India's Reliance Retail is preparing to double its retail space for Zara in tier-1 metro hubs to meet surging premium apparel demands.",
        offsetMinutes: 15,
      },
      {
        title: "Surat textile manufacturers report 12% rise in cotton prices, squeezing apparel margins",
        content: "High raw material prices in cotton hubs are forcing Surat mills to increase export prices, affecting textile supply chains globally.",
        offsetMinutes: 45,
      },
      {
        title: "FabIndia launches sustainable organic cotton collection to target eco-conscious youth",
        content: "Traditional apparel brand FabIndia announced its transition to 100% certified organic cotton for its autumn festive range.",
        offsetMinutes: 120,
      },
      {
        title: "Nike targets double-digit growth in India with new athlete-centric flagship outlets",
        content: "Athletic wear giant Nike is focusing on fitness trends in urban India, launching large-format experiential stores.",
        offsetMinutes: 200,
      },
      {
        title: "H&M India reports record ecommerce traffic during summer festival sales run",
        content: "Fast-fashion giant H&M announced its online division in India outperformed local physical store sales by 25% this quarter.",
        offsetMinutes: 320,
      }
    ],
    USA: [
      {
        title: "Nike introduces high-performance running sneakers made of 80% recycled ocean plastics",
        content: "In a bid to meet ESG goals, Nike's new circular economy initiative launches nationwide next month with recycled running shoes.",
        offsetMinutes: 10,
      },
      {
        title: "Lululemon shares rise 4% as activewear demand remains resilient in US retail sector",
        content: "Lululemon's first quarter results exceed Wall Street expectations, bolstered by athleisure demand and online orders.",
        offsetMinutes: 30,
      },
      {
        title: "Retail analyst report: US department stores struggle to move high inventory of denim and boots",
        content: "A sluggish spring fashion season has left major American retailers like Macy's with excess winter fashion stock.",
        offsetMinutes: 90,
      },
      {
        title: "Zara debuts first fully-automated checkout experience in flagship New York store",
        content: "Zara's parent company Inditex is rolling out RFID-based self-checkout counters in the US to reduce customer wait times.",
        offsetMinutes: 180,
      },
      {
        title: "US Cotton Council warns tariff discussions could disrupt clothing manufacturing supply chains",
        content: "Proposed import duties on raw materials could impact retail clothing costs for major American brands.",
        offsetMinutes: 240,
      }
    ],
    UK: [
      {
        title: "Puma announces major partnership with London-based circular design platform",
        content: "Puma is launching an apparel take-back program across the UK, allowing consumers to recycle worn sports clothing for store credit.",
        offsetMinutes: 20,
      },
      {
        title: "Burberry retail sales slow in London flagship stores as luxury tourism drops",
        content: "British heritage brand Burberry notes a decline in tourist footfall in its luxury boutiques in London and Paris.",
        offsetMinutes: 60,
      },
      {
        title: "UK high street fashion stores report 4% drop in footfall due to unseasonable weather",
        content: "Cold summer temperatures have delayed sales of swimwear and light apparel, leaving retailers with excess stock.",
        offsetMinutes: 140,
      },
      {
        title: "Uniqlo opens new multi-story flagship store on Oxford Street with sustainable cafe",
        content: "Fast-retailing giant Uniqlo expands its footprint in the UK, showcasing its LifeWear line and local sustainable initiatives.",
        offsetMinutes: 220,
      },
      {
        title: "UK textile manufacturers call for government tax cuts to boost local wool production",
        content: "Domestic weavers warn they cannot compete with cheap synthetic imports without immediate financial reliefs.",
        offsetMinutes: 310,
      }
    ],
    Germany: [
      {
        title: "Adidas reports 8% revenue growth led by retro sneaker craze across Europe",
        content: "Strong demand for Adidas Samba and Gazelle sneakers has driven double-digit athletic division sales in key German cities.",
        offsetMinutes: 12,
      },
      {
        title: "Puma CEO outlines plan to streamline European retail operations and logistics",
        content: "Speaking in Herzogenaurach, Puma executives detailed a central European supply hub to decrease transit times.",
        offsetMinutes: 50,
      },
      {
        title: "Zalando expands AI stylist shopping assistant to German and French markets",
        content: "Germany's biggest online fashion platform Zalando launches a ChatGPT-powered recommendations tool for premium outerwear.",
        offsetMinutes: 110,
      },
      {
        title: "Berlin sustainable fashion week emphasizes eco-labeling and digital product passports",
        content: "Industry leaders in Germany call for standard transparency regulations across all ready-to-wear clothing brands.",
        offsetMinutes: 190,
      },
      {
        title: "H&M Germany reports high sales for its newly launched linen collections",
        content: "Eco-friendly light fabrics are dominating German summer wardrobes, prompting H&M to increase linen product supply.",
        offsetMinutes: 280,
      }
    ],
    China: [
      {
        title: "Uniqlo operator Fast Retailing to open 30 new stores in China by year-end",
        content: "Uniqlo continues its aggressive retail expansion in China, aiming at tier-2 and tier-3 cities to secure mass market presence.",
        offsetMinutes: 8,
      },
      {
        title: "Shein supply chain margins squeezed by international air freight shipping rate spikes",
        content: "The fast-fashion giant faces higher costs for shipping goods directly from China warehouses to European and US buyers.",
        offsetMinutes: 40,
      },
      {
        title: "Gucci and Prada luxury sales show signs of rebound in Shanghai and Beijing malls",
        content: "A post-holiday shopping rebound has boosted premium watch, leather bag, and apparel sales in Chinese luxury centers.",
        offsetMinutes: 100,
      },
      {
        title: "Cotton exports from Xinjiang region surge as global textile orders recover",
        content: "Increased demand from Asian garment factories has led to high textile output and logistics activity in Western China.",
        offsetMinutes: 170,
      },
      {
        title: "Zara debuts limited-edition collaboration with Chinese designer at Shanghai boutique",
        content: "Inditex targets China's Gen-Z demographic by partnering with independent local designers for cultural runway capsules.",
        offsetMinutes: 260,
      }
    ]
  };

  const list = mocksByCountry[country] || mocksByCountry.USA;

  return list.map((item, index) => {
    const artDate = new Date(date.getTime() - item.offsetMinutes * 60 * 1000);
    return {
      title: item.title,
      source: sourceName,
      url: `https://mocknews.example.com/${country.toLowerCase()}/fashion/${index}-${Date.now()}`,
      published_at: artDate.toISOString(),
      content: item.content,
    };
  });
}
