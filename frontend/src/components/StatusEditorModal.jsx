import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';

// ─── Giphy API Key ───────────────────────────────────────────────────────────
const ENV_GIPHY_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.REACT_APP_GIPHY_API_KEY || import.meta.env.VITE_GIPHY_API_KEY)) ||
  (typeof process !== 'undefined' && process.env && (process.env.REACT_APP_GIPHY_API_KEY || process.env.VITE_GIPHY_API_KEY)) ||
  '';
const ACTIVE_GIPHY_KEY = ENV_GIPHY_KEY.trim() || 'Zf8by2lWLWfdCtoo2008F6jWTarkTdKq';

// ─── Color Palettes ──────────────────────────────────────────────────────────
const COLOR_PALETTE = [
  '#FFFFFF', // White
  '#25D366', // WhatsApp Green
  '#34B7F1', // Sky Blue
  '#FFD700', // Gold / Yellow
  '#FF3B30', // Red
  '#FF2D55', // Pink
  '#AF52DE', // Purple
  '#FF9500', // Orange
  '#000000', // Black
];

// ─── 10 Distinct WhatsApp Status Fonts ───────────────────────────────────────
const STATUS_FONTS = [
  { id: 'sans', name: 'Sans', family: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { id: 'serif', name: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { id: 'handwriting', name: 'Handwrite', family: '"Brush Script MT", "Caveat", cursive' },
  { id: 'impact', name: 'Impact', family: 'Impact, Charcoal, sans-serif' },
  { id: 'monospace', name: 'Mono', family: '"Courier New", Courier, monospace' },
  { id: 'comic', name: 'Comic', family: '"Comic Sans MS", "Chalkboard SE", cursive' },
  { id: 'neon', name: 'Neon', family: '"Trebuchet MS", "Lucida Grande", sans-serif' },
  { id: 'condensed', name: 'Condensed', family: '"Arial Narrow", "Helvetica Condensed", sans-serif' },
  { id: 'retro', name: 'Retro', family: 'Rockwell, "Courier Bold", serif' },
  { id: 'artistic', name: 'Artistic', family: '"Lucida Handwriting", "Apple Chancery", cursive' },
];

// ─── 6 Gradient Presets for Text Background ─────────────────────────────────
const GRADIENT_PRESETS = [
  { id: 'sunset', name: 'Sunset', css: 'linear-gradient(135deg, #FF512F, #DD2476)', colors: ['#FF512F', '#DD2476'] },
  { id: 'ocean', name: 'Ocean', css: 'linear-gradient(135deg, #00c6ff, #0072ff)', colors: ['#00c6ff', '#0072ff'] },
  { id: 'emerald', name: 'Emerald', css: 'linear-gradient(135deg, #11998e, #38ef7d)', colors: ['#11998e', '#38ef7d'] },
  { id: 'violet', name: 'Violet', css: 'linear-gradient(135deg, #8A2387, #E94057)', colors: ['#8A2387', '#E94057'] },
  { id: 'gold', name: 'Gold', css: 'linear-gradient(135deg, #f7971e, #ffd200)', colors: ['#f7971e', '#ffd200'] },
  { id: 'cyber', name: 'Dark', css: 'linear-gradient(135deg, #232526, #414345)', colors: ['#232526', '#414345'] },
];

// ─── Aspect Ratio Presets for Cropping ───────────────────────────────────────
const ASPECT_RATIOS = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '4:5', label: '4:5 Portrait', ratio: 4 / 5 },
  { id: '16:9', label: '16:9 Wide', ratio: 16 / 9 },
  { id: '3:4', label: '3:4 Photo', ratio: 3 / 4 },
];

export default function StatusEditorModal({ isOpen, onClose, onSave, initialData }) {
  // Media State
  const [mediaType, setMediaType] = useState('image'); // 'image' | 'video'
  const [mediaSrc, setMediaSrc] = useState(null);
  const [originalMediaSrc, setOriginalMediaSrc] = useState(null); // preserved for crop reset
  const [mediaFile, setMediaFile] = useState(null);
  const [caption, setCaption] = useState('');

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState(null); // 'draw' | 'text' | 'sticker' | 'crop' | null

  // Crop & Transform State
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isFlippedH, setIsFlippedH] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState('free');
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 }); // in percentages (0-100)

  // Drawing / Doodle State
  const [drawColor, setDrawColor] = useState('#25D366');
  const [brushSize, setBrushSize] = useState(4);
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Advanced Text Overlays State
  const [textElements, setTextElements] = useState([]); // { id, text, color, bgMode, bgColor, bgGradient, fontId, x, y }
  const [newTextInput, setNewTextInput] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textBgMode, setTextBgMode] = useState('solid'); // 'none' | 'solid' | 'gradient'
  const [textBgColor, setTextBgColor] = useState('#000000');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0]);
  const [selectedFont, setSelectedFont] = useState(STATUS_FONTS[0]);

  // Stickers / Emojis / GIFs Library State
  const [stickers, setStickers] = useState([]); // { id, type: 'emoji'|'image', content, x, y, size }
  const [stickerTab, setStickerTab] = useState('emoji'); // 'emoji' | 'sticker' | 'gif'
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyItems, setGiphyItems] = useState([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);

  // Video State & Dual-Handle Trimmer
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);

  // Dragging State
  const [draggingItem, setDraggingItem] = useState(null); // { type, id, startX, startY, origX, origY }

  // Refs
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const videoRef = useRef(null);
  const cropImageRef = useRef(null);

  // Initialize data
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setMediaType(initialData.type || 'image');
        setMediaSrc(initialData.data || initialData.preview || null);
        setOriginalMediaSrc(initialData.data || initialData.preview || null);
        setCaption(initialData.caption || '');
        setTrimStart(initialData.trimStart || 0);
        setTrimEnd(initialData.trimEnd || 30);
      } else {
        setMediaType('image');
        setMediaSrc(null);
        setOriginalMediaSrc(null);
        setMediaFile(null);
        setCaption('');
        setDrawings([]);
        setTextElements([]);
        setStickers([]);
        setRotation(0);
        setIsFlippedH(false);
        setTrimStart(0);
        setTrimEnd(30);
      }
      setActiveTool(null);
      setGiphySearch('');
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
    setIsFlippedH(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaSrc(event.target.result);
      setOriginalMediaSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Video metadata & auto-loop trim
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = Math.round(videoRef.current.duration) || 30;
      setVideoDuration(dur);
      setTrimStart(0);
      setTrimEnd(Math.min(dur, 30));
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  // Dual Trimmer adjustments
  const handleTrimStartChange = (val) => {
    const newStart = Math.max(0, Math.min(val, trimEnd - 1));
    setTrimStart(newStart);
    if (trimEnd - newStart > 30) {
      setTrimEnd(newStart + 30);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = newStart;
    }
  };

  const handleTrimEndChange = (val) => {
    const newEnd = Math.max(trimStart + 1, Math.min(val, videoDuration));
    if (newEnd - trimStart > 30) {
      setTrimStart(Math.max(0, newEnd - 30));
    }
    setTrimEnd(newEnd);
    if (videoRef.current) {
      videoRef.current.currentTime = newEnd;
    }
  };

  // ─── Giphy Live Search for Stickers & GIFs ──────────────────────────────────
  const fetchGiphyMedia = useCallback(async (tab, query) => {
    if (tab === 'emoji') return;
    setIsGiphyLoading(true);
    try {
      const endpoint = tab === 'sticker' ? 'stickers' : 'gifs';
      const cleanQ = query.trim();
      const url = cleanQ
        ? `https://api.giphy.com/v1/${endpoint}/search?api_key=${ACTIVE_GIPHY_KEY}&q=${encodeURIComponent(cleanQ)}&limit=24&rating=g`
        : `https://api.giphy.com/v1/${endpoint}/trending?api_key=${ACTIVE_GIPHY_KEY}&limit=24&rating=g`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch from Giphy');
      const data = await res.json();
      setGiphyItems(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.warn('Giphy fetch warning:', err);
      setGiphyItems([]);
    } finally {
      setIsGiphyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTool === 'sticker' && (stickerTab === 'sticker' || stickerTab === 'gif')) {
      const timer = setTimeout(() => {
        fetchGiphyMedia(stickerTab, giphySearch);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [activeTool, stickerTab, giphySearch, fetchGiphyMedia]);

  // ─── Crop & Rotate Functions ───────────────────────────────────────────────
  const handleRotate90 = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlipHorizontal = () => {
    setIsFlippedH((prev) => !prev);
  };

  const handleRatioSelect = (ratioItem) => {
    setSelectedRatio(ratioItem.id);
    if (!ratioItem.ratio) {
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
      return;
    }

    // Adapt crop box to selected aspect ratio inside 100x100 space
    const targetAspect = ratioItem.ratio; // width / height
    let w = 85;
    let h = w / targetAspect;
    if (h > 85) {
      h = 85;
      w = h * targetAspect;
    }
    const x = Math.max(0, (100 - w) / 2);
    const y = Math.max(0, (100 - h) / 2);
    setCropBox({ x, y, width: w, height: h });
  };

  const handleApplyCrop = async () => {
    if (!mediaSrc) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Calculate pixel crop region
      const cropPixelX = (cropBox.x / 100) * img.width;
      const cropPixelY = (cropBox.y / 100) * img.height;
      const cropPixelW = (cropBox.width / 100) * img.width;
      const cropPixelH = (cropBox.height / 100) * img.height;

      const cropCanvas = document.createElement('canvas');
      const isRotated90 = rotation === 90 || rotation === 270;
      cropCanvas.width = isRotated90 ? cropPixelH : cropPixelW;
      cropCanvas.height = isRotated90 ? cropPixelW : cropPixelH;
      const ctx = cropCanvas.getContext('2d');

      ctx.save();
      ctx.translate(cropCanvas.width / 2, cropCanvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (isFlippedH) ctx.scale(-1, 1);

      ctx.drawImage(
        img,
        cropPixelX,
        cropPixelY,
        cropPixelW,
        cropPixelH,
        -cropPixelW / 2,
        -cropPixelH / 2,
        cropPixelW,
        cropPixelH
      );
      ctx.restore();

      const croppedUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
      setMediaSrc(croppedUrl);
      setRotation(0);
      setIsFlippedH(false);
      setActiveTool(null);
      toast.success('Crop applied!');
    } catch (err) {
      console.error('Failed to crop image:', err);
      toast.error('Crop failed: ' + err.message);
    }
  };

  const handleResetCrop = () => {
    if (originalMediaSrc) {
      setMediaSrc(originalMediaSrc);
      setRotation(0);
      setIsFlippedH(false);
      setSelectedRatio('free');
      setCropBox({ x: 10, y: 10, width: 80, height: 80 });
      toast.success('Reverted to original photo');
    }
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

  // ─── Advanced Text Handlers ─────────────────────────────────────────────────
  const handleAddText = () => {
    if (!newTextInput.trim()) {
      setActiveTool(null);
      return;
    }
    const newEl = {
      id: Date.now().toString(),
      text: newTextInput.trim(),
      color: textColor,
      bgMode: textBgMode,
      bgColor: textBgColor,
      bgGradient: selectedGradient,
      font: selectedFont,
      x: 50,
      y: 45 + (textElements.length % 4) * 8,
    };
    setTextElements((prev) => [...prev, newEl]);
    setNewTextInput('');
    setActiveTool(null);
  };

  const handleDeleteText = (id) => {
    setTextElements((prev) => prev.filter((t) => t.id !== id));
  };

  // ─── Sticker / Emoji / GIF Handlers ─────────────────────────────────────────
  const handleAddEmoji = (emojiData) => {
    const emoji = emojiData?.emoji || emojiData;
    const newSticker = {
      id: Date.now().toString(),
      type: 'emoji',
      content: emoji,
      x: 45 + (stickers.length % 3) * 10,
      y: 50,
      size: 48,
    };
    setStickers((prev) => [...prev, newSticker]);
    setActiveTool(null);
  };

  const handleAddGiphyMedia = (item) => {
    const imgUrl = item.images?.fixed_height?.url || item.images?.original?.url;
    if (!imgUrl) return;
    const newSticker = {
      id: Date.now().toString(),
      type: 'image',
      content: imgUrl,
      x: 45 + (stickers.length % 3) * 10,
      y: 50,
      size: 80,
    };
    setStickers((prev) => [...prev, newSticker]);
    setActiveTool(null);
  };

  const handleDeleteSticker = (id) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  // ─── Drag Overlays ──────────────────────────────────────────────────────────
  const handleDragStart = (e, type, id, currentX, currentY) => {
    if (activeTool === 'draw' || activeTool === 'crop') return;
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

  // ─── Final Bake & Save Status ───────────────────────────────────────────────
  const handleDone = async () => {
    if (!mediaSrc) {
      toast.error('Please select a photo or video for your status.');
      return;
    }

    // Video Status
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

    // Image Status: Bake 9:16 Canvas with Letterboxing & All Overlays
    try {
      const toastId = toast.loading('Preparing WhatsApp Status...');
      const targetWidth = 1080;
      const targetHeight = 1920;

      const bakeCanvas = document.createElement('canvas');
      bakeCanvas.width = targetWidth;
      bakeCanvas.height = targetHeight;
      const ctx = bakeCanvas.getContext('2d');

      // 1. Solid Black Letterbox
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // 2. Base Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = mediaSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      ctx.save();
      ctx.translate(targetWidth / 2, targetHeight / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (isFlippedH) ctx.scale(-1, 1);

      const isRotated90 = rotation === 90 || rotation === 270;
      const srcW = isRotated90 ? img.height : img.width;
      const srcH = isRotated90 ? img.width : img.height;
      const scale = Math.min(targetWidth / srcW, targetHeight / srcH);
      const drawW = img.width * scale;
      const drawH = img.height * scale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      // 3. Freehand Drawings
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

      // 4. Stickers & GIFs
      for (const s of stickers) {
        const posX = (s.x / 100) * targetWidth;
        const posY = (s.y / 100) * targetHeight;

        if (s.type === 'emoji') {
          const fontPx = Math.round(s.size * 2.4);
          ctx.font = `${fontPx}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(s.content, posX, posY);
        } else if (s.type === 'image') {
          try {
            const stickerImg = new Image();
            stickerImg.crossOrigin = 'anonymous';
            stickerImg.src = s.content;
            await new Promise((res, rej) => {
              stickerImg.onload = res;
              stickerImg.onerror = rej;
            });
            const renderSize = s.size * 2.8;
            ctx.drawImage(stickerImg, posX - renderSize / 2, posY - renderSize / 2, renderSize, renderSize);
          } catch {
            // Ignore corrupted sticker load
          }
        }
      }

      // 5. Text Overlays with 10 Fonts & Gradients
      textElements.forEach((t) => {
        const posX = (t.x / 100) * targetWidth;
        const posY = (t.y / 100) * targetHeight;
        const fontPx = 56;
        const fontFamily = t.font?.family || 'sans-serif';

        ctx.font = `bold ${fontPx}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(t.text);
        const textW = metrics.width;
        const padX = 32;
        const padY = 20;
        const pillH = fontPx + padY * 2;
        const pillW = textW + padX * 2;
        const rectX = posX - pillW / 2;
        const rectY = posY - pillH / 2;

        // Draw Background
        if (t.bgMode === 'solid') {
          ctx.fillStyle = t.bgColor || '#000000';
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, pillW, pillH, 22);
          ctx.fill();
        } else if (t.bgMode === 'gradient') {
          const grad = ctx.createLinearGradient(rectX, rectY, rectX + pillW, rectY + pillH);
          const colors = t.bgGradient?.colors || ['#FF512F', '#DD2476'];
          grad.addColorStop(0, colors[0]);
          grad.addColorStop(1, colors[1]);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, pillW, pillH, 22);
          ctx.fill();
        }

        ctx.fillStyle = t.color;
        ctx.fillText(t.text, posX, posY);
      });

      const bakedDataUri = bakeCanvas.toDataURL('image/jpeg', 0.94);
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
      console.error('Failed to bake status:', err);
      toast.error('Failed to prepare status: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-2 sm:p-4 animate-fade-in select-none">
      
      {/* ── PHONE SHELL CONTAINER ────────────────────────────────────────── */}
      <div className="relative w-full max-w-[390px] h-[92vh] max-h-[820px] bg-neutral-950 rounded-[32px] border border-white/20 shadow-2xl overflow-hidden flex flex-col justify-between ring-1 ring-white/10">
        
        {/* ── TOP HEADER / TOOLBAR ────────────────────────────────────────── */}
        <div className="relative z-30 flex items-center justify-between px-3.5 py-3 bg-gradient-to-b from-black/90 via-black/50 to-transparent text-white">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Discard Status"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {mediaSrc && (
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Crop & Rotate Tool Button (Photos only) */}
              {mediaType === 'image' && (
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'crop' ? null : 'crop')}
                  className={`p-2 rounded-full transition-colors ${
                    activeTool === 'crop' ? 'bg-wa-teal text-white' : 'hover:bg-white/20 text-white'
                  }`}
                  title="Crop & Rotate"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </button>
              )}

              {/* Emoji / Sticker / GIF Button */}
              <button
                type="button"
                onClick={() => setActiveTool(activeTool === 'sticker' ? null : 'sticker')}
                className={`p-2 rounded-full transition-colors ${
                  activeTool === 'sticker' ? 'bg-wa-teal text-white' : 'hover:bg-white/20 text-white'
                }`}
                title="Stickers, Emojis & GIFs"
              >
                <span className="text-xl leading-none">😊</span>
              </button>

              {/* Advanced Text Tool Button */}
              <button
                type="button"
                onClick={() => setActiveTool(activeTool === 'text' ? null : 'text')}
                className={`p-2 rounded-full transition-colors ${
                  activeTool === 'text' ? 'bg-wa-teal text-white' : 'hover:bg-white/20 text-white'
                }`}
                title="Add Text"
              >
                <span className="font-extrabold text-lg leading-none font-serif">T</span>
              </button>

              {/* Doodle / Pen Tool Button (Photos only) */}
              {mediaType === 'image' && (
                <button
                  type="button"
                  onClick={() => setActiveTool(activeTool === 'draw' ? null : 'draw')}
                  className={`p-2 rounded-full transition-colors ${
                    activeTool === 'draw' ? 'bg-wa-teal text-white' : 'hover:bg-white/20 text-white'
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
                className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
                title="Change Photo/Video"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── TOOL SUB-PANELS ─────────────────────────────────────────────── */}
        
        {/* 1. DRAW SUB-BAR */}
        {activeTool === 'draw' && (
          <div className="relative z-30 px-3 py-2 bg-neutral-900/95 border-b border-white/10 flex items-center justify-between gap-2 animate-fade-in">
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
              {/* Brush size slider */}
              <input
                type="range"
                min="2"
                max="16"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-16 accent-wa-teal ml-1"
                title={`Brush size: ${brushSize}px`}
              />
            </div>
            <button
              type="button"
              onClick={() => setDrawings((p) => p.slice(0, -1))}
              className="text-xs text-white/90 hover:text-white px-2.5 py-1 rounded-md bg-white/15 shrink-0"
              title="Undo stroke"
            >
              ↩ Undo
            </button>
          </div>
        )}

        {/* 2. CROP & ROTATE SUB-BAR */}
        {activeTool === 'crop' && (
          <div className="relative z-30 p-3 bg-neutral-900/95 border-b border-white/10 animate-fade-in flex flex-col gap-2.5 text-xs text-white">
            {/* Rotate & Flip Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate90}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 font-semibold transition-colors"
                >
                  <span>🔄 Rotate 90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleFlipHorizontal}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                    isFlippedH ? 'bg-wa-teal text-white' : 'bg-white/15 hover:bg-white/25'
                  }`}
                >
                  <span>↔ Flip</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetCrop}
                className="text-white/60 hover:text-white underline text-[11px]"
              >
                Reset Original
              </button>
            </div>

            {/* Aspect Ratio Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scroll">
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRatioSelect(item)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                    selectedRatio === item.id
                      ? 'bg-wa-teal text-white ring-1 ring-white/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Crop Size Sliders & Apply Button */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10 gap-2">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] text-white/50">Box Size:</span>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={cropBox.width}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    const currentRatioItem = ASPECT_RATIOS.find((r) => r.id === selectedRatio);
                    const targetAspect = currentRatioItem?.ratio || 1;
                    const h = currentRatioItem?.ratio ? Math.min(100, w / targetAspect) : w;
                    setCropBox({
                      width: w,
                      height: h,
                      x: Math.max(0, (100 - w) / 2),
                      y: Math.max(0, (100 - h) / 2),
                    });
                  }}
                  className="w-full accent-wa-teal"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-3.5 py-1.5 bg-wa-green hover:bg-wa-teal text-white font-bold rounded-lg shadow transition-colors"
              >
                Apply Crop
              </button>
            </div>
          </div>
        )}

        {/* 3. ADVANCED TEXT SUB-PANEL (10 Fonts, Colors, Gradients) */}
        {activeTool === 'text' && (
          <div className="absolute inset-x-3 top-14 z-40 p-3.5 bg-neutral-900/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl animate-scale-in text-white">
            <input
              type="text"
              autoFocus
              value={newTextInput}
              onChange={(e) => setNewTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
              placeholder="Type your status text..."
              className="w-full text-center text-lg font-bold bg-transparent border-b border-wa-teal focus:outline-none pb-2 text-white"
              style={{
                fontFamily: selectedFont.family,
                color: textColor,
              }}
            />

            {/* 10 Fonts Switcher Strip */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/60 mb-1.5">
                <span>Select Font (10 Styles)</span>
                <span className="text-wa-teal">{selectedFont.name}</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scroll">
                {STATUS_FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setSelectedFont(font)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                      selectedFont.id === font.id
                        ? 'border-wa-teal bg-wa-teal/20 text-white ring-1 ring-wa-teal'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/15'
                    }`}
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Color Picker & Palettes */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/60 mb-1">
                <span>Text Color</span>
                <label className="flex items-center gap-1 cursor-pointer text-xs text-white/80 hover:text-white">
                  <span>Pick:</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                  />
                </label>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTextColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      textColor === c ? 'scale-125 border-white ring-2 ring-wa-teal' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Background Style: None | Solid | Gradient */}
            <div className="mt-3 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-semibold text-white/60 mb-1.5">
                <span>Background Style</span>
                <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTextBgMode('none')}
                    className={`px-2 py-0.5 rounded-md ${textBgMode === 'none' ? 'bg-wa-teal text-white font-bold' : 'text-white/70'}`}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextBgMode('solid')}
                    className={`px-2 py-0.5 rounded-md ${textBgMode === 'solid' ? 'bg-wa-teal text-white font-bold' : 'text-white/70'}`}
                  >
                    Solid
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextBgMode('gradient')}
                    className={`px-2 py-0.5 rounded-md ${textBgMode === 'gradient' ? 'bg-wa-teal text-white font-bold' : 'text-white/70'}`}
                  >
                    Gradient
                  </button>
                </div>
              </div>

              {/* Solid Background Colors */}
              {textBgMode === 'solid' && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTextBgColor(c)}
                      className={`w-5 h-5 rounded-full border-2 transition-transform ${
                        textBgColor === c ? 'scale-125 border-white ring-2 ring-wa-teal' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-white/70 ml-1">
                    <span>Custom:</span>
                    <input
                      type="color"
                      value={textBgColor}
                      onChange={(e) => setTextBgColor(e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                    />
                  </label>
                </div>
              )}

              {/* Gradient Presets */}
              {textBgMode === 'gradient' && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scroll">
                  {GRADIENT_PRESETS.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelectedGradient(g)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-transform ${
                        selectedGradient.id === g.id ? 'scale-105 ring-2 ring-white shadow-lg' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ background: g.css }}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 mt-3 pt-2.5 border-t border-white/10">
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
                className="text-xs font-bold bg-wa-teal hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg shadow-md transition-colors"
              >
                Add Text
              </button>
            </div>
          </div>
        )}

        {/* 4. STICKER / EMOJI / GIF FULL PICKER DRAWER */}
        {activeTool === 'sticker' && (
          <div className="absolute inset-x-2 top-14 bottom-16 z-40 bg-neutral-900/98 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-scale-in text-white">
            {/* Tabs Header */}
            <div className="flex items-center justify-between p-2.5 border-b border-white/10 bg-black/40">
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStickerTab('emoji')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    stickerTab === 'emoji' ? 'bg-wa-teal text-white shadow' : 'text-white/70 hover:text-white'
                  }`}
                >
                  😊 Emojis
                </button>
                <button
                  type="button"
                  onClick={() => setStickerTab('sticker')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    stickerTab === 'sticker' ? 'bg-wa-teal text-white shadow' : 'text-white/70 hover:text-white'
                  }`}
                >
                  ✨ Stickers
                </button>
                <button
                  type="button"
                  onClick={() => setStickerTab('gif')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    stickerTab === 'gif' ? 'bg-wa-teal text-white shadow' : 'text-white/70 hover:text-white'
                  }`}
                >
                  🎬 GIFs
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/15"
              >
                ✕
              </button>
            </div>

            {/* Giphy Search input (for stickers & gifs) */}
            {stickerTab !== 'emoji' && (
              <div className="p-2 border-b border-white/10 bg-neutral-900">
                <input
                  type="text"
                  value={giphySearch}
                  onChange={(e) => setGiphySearch(e.target.value)}
                  placeholder={`Search ${stickerTab === 'sticker' ? 'Stickers' : 'GIFs'} on Giphy...`}
                  className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-wa-teal"
                />
              </div>
            )}

            {/* Tab 1: Emoji Picker */}
            {stickerTab === 'emoji' && (
              <div className="flex-1 overflow-hidden">
                <EmojiPicker
                  onEmojiClick={handleAddEmoji}
                  theme={Theme.DARK}
                  emojiStyle={EmojiStyle.APPLE}
                  width="100%"
                  height="100%"
                  searchDisabled={false}
                  skinTonesDisabled
                  previewConfig={{ showPreview: false }}
                />
              </div>
            )}

            {/* Tab 2 & 3: Stickers & GIFs Grid */}
            {stickerTab !== 'emoji' && (
              <div className="flex-1 p-2 overflow-y-auto custom-scroll">
                {isGiphyLoading ? (
                  <div className="flex items-center justify-center h-48 text-white/50 text-xs">
                    Loading {stickerTab === 'sticker' ? 'Stickers' : 'GIFs'}...
                  </div>
                ) : giphyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-white/40 text-xs text-center p-4">
                    <span>No media found</span>
                    <span className="text-[10px] mt-1">Try another search keyword</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {giphyItems.map((item) => {
                      const thumb =
                        item.images?.fixed_width_small?.url ||
                        item.images?.fixed_height_small?.url ||
                        item.images?.original?.url;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAddGiphyMedia(item)}
                          className="aspect-square rounded-xl bg-white/5 hover:bg-white/15 p-1 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 active:scale-95"
                        >
                          <img
                            src={thumb}
                            alt={item.title || 'media'}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
          {!mediaSrc ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-white/70">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl mb-4 border border-white/20 animate-pulse">
                📱
              </div>
              <h3 className="text-base font-bold text-white mb-1">Create WhatsApp Status</h3>
              <p className="text-xs text-white/60 mb-6 max-w-xs">
                Post an automated 24-hour Status to all your WhatsApp contacts.
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
              {/* Image Base Layer */}
              {mediaType === 'image' && (
                <img
                  ref={cropImageRef}
                  src={mediaSrc}
                  alt="Status Preview"
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `rotate(${rotation}deg) ${isFlippedH ? 'scaleX(-1)' : ''}`,
                  }}
                />
              )}

              {/* Video Base Layer */}
              {mediaType === 'video' && (
                <video
                  ref={videoRef}
                  src={mediaSrc}
                  onLoadedMetadata={handleVideoLoadedMetadata}
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="max-w-full max-h-full object-contain"
                  playsInline
                  autoPlay
                  loop
                  muted
                />
              )}

              {/* Crop Box Overlay in Crop Mode */}
              {activeTool === 'crop' && mediaType === 'image' && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div
                    className="absolute border-2 border-dashed border-wa-teal bg-wa-teal/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.width}%`,
                      height: `${cropBox.height}%`,
                    }}
                  >
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-wa-teal rounded-full" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-wa-teal rounded-full" />
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-wa-teal rounded-full" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-wa-teal rounded-full" />
                  </div>
                </div>
              )}

              {/* Drawing Layer */}
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
                    className="px-3.5 py-1.5 rounded-xl font-bold text-center text-sm sm:text-base transition-shadow"
                    style={{
                      fontFamily: t.font?.family || 'sans-serif',
                      color: t.color,
                      backgroundColor: t.bgMode === 'solid' ? t.bgColor : undefined,
                      backgroundImage: t.bgMode === 'gradient' ? t.bgGradient?.css : undefined,
                      boxShadow: t.bgMode !== 'none' ? '0 4px 14px rgba(0,0,0,0.5)' : undefined,
                      textShadow: t.bgMode === 'none' ? '0 2px 4px rgba(0,0,0,0.8)' : undefined,
                    }}
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

              {/* Draggable Stickers & Emojis & GIFs */}
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
                  }}
                >
                  {s.type === 'emoji' ? (
                    <span style={{ fontSize: `${s.size}px` }}>{s.content}</span>
                  ) : (
                    <img
                      src={s.content}
                      alt="sticker"
                      className="object-contain pointer-events-none rounded-lg"
                      style={{ width: `${s.size}px`, height: `${s.size}px` }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteSticker(s.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold leading-none shadow"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── DUAL-HANDLE VIDEO TRIMMER BAR ───────────────────────────────── */}
        {mediaType === 'video' && mediaSrc && videoDuration > 0 && (
          <div className="relative z-30 px-3.5 py-2.5 bg-neutral-900/95 border-t border-white/10 text-white text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold flex items-center gap-1 text-wa-teal">
                <span>✂️ Video Trimmer</span>
                <span className="text-[10px] text-white/50">(Max 30s)</span>
              </span>
              <span className="font-mono text-white/80">
                {trimStart}s - {trimEnd}s <span className="text-wa-teal font-bold">({trimEnd - trimStart}s)</span>
              </span>
            </div>

            {/* Visual Timeline Track */}
            <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div
                className="absolute top-0 bottom-0 bg-wa-teal rounded-full transition-all"
                style={{
                  left: `${(trimStart / videoDuration) * 100}%`,
                  width: `${((trimEnd - trimStart) / videoDuration) * 100}%`,
                }}
              />
            </div>

            {/* Dual Front & Back Handles with Fine-Tuning */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* Start Handle */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-white/60">
                  <span>Start: {trimStart}s</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTrimStartChange(trimStart - 1)}
                      className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                    >
                      -1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrimStartChange(trimStart + 1)}
                      className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                    >
                      +1s
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, videoDuration - 1)}
                  value={trimStart}
                  onChange={(e) => handleTrimStartChange(Number(e.target.value))}
                  className="w-full accent-wa-teal"
                />
              </div>

              {/* End Handle */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-white/60">
                  <span>End: {trimEnd}s</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTrimEndChange(trimEnd - 1)}
                      className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                    >
                      -1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrimEndChange(trimEnd + 1)}
                      className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20"
                    >
                      +1s
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min="1"
                  max={videoDuration}
                  value={trimEnd}
                  onChange={(e) => handleTrimEndChange(Number(e.target.value))}
                  className="w-full accent-wa-teal"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── BOTTOM CAPTION & SEND BAR ───────────────────────────────────── */}
        <div className="relative z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2">
          {/* Audience Pill */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 text-white/90 text-[11px] font-semibold backdrop-blur-sm">
              <span>🔒 Status (My contacts)</span>
            </div>
            {mediaSrc && (
              <p className="text-[10px] text-white/50">
                {mediaType === 'image' ? '9:16 Photo Story' : '30s Video Story'}
              </p>
            )}
          </div>

          {/* Caption Input & Green Done/Send Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-white/15 border border-white/20 backdrop-blur-md text-white text-sm focus-within:border-wa-teal focus-within:bg-black/60 transition-all">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full bg-transparent text-white placeholder-white/50 text-xs sm:text-sm focus:outline-none"
              />
            </div>

            {/* Done / Schedule Status Button */}
            <button
              type="button"
              onClick={handleDone}
              disabled={!mediaSrc}
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-xl transition-all ${
                mediaSrc
                  ? 'bg-wa-teal hover:bg-teal-600 text-white cursor-pointer active:scale-95 shadow-wa-teal/50'
                  : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}
              title="Done & Set Status"
            >
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hidden File Input */}
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
