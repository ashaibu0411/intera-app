import type { NewsArticle } from './store';

// State to country mapping for better regional news
const STATE_TO_REGION: Record<string, string> = {
  // US States
  'CO': 'Colorado',
  'Colorado': 'Colorado',
  'CA': 'California',
  'California': 'California',
  'TX': 'Texas',
  'Texas': 'Texas',
  'NY': 'New York',
  'New York': 'New York',
  'FL': 'Florida',
  'Florida': 'Florida',
  'GA': 'Georgia',
  'Georgia': 'Georgia',
  'IL': 'Illinois',
  'Illinois': 'Illinois',
  'PA': 'Pennsylvania',
  'Pennsylvania': 'Pennsylvania',
  'OH': 'Ohio',
  'Ohio': 'Ohio',
  'MI': 'Michigan',
  'Michigan': 'Michigan',
  'NC': 'North Carolina',
  'North Carolina': 'North Carolina',
  'NJ': 'New Jersey',
  'New Jersey': 'New Jersey',
  'VA': 'Virginia',
  'Virginia': 'Virginia',
  'WA': 'Washington',
  'Washington': 'Washington',
  'AZ': 'Arizona',
  'Arizona': 'Arizona',
  'MA': 'Massachusetts',
  'Massachusetts': 'Massachusetts',
  'TN': 'Tennessee',
  'Tennessee': 'Tennessee',
  'IN': 'Indiana',
  'Indiana': 'Indiana',
  'MD': 'Maryland',
  'Maryland': 'Maryland',
  'MN': 'Minnesota',
  'Minnesota': 'Minnesota',
  'MO': 'Missouri',
  'Missouri': 'Missouri',
  'WI': 'Wisconsin',
  'Wisconsin': 'Wisconsin',
};

// Country language codes for news API
const COUNTRY_CODES: Record<string, string> = {
  'United States': 'us',
  'USA': 'us',
  'United Kingdom': 'gb',
  'UK': 'gb',
  'Canada': 'ca',
  'Australia': 'au',
  'Nigeria': 'ng',
  'South Africa': 'za',
  'Kenya': 'ke',
  'Ghana': 'gh',
  'France': 'fr',
  'Germany': 'de',
  'Netherlands': 'nl',
  'Italy': 'it',
  'Spain': 'es',
  'Brazil': 'br',
  'India': 'in',
};

/**
 * Fetches real local news using GNews API
 * Falls back to mock data if API fails or no key configured
 */
export async function getLocalNews(
  city: string,
  limit: number = 4,
  state?: string,
  country?: string
): Promise<NewsArticle[]> {
  const apiKey = process.env.EXPO_PUBLIC_GNEWS_API_KEY;

  // Try to fetch real news if API key is available
  if (apiKey) {
    try {
      const news = await fetchRealNews(city, state, country, apiKey, limit);
      if (news.length > 0) {
        return news;
      }
    } catch (error) {
      console.log('[News] API error, falling back to mock data:', error);
    }
  }

  // Fallback to mock data
  return getMockNews(city, state, limit);
}

/**
 * Fetch real news from GNews API
 */
async function fetchRealNews(
  city: string,
  state?: string,
  country?: string,
  apiKey?: string,
  limit: number = 4
): Promise<NewsArticle[]> {
  if (!apiKey) return [];

  // Build search query - include city, state/region for better local results
  const region = state ? STATE_TO_REGION[state] || state : '';
  const searchTerms = [city];
  if (region && region !== city) {
    searchTerms.push(region);
  }

  // Create query - search for city OR region news
  const query = encodeURIComponent(searchTerms.join(' OR '));

  // Get country code for the API
  const countryCode = country ? COUNTRY_CODES[country] || 'us' : 'us';

  const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&country=${countryCode}&max=${limit}&apikey=${apiKey}`;

  console.log('[News] Fetching news for:', { city, state: region, country, query });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`News API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.articles || data.articles.length === 0) {
    // Try a broader search with just the region/state
    if (region) {
      const broadQuery = encodeURIComponent(region);
      const broadUrl = `https://gnews.io/api/v4/search?q=${broadQuery}&lang=en&country=${countryCode}&max=${limit}&apikey=${apiKey}`;

      console.log('[News] No city results, trying broader search:', region);

      const broadResponse = await fetch(broadUrl);
      if (broadResponse.ok) {
        const broadData = await broadResponse.json();
        if (broadData.articles && broadData.articles.length > 0) {
          return formatNewsArticles(broadData.articles);
        }
      }
    }
    return [];
  }

  return formatNewsArticles(data.articles);
}

/**
 * Format API response to our NewsArticle format
 */
function formatNewsArticles(articles: any[]): NewsArticle[] {
  return articles.map((article, index) => ({
    id: `news_${Date.now()}_${index}`,
    title: article.title || 'Untitled',
    description: article.description || article.content?.substring(0, 200) || '',
    url: article.url || '#',
    imageUrl: article.image || getDefaultNewsImage(article.title),
    source: article.source?.name || 'News',
    publishedAt: article.publishedAt || new Date().toISOString(),
    category: detectCategory(article.title, article.description),
  }));
}

/**
 * Detect news category from title/description
 */
function detectCategory(title: string, description?: string): string {
  const text = `${title} ${description || ''}`.toLowerCase();

  if (text.match(/business|economy|stock|market|company|startup|entrepreneur/)) {
    return 'Business';
  }
  if (text.match(/tech|software|app|digital|ai|computer|cyber/)) {
    return 'Tech';
  }
  if (text.match(/school|university|education|student|college|teacher/)) {
    return 'Education';
  }
  if (text.match(/food|restaurant|chef|dining|cuisine|recipe/)) {
    return 'Food';
  }
  if (text.match(/culture|art|music|festival|heritage|tradition|african/)) {
    return 'Culture';
  }
  if (text.match(/community|local|neighborhood|city|town|resident/)) {
    return 'Community';
  }
  if (text.match(/politic|government|election|vote|law|policy|congress/)) {
    return 'Politics';
  }
  if (text.match(/entertainment|movie|film|celebrity|show|concert|sport/)) {
    return 'Entertainment';
  }
  if (text.match(/health|medical|hospital|doctor|covid|wellness/)) {
    return 'Health';
  }

  return 'News';
}

/**
 * Get default image based on category
 */
function getDefaultNewsImage(title: string): string {
  const category = detectCategory(title);
  const defaultImages: Record<string, string> = {
    'Business': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
    'Tech': 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
    'Education': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
    'Food': 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=400&fit=crop',
    'Culture': 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=400&fit=crop',
    'Community': 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
    'Politics': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=400&fit=crop',
    'Entertainment': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
    'Health': 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=400&fit=crop',
  };
  return defaultImages[category] || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=400&fit=crop';
}

/**
 * Mock news data fallback - includes regional news
 */
function getMockNews(city: string, state?: string, limit: number = 4): NewsArticle[] {
  const region = state ? STATE_TO_REGION[state] || state : '';

  // Mock news organized by region
  const MOCK_NEWS: Record<string, NewsArticle[]> = {
    'Colorado': [
      {
        id: 'co_news_1',
        title: 'Colorado African Community Center Expands Services',
        description: 'The center announces new programs including job training, language classes, and cultural events for the growing African diaspora in Colorado.',
        url: 'https://example.com/news/colorado-african-center',
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
        source: 'Colorado Public Radio',
        publishedAt: new Date().toISOString(),
        category: 'Community',
      },
      {
        id: 'co_news_2',
        title: 'Denver Metro Area Welcomes New African-Owned Businesses',
        description: 'Over 20 new African-owned businesses have opened across the Denver metro area this year, contributing to the local economy.',
        url: 'https://example.com/news/denver-african-businesses',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
        source: 'Denver Business Journal',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        category: 'Business',
      },
      {
        id: 'co_news_3',
        title: 'Aurora Schools Launch African Language Programs',
        description: 'Several Aurora public schools are now offering Swahili and Amharic language classes to serve the diverse student population.',
        url: 'https://example.com/news/aurora-language-programs',
        imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
        source: 'Aurora Sentinel',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        category: 'Education',
      },
      {
        id: 'co_news_4',
        title: 'Ethiopian Coffee Culture Thrives in Colorado',
        description: 'Traditional Ethiopian coffee ceremonies are becoming popular across Colorado, with new cafes opening in Aurora, Denver, and Boulder.',
        url: 'https://example.com/news/ethiopian-coffee-colorado',
        imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop',
        source: 'Westword',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        category: 'Food',
      },
    ],
    'default': [
      {
        id: 'news_default_1',
        title: 'African Diaspora Communities Growing Across America',
        description: 'New census data shows significant growth in African immigrant communities, with strong economic contributions.',
        url: 'https://example.com/news/diaspora-growth',
        imageUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
        source: 'NPR',
        publishedAt: new Date().toISOString(),
        category: 'Community',
      },
      {
        id: 'news_default_2',
        title: 'African Tech Founders Making Waves in Silicon Valley',
        description: 'A new generation of African-born entrepreneurs is reshaping the tech industry with innovative startups.',
        url: 'https://example.com/news/african-tech-founders',
        imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
        source: 'TechCrunch',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        category: 'Tech',
      },
      {
        id: 'news_default_3',
        title: 'Afrobeats Continues Global Domination',
        description: 'African music genres are topping charts worldwide, with streaming numbers breaking records.',
        url: 'https://example.com/news/afrobeats-global',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
        source: 'Billboard',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        category: 'Entertainment',
      },
    ],
  };

  // Get regional news (e.g., Colorado news for Aurora)
  const regionalNews = region ? MOCK_NEWS[region] || [] : [];
  const cityNews = MOCK_NEWS[city] || [];
  const defaultNews = MOCK_NEWS['default'] || [];

  // Combine: city-specific + regional + default, remove duplicates
  const allNews = [...cityNews, ...regionalNews, ...defaultNews];
  const uniqueNews = allNews.filter((news, index, self) =>
    index === self.findIndex(n => n.id === news.id)
  );

  return uniqueNews
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

/**
 * Formats the time since publication
 */
export function formatNewsDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Just now';
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/**
 * Get category color for news badges
 */
export function getNewsCategoryColor(category?: string): string {
  const colors: Record<string, string> = {
    'Culture': '#D4673A',
    'Business': '#1B4D3E',
    'Education': '#C9A227',
    'Food': '#E97451',
    'Community': '#8B5CF6',
    'Politics': '#3B82F6',
    'Tech': '#10B981',
    'Entertainment': '#EC4899',
    'Health': '#06B6D4',
    'News': '#6B7280',
  };
  return colors[category || ''] || '#6B7280';
}
