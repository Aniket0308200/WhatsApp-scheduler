import React, { useState } from 'react';

/**
 * Phone-Gallery Style Media Modal
 * Displays items in a clean phone-gallery grid with thumbnails,
 * audio player, video playback, per-item deletion, and full zoom preview.
 */
export default function MediaGalleryModal({
  isOpen,
  onClose,
  title = 'Media Gallery',
  category = 'all', // 'image' | 'video' | 'audio' | 'sticker' | 'gif' | 'all'
  items = [],
  onRemoveItem = null,
  onClearCategory = null,
  onAddMore = null,
  readOnly = false,
  mediaPurged = false
}) {
  const [zoomItem, setZoomItem] = useState(null);

  if (!isOpen) return null;

  const categoryIcon = {
    image: '📷',
    video: '🎥',
    audio: '🎵',
    document: '📄',
    sticker: '🏷️',
    gif: '🎞️',
    all: '📁'
  }[category] || '📁';

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-4xl bg-white dark:bg-wa-dpanel rounded-2xl shadow-2xl border border-slate-200 dark:border-wa-dbdr flex flex-col max-h-[90vh] overflow-hidden transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-wa-dbdr flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-wa-dsurf/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {categoryIcon}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-wa-dtext truncate">
                  {title}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                  {items.length} {items.length === 1 ? 'file' : 'files'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-wa-dmuted truncate">
                {readOnly ? 'Scheduled media files overview' : 'Phone Gallery View — tap any item to inspect or remove'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!readOnly && onAddMore && (
              <button
                type="button"
                onClick={onAddMore}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Add More</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-wa-dmuted dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-wa-dsurf transition-colors"
              title="Close Gallery"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Purged Notice (if applicable) ───────────────────────────────── */}
        {mediaPurged && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <span>🛡️</span>
            <span>
              <strong>Storage Auto-Cleaned:</strong> To prevent database bloat, the raw payloads for this sent message were removed after 2 days. The history and file list remain preserved above.
            </span>
          </div>
        )}

        {/* ── Content Grid (Phone Gallery View) ──────────────────────────── */}
        <div className="flex-1 overflow-y-auto custom-scroll p-4 sm:p-5">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400 dark:text-wa-dmuted">
              <span className="text-4xl block mb-2">📂</span>
              <p className="text-sm font-semibold">No media files in this folder.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 min-[460px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3.5">
              {items.map((item, idx) => {
                const itemId = item.id || `media_${idx}`;
                const isImage = item.type === 'image';
                const isVideo = item.type === 'video';
                const isAudio = item.type === 'audio';
                const isDocument = item.type === 'document' || item.type === 'pdf';
                const isSticker = item.type === 'sticker';
                const isGif = item.type === 'gif';

                return (
                  <div
                    key={itemId}
                    className="group relative rounded-xl border border-slate-200/90 dark:border-wa-dbdr bg-slate-50/60 dark:bg-wa-dsurf/40 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Media Thumbnail Container */}
                    <div
                      className="relative w-full h-32 bg-slate-100 dark:bg-black/30 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => (isImage || isSticker || isGif) && setZoomItem(item)}
                    >
                      {/* Image / Sticker / GIF preview */}
                      {(isImage || isSticker || isGif) && (
                        <img
                          src={item.preview || item.data}
                          alt={item.name || 'attachment'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      )}

                      {/* Video preview */}
                      {isVideo && (
                        <div className="relative w-full h-full flex items-center justify-center bg-black/40">
                          {item.data ? (
                            <video
                              src={item.data}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                            />
                          ) : (
                            <span className="text-3xl">🎥</span>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                            <span className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center text-sm shadow-md">
                              ▶
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Audio preview */}
                      {isAudio && (
                        <div className="p-3 text-center flex flex-col items-center justify-center">
                          <span className="text-3xl mb-1">🎵</span>
                          <span className="text-[10px] font-semibold text-slate-600 dark:text-wa-dtext truncate max-w-[120px]">
                            {item.name || 'Audio Track'}
                          </span>
                        </div>
                      )}

                      {/* Document preview */}
                      {isDocument && (
                        <div className="p-3 text-center flex flex-col items-center justify-center">
                          <span className="text-3xl mb-1 text-violet-600 dark:text-violet-400">📄</span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-wa-dtext truncate max-w-[120px]" title={item.name}>
                            {item.name || 'Document'}
                          </span>
                          <span className="text-[9px] text-violet-600 dark:text-violet-400 font-semibold mt-0.5">
                            {item.size || 'Original MB'}
                          </span>
                        </div>
                      )}

                      {/* Type Badge on thumbnail */}
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-xs">
                        {isImage ? '📷' : isVideo ? '🎥' : isAudio ? '🎵' : isDocument ? '📄' : isGif ? '🎞️' : '🏷️'}
                      </span>

                      {/* Per-item Delete Button (in edit mode) */}
                      {!readOnly && onRemoveItem && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveItem(itemId);
                          }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95"
                          title="Remove this item"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Meta info footer */}
                    <div className="p-2 bg-white dark:bg-wa-dpanel border-t border-slate-100 dark:border-wa-dbdr/40">
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-wa-dtext truncate" title={item.name}>
                        {item.name || `Item #${idx + 1}`}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-wa-dmuted mt-0.5 flex items-center justify-between">
                        <span>{item.size || 'Attachment'}</span>
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">#{idx + 1}</span>
                      </p>

                      {/* Audio inline player in gallery */}
                      {isAudio && item.data && (
                        <audio
                          controls
                          src={item.data}
                          className="w-full mt-1.5 h-6 scale-90 -ml-1"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-wa-dbdr flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-wa-dsurf/30">
          <div>
            {!readOnly && onClearCategory && items.length > 0 && (
              <button
                type="button"
                onClick={onClearCategory}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
              >
                Remove all in this folder
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-wa-green hover:bg-wa-teal text-white shadow-xs active:scale-98 transition-all"
          >
            ✓ Done
          </button>
        </div>
      </div>

      {/* ── Fullscreen Zoom Viewer for Images & Stickers ─────────────────── */}
      {zoomItem && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setZoomItem(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setZoomItem(null)}
              className="absolute -top-10 right-0 text-white text-lg font-bold hover:text-emerald-400"
            >
              ✕ Close
            </button>
            <img
              src={zoomItem.preview || zoomItem.data}
              alt={zoomItem.name}
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
            />
            <p className="text-white text-xs mt-2 font-medium">{zoomItem.name}</p>
          </div>
        </div>
      )}
    </div>
  );
}

