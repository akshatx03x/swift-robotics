import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIAnalysisResult {
  relevant: boolean;
  importance: 'High' | 'Medium' | 'Low';
  summary: string;
  topic: string;
  competitors: string[];
  reason: string;
}

const SYSTEM_PROMPT = `You are a fashion industry analyst.
Given a news article, determine:
- relevance (true/false)
- importance (High, Medium, Low)
- concise summary (maximum 3 sentences)
- topic (must choose a relevant topic)
- competitors mentioned (list of names)
- why this matters for the fashion industry.

You must return your output strictly in JSON format matching this schema:
{
  "relevant": boolean,
  "importance": "High" | "Medium" | "Low",
  "summary": "string",
  "topic": "string",
  "competitors": ["string"],
  "reason": "string"
}`;

/**
 * Analyzes an article using the Gemini API if a key is provided, or a high-quality simulation fallback.
 */
export async function analyzeArticle(
  title: string,
  content: string,
  apiKey: string,
  activeTopics: string[],
  activeCompetitors: string[]
): Promise<AIAnalysisResult> {
  const geminiKey = apiKey || process.env.GEMINI_API_KEY || '';

  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const prompt = `
Active Topics of interest: ${activeTopics.join(', ')}
Active Competitors of interest: ${activeCompetitors.join(', ')}

Article Title: ${title}
Article Text/Snippet: ${content}

Please analyze this article. Determine relevance based on whether it relates to the fashion industry, apparel retail, textile supply chain, or the economy/consumer behavior affecting fashion. If relevant is false, you can set placeholder values for other fields.
`;

      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: prompt }
      ]);
      
      const text = result.response.text();
      const parsed = JSON.parse(text) as AIAnalysisResult;
      
      // Clean and normalize competitors to match our active ones if possible
      if (parsed.competitors) {
        parsed.competitors = parsed.competitors
          .map(c => activeCompetitors.find(ac => ac.toLowerCase() === c.toLowerCase()) || c)
          .filter(Boolean);
      }

      return parsed;
    } catch (error) {
      console.warn('Gemini analysis failed, falling back to simulated analysis:', error);
      // Fall through to simulation if API call fails
    }
  }

  // SIMULATION FALLBACK (High quality mock analyst)
  return simulateAnalysis(title, content, activeTopics, activeCompetitors);
}

/**
 * Generates highly realistic, dynamic AI analysis responses when API key is missing or fails.
 */
function simulateAnalysis(
  title: string,
  content: string,
  activeTopics: string[],
  activeCompetitors: string[]
): AIAnalysisResult {
  const lowercaseTitle = title.toLowerCase();
  const lowercaseContent = content.toLowerCase();

  // 1. Detect competitors
  const foundCompetitors = activeCompetitors.filter(comp => {
    const compLower = comp.toLowerCase();
    return lowercaseTitle.includes(compLower) || lowercaseContent.includes(compLower);
  });

  // 2. Detect topics
  let matchedTopic = 'Fashion';
  for (const topic of activeTopics) {
    if (lowercaseTitle.includes(topic.toLowerCase()) || lowercaseContent.includes(topic.toLowerCase())) {
      matchedTopic = topic;
      break;
    }
  }

  // 3. Determine relevance
  // Broad list of words indicating fashion, apparel, retail, supply chain, textile, or commerce
  const fashionKeywords = [
    'fashion', 'apparel', 'clothing', 'retail', 'ecommerce', 'sustainability', 'cotton', 
    'textile', 'sneaker', 'shoe', 'runway', 'designer', 'luxury', 'brand', 'sales',
    'nike', 'adidas', 'zara', 'h&m', 'uniqlo', 'lululemon', 'puma', 'gucci', 'prada',
    'wear', 'garment', 'outlet', 'collection', 'consumer spending', 'tariff'
  ];

  const isRelevant = fashionKeywords.some(keyword => 
    lowercaseTitle.includes(keyword) || lowercaseContent.includes(keyword)
  );

  if (!isRelevant) {
    return {
      relevant: false,
      importance: 'Low',
      summary: 'Non-fashion general news update.',
      topic: 'General',
      competitors: [],
      reason: 'Does not pertain to apparel, textiles, fashion supply chains, or associated retail markets.',
    };
  }

  // 4. Determine importance & summary & reason based on keywords in title
  let importance: 'High' | 'Medium' | 'Low' = 'Medium';
  let summary = `This article discusses recent developments regarding ${matchedTopic.toLowerCase()} and market trends.`;
  let reason = `Understanding trends in ${matchedTopic.toLowerCase()} helps brands adapt their supply chains and marketing strategies.`;

  if (lowercaseTitle.includes('collapse') || lowercaseTitle.includes('bankruptcy') || lowercaseTitle.includes('plunge') || lowercaseTitle.includes('soar') || lowercaseTitle.includes('surge') || lowercaseTitle.includes('acquisition') || lowercaseTitle.includes('buyout') || lowercaseTitle.includes('tariff') || lowercaseTitle.includes('trade war')) {
    importance = 'High';
  } else if (lowercaseTitle.includes('launch') || lowercaseTitle.includes('collab') || lowercaseTitle.includes('open') || lowercaseTitle.includes('store') || lowercaseTitle.includes('quarter') || lowercaseTitle.includes('revenue')) {
    importance = 'Medium';
  } else {
    importance = 'Low';
  }

  // Customize based on competitors found
  if (foundCompetitors.length > 0) {
    const compList = foundCompetitors.join(' and ');
    summary = `Report analyzing the market positioning, consumer interest, and recent strategic moves by ${compList}.`;
    
    if (lowercaseTitle.includes('earnings') || lowercaseTitle.includes('sales') || lowercaseTitle.includes('revenue')) {
      summary = `Quarterly financial results and performance analysis for ${compList}, highlighting consumer demand shifts.`;
      reason = `Financial health and growth indicators of major players like ${compList} set benchmarks for the wider fashion retail sector.`;
    } else if (lowercaseTitle.includes('sustainab') || lowercaseTitle.includes('eco') || lowercaseTitle.includes('green')) {
      summary = `New environmental initiatives and sustainability programs announced by ${compList} as ESG pressures rise.`;
      reason = `Sustainability is a critical consumer demand; actions by ${compList} push competitors to speed up their green transitions.`;
      matchedTopic = activeTopics.find(t => t.toLowerCase().includes('sustain')) || 'Sustainability';
    } else {
      reason = `Monitoring competitive activity from ${compList} is vital for forecasting market share shifts in the industry.`;
    }
  } else {
    // General topic-based customization
    if (matchedTopic.toLowerCase().includes('cotton') || matchedTopic.toLowerCase().includes('price') || matchedTopic.toLowerCase().includes('textile')) {
      summary = `Analysis of agricultural raw material prices and logistics costs impacting textile production lines.`;
      reason = `Cotton and textile price fluctuations directly impact production margins and retail pricing models for apparel brands.`;
    } else if (matchedTopic.toLowerCase().includes('luxury')) {
      summary = `An overview of the luxury retail landscape, noting changing consumer behaviors in high-end purchasing.`;
      reason = `Luxury fashion serves as a leading indicator for global economic health and premium consumer spending capacity.`;
    }
  }

  return {
    relevant: true,
    importance,
    summary,
    topic: matchedTopic,
    competitors: foundCompetitors,
    reason,
  };
}
