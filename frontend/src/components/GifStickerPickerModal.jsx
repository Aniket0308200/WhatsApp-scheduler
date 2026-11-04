import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

// ─── Giphy API Key Retrieval ─────────────────────────────────────────────────
// Reads from .env (supports REACT_APP_GIPHY_API_KEY and VITE_GIPHY_API_KEY)
const ENV_GIPHY_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.REACT_APP_GIPHY_API_KEY || import.meta.env.VITE_GIPHY_API_KEY)) ||
  (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_GIPHY_API_KEY || process.env.VITE_GIPHY_API_KEY)) ||
  '';

// Default to user's Giphy API key from .env so live search works seamlessly everywhere
const USER_GIPHY_KEY = 'Zf8by2lWLWfdCtoo2008F6jWTarkTdKq';
const ACTIVE_GIPHY_KEY = ENV_GIPHY_KEY.trim() || USER_GIPHY_KEY;

/**
 * Pixel-perfect SVG matching WhatsApp sticker icon:
 * Rounded square with folded/peeled bottom-right corner flap, circular eyes, and curved smiling mouth.
 */
export function WhatsAppStickerIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M4 7C4 5.34315 5.34315 4 7 4H17C18.6569 4 20 5.34315 20 7V13.8C20 14.3304 19.7893 14.8391 19.4142 15.2142L15.2142 19.4142C14.8391 19.7893 14.3304 20 13.8 20H7C5.34315 20 4 18.6569 4 17V7Z" />
      <path
        d="M14 20V15C14 14.4477 14.4477 14 15 14H20L14 20Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx="8.75" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="10" r="1.3" fill="currentColor" stroke="none" />
      <path d="M8.5 13.6C9.6 15.8 13.6 15.8 14.7 13.6" strokeWidth={2} />
    </svg>
  );
}

/**
 * WhatsApp-style GIF pill icon
 */
export function WhatsAppGifIcon({ className = "w-5 h-5", ...props }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="2.5" y="4.5" width="19" height="15" rx="3.5" />
      <path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v3A1.5 1.5 0 0 0 6.5 15H8v-3H6.5" />
      <path d="M12 9v6" />
      <path d="M16 15V9h3" />
      <path d="M16 12h2" />
    </svg>
  );
}

/**
 * Converts any user uploaded image file (PNG/JPG/SVG/WebP) into 512x512 WebP sticker.
 */
export function convertImageFileToWebpSticker(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        ctx.clearRect(0, 0, 512, 512);

        // Aspect fit image inside 512x512 with transparent background
        const scale = Math.min(512 / img.width, 512 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (512 - w) / 2;
        const y = (512 - h) / 2;

        ctx.drawImage(img, x, y, w, h);

        const webpUrl = canvas.toDataURL('image/webp', 0.92);
        resolve(webpUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Converts an online Sticker URL (e.g. from Giphy) into a native 512x512 WebP Sticker Data URL.
 */
export function convertImageUrlToWebpSticker(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(imageUrl);

        ctx.clearRect(0, 0, 512, 512);
        const scale = Math.min(512 / img.width, 512 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (512 - w) / 2;
        const y = (512 - h) / 2;

        ctx.drawImage(img, x, y, w, h);
        const webpUrl = canvas.toDataURL('image/webp', 0.92);
        resolve(webpUrl);
      } catch {
        // In case of CORS canvas taint, resolve direct URL
        resolve(imageUrl);
      }
    };
    img.onerror = () => {
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
}

// ─── Quick Suggestion Category Chips ─────────────────────────────────────────
const STICKER_QUICK_TAGS = [
  { id: 'all', label: '🔥 Trending' },
  { id: 'funny', label: '😂 Funny' },
  { id: 'love', label: '❤️ Love' },
  { id: 'namaste', label: '🙏 Namaste' },
  { id: 'party', label: '🎉 Party' },
  { id: 'chai', label: '☕ Chai' },
  { id: 'birthday', label: '🎂 Birthday' },
  { id: 'yes', label: '👍 Yes' },
  { id: 'bye', label: '👋 Bye' },
  { id: 'cat', label: '🐱 Cat' }
];

const GIF_QUICK_TAGS = [
  { id: 'all', label: '🔥 Trending' },
  { id: 'laugh', label: '🤣 Laugh' },
  { id: 'dance', label: '🕺 Dance' },
  { id: 'bollywood', label: '🎬 Bollywood' },
  { id: 'cute', label: '🐱 Cute' },
  { id: 'sorry', label: '💔 Sorry' },
  { id: 'party', label: '🥳 Party' },
  { id: 'chai', label: '☕ Chai' },
  { id: 'cheers', label: '🍻 Cheers' },
  { id: 'work', label: '💼 Work' }
];

/**
 * Unified WhatsApp Giphy Real-time Dynamic GIF & Sticker Picker Modal
 */
export default function GifStickerPickerModal({
  isOpen,
  initialTab = 'sticker', // 'sticker' | 'gif'
  onClose,
  onSelectMedia,
  customStickerInputRef,
  customGifInputRef
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Sync tab with initialTab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [isOpen, initialTab]);

  /**
   * Fetch from Giphy Search or Trending API
   */
  const fetchGiphyData = useCallback(async (tab, query) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const type = tab === 'sticker' ? 'stickers' : 'gifs';
      const cleanQ = query.trim();
      let url = '';

      if (cleanQ) {
        url = `https://api.giphy.com/v1/${type}/search?api_key=${ACTIVE_GIPHY_KEY}&q=${encodeURIComponent(cleanQ)}&limit=28&rating=g`;
      } else {
        url = `https://api.giphy.com/v1/${type}/trending?api_key=${ACTIVE_GIPHY_KEY}&limit=28&rating=g`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Giphy API error (HTTP ${res.status})`);
      }
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      setItems(list);
    } catch (err) {
      console.error('[Giphy Fetch Error]', err);
      setFetchError(err.message || 'Failed to fetch live media from Giphy');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!isOpen) return;

    const queryToUse = activeCategory !== 'all' && !searchQuery.trim() ? activeCategory : searchQuery;
    const timer = setTimeout(() => {
      fetchGiphyData(activeTab, queryToUse);
    }, 300);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, searchQuery, activeCategory, fetchGiphyData]);

  // Handle Tab Switch
  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    setActiveCategory('all');
  };

  // Handle Category Chip Click
  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      setSearchQuery('');
    } else {
      setSearchQuery(catId);
    }
  };

  // Select Sticker Handler
  const handleSelectSticker = async (item) => {
    try {
      setIsProcessing(true);
      // Giphy sticker webp or gif source
      const stickerUrl =
        item.images?.fixed_height?.webp ||
        item.images?.fixed_height?.url ||
        item.images?.original?.webp ||
        item.images?.original?.url;

      if (!stickerUrl) {
        toast.error('Unable to retrieve sticker URL.');
        return;
      }

      const webpData = await convertImageUrlToWebpSticker(stickerUrl);

      onSelectMedia({
        type: 'sticker',
        data: webpData,
        name: `sticker_${item.id}.webp`,
        size: 'Sticker (512×512 WebP)',
        preview: webpData
      });
      toast.success('Sticker attached!');
      onClose();
    } catch (err) {
      console.error('Sticker selection error:', err);
      toast.error('Failed to prepare sticker.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Select GIF Handler
  const handleSelectGif = async (gif) => {
    try {
      setIsProcessing(true);
      const gifUrl =
        gif.images?.fixed_height?.url ||
        gif.images?.original?.url ||
        gif.images?.downsized_medium?.url;

      if (!gifUrl) {
        toast.error('Unable to retrieve GIF URL.');
        return;
      }

      // Fetch GIF as blob or data URL so it's fully self-contained
      try {
        const res = await fetch(gifUrl);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          onSelectMedia({
            type: 'gif',
            data: reader.result,
            name: `giphy_${gif.id}.gif`,
            size: `${Math.round(blob.size / 1024)} KB`,
            preview: gifUrl
          });
          toast.success('GIF attached!');
          onClose();
        };
        reader.readAsDataURL(blob);
      } catch {
        // Fallback: pass direct media URL
        onSelectMedia({
          type: 'gif',
          data: gifUrl,
          name: `giphy_${gif.id}.gif`,
          size: 'GIF',
          preview: gifUrl
        });
        toast.success('GIF attached!');
        onClose();
      }
    } catch (err) {
      console.error('GIF selection error:', err);
      toast.error('Failed to attach GIF.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const currentChips = activeTab === 'sticker' ? STICKER_QUICK_TAGS : GIF_QUICK_TAGS;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1f2c34] border border-gray-200 dark:border-wa-dbdr rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[82vh]">
        {/* Header with Tabs */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-wa-dbdr/60 flex items-center justify-between bg-slate-50 dark:bg-[#111b21]">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/80 dark:bg-wa-dsurf rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchTab('sticker')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sticker'
                  ? 'bg-white dark:bg-[#202c33] text-pink-600 dark:text-pink-400 shadow-xs'
                  : 'text-gray-600 dark:text-wa-dmuted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <WhatsAppStickerIcon className="w-4 h-4" />
              <span>Stickers</span>
            </button>

            <button
              type="button"
              onClick={() => handleSwitchTab('gif')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'gif'
                  ? 'bg-white dark:bg-[#202c33] text-violet-600 dark:text-violet-400 shadow-xs'
                  : 'text-gray-600 dark:text-wa-dmuted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <WhatsAppGifIcon className="w-4 h-4" />
              <span>GIFs</span>
            </button>
          </div>

          {/* Custom Upload & Close */}
          <div className="flex items-center gap-2">
            {activeTab === 'sticker' ? (
              <button
                type="button"
                onClick={() => customStickerInputRef?.current?.click()}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-wa-teal dark:text-wa-green border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Upload custom PNG or JPG to convert to WebP Sticker"
              >
                <span>📁 Upload Sticker</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => customGifInputRef?.current?.click()}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors flex items-center gap-1 cursor-pointer"
                title="Upload custom GIF file"
              >
                <span>📁 Upload GIF</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-wa-dsurf text-base leading-none transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Search Bar */}
        <div className="p-3 border-b border-gray-100 dark:border-wa-dbdr/40 bg-white dark:bg-[#1f2c34]">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveCategory('all');
              }}
              placeholder={
                activeTab === 'sticker'
                  ? 'Search live Giphy stickers (e.g. namaste, haha, chai, cat)...'
                  : 'Search live Giphy GIFs (e.g. funny, bollywood, dance, cat)...'
              }
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-100 dark:bg-[#111b21] text-gray-800 dark:text-white rounded-xl border border-transparent focus:border-wa-teal dark:focus:border-wa-green focus:outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto custom-scroll pb-1">
            {currentChips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleCategoryClick(chip.id)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  (activeCategory === chip.id && !searchQuery) || searchQuery.toLowerCase() === chip.id
                    ? activeTab === 'sticker'
                      ? 'bg-pink-600 text-white font-semibold shadow-xs'
                      : 'bg-violet-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 dark:bg-wa-dsurf text-gray-600 dark:text-wa-dmuted hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Real-time Giphy Grid */}
        <div className="flex-1 overflow-y-auto p-3 custom-scroll min-h-[300px] relative">
          {isProcessing && (
            <div className="absolute inset-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
              <span className="w-8 h-8 border-3 border-wa-teal dark:border-wa-green border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                Optimizing for WhatsApp Mobile & Web...
              </p>
            </div>
          )}

          {isLoading ? (
            /* Skeleton Loading State */
            <div className={activeTab === 'sticker' ? 'grid grid-cols-3 sm:grid-cols-4 gap-2.5' : 'grid grid-cols-2 sm:grid-cols-3 gap-2.5'}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-wa-dsurf/60 ${
                    activeTab === 'sticker' ? 'h-28' : 'h-32'
                  }`}
                />
              ))}
            </div>
          ) : fetchError ? (
            /* Error State */
            <div className="py-12 text-center text-gray-400 dark:text-wa-dmuted space-y-2">
              <span className="text-3xl block">⚠️</span>
              <p className="text-xs font-semibold text-rose-500">{fetchError}</p>
              <button
                type="button"
                onClick={() => fetchGiphyData(activeTab, searchQuery)}
                className="mt-2 px-3 py-1 text-xs font-semibold text-white bg-wa-teal rounded-lg hover:bg-teal-600 transition-colors"
              >
                Retry Search
              </button>
            </div>
          ) : items.length > 0 ? (
            activeTab === 'sticker' ? (
              /* Real-time Stickers Grid */
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {items.map((item) => {
                  const previewUrl =
                    item.images?.fixed_height_small?.webp ||
                    item.images?.fixed_height_small?.url ||
                    item.images?.fixed_height?.webp ||
                    item.images?.fixed_height?.url;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSticker(item)}
                      className="p-2 flex flex-col items-center justify-center rounded-2xl bg-slate-50/70 dark:bg-wa-dsurf/40 hover:bg-pink-50/60 dark:hover:bg-white/10 border border-slate-200/80 dark:border-wa-dbdr/40 hover:border-pink-300 dark:hover:border-pink-500 hover:scale-105 active:scale-95 transition-all text-center group cursor-pointer aspect-square overflow-hidden"
                      title={item.title || 'WhatsApp Sticker'}
                    >
                      <img
                        src={previewUrl}
                        alt={item.title || 'Sticker'}
                        loading="lazy"
                        className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-110 transition-transform"
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Real-time GIFs Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {items.map((gif) => {
                  const previewUrl =
                    gif.images?.fixed_height?.url ||
                    gif.images?.fixed_height_small?.url ||
                    gif.images?.original?.url;

                  return (
                    <button
                      key={gif.id}
                      type="button"
                      onClick={() => handleSelectGif(gif)}
                      className="relative group rounded-xl overflow-hidden bg-slate-100 dark:bg-wa-dsurf border border-slate-200 dark:border-wa-dbdr/40 hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg transition-all text-left cursor-pointer"
                      title={gif.title}
                    >
                      <div className="w-full h-28 sm:h-32 bg-black/10 dark:bg-black/30 flex items-center justify-center overflow-hidden">
                        <img
                          src={previewUrl}
                          alt={gif.title || 'GIF'}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-1.5 bg-white/95 dark:bg-[#111b21]/95 border-t border-slate-100 dark:border-wa-dbdr/30">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                          {gif.title || 'GIF'}
                        </p>
                      </div>
                      <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-extrabold tracking-wider">
                        GIF
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            /* Empty Results */
            <div className="py-12 text-center text-gray-400 dark:text-wa-dmuted">
              <span className="text-3xl block mb-2">{activeTab === 'sticker' ? '🔍' : '🎞️'}</span>
              <p className="text-xs font-semibold">
                No {activeTab === 'sticker' ? 'stickers' : 'GIFs'} found for "{searchQuery}"
              </p>
              <p className="text-[11px] mt-1">Try another keyword or upload your custom file.</p>
            </div>
          )}
        </div>

        {/* Footer: Powered by GIPHY badge & info */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-wa-dbdr/40 bg-slate-50 dark:bg-[#111b21] flex items-center justify-between text-[11px] text-gray-500 dark:text-wa-dmuted">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-[10px] tracking-wider uppercase text-gray-400 dark:text-gray-500">
              ⚡ Powered by
            </span>
            <span className="font-black text-xs bg-gradient-to-r from-[#00ff99] via-[#00ccff] to-[#9933ff] bg-clip-text text-transparent">
              GIPHY
            </span>
          </div>
          <span className="font-semibold text-wa-teal dark:text-wa-green">
            {items.length > 0 ? `${items.length} live results` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
