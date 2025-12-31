import type { NewsArticle } from './store';

// Mock news data for development
// In production, this would fetch from a news API like NewsAPI.org or GNews
const MOCK_NEWS: Record<string, NewsArticle[]> = {
  'Denver': [
    {
      id: 'news_1',
      title: 'African Restaurant Week Returns to Denver with 20+ Participating Venues',
      description: 'The annual celebration of African cuisine kicks off this weekend, featuring restaurants from across the Mile High City offering special menus and cultural experiences.',
      url: 'https://example.com/news/african-restaurant-week',
      imageUrl: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=400&fit=crop',
      source: 'Denver Post',
      publishedAt: '2024-12-30T08:00:00Z',
      category: 'Culture',
    },
    {
      id: 'news_2',
      title: 'New African Business Incubator Opens in Five Points Neighborhood',
      description: 'A new co-working space and business accelerator aims to support African entrepreneurs and small business owners in the Denver metro area.',
      url: 'https://example.com/news/business-incubator',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=400&fit=crop',
      source: 'Colorado Business Journal',
      publishedAt: '2024-12-29T14:00:00Z',
      category: 'Business',
    },
    {
      id: 'news_3',
      title: 'Colorado State University Launches African Studies Program',
      description: 'The new interdisciplinary program will offer courses in African history, languages, politics, and contemporary issues.',
      url: 'https://example.com/news/csu-african-studies',
      imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
      source: 'Education Weekly',
      publishedAt: '2024-12-28T10:00:00Z',
      category: 'Education',
    },
    {
      id: 'news_4',
      title: 'Local Ethiopian Coffee Shop Wins Best Specialty Coffee Award',
      description: "Addis Ababa Coffee House in Aurora takes home the top prize at Colorado's annual coffee competition.",
      url: 'https://example.com/news/coffee-award',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop',
      source: 'Denver Eater',
      publishedAt: '2024-12-27T16:00:00Z',
      category: 'Food',
    },
  ],
  'Aurora': [
    {
      id: 'news_5',
      title: 'Aurora Celebrates African Heritage Month with City-Wide Events',
      description: 'The city announces a month-long series of cultural events, art exhibitions, and community gatherings celebrating African heritage.',
      url: 'https://example.com/news/aurora-heritage-month',
      imageUrl: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=800&h=400&fit=crop',
      source: 'Aurora Sentinel',
      publishedAt: '2024-12-30T09:00:00Z',
      category: 'Community',
    },
    {
      id: 'news_6',
      title: 'New African Grocery Store Opens on Havana Street',
      description: 'The 10,000 sq ft market will offer authentic ingredients, spices, and products from over 20 African countries.',
      url: 'https://example.com/news/african-grocery',
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=400&fit=crop',
      source: 'Aurora Business News',
      publishedAt: '2024-12-29T11:00:00Z',
      category: 'Business',
    },
  ],
  'default': [
    {
      id: 'news_7',
      title: 'African Union Summit Addresses Diaspora Engagement Initiatives',
      description: 'Leaders discuss new programs to strengthen connections between African nations and diaspora communities worldwide.',
      url: 'https://example.com/news/au-summit',
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=400&fit=crop',
      source: 'Africa News',
      publishedAt: '2024-12-30T06:00:00Z',
      category: 'Politics',
    },
    {
      id: 'news_8',
      title: 'Tech Startups in Africa Raise Record $3 Billion in 2024',
      description: 'African tech ecosystem continues to grow as investors show increased confidence in the continent\'s innovation potential.',
      url: 'https://example.com/news/africa-tech',
      imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=400&fit=crop',
      source: 'TechCrunch Africa',
      publishedAt: '2024-12-29T08:00:00Z',
      category: 'Tech',
    },
    {
      id: 'news_9',
      title: 'Afrobeats Dominates Global Music Charts for Third Consecutive Year',
      description: 'African artists continue to break records and reach new audiences as the genre\'s global popularity soars.',
      url: 'https://example.com/news/afrobeats',
      imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
      source: 'Billboard',
      publishedAt: '2024-12-28T12:00:00Z',
      category: 'Entertainment',
    },
  ],
};

/**
 * Fetches local news for a given city
 * In production, this would call a real news API
 */
export async function getLocalNews(city: string, limit: number = 4): Promise<NewsArticle[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Check if we have specific news for this city
  const cityNews = MOCK_NEWS[city] || [];
  const defaultNews = MOCK_NEWS['default'] || [];

  // Combine city-specific news with default news
  const allNews = [...cityNews, ...defaultNews];

  // Sort by date and limit
  return allNews
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
  };
  return colors[category || ''] || '#6B7280';
}
