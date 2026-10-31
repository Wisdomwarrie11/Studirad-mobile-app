/**
 * YouTube Embed & URL Parser Utilities
 * Ensures seamless in-app video playback across all YouTube formats
 * (watch, shorts, youtu.be, embed, mobile)
 */

export interface ParsedYouTube {
  videoId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  isValid: boolean;
}

/**
 * Extracts 11-character YouTube video ID from any valid YouTube URL
 */
export function extractYouTubeId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // 1. If it's already a clean 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. YouTube Shorts: https://youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }

  // 3. youtu.be short link: https://youtu.be/VIDEO_ID
  const youtuBeMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (youtuBeMatch && youtuBeMatch[1]) {
    return youtuBeMatch[1];
  }

  // 4. Standard watch / embed / v / live URLs:
  // e.g. https://www.youtube.com/watch?v=VIDEO_ID, https://www.youtube.com/embed/VIDEO_ID
  const standardMatch = trimmed.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|live)\/|\S*?[?&]v=))([a-zA-Z0-9_-]{11})/
  );
  if (standardMatch && standardMatch[1]) {
    return standardMatch[1];
  }

  return null;
}

/**
 * Returns a privacy-enhanced, responsive YouTube embed URL that plays in-app
 */
export function getYouTubeEmbedUrl(url?: string | null, autoplay = false): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
  });

  if (autoplay) {
    params.set('autoplay', '1');
  }

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Returns the high-resolution YouTube video thumbnail
 */
export function getYouTubeThumbnail(url?: string | null): string | null {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Comprehensive parser returning parsed details
 */
export function parseYouTubeVideo(url?: string | null, autoplay = false): ParsedYouTube {
  const videoId = extractYouTubeId(url);
  if (!videoId) {
    return {
      videoId: null,
      embedUrl: null,
      thumbnailUrl: null,
      isValid: false,
    };
  }

  return {
    videoId,
    embedUrl: getYouTubeEmbedUrl(url, autoplay),
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    isValid: true,
  };
}
