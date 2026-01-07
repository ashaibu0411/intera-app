// Music Streaming API Service
// Integrates JioSaavn (South Asian), Audiomack (African), and Deezer (Global)

export interface StreamingSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  durationFormatted: string;
  coverImage: string;
  streamUrl: string | null;
  previewUrl: string | null;
  source: 'jiosaavn' | 'audiomack' | 'deezer' | 'local';
  region: string;
  country: string;
  genre: string;
  year?: string;
}

export interface SearchResult {
  songs: StreamingSong[];
  source: string;
}

// ============================================
// JIOSAAVN API (South Asian Music - Pakistan, India)
// ============================================

const JIOSAAVN_BASE_URL = 'https://saavn.dev/api';

export async function searchJioSaavn(query: string): Promise<StreamingSong[]> {
  try {
    const response = await fetch(
      `${JIOSAAVN_BASE_URL}/search/songs?query=${encodeURIComponent(query)}&limit=20`
    );
    const data = await response.json();

    if (!data.success || !data.data?.results) {
      return [];
    }

    return data.data.results.map((song: any) => ({
      id: `jiosaavn_${song.id}`,
      title: song.name || song.title || 'Unknown',
      artist: song.artists?.primary?.map((a: any) => a.name).join(', ') ||
              song.primaryArtists || 'Unknown Artist',
      album: song.album?.name || song.album || '',
      duration: song.duration || 0,
      durationFormatted: formatDuration(song.duration || 0),
      coverImage: song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url ||
                  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      streamUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url ||
                 song.downloadUrl?.[2]?.url || song.downloadUrl?.[1]?.url || null,
      previewUrl: song.downloadUrl?.[1]?.url || null,
      source: 'jiosaavn' as const,
      region: 'south-asia',
      country: song.language === 'punjabi' || song.label?.toLowerCase().includes('pakistan')
        ? 'Pakistan' : 'India',
      genre: song.language || 'South Asian',
      year: song.year || song.releaseDate?.split('-')[0],
    }));
  } catch (error) {
    console.log('JioSaavn search error:', error);
    return [];
  }
}

export async function getJioSaavnSong(songId: string): Promise<StreamingSong | null> {
  try {
    const id = songId.replace('jiosaavn_', '');
    const response = await fetch(`${JIOSAAVN_BASE_URL}/songs/${id}`);
    const data = await response.json();

    if (!data.success || !data.data?.[0]) {
      return null;
    }

    const song = data.data[0];
    return {
      id: `jiosaavn_${song.id}`,
      title: song.name || song.title || 'Unknown',
      artist: song.artists?.primary?.map((a: any) => a.name).join(', ') ||
              song.primaryArtists || 'Unknown Artist',
      album: song.album?.name || song.album || '',
      duration: song.duration || 0,
      durationFormatted: formatDuration(song.duration || 0),
      coverImage: song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url ||
                  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      streamUrl: song.downloadUrl?.[4]?.url || song.downloadUrl?.[3]?.url ||
                 song.downloadUrl?.[2]?.url || song.downloadUrl?.[1]?.url || null,
      previewUrl: song.downloadUrl?.[1]?.url || null,
      source: 'jiosaavn' as const,
      region: 'south-asia',
      country: song.language === 'punjabi' ? 'Pakistan' : 'India',
      genre: song.language || 'South Asian',
      year: song.year || song.releaseDate?.split('-')[0],
    };
  } catch (error) {
    console.log('JioSaavn get song error:', error);
    return null;
  }
}

// Search for specific Pakistani artists/songs
export async function searchPakistaniMusic(query: string): Promise<StreamingSong[]> {
  const pakistaniArtists = [
    'Nusrat Fateh Ali Khan',
    'Atif Aslam',
    'Rahat Fateh Ali Khan',
    'Abida Parveen',
    'Coke Studio Pakistan',
    'Ali Sethi',
    'Mehdi Hassan',
    'Ghulam Ali',
  ];

  // If query matches a Pakistani artist, search for them
  const searchQuery = pakistaniArtists.some(artist =>
    query.toLowerCase().includes(artist.toLowerCase())
  ) ? query : `${query} pakistan`;

  return searchJioSaavn(searchQuery);
}

// ============================================
// AUDIOMACK API (African Music)
// ============================================

const AUDIOMACK_BASE_URL = 'https://api.audiomack.com/v1';

export async function searchAudiomack(query: string): Promise<StreamingSong[]> {
  try {
    // Audiomack public search endpoint
    const response = await fetch(
      `${AUDIOMACK_BASE_URL}/music/search?q=${encodeURIComponent(query)}&type=song&limit=20`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log('Audiomack API error:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.results) {
      return [];
    }

    return data.results.map((song: any) => ({
      id: `audiomack_${song.id}`,
      title: song.title || 'Unknown',
      artist: song.artist || song.uploader?.name || 'Unknown Artist',
      album: song.album || '',
      duration: song.duration || 0,
      durationFormatted: formatDuration(song.duration || 0),
      coverImage: song.image || song.image_base ||
                  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      streamUrl: song.streaming_url || song.url_high || song.url_medium || null,
      previewUrl: song.url_medium || null,
      source: 'audiomack' as const,
      region: 'west-africa',
      country: song.genre?.toLowerCase().includes('nigeri') ? 'Nigeria' :
               song.genre?.toLowerCase().includes('ghana') ? 'Ghana' : 'Africa',
      genre: song.genre || 'Afrobeat',
      year: song.released?.split('-')[0],
    }));
  } catch (error) {
    console.log('Audiomack search error:', error);
    return [];
  }
}

// Search for African music by genre
export async function searchAfricanMusic(genre: string): Promise<StreamingSong[]> {
  const africanGenres = ['afrobeat', 'highlife', 'afropop', 'naija', 'amapiano', 'bongo'];
  const searchTerm = africanGenres.includes(genre.toLowerCase()) ? genre : `${genre} africa`;
  return searchAudiomack(searchTerm);
}

// ============================================
// DEEZER API (Global - Caribbean, Latin, etc.)
// ============================================

const DEEZER_BASE_URL = 'https://api.deezer.com';

export async function searchDeezer(query: string): Promise<StreamingSong[]> {
  try {
    const response = await fetch(
      `${DEEZER_BASE_URL}/search?q=${encodeURIComponent(query)}&limit=20`
    );
    const data = await response.json();

    if (!data.data) {
      return [];
    }

    return data.data.map((track: any) => ({
      id: `deezer_${track.id}`,
      title: track.title || track.title_short || 'Unknown',
      artist: track.artist?.name || 'Unknown Artist',
      album: track.album?.title || '',
      duration: track.duration || 0,
      durationFormatted: formatDuration(track.duration || 0),
      coverImage: track.album?.cover_big || track.album?.cover_medium ||
                  track.album?.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      streamUrl: null, // Deezer requires auth for full streams
      previewUrl: track.preview || null, // 30-second preview
      source: 'deezer' as const,
      region: detectRegionFromGenre(track.artist?.name, track.title),
      country: detectCountryFromTrack(track),
      genre: 'World Music',
      year: track.album?.release_date?.split('-')[0],
    }));
  } catch (error) {
    console.log('Deezer search error:', error);
    return [];
  }
}

// Search for Caribbean music (Reggae, Soca, etc.)
export async function searchCaribbeanMusic(query: string): Promise<StreamingSong[]> {
  const searchTerm = `${query} reggae jamaica caribbean`;
  const results = await searchDeezer(searchTerm);
  return results.map(song => ({
    ...song,
    region: 'caribbean',
    country: 'Jamaica',
    genre: 'Reggae',
  }));
}

// Search for Latin American music
export async function searchLatinMusic(query: string): Promise<StreamingSong[]> {
  const searchTerm = `${query} latin bossa salsa`;
  const results = await searchDeezer(searchTerm);
  return results.map(song => ({
    ...song,
    region: 'latin-america',
    country: 'Brazil',
    genre: 'Latin',
  }));
}

// Search for Middle Eastern music
export async function searchMiddleEasternMusic(query: string): Promise<StreamingSong[]> {
  const searchTerm = `${query} arabic oud`;
  const results = await searchDeezer(searchTerm);
  return results.map(song => ({
    ...song,
    region: 'middle-east',
    country: 'Middle East',
    genre: 'Arabic',
  }));
}

// ============================================
// UNIFIED SEARCH - Search all sources
// ============================================

export async function searchAllSources(query: string, region?: string): Promise<StreamingSong[]> {
  const results: StreamingSong[] = [];

  try {
    // Determine which APIs to search based on region
    const searchPromises: Promise<StreamingSong[]>[] = [];

    if (!region || region === 'all' || region === 'south-asia') {
      searchPromises.push(searchJioSaavn(query));
    }

    if (!region || region === 'all' || region === 'west-africa' || region === 'east-africa') {
      searchPromises.push(searchAudiomack(query));
    }

    if (!region || region === 'all' || region === 'caribbean' || region === 'latin-america' || region === 'middle-east') {
      searchPromises.push(searchDeezer(query));
    }

    const allResults = await Promise.allSettled(searchPromises);

    allResults.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(...result.value);
      }
    });

    // Remove duplicates based on title + artist
    const uniqueResults = results.filter((song, index, self) =>
      index === self.findIndex(s =>
        s.title.toLowerCase() === song.title.toLowerCase() &&
        s.artist.toLowerCase() === song.artist.toLowerCase()
      )
    );

    return uniqueResults;
  } catch (error) {
    console.log('Search all sources error:', error);
    return results;
  }
}

// ============================================
// FEATURED/CURATED SEARCHES
// ============================================

export async function getFeaturedPakistaniMusic(): Promise<StreamingSong[]> {
  const queries = [
    'Nusrat Fateh Ali Khan',
    'Atif Aslam Tajdar',
    'Coke Studio Pakistan',
    'Rahat Fateh Ali Khan Afreen',
  ];

  const results: StreamingSong[] = [];

  for (const query of queries) {
    const songs = await searchJioSaavn(query);
    results.push(...songs.slice(0, 5));
  }

  return results;
}

export async function getFeaturedAfricanMusic(): Promise<StreamingSong[]> {
  const queries = ['afrobeat hits', 'highlife ghana', 'naija music', 'amapiano'];

  const results: StreamingSong[] = [];

  for (const query of queries) {
    const songs = await searchAudiomack(query);
    results.push(...songs.slice(0, 5));
  }

  return results;
}

export async function getFeaturedReggaeMusic(): Promise<StreamingSong[]> {
  const queries = ['Bob Marley', 'reggae classics', 'dancehall hits', 'soca music'];

  const results: StreamingSong[] = [];

  for (const query of queries) {
    const songs = await searchDeezer(query);
    results.push(...songs.slice(0, 5).map(s => ({
      ...s,
      region: 'caribbean',
      genre: 'Reggae',
    })));
  }

  return results;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function detectRegionFromGenre(artist: string, title: string): string {
  const text = `${artist} ${title}`.toLowerCase();

  if (text.includes('reggae') || text.includes('jamaica') || text.includes('caribbean')) {
    return 'caribbean';
  }
  if (text.includes('latin') || text.includes('brazil') || text.includes('salsa')) {
    return 'latin-america';
  }
  if (text.includes('arabic') || text.includes('egypt') || text.includes('morocco')) {
    return 'middle-east';
  }
  if (text.includes('africa') || text.includes('nigeria') || text.includes('ghana')) {
    return 'west-africa';
  }
  if (text.includes('india') || text.includes('pakistan') || text.includes('bollywood')) {
    return 'south-asia';
  }

  return 'all';
}

function detectCountryFromTrack(track: any): string {
  const artistName = track.artist?.name?.toLowerCase() || '';
  const title = track.title?.toLowerCase() || '';
  const combined = `${artistName} ${title}`;

  if (combined.includes('jamaica') || combined.includes('marley')) return 'Jamaica';
  if (combined.includes('brazil') || combined.includes('bossa')) return 'Brazil';
  if (combined.includes('mexico')) return 'Mexico';
  if (combined.includes('cuba') || combined.includes('salsa')) return 'Cuba';
  if (combined.includes('trinidad') || combined.includes('soca')) return 'Trinidad';

  return 'International';
}

// Export a function to get streaming URL prioritizing full song over preview
export function getPlayableUrl(song: StreamingSong): string | null {
  return song.streamUrl || song.previewUrl;
}
