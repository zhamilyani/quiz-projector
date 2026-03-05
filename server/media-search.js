const https = require('https');
const path = require('path');
const fs = require('fs');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const idx = line.indexOf('=');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      env[key] = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', ...headers },
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// --- iTunes (audio) ---
async function searchITunes(query, mediaType = 'music') {
  const encoded = encodeURIComponent(query);
  const url = `https://itunes.apple.com/search?term=${encoded}&media=${mediaType}&limit=1&country=us`;
  try {
    const res = await httpsGet(url);
    if (res.status !== 200) return null;
    const data = JSON.parse(res.data);
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return {
        previewUrl: r.previewUrl,
        trackName: r.trackName,
        artistName: r.artistName,
        artworkUrl: r.artworkUrl100?.replace('100x100', '600x600'),
        collectionName: r.collectionName,
      };
    }
  } catch (e) {
    console.log('[media-search] iTunes error:', e.message);
  }
  return null;
}

// --- TMDB (movies/TV) ---
async function searchTMDB(query, apiKey) {
  const encoded = encodeURIComponent(query);
  // Search movie
  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encoded}&language=ru-RU`;
  try {
    const res = await httpsGet(searchUrl);
    if (res.status !== 200) return null;
    const data = JSON.parse(res.data);
    if (!data.results || data.results.length === 0) return null;
    const movieId = data.results[0].id;
    const movieTitle = data.results[0].title;

    // Get videos (trailers) — try Russian first, then English
    let videoId = await getTMDBTrailer(movieId, apiKey, 'ru-RU');
    if (!videoId) videoId = await getTMDBTrailer(movieId, apiKey, 'en-US');

    if (videoId) {
      console.log(`  [TMDB] "${query}" → "${movieTitle}" → youtube:${videoId}`);
      return { videoId, movieTitle };
    }
    console.log(`  [TMDB] "${query}" → "${movieTitle}" found but no trailer`);
  } catch (e) {
    console.log('[media-search] TMDB error:', e.message);
  }
  return null;
}

async function getTMDBTrailer(movieId, apiKey, lang) {
  const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${apiKey}&language=${lang}`;
  try {
    const res = await httpsGet(url);
    if (res.status !== 200) return null;
    const data = JSON.parse(res.data);
    if (!data.results || data.results.length === 0) return null;
    // Prefer official trailers, then teasers, then any
    const trailer = data.results.find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || data.results.find(v => v.site === 'YouTube' && v.type === 'Teaser')
      || data.results.find(v => v.site === 'YouTube');
    return trailer?.key || null;
  } catch (e) {
    return null;
  }
}

// --- YouTube scraping (fallback) ---
async function searchYouTube(query) {
  const encoded = encodeURIComponent(query);
  try {
    const res = await httpsGet(`https://www.youtube.com/results?search_query=${encoded}`, {
      'Accept-Language': 'ru,en',
    });
    if (res.status !== 200) return null;
    const matches = res.data.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
    if (matches) {
      const ids = [...new Set(matches.map(m => m.match(/"([a-zA-Z0-9_-]{11})"/)[1]))];
      return ids[0] || null;
    }
  } catch (e) {
    console.log('[media-search] YouTube scrape error:', e.message);
  }
  return null;
}

// --- Main: attach media to all questions ---
async function attachMediaToQuestions(quiz) {
  const env = loadEnv();
  const tmdbKey = env.TMDB_API_KEY;

  const promises = [];
  for (const round of quiz.rounds) {
    for (const q of round.questions) {
      if (!q.media?.url && (q.type === 'audio' || q.type === 'video' || q.type === 'image')) {
        promises.push(attachSingleMedia(q, tmdbKey));
      }
    }
  }

  if (promises.length > 0) {
    console.log(`[media-search] Searching media for ${promises.length} questions...${tmdbKey ? ' (TMDB enabled)' : ' (TMDB key missing, YouTube fallback)'}`);
    await Promise.allSettled(promises);
    console.log(`[media-search] Done.`);
  }

  return quiz;
}

async function attachSingleMedia(q, tmdbKey) {
  const searchQuery = q.answer || q.text;
  if (!searchQuery) return;

  try {
    if (q.type === 'audio') {
      const result = await searchITunes(searchQuery, 'music');
      if (result?.previewUrl) {
        q.media = { url: result.previewUrl };
        q.mediaInfo = {
          artist: result.artistName,
          track: result.trackName,
          artwork: result.artworkUrl,
          album: result.collectionName,
        };
        console.log(`  [audio] "${searchQuery}" → ${result.artistName} - ${result.trackName}`);
      } else {
        console.log(`  [audio] "${searchQuery}" → not found`);
      }
    } else if (q.type === 'video' || q.type === 'image') {
      // Try TMDB first (official trailers, HD), fallback to YouTube scraping
      let videoId = null;

      if (tmdbKey) {
        const tmdbResult = await searchTMDB(searchQuery, tmdbKey);
        if (tmdbResult) videoId = tmdbResult.videoId;
      }

      if (!videoId) {
        // Fallback: YouTube scraping
        const ytQuery = searchQuery + (q.type === 'image' ? ' фильм сцена отрывок' : ' трейлер фильм');
        videoId = await searchYouTube(ytQuery);
        if (videoId) console.log(`  [video/yt-fallback] "${searchQuery}" → youtube:${videoId}`);
      }

      if (videoId) {
        q.media = { url: `https://www.youtube.com/embed/${videoId}`, embedType: 'youtube' };
        q.mediaInfo = { videoId, thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` };
        if (q.type === 'image') {
          q.type = 'video';
          console.log(`  [image→video] "${searchQuery}" → youtube:${videoId}`);
        } else {
          console.log(`  [video] "${searchQuery}" → youtube:${videoId}`);
        }
      } else {
        console.log(`  [${q.type}] "${searchQuery}" → not found anywhere`);
      }
    }
  } catch (e) {
    console.log(`  [media] Error for "${searchQuery}": ${e.message}`);
  }
}

module.exports = { attachMediaToQuestions, searchITunes };
