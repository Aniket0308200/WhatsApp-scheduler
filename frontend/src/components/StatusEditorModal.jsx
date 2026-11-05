import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

// WhatsApp Palette for Text & Doodle
const COLOR_PALETTE = [
  '#FFFFFF', // White
  '#25D366', // WhatsApp Green
  '#34B7F1', // WhatsApp Sky Blue
  '#FFD700', // Gold/Yellow
  '#FF3B30', // Red
  '#FF2D55', // Pink
  '#AF52DE', // Purple
  '#FF9500', // Orange
  '#000000', // Black
];

const POPULAR_EMOJIS = ['❤️', '🔥', '😂', '🎉', '👏', '😍', '✨', '💯', '🙏', '🎂', '👍', '🥳', '🌟', '😎', '🏖️', '🥂'];

export default function StatusEditorModal({ isOpen, onClose, onSave, initialData }) {
  // Media State
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [mediaSrc, setMediaSrc] = useState(null); // base64 or object URL
  const [mediaFile, setMediaFile] = useState(null);
  const [caption, setCaption] = useState('');

  // Editor Mode & Tools
  const [activeTool, setActiveTool] = useState(null); // 'draw' | 'text' | 'sticker' | 'rotate' | null
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

  // Drawing / Doodle State
  const [drawColor, setDrawColor] = useState('#25D366');
  const [brushSize, setBrushSize] = useState(4);
  const [drawings, setDrawings] = useState([]); // array of strokes: { color, size, points: [{x, y}] }
  const [isDrawing, setIsDrawing] = useState(false);

  // Text Overlays State
  const [textElements, setTextElements] = useState([]); // { id, text, color, hasBg, x, y }
  const [editingTextId, setEditingTextId] = useState(null);
  const [newTextInput, setNewTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textHasBg, setTextHasBg] = useState(true);

  // Stickers / Emojis State
  const [stickers, setStickers] = useState([]); // { id, emoji, x, y, size }
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Video State
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);

  // Dragging State
  const [draggingItem, setDraggingItem] = useState(null); // { type: 'text'|'sticker', id, startX, startY, origX, origY }

  // Refs
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const videoRef = useRef(null);

  // Load initial data if editing
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setMediaType(initialData.type || 'image');
        setMediaSrc(initialData.data || initialData.preview || null);
        setCaption(initialData.caption || '');
        setTrimStart(initialData.trimStart || 0);
        setTrimEnd(initialData.trimEnd || 30);
      } else {
        setMediaType('image');
        setMediaSrc(null);
        setMediaFile(null);
        setCaption('');
        setDrawings([]);
        setTextElements([]);
        setStickers([]);
        setRotation(0);
        setTrimStart(0);
        setTrimEnd(30);
      }
      setActiveTool(null);
      setShowEmojiPicker(false);
    }
  }, [isOpen, initialData]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      toast.error('Please select an image or video file.');
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setDrawings([]);
    setTextElements([]);
    setStickers([]);
    setRotation(0);

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Video metadata loaded
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = Math.round(videoRef.current.duration) || 30;
      setVideoDuration(dur);
      setTrimStart(0);
      setTrimEnd(Math.min(dur, 30)); // WhatsApp status max 30s
    }
  };

  // Rotate image
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    toast.success('Rotated 90°');
  };

  // ─── Drawing Canvas Handlers ────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawings.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [drawings]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStartDraw = (e) => {
    if (activeTool !== 'draw') return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setDrawings((prev) => [
      ...prev,
      { color: drawColor, size: brushSize, points: [coords] },
    ]);
  };

  const handleDrawMove = (e) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const coords = getCanvasCoords(e);
    setDrawings((prev) => {
      if (!prev.length) return prev;
      const updated = [...prev];
      const lastStroke = { ...updated[updated.length - 1] };
      lastStroke.points = [...lastStroke.points, coords];
      updated[updated.length - 1] = lastStroke;
      return updated;
    });
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const handleUndoDraw = () => {
    setDrawings((prev) => prev.slice(0, -1));
  };

  // ─── Text Overlay Handlers ──────────────────────────────────────────────────
  const handleAddText = () => {
    if (!newTextInput.trim()) {
      setActiveTool(null);
      return;
    }
    const newEl = {
      id: Date.now().toString(),
      text: newTextInput.trim(),
      color: textColor,
      hasBg: textHasBg,
      x: 50, // % from left
      y: 40 + textElements.length * 8, // % from top
    };
    setTextElements((prev) => [...prev, newEl]);
    setNewTextInput('');
    setActiveTool(null);
  };

  const handleDeleteText = (id) => {
    setTextElements((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── Sticker / Emoji Handlers ───────────────────────────────────────────────
  const handleAddSticker = (emoji) => {
    const newSticker = {
      id: Date.now().toString(),
      emoji,
      x: 40 + (stickers.length % 3) * 15,
      y: 50,
      size: 48,
    };
    setStickers((prev) => [...prev, newSticker]);
    setShowEmojiPicker(false);
    setActiveTool(null);
  };

  const handleDeleteSticker = (id) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // ─── Drag & Drop for Text & Stickers ───────────────────────────────────────
  const handleDragStart = (e, type, id, currentX, currentY) => {
    if (activeTool === 'draw') return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDraggingItem({
      type,
      id,
      startX: clientX,
      startY: clientY,
      origX: currentX,
      origY: currentY,
    });
  };

  const handleDragMove = (e) => {
    if (!draggingItem || !viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = ((clientX - draggingItem.startX) / rect.width) * 100;
    const deltaY = ((clientY - draggingItem.startY) / rect.height) * 100;

    const newX = Math.max(5, Math.min(95, draggingItem.origX + deltaX));
    const newY = Math.max(5, Math.min(95, draggingItem.origY + deltaY));

    if (draggingItem.type === 'text') {
      setTextElements((prev) =>
        prev.map((t) => (t.id === draggingItem.id ? { ...t, x: newX, y: newY } : t))
      );
    } else if (draggingItem.type === 'sticker') {
      setStickers((prev) =>
        prev.map((s) => (s.id === draggingItem.id ? { ...s, x: newX, y: newY } : s))
      );
    }
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
  };

  // ─── Bake Canvas & Finalize Status ──────────────────────────────────────────
  const handleDone = async () => {
    if (!mediaSrc) {
      toast.error('Please select a photo or video for your status.');
      return;
    }

    // 1. If Video Status
    if (mediaType === 'video') {
      onSave({
        type: 'video',
        data: mediaSrc,
        caption: caption.trim(),
        preview: null,
        isStatus: true,
        trimStart,
        trimEnd,
        duration: trimEnd - trimStart,
      });
      onClose();
      return;
    }

    // 2. If Image Status: Bake 9:16 phone view with black bars & overlays
    try {
      const toastId = toast.loading('Preparing WhatsApp Status...');
      const targetWidth = 1080;
      const targetHeight = 1920; // Exact 9:16 vertical resolution

      const bakeCanvas = document.createElement('canvas');
      bakeCanvas.width = targetWidth;
      bakeCanvas.height = targetHeight;
      const ctx = bakeCanvas.getContext('2d');

      // 1. Fill entire canvas with solid black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 2. Load the base image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // 3. Draw image centered with letterboxing and rotation
      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);

      const isRotated90 = rotation === 90 || rotation === 270;
      const srcW = isRotated90 ? img.height : img.width;
      const srcH = isRotated90 ? img.width : img.height;

      // Scale to fit inside 9:16 without distortion
      const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
      const drawW = img.width * scale;
      const drawH = img.height * scale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // 4. Draw freehand doodle strokes (scaled to 1080x1920)
      if (drawings.length > 0 && canvasRef.current) {
        const drawScaleX = targetWidth / canvasRef.current.width;
        const drawScaleY = targetHeight / canvasRef.current.height;

        drawings.forEach((stroke) => {
          if (stroke.points.length < 2) return;
          ctx.beginPath();
          ctx.strokeStyle = stroke.color;
          ctx.lineWidth = stroke.size * drawScaleX;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.moveTo(stroke.points[0].x * drawScaleX, stroke.points[0].y * drawScaleY);
          for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x * drawScaleX, stroke.points[i].y * drawScaleY);
          }
          ctx.stroke();
        });
      }

      // 5. Draw Stickers / Emojis
      stickers.forEach((s) => {
        const posX = (s.x / 100) * targetWidth;
        const posY = (s.y / 100) * targetHeight;
        const fontPx = Math.round(s.size * 2.5);
        ctx.font = `${fontPx}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.emoji, posX, posY);
      });

      // 6. Draw Text Overlays with styling & pill backgrounds
      textElements.forEach((t) => {
        const posX = (t.x / 100) * targetWidth;
        const posY = (t.y / 100) * targetHeight;
        const fontPx = 54;
        ctx.font = `bold ${fontPx}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(t.text);
        const textW = metrics.width;
        const padX = 28;
        const padY = 16;
        const pillH = fontPx + padY * 2;
        const pillW = textW + padX * 2;

        if (t.hasBg) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.beginPath();
          ctx.roundRect(posX - pillW / 2, posY - pillH / 2, pillW, pillH, 20);
          ctx.fill();
        }

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, posX, posY);
      });

      // 7. Export high-quality JPEG
      const bakedDataUri = bakeCanvas.toDataURL('image/jpeg', 0.92);
      toast.dismiss(toastId);

      onSave({
        type: 'image',
        data: bakedDataUri,
        caption: caption.trim(),
        preview: bakedDataUri,
        isStatus: true,
      });
      onClose();
    } catch (err) {
      console.error('Failed to bake status image:', err);
      toast.error('Failed to prepare status: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full h-full max-w-md mx-auto flex flex-col justify-between overflow-hidden">
        
        {/* ── TOP HEADER / TOOLBAR ────────────────────────────────────────── */}
        <div className="relative z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white">
          {/* Discard / Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Discard Status"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Action Tools (Visible when media is loaded) */}
          {mediaSrc && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Rotate Button (Photos only) */}
              {mediaType === 'image' && (
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  title="Rotate 90°"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              )}

              {/* Emoji / Sticker Button */}
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker((p) => !p);
                  setActiveTool(null);
                }}
                className={`p-2 rounded-full transition-colors ${
                  showEmojiPicker ? 'bg-wa-teal text-white' : 'hover:bg-white/20'
                }`}
                title="Add Sticker / Emoji"
              >
                <span className="text-xl leading-none">😊</span>
              </button>

              {/* Text Tool Button */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool(activeTool === 'text' ? null : 'text');
                  setShowEmojiPicker(false);
                }}
                className={`p-2 rounded-full transition-colors ${
                  activeTool === 'text' ? 'bg-wa-teal text-white' : 'hover:bg-white/20'
                }`}
                title="Add Text"
              >
                <span className="font-extrabold text-lg leading-none font-serif">T</span>
              </button>

              {/* Doodle / Pen Tool Button (Photos only) */}
              {mediaType === 'image' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool(activeTool === 'draw' ? null : 'draw');
                    setShowEmojiPicker(false);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    activeTool === 'draw' ? 'bg-wa-teal text-white' : 'hover:bg-white/20'
                  }`}
                  title="Doodle / Draw"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}

              {/* Change Media Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Change Photo/Video"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── TOOL SUB-BARS (Drawing palette or Text Creator) ─────────────── */}
        {/* Draw Sub-bar */}
        {activeTool === 'draw' && (
          <div className="relative z-30 px-4 py-2 bg-black/80 flex items-center justify-between gap-2 animate-fade-in border-b border-white/10">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scroll">
              {COLOR_PALETTE.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setDrawColor(col)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    drawColor === col ? 'scale-125 border-white ring-2 ring-wa-teal' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleUndoDraw}
              className="text-xs text-white/90 hover:text-white px-2 py-1 rounded bg-white/20 shrink-0"
              title="Undo stroke"
            >
              ↩ Undo
            </button>
          </div>
        )}

        {/* Text Creator Modal Popup */}
        {activeTool === 'text' && (
          <div className="absolute inset-x-4 top-16 z-40 p-4 bg-black/90 border border-white/20 rounded-2xl shadow-2xl animate-scale-in">
            <input
              type="text"
              autoFocus
              value={newTextInput}
              onChange={(e) => setNewTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
              placeholder="Type your status text..."
              className="w-full text-center text-lg font-bold text-white bg-transparent border-b-2 border-wa-teal focus:outline-none py-2"
            />
            <div className="flex items-center justify-between mt-3 gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTextColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${
                      textColor === c ? 'scale-125 border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setTextHasBg((p) => !p)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  textHasBg ? 'bg-white text-black' : 'bg-white/20 text-white'
                }`}
              >
                Pill
              </button>
            </div>
            <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="text-xs text-white/70 hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddText}
                className="text-xs font-bold bg-wa-teal text-white px-4 py-1.5 rounded-lg"
              >
                Add Text
              </button>
            </div>
          </div>
        )}

        {/* Quick Emoji Bar Popup */}
        {showEmojiPicker && (
          <div className="absolute inset-x-4 top-16 z-40 p-3 bg-black/90 border border-white/20 rounded-2xl shadow-2xl animate-scale-in">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-2">Tap to place on status</p>
            <div className="grid grid-cols-8 gap-2 text-2xl text-center">
              {POPULAR_EMOJIS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => handleAddSticker(em)}
                  className="hover:scale-125 transition-transform p-1"
                >
                  {em}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── 9:16 PHONE VIEWPORT CANVAS ──────────────────────────────────── */}
        <div
          ref={viewportRef}
          onMouseMove={handleDragMove}
          onTouchMove={handleDragMove}
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '9/16' }}
        >
          {/* Empty State / File Uploader */}
          {!mediaSrc ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white/70">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl mb-4 border border-white/20 animate-pulse">
                📱
              </div>
              <h3 className="text-base font-bold text-white mb-1">Create WhatsApp Status</h3>
              <p className="text-xs text-white/60 mb-6 max-w-xs">
                Post an automated 24-hour Status / Story to all your contacts.
              </p>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 rounded-full bg-wa-green hover:bg-wa-teal text-white font-bold text-sm shadow-xl flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Select Photo or Video</span>
              </button>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              {/* Image Base Layer (Center Letterbox) */}
              {mediaType === 'image' && (
                <img
                  src={mediaSrc}
                  alt="Status Preview"
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              )}

              {/* Video Base Layer */}
              {mediaType === 'video' && (
                <video
                  ref={videoRef}
                  src={mediaSrc}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  className="max-w-full max-h-full object-contain"
                  playsInline
                  autoPlay
                  loop
                  muted
                />
              )}

              {/* Drawing Layer (HTML5 Canvas Overlay) */}
              {mediaType === 'image' && (
                <canvas
                  ref={canvasRef}
                  width={360}
                  height={640}
                  onMouseDown={handleStartDraw}
                  onMouseMove={handleDrawMove}
                  onMouseUp={handleEndDraw}
                  onTouchStart={handleStartDraw}
                  onTouchMove={handleDrawMove}
                  onTouchEnd={handleEndDraw}
                  className={`absolute inset-0 w-full h-full ${
                    activeTool === 'draw' ? 'cursor-crosshair z-20 pointer-events-auto' : 'pointer-events-none z-10'
                  }`}
                />
              )}

              {/* Draggable Text Overlays */}
              {textElements.map((t) => (
                <div
                  key={t.id}
                  onMouseDown={(e) => handleDragStart(e, 'text', t.id, t.x, t.y)}
                  onTouchStart={(e) => handleDragStart(e, 'text', t.id, t.x, t.y)}
                  className="absolute z-20 cursor-move group select-none"
                  style={{
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className={`px-3 py-1.5 rounded-xl font-bold text-center text-sm sm:text-base ${
                      t.hasBg ? 'bg-black/75 shadow-lg' : ''
                    }`}
                    style={{ color: t.color }}
                  >
                    {t.text}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteText(t.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Draggable Stickers / Emojis */}
              {stickers.map((s) => (
                <div
                  key={s.id}
                  onMouseDown={(e) => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
                  onTouchStart={(e) => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
                  className="absolute z-20 cursor-move group select-none leading-none"
                  style={{
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: `${s.size}px`,
                  }}
                >
                  <span>{s.emoji}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSticker(s.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold leading-none"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── VIDEO TRIMMER BAR (When video is loaded) ────────────────────── */}
        {mediaType === 'video' && mediaSrc && videoDuration > 0 && (
          <div className="relative z-30 px-4 py-2 bg-black/90 border-t border-white/10 text-white text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold">✂️ Video Trim (max 30s)</span>
              <span className="text-white/70">
                {trimStart}s - {trimEnd}s ({trimEnd - trimStart}s)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={Math.max(0, videoDuration - 1)}
                value={trimStart}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTrimStart(val);
                  setTrimEnd(Math.min(videoDuration, val + 30));
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-wa-teal"
              />
            </div>
          </div>
        )}

        {/* ── BOTTOM CAPTION & SEND BAR ───────────────────────────────────── */}
        <div className="relative z-30 p-3 sm:p-4 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-2.5">
          {/* Audience Pill */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-semibold backdrop-blur-sm">
              <span>🔒 Status (Contacts)</span>
            </div>
            {mediaSrc && (
              <p className="text-[11px] text-white/60">
                {mediaType === 'image' ? '9:16 Photo Story' : '30s Video Story'}
              </p>
            )}
          </div>

          {/* Caption Input & Green Done/Send Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-white text-sm focus-within:border-wa-teal focus-within:bg-black/60 transition-all">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
              />
            </div>

            {/* Done / Schedule Status Button */}
            <button
              type="button"
              onClick={handleDone}
              disabled={!mediaSrc}
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-xl transition-all ${
                mediaSrc
                  ? 'bg-wa-teal hover:bg-teal-600 text-white cursor-pointer active:scale-95 shadow-wa-teal/50'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
              title="Done & Set Status"
            >
              <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden File Input for Picking Photo/Video */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
