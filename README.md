# Fashion News Monitoring Agent

An AI-powered Fashion News Monitoring Agent that aggregates fashion-related news, filters irrelevant articles using AI, and presents concise, actionable insights in a structured dashboard.

Built as an MVP to demonstrate an end-to-end AI workflow, including configurable monitoring topics, competitors, and news sources.

---

## Features

### 📰 Live News Monitoring
- Fetches real-time fashion news from Google News RSS.
- Supports configurable news sources.

### AI-Powered Analysis
Each article is analyzed using Gemini AI (with a fallback analyzer when unavailable) to determine:
- Relevance
- Importance (High / Medium / Low)
- Executive Summary
- Why It Matters
- Related Topic
- Mentioned Competitors

### Configurable Monitoring

Manage monitored:

- Topics
- Competitors
- News Sources

All configurations can be added, edited, enabled/disabled, or removed directly from the UI.

### Dashboard

The dashboard displays:

- Articles Processed
- Relevant Articles
- High Priority Alerts
- Active Sources

Each article contains:

- Executive Summary
- Importance Level
- Topic
- Competitors
- Source
- Published Time
- Why It Matters

---

# Architecture

```text
          User Configuration
      (Topics / Sources / Competitors)
                    │
                    ▼
          Fetch Latest News
                    │
                    ▼
         Google News RSS Feeds
                    │
                    ▼
           AI Article Analysis
           (Gemini / Fallback)
                    │
                    ▼
       Relevance Classification
                    │
                    ▼
      Summary + Importance + Reason
                    │
                    ▼
          Store Processed Articles
                    │
                    ▼
        Dashboard & Analytics
```

---

# Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js | Frontend & API Routes |
| React | UI Components |
| TypeScript | Type Safety |
| Tailwind CSS | Styling |
| Google News RSS | News Source |
| Google Gemini AI | Article Analysis |
| Supabase (optional) | Data Storage |
| Local Storage | Offline/MVP Persistence |
| Vercel | Deployment |

---

# Project Structure

```
app/
 ├── api/
 │    └── fetch-news/
 ├── competitors/
 ├── settings/
 ├── sources/
 ├── topics/
 └── page.tsx

components/
services/
 ├── ai.ts
 ├── db.ts
 └── news.ts

lib/
```

---

# ⚙️ Setup

## Clone

```bash
git clone https://github.com/<your-username>/fashion-news-agent.git

cd fashion-news-agent
```

Install dependencies

```bash
npm install
```

Run locally

```bash
npm run dev
```

Production build

```bash
npm run build
```

---

# Environment Variables

Create a `.env.local` file.

```env
GEMINI_API_KEY=your_api_key
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

> If Gemini or Supabase are not configured, the application gracefully falls back to local storage and a simulated AI analysis engine for demonstration purposes.

---

# Usage

### 1. Configure Topics

Examples:

- Fashion
- Luxury Fashion
- Textile Industry
- Sustainability

---

### 2. Configure Competitors

Examples:

- Nike
- Adidas
- Zara
- H&M
- Puma

---

### 3. Configure News Sources

Examples:

- Google News RSS

---

### 4. Fetch Latest News

Click **Fetch Latest News**.

The application:

- Retrieves articles
- Sends them to the AI analyzer
- Filters irrelevant news
- Generates structured insights
- Updates the dashboard

---

# AI Workflow

Each fetched article is analyzed to determine:

- Is it relevant?
- What is its importance?
- Which topic does it belong to?
- Which competitors are mentioned?
- Why does it matter?
- Generate a concise executive summary.

Only relevant articles are displayed.

---

# Design Decisions

### Why Google News RSS?

- Free
- No API key required
- Reliable
- Suitable for an MVP

### Why Gemini AI?

- Strong text understanding
- Fast inference
- Produces structured JSON outputs
- Excellent for summarization and classification

### Why Configurable Topics, Sources & Competitors?

The assignment required users to dynamically control what the agent monitors without modifying the code.

### Why Manual Fetch?

For an MVP, a manual fetch provides a complete demonstration of the workflow while keeping the implementation simple.

---

# Future Improvements

### Short Term

- Scheduled monitoring
- Email notifications
- Slack integration
- Microsoft Teams integration

---

### Medium Term

- Multiple News APIs
- Improved deduplication
- Trend detection
- Historical analytics
- Better search

---

### Long Term

- Real-time streaming
- Semantic search
- Vector database
- Competitor intelligence dashboard
- Sentiment analysis
- Interactive analytics

---

# Known Limitations

- Google News RSS is the primary live news source.
- Manual fetch instead of automated scheduling.
- AI quality depends on the configured model/API key.
- Local storage is used when Supabase is unavailable.
- Designed as an MVP for demonstration purposes.

---

# Deployment

Deploy on Vercel.

```bash
npm run build
```

Connect the GitHub repository to Vercel and configure the required environment variables.

---

# Assignment Coverage

| Assignment Requirement | Implementation |
|------------------------|----------------|
| Monitor relevant sources | Google News RSS |
| Filter out noise | Gemini AI relevance classification |
| Deliver structured information | Dashboard with summaries and insights |
| Add/remove topics | CRUD interface |
| Add/remove competitors | CRUD interface |
| Add/remove news sources | CRUD interface |

---

# Demo

The project includes:

- Working MVP
- Dashboard
- AI-powered news filtering
- Configurable monitoring
- Ready for Loom walkthrough

---

# 📄 License

This project was developed as part of a technical interview assignment and is released under the MIT License.
