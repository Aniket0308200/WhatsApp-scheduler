import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { WhatsAppGifIcon } from './GifStickerPickerModal';
import { fetchAllContacts } from '../api';

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

// ─── 6 Gradient Presets ──────────────────────────────────────────────────────
const GRADIENT_PRESETS = [
  { id: 'sunset', name: 'Sunset', colors: ['#FF512F', '#DD2476'] },
  { id: 'ocean', name: 'Ocean', colors: ['#00c6ff', '#0072ff'] },
  { id: 'emerald', name: 'Emerald', colors: ['#11998e', '#38ef7d'] },
  { id: 'violet', name: 'Violet', colors: ['#8A2387', '#E94057'] },
  { id: 'gold', name: 'Gold', colors: ['#f7971e', '#ffd200'] },
  { id: 'cyber', name: 'Dark', colors: ['#232526', '#414345'] },
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
  const [originalMediaSrc, setOriginalMediaSrc] = useState(null);
  const [caption, setCaption] = useState('');

  // Active Tool Mode
  const [activeTool, setActiveTool] = useState(null); // 'draw' | 'text' | 'sticker' | 'crop' | null

  // Crop & Transform State
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [isFlippedH, setIsFlippedH] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState('free');
  const [cropBox, setCropBox] = useState({ x: 10, y: 10, width: 80, height: 80 });

  // Drawing / Doodle State
  const [drawColor, setDrawColor] = useState('#25D366');
  const [brushSize, setBrushSize] = useState(4);
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Advanced Text Overlays State
  const [textElements, setTextElements] = useState([]); // { id, text, textColorMode, color, textGrad1, textGrad2, textDegree, bgMode, bgColor, bgGrad1, bgGrad2, bgDegree, font, size, x, y }
  const [editingTextId, setEditingTextId] = useState(null);
  const [newTextInput, setNewTextInput] = useState('');
  const [textColorMode, setTextColorMode] = useState('solid'); // 'solid' | 'gradient'
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textGrad1, setTextGrad1] = useState('#FF512F');
  const [textGrad2, setTextGrad2] = useState('#DD2476');
  const [textDegree, setTextDegree] = useState(135);
  const [textBgMode, setTextBgMode] = useState('solid'); // 'none' | 'solid' | 'gradient'
  const [textBgColor, setTextBgColor] = useState('#000000');
  const [bgGrad1, setBgGrad1] = useState('#FF512F');
  const [bgGrad2, setBgGrad2] = useState('#DD2476');
  const [bgDegree, setBgDegree] = useState(135);
  const [selectedFont, setSelectedFont] = useState(STATUS_FONTS[0]);
  const [textSize, setTextSize] = useState(56);

  // Stickers / Emojis / GIFs State
  const [stickers, setStickers] = useState([]); // { id, type: 'emoji'|'image', content, size, x, y }
  const [stickerTab, setStickerTab] = useState('emoji'); // 'emoji' | 'sticker' | 'gif'
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyItems, setGiphyItems] = useState([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);

  // Selected Item for Resizing & Controls
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'text' | 'sticker'

  // Contact Mention (@) State
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [contactDirectory, setContactDirectory] = useState([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionedContacts, setMentionedContacts] = useState([]); // [{ name, phone, jid }]

  // Video State & Dual Trimmer
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(30);

  // Dragging State (Position only, no size change)
  const [draggingItem, setDraggingItem] = useState(null);

  // Refs
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const videoRef = useRef(null);
  const captionInputRef = useRef(null);

  // ─── Body Scroll Lock when Modal is Open ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ─── Load Contacts Directory for Mentions ──────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // 1. Read instant local cache
      try {
        const cached = localStorage.getItem('wa_cached_contacts');
        if (cached) {
          const parsed = JSON.parse(cached);
          const list = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed.all)
            ? parsed.all
            : Array.isArray(parsed.personal)
            ? parsed.personal
            : [];
          if (list.length > 0) setContactDirectory(list);
        }
      } catch {}

      // 2. Fetch fresh contacts from backend API
      fetchAllContacts()
        .then((data) => {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.all)
            ? data.all
            : Array.isArray(data?.personal)
            ? data.personal
            : [];
          if (list.length > 0) {
            setContactDirectory(list);
          }
        })
        .catch((err) => console.warn('Failed to load contacts for mention:', err.message));
    }
  }, [isOpen]);

  // Initialize data on open
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
        setCaption('');
        setDrawings([]);
        setTextElements([]);
        setStickers([]);
        setRotation(0);
        setIsFlippedH(false);
        setTrimStart(0);
        setTrimEnd(30);
        setMentionedContacts([]);
      }
      setActiveTool(null);
      setSelectedItemId(null);
      setEditingTextId(null);
      setShowMentionPicker(false);
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

    setMediaType(isVideo ? 'video' : 'image');
    setDrawings([]);
    setTextElements([]);
    setStickers([]);
    setRotation(0);
    setIsFlippedH(false);
    setSelectedItemId(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaSrc(event.target.result);
      setOriginalMediaSrc(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Video loaded & time update
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

  const handleTrimStartChange = (val) => {
    const newStart = Math.max(0, Math.min(val, trimEnd - 1));
    setTrimStart(newStart);
    if (trimEnd - newStart > 30) {
      setTrimEnd(newStart + 30);
    }
    if (videoRef.current) videoRef.current.currentTime = newStart;
  };

  const handleTrimEndChange = (val) => {
    const newEnd = Math.max(trimStart + 1, Math.min(val, videoDuration));
    if (newEnd - trimStart > 30) {
      setTrimStart(Math.max(0, newEnd - 30));
    }
    setTrimEnd(newEnd);
    if (videoRef.current) videoRef.current.currentTime = newEnd;
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
  const handleRotate90 = () => setRotation((prev) => (prev + 90) % 360);
  const handleFlipHorizontal = () => setIsFlippedH((prev) => !prev);

  const handleRatioSelect = (ratioItem) => {
    setSelectedRatio(ratioItem.id);
    if (!ratioItem.ratio) {
      setCropBox({ x: 5, y: 5, width: 90, height: 90 });
      return;
    }
    const targetAspect = ratioItem.ratio;
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

  const handleEndDraw = () => setIsDrawing(false);

  // ─── Advanced Text Handlers (Add, Edit, Gradients) ───────────────────────────
  const handleSaveText = () => {
    if (!newTextInput.trim()) {
      setActiveTool(null);
      setEditingTextId(null);
      return;
    }

    if (editingTextId) {
      setTextElements((prev) =>
        prev.map((t) =>
          t.id === editingTextId
            ? {
                ...t,
                text: newTextInput.trim(),
                textColorMode,
                color: textColor,
                textGrad1,
                textGrad2,
                textDegree,
                bgMode: textBgMode,
                bgColor: textBgColor,
                bgGrad1,
                bgGrad2,
                bgDegree,
                font: selectedFont,
                size: textSize,
              }
            : t
        )
      );
      toast.success('Text updated');
    } else {
      const newEl = {
        id: Date.now().toString(),
        text: newTextInput.trim(),
        textColorMode,
        color: textColor,
        textGrad1,
        textGrad2,
        textDegree,
        bgMode: textBgMode,
        bgColor: textBgColor,
        bgGrad1,
        bgGrad2,
        bgDegree,
        font: selectedFont,
        size: 56,
        x: 50,
        y: 45 + (textElements.length % 4) * 8,
      };
      setTextElements((prev) => [...prev, newEl]);
      setSelectedItemId(newEl.id);
      setSelectedItemType('text');
    }

    setNewTextInput('');
    setEditingTextId(null);
    setActiveTool(null);
  };

  const handleEditText = (t) => {
    setEditingTextId(t.id);
    setNewTextInput(t.text);
    setTextColorMode(t.textColorMode || 'solid');
    setTextColor(t.color || '#FFFFFF');
    setTextGrad1(t.textGrad1 || '#FF512F');
    setTextGrad2(t.textGrad2 || '#DD2476');
    setTextDegree(t.textDegree ?? 135);
    setTextBgMode(t.bgMode || 'solid');
    setTextBgColor(t.bgColor || '#000000');
    setBgGrad1(t.bgGrad1 || '#FF512F');
    setBgGrad2(t.bgGrad2 || '#DD2476');
    setBgDegree(t.bgDegree ?? 135);
    setSelectedFont(t.font || STATUS_FONTS[0]);
    setTextSize(t.size || 56);
    setActiveTool('text');
  };

  const handleDeleteText = (id) => {
    setTextElements((prev) => prev.filter((t) => t.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
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
      size: 52,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedItemId(newSticker.id);
    setSelectedItemType('sticker');
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
      size: 90,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedItemId(newSticker.id);
    setSelectedItemType('sticker');
    setActiveTool(null);
  };

  const handleDeleteSticker = (id) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // ─── Resize Helper for ALL Items (Strictly via Sliders/Buttons) ─────────────
  const updateItemSize = (id, type, delta) => {
    if (type === 'text') {
      setTextElements((prev) =>
        prev.map((t) => (t.id === id ? { ...t, size: Math.max(20, Math.min(140, (t.size || 56) + delta)) } : t))
      );
    } else if (type === 'sticker') {
      setStickers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, size: Math.max(24, Math.min(240, (s.size || 52) + delta)) } : s))
      );
    }
  };

  const setItemExactSize = (id, type, newSize) => {
    if (type === 'text') {
      setTextElements((prev) =>
        prev.map((t) => (t.id === id ? { ...t, size: newSize } : t))
      );
    } else if (type === 'sticker') {
      setStickers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, size: newSize } : s))
      );
    }
  };

  const getSelectedItem = () => {
    if (!selectedItemId) return null;
    if (selectedItemType === 'text') {
      return textElements.find((t) => t.id === selectedItemId);
    }
    return stickers.find((s) => s.id === selectedItemId);
  };
  const activeSelectedItem = getSelectedItem();

  // ─── Contact Mention Handlers ───────────────────────────────────────────────
  const handleSelectMention = (contact) => {
    const rawName = contact.name || contact.displayName || contact.pushName || '';
    const cleanName = rawName && !rawName.startsWith('Contact +') ? rawName : contact.phone;
    const mentionTag = `@${cleanName} `;
    setCaption((prev) => prev + (prev.endsWith(' ') || !prev ? '' : ' ') + mentionTag);
    const jid = contact.jid || `${String(contact.phone).replace(/\D/g, '')}@s.whatsapp.net`;
    if (!mentionedContacts.some((m) => m.phone === contact.phone)) {
      setMentionedContacts((prev) => [...prev, { name: cleanName, phone: contact.phone, jid }]);
    }
    setShowMentionPicker(false);
    setMentionSearch('');
    if (captionInputRef.current) captionInputRef.current.focus();
    toast.success(`Mentioned ${cleanName}`);
  };

  const handleRemoveMentionTag = (phone) => {
    setMentionedContacts((prev) => prev.filter((m) => m.phone !== phone));
  };

  const filteredContacts = contactDirectory.filter((c) => {
    if (!c) return false;
    const q = mentionSearch.trim().toLowerCase();
    if (!q) return true;

    // 1. Comprehensive name matching
    const nameStr = String(c.name || c.displayName || c.pushName || c.notify || '').toLowerCase();
    const matchesName = nameStr.includes(q);

    // 2. Phone number matching - ONLY if digits were actually entered
    const searchDigits = q.replace(/\D/g, '');
    const phoneDigits = String(c.phone || c.jid || '').replace(/\D/g, '');
    const matchesPhone = searchDigits.length > 0 && phoneDigits.includes(searchDigits);

    return Boolean(matchesName || matchesPhone);
  });

  // ─── Drag Overlays (Moves ONLY X/Y, Never touches Size) ─────────────────────
  const handleDragStart = (e, type, id, currentX, currentY) => {
    if (activeTool === 'draw' || activeTool === 'crop') return;
    // Prevent default browser drag/selection behavior which caused erratic resizing
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    setSelectedItemId(id);
    setSelectedItemType(type);

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
    if (e.cancelable) e.preventDefault();
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
  // Helper to bake CSS angled linear gradients onto HTML5 Canvas
  const createAngledGradient = (ctx, x, y, width, height, angleDeg, color1, color2) => {
    const rad = ((Number(angleDeg ?? 135)) * Math.PI) / 180;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const halfW = width / 2;
    const halfH = height / 2;
    const dist = Math.abs(halfW * dx) + Math.abs(halfH * dy);
    const x1 = cx - dx * dist;
    const y1 = cy - dy * dist;
    const x2 = cx + dx * dist;
    const y2 = cy + dy * dist;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    return grad;
  };

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
        mentions: mentionedContacts.map((m) => m.jid).filter(Boolean),
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

      // 4. Stickers & GIFs (Using Exact Configured Size)
      for (const s of stickers) {
        const posX = (s.x / 100) * targetWidth;
        const posY = (s.y / 100) * targetHeight;
        const renderSize = (s.size || 52) * 2.8;

        if (s.type === 'emoji') {
          const fontPx = Math.round(renderSize * 0.85);
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
        const basePx = t.size || 56;
        const fontPx = Math.round(basePx * 1.6);
        const fontFamily = t.font?.family || 'sans-serif';

        ctx.font = `bold ${fontPx}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(t.text);
        const textW = metrics.width;
        const padX = Math.round(fontPx * 0.45);
        const padY = Math.round(fontPx * 0.28);
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
          const grad = createAngledGradient(
            ctx,
            rectX,
            rectY,
            pillW,
            pillH,
            t.bgDegree ?? 135,
            t.bgGrad1 || '#FF512F',
            t.bgGrad2 || '#DD2476'
          );
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(rectX, rectY, pillW, pillH, 22);
          ctx.fill();
        }

        // Draw Text (Solid or Gradient)
        if (t.textColorMode === 'gradient') {
          const textGrad = createAngledGradient(
            ctx,
            rectX,
            rectY,
            pillW,
            pillH,
            t.textDegree ?? 135,
            t.textGrad1 || '#FF512F',
            t.textGrad2 || '#DD2476'
          );
          ctx.fillStyle = textGrad;
        } else {
          ctx.fillStyle = t.color || '#FFFFFF';
        }

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
        mentions: mentionedContacts.map((m) => m.jid).filter(Boolean),
      });
      onClose();
    } catch (err) {
      console.error('Failed to bake status:', err);
      toast.error('Failed to prepare status: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    /* Outer Modal Backdrop - Pure Dark OLED Glassmorphism without top margin/gap */
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-md p-0 m-0 animate-fade-in select-none">
      
      {/* ── PHONE SHELL CONTAINER (Pure WhatsApp Dark Mode) ──────────────── */}
      <div className="relative w-full max-w-[420px] h-full sm:h-screen max-h-screen bg-[#0b141a] sm:rounded-2xl border-0 sm:border border-neutral-800 shadow-2xl overflow-hidden flex flex-col justify-between m-0 p-0">
        
        {/* ── TOP HEADER / TOOLBAR (Dark WhatsApp Theme) ─────────────────── */}
        <div className="relative z-30 flex items-center justify-between px-3.5 py-3 bg-[#111b21]/95 border-b border-neutral-800/80 text-white">
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
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
                  onClick={() => {
                    setActiveTool(activeTool === 'crop' ? null : 'crop');
                    setSelectedItemId(null);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    activeTool === 'crop' ? 'bg-wa-teal text-white' : 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                  title="Crop & Rotate"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </button>
              )}

              {/* Emoji / Sticker / GIF Button - Simple Clean GIF Icon from Message section */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool(activeTool === 'sticker' ? null : 'sticker');
                  setSelectedItemId(null);
                }}
                className={`p-2 rounded-full transition-colors ${
                  activeTool === 'sticker' ? 'bg-wa-teal text-white' : 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
                title="Stickers, Emojis & GIFs"
              >
                <WhatsAppGifIcon className="w-5 h-5" />
              </button>

              {/* Advanced Text Tool Button */}
              <button
                type="button"
                onClick={() => {
                  setEditingTextId(null);
                  setNewTextInput('');
                  setActiveTool(activeTool === 'text' ? null : 'text');
                  setSelectedItemId(null);
                }}
                className={`p-2 rounded-full transition-colors ${
                  activeTool === 'text' ? 'bg-wa-teal text-white' : 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
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
                    setSelectedItemId(null);
                  }}
                  className={`p-2 rounded-full transition-colors ${
                    activeTool === 'draw' ? 'bg-wa-teal text-white' : 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
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
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                title="Change Photo/Video"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* ── TOOL SUB-PANELS (All Dark Mode Styled) ──────────────────────── */}
        
        {/* 1. DRAW SUB-BAR */}
        {activeTool === 'draw' && (
          <div className="relative z-30 px-3 py-2 bg-[#111b21] border-b border-neutral-800 flex items-center justify-between gap-2 animate-fade-in">
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
              className="text-xs text-neutral-300 hover:text-white px-2.5 py-1 rounded-md bg-neutral-800 shrink-0"
              title="Undo stroke"
            >
              ↩ Undo
            </button>
          </div>
        )}

        {/* 2. CROP & ROTATE SUB-BAR */}
        {activeTool === 'crop' && (
          <div className="relative z-30 p-3 bg-[#111b21] border-b border-neutral-800 animate-fade-in flex flex-col gap-2.5 text-xs text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRotate90}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-semibold transition-colors text-neutral-200"
                >
                  <span>🔄 Rotate 90°</span>
                </button>
                <button
                  type="button"
                  onClick={handleFlipHorizontal}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-semibold transition-colors ${
                    isFlippedH ? 'bg-wa-teal text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  <span>↔ Flip</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetCrop}
                className="text-neutral-400 hover:text-white underline text-[11px]"
              >
                Reset Original
              </button>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto py-1 custom-scroll">
              {ASPECT_RATIOS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleRatioSelect(item)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                    selectedRatio === item.id
                      ? 'bg-wa-teal text-white ring-1 ring-white/50'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-neutral-800 gap-2">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] text-neutral-400">Box Size:</span>
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

        {/* 3. ADVANCED TEXT SUB-PANEL (Pure Dark Mode) */}
        {activeTool === 'text' && (
          <div className="absolute inset-x-2 top-12 bottom-16 z-40 p-3.5 bg-[#111b21] border border-neutral-700 rounded-2xl shadow-2xl flex flex-col justify-between overflow-y-auto custom-scroll animate-scale-in text-white">
            <div>
              <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 mb-2">
                <span className="text-xs font-bold text-wa-teal">
                  {editingTextId ? '✏️ Edit Text Overlay' : '✍️ New Text Overlay'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool(null);
                    setEditingTextId(null);
                  }}
                  className="text-neutral-400 hover:text-white text-xs px-2 py-0.5"
                >
                  ✕
                </button>
              </div>

              {/* Live Preview Pill & Text Input */}
              <div className="flex flex-col gap-2 my-2">
                <div
                  className="p-3 rounded-xl border border-neutral-700 flex items-center justify-center min-h-[60px] text-center transition-all overflow-hidden"
                  style={{
                    backgroundColor: textBgMode === 'solid' ? textBgColor : undefined,
                    backgroundImage:
                      textBgMode === 'gradient'
                        ? `linear-gradient(${bgDegree}deg, ${bgGrad1}, ${bgGrad2})`
                        : undefined,
                  }}
                >
                  <span
                    className="text-lg font-bold select-none whitespace-pre-wrap break-words max-w-full"
                    style={{
                      fontFamily: selectedFont.family,
                      color: textColorMode === 'solid' ? textColor : undefined,
                      backgroundImage:
                        textColorMode === 'gradient'
                          ? `linear-gradient(${textDegree}deg, ${textGrad1}, ${textGrad2})`
                          : undefined,
                      WebkitBackgroundClip: textColorMode === 'gradient' ? 'text' : undefined,
                      backgroundClip: textColorMode === 'gradient' ? 'text' : undefined,
                      WebkitTextFillColor: textColorMode === 'gradient' ? 'transparent' : undefined,
                      display: 'inline-block',
                    }}
                  >
                    {newTextInput || 'Type your status text...'}
                  </span>
                </div>

                <input
                  type="text"
                  autoFocus
                  value={newTextInput}
                  onChange={(e) => setNewTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveText()}
                  placeholder="Type your status text..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white text-sm font-medium focus:outline-none focus:border-wa-teal focus:ring-1 focus:ring-wa-teal transition-all"
                />
              </div>

              {/* 10 Fonts Switcher Strip */}
              <div className="mt-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1">
                  <span>Font Style (10 Types)</span>
                  <span className="text-wa-teal font-mono">{selectedFont.name}</span>
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
                          : 'border-neutral-800 bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700'
                      }`}
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Color Section: Solid or Gradient with Pickers */}
              <div className="mt-3 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5">
                  <span>Text Color</span>
                  <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTextColorMode('solid')}
                      className={`px-2 py-0.5 rounded-md ${textColorMode === 'solid' ? 'bg-wa-teal text-white font-bold' : 'text-neutral-400'}`}
                    >
                      Solid
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextColorMode('gradient')}
                      className={`px-2 py-0.5 rounded-md ${textColorMode === 'gradient' ? 'bg-wa-teal text-white font-bold' : 'text-neutral-400'}`}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

                {textColorMode === 'solid' ? (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
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
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-neutral-300 ml-1">
                      <span>Pick:</span>
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 custom-scroll">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setTextGrad1(g.colors[0]);
                            setTextGrad2(g.colors[1]);
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm shrink-0"
                          style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-800/80 p-1.5 rounded-lg text-[11px]">
                      <span className="text-neutral-400 text-[10px]">Custom Pick:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <span>Color 1:</span>
                        <input
                          type="color"
                          value={textGrad1}
                          onChange={(e) => setTextGrad1(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                        />
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <span>Color 2:</span>
                        <input
                          type="color"
                          value={textGrad2}
                          onChange={(e) => setTextGrad2(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                        />
                      </label>
                      <div
                        className="w-8 h-4 rounded ml-auto shadow-inner border border-neutral-700"
                        style={{ background: `linear-gradient(${textDegree}deg, ${textGrad1}, ${textGrad2})` }}
                      />
                    </div>

                    {/* Text Gradient Degree (Angle) Slider & Chips */}
                    <div className="flex items-center gap-2 bg-neutral-800/80 p-1.5 rounded-lg text-[11px]">
                      <span className="text-neutral-400 text-[10px] whitespace-nowrap">Degree:</span>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={textDegree}
                        onChange={(e) => setTextDegree(Number(e.target.value))}
                        className="w-full accent-wa-teal h-1 cursor-pointer"
                      />
                      <span className="text-wa-teal font-mono text-[10px] w-8 text-right font-bold">{textDegree}°</span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 custom-scroll">
                      {[0, 45, 90, 135, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setTextDegree(deg)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${
                            textDegree === deg ? 'bg-wa-teal text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Background Style: None | Solid | Gradient */}
              <div className="mt-3 pt-2 border-t border-neutral-800">
                <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 mb-1.5">
                  <span>Background Pill</span>
                  <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setTextBgMode('none')}
                      className={`px-2 py-0.5 rounded-md ${textBgMode === 'none' ? 'bg-wa-teal text-white font-bold' : 'text-neutral-400'}`}
                    >
                      None
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextBgMode('solid')}
                      className={`px-2 py-0.5 rounded-md ${textBgMode === 'solid' ? 'bg-wa-teal text-white font-bold' : 'text-neutral-400'}`}
                    >
                      Solid
                    </button>
                    <button
                      type="button"
                      onClick={() => setTextBgMode('gradient')}
                      className={`px-2 py-0.5 rounded-md ${textBgMode === 'gradient' ? 'bg-wa-teal text-white font-bold' : 'text-neutral-400'}`}
                    >
                      Gradient
                    </button>
                  </div>
                </div>

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
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-neutral-300 ml-1">
                      <span>Pick:</span>
                      <input
                        type="color"
                        value={textBgColor}
                        onChange={(e) => setTextBgColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                      />
                    </label>
                  </div>
                )}

                {textBgMode === 'gradient' && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 custom-scroll">
                      {GRADIENT_PRESETS.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            setBgGrad1(g.colors[0]);
                            setBgGrad2(g.colors[1]);
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm shrink-0"
                          style={{ background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})` }}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 bg-neutral-800/80 p-1.5 rounded-lg text-[11px]">
                      <span className="text-neutral-400 text-[10px]">Custom Pick:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <span>Color 1:</span>
                        <input
                          type="color"
                          value={bgGrad1}
                          onChange={(e) => setBgGrad1(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                        />
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <span>Color 2:</span>
                        <input
                          type="color"
                          value={bgGrad2}
                          onChange={(e) => setBgGrad2(e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                        />
                      </label>
                      <div
                        className="w-8 h-4 rounded ml-auto shadow-inner border border-neutral-700"
                        style={{ background: `linear-gradient(${bgDegree}deg, ${bgGrad1}, ${bgGrad2})` }}
                      />
                    </div>

                    {/* Background Gradient Degree (Angle) Slider & Chips */}
                    <div className="flex items-center gap-2 bg-neutral-800/80 p-1.5 rounded-lg text-[11px]">
                      <span className="text-neutral-400 text-[10px] whitespace-nowrap">Degree:</span>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        step="5"
                        value={bgDegree}
                        onChange={(e) => setBgDegree(Number(e.target.value))}
                        className="w-full accent-wa-teal h-1 cursor-pointer"
                      />
                      <span className="text-wa-teal font-mono text-[10px] w-8 text-right font-bold">{bgDegree}°</span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto py-0.5 custom-scroll">
                      {[0, 45, 90, 135, 180, 270].map((deg) => (
                        <button
                          key={deg}
                          type="button"
                          onClick={() => setBgDegree(deg)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-colors ${
                            bgDegree === deg ? 'bg-wa-teal text-white font-bold' : 'bg-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800 mt-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTool(null);
                  setEditingTextId(null);
                }}
                className="text-xs text-neutral-400 hover:text-white px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveText}
                className="text-xs font-bold bg-wa-teal hover:bg-teal-600 text-white px-4 py-1.5 rounded-lg shadow-md transition-colors"
              >
                {editingTextId ? 'Update Text' : 'Add Text'}
              </button>
            </div>
          </div>
        )}

        {/* 4. STICKER / EMOJI / GIF FULL PICKER DRAWER (Pure Dark Mode) */}
        {activeTool === 'sticker' && (
          <div className="absolute inset-x-2 top-14 bottom-16 z-40 bg-[#111b21] border border-neutral-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in text-white">
            <div className="flex items-center justify-between p-2.5 border-b border-neutral-800 bg-[#0b141a]">
              <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStickerTab('emoji')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    stickerTab === 'emoji' ? 'bg-wa-teal text-white shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  😊 Emojis
                </button>
                <button
                  type="button"
                  onClick={() => setStickerTab('sticker')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    stickerTab === 'sticker' ? 'bg-wa-teal text-white shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  ✨ Stickers
                </button>
                <button
                  type="button"
                  onClick={() => setStickerTab('gif')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    stickerTab === 'gif' ? 'bg-wa-teal text-white shadow' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🎬 GIFs
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveTool(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                ✕
              </button>
            </div>

            {stickerTab !== 'emoji' && (
              <div className="p-2 border-b border-neutral-800 bg-[#111b21]">
                <input
                  type="text"
                  value={giphySearch}
                  onChange={(e) => setGiphySearch(e.target.value)}
                  placeholder={`Search ${stickerTab === 'sticker' ? 'Stickers' : 'GIFs'} on Giphy...`}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-wa-teal"
                />
              </div>
            )}

            {stickerTab === 'emoji' && (
              <div className="flex-1 overflow-hidden bg-[#111b21]">
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

            {stickerTab !== 'emoji' && (
              <div className="flex-1 p-2 overflow-y-auto custom-scroll bg-[#111b21]">
                {isGiphyLoading ? (
                  <div className="flex items-center justify-center h-48 text-neutral-400 text-xs">
                    Loading {stickerTab === 'sticker' ? 'Stickers' : 'GIFs'}...
                  </div>
                ) : giphyItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-neutral-500 text-xs text-center p-4">
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
                          className="aspect-square rounded-xl bg-neutral-800/80 hover:bg-neutral-700 p-1 flex items-center justify-center overflow-hidden transition-transform hover:scale-105 active:scale-95 border border-neutral-700/50"
                        >
                          <img
                            src={thumb}
                            alt={item.title || 'media'}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            draggable={false}
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
          onClick={() => {
            if (activeTool !== 'draw' && activeTool !== 'crop') {
              setSelectedItemId(null);
            }
          }}
          className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden"
          style={{ aspectRatio: '9/16' }}
        >
          {!mediaSrc ? (
            <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-300">
              <div className="w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-3xl mb-4 border border-neutral-800 animate-pulse">
                📱
              </div>
              <h3 className="text-base font-bold text-white mb-1">Create WhatsApp Status</h3>
              <p className="text-xs text-neutral-400 mb-6 max-w-xs">
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
                  src={mediaSrc}
                  alt="Status Preview"
                  draggable={false}
                  className="max-w-full max-h-full object-contain"
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

              {/* Crop Box Overlay */}
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

              {/* Draggable Text Overlays (Double-click to edit, Strictly size-locked while dragging) */}
              {textElements.map((t) => {
                const isSelected = selectedItemId === t.id;
                const fontPx = Math.round((t.size || 56) * 0.3);
                return (
                  <div
                    key={t.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItemId(t.id);
                      setSelectedItemType('text');
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleEditText(t);
                    }}
                    onMouseDown={(e) => handleDragStart(e, 'text', t.id, t.x, t.y)}
                    onTouchStart={(e) => handleDragStart(e, 'text', t.id, t.x, t.y)}
                    className={`absolute z-20 cursor-move group select-none ${
                      isSelected ? 'ring-2 ring-wa-teal ring-offset-2 ring-offset-black rounded-xl' : ''
                    }`}
                    style={{
                      left: `${t.x}%`,
                      top: `${t.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title="Double-click to edit text • Drag to move"
                  >
                    <div
                      className="rounded-xl font-bold text-center whitespace-pre-wrap select-none"
                      style={{
                        backgroundColor: t.bgMode === 'solid' ? t.bgColor : undefined,
                        backgroundImage:
                          t.bgMode === 'gradient'
                            ? `linear-gradient(${t.bgDegree ?? 135}deg, ${t.bgGrad1 || '#FF512F'}, ${t.bgGrad2 || '#DD2476'})`
                            : undefined,
                        boxShadow: t.bgMode !== 'none' ? '0 4px 14px rgba(0,0,0,0.5)' : undefined,
                        padding: '6px 14px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: t.font?.family || 'sans-serif',
                          fontSize: `${fontPx}px`,
                          color: t.textColorMode === 'solid' ? (t.color || '#FFFFFF') : undefined,
                          backgroundImage:
                            t.textColorMode === 'gradient'
                              ? `linear-gradient(${t.textDegree ?? 135}deg, ${t.textGrad1 || '#FF512F'}, ${t.textGrad2 || '#DD2476'})`
                              : undefined,
                          WebkitBackgroundClip: t.textColorMode === 'gradient' ? 'text' : undefined,
                          backgroundClip: t.textColorMode === 'gradient' ? 'text' : undefined,
                          WebkitTextFillColor: t.textColorMode === 'gradient' ? 'transparent' : undefined,
                          textShadow: t.bgMode === 'none' && t.textColorMode === 'solid' ? '0 2px 4px rgba(0,0,0,0.8)' : undefined,
                          display: 'inline-block',
                          lineHeight: 1.2,
                        }}
                      >
                        {t.text}
                      </span>
                    </div>

                    {/* Quick Item Controls (Edit, Resize & Delete) */}
                    {isSelected && (
                      <div className="absolute -top-7 inset-x-0 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-1 bg-[#111b21] rounded-lg p-0.5 border border-neutral-700 shadow-lg">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemSize(t.id, 'text', -6);
                            }}
                            className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center"
                            title="Smaller"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemSize(t.id, 'text', +6);
                            }}
                            className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center"
                            title="Larger"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditText(t);
                            }}
                            className="px-1.5 h-5 rounded bg-wa-teal hover:bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center"
                            title="Edit text"
                          >
                            ✏️
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteText(t.id);
                          }}
                          className="w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center shadow"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Draggable Stickers, Emojis & GIFs (Strictly moves X/Y, no resize while dragging) */}
              {stickers.map((s) => {
                const isSelected = selectedItemId === s.id;
                const itemSize = s.size || 52;
                return (
                  <div
                    key={s.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItemId(s.id);
                      setSelectedItemType('sticker');
                    }}
                    onMouseDown={(e) => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
                    onTouchStart={(e) => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
                    className={`absolute z-20 cursor-move group select-none leading-none touch-none shrink-0 ${
                      isSelected ? 'ring-2 ring-wa-teal ring-offset-2 ring-offset-black rounded-xl' : ''
                    }`}
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${itemSize}px`,
                      height: `${itemSize}px`,
                      minWidth: `${itemSize}px`,
                      minHeight: `${itemSize}px`,
                      maxWidth: 'none',
                      maxHeight: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Click to select & resize • Drag to move"
                  >
                    {s.type === 'emoji' ? (
                      <span
                        style={{
                          fontSize: `${itemSize}px`,
                          lineHeight: 1,
                        }}
                        className="select-none pointer-events-none shrink-0 inline-block whitespace-nowrap leading-none"
                      >
                        {s.content}
                      </span>
                    ) : (
                      <img
                        src={s.content}
                        alt="sticker"
                        draggable={false}
                        className="object-contain pointer-events-none rounded-lg select-none shrink-0 max-w-none max-h-none"
                        style={{
                          width: `${itemSize}px`,
                          height: `${itemSize}px`,
                          minWidth: `${itemSize}px`,
                          minHeight: `${itemSize}px`,
                          maxWidth: 'none',
                          maxHeight: 'none',
                        }}
                      />
                    )}

                    {/* Quick Resize & Delete controls when selected */}
                    {isSelected && (
                      <div className="absolute -top-7 inset-x-0 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-1 bg-[#111b21] rounded-lg p-0.5 border border-neutral-700 shadow-lg">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemSize(s.id, 'sticker', -8);
                            }}
                            className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center"
                            title="Smaller"
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateItemSize(s.id, 'sticker', +8);
                            }}
                            className="w-5 h-5 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center"
                            title="Larger"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSticker(s.id);
                          }}
                          className="w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center shadow"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Floating Resize Dock (Pure Dark Mode) */}
              {activeSelectedItem && !activeTool && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-2 inset-x-4 z-30 px-3 py-1.5 rounded-2xl bg-[#111b21] border border-neutral-700 shadow-2xl flex items-center justify-between gap-2 text-white animate-fade-in"
                >
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">Resize:</span>
                  <button
                    type="button"
                    onClick={() => updateItemSize(activeSelectedItem.id, selectedItemType, -6)}
                    className="w-6 h-6 rounded-md bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center font-bold text-sm"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={selectedItemType === 'text' ? 24 : 30}
                    max={selectedItemType === 'text' ? 120 : 220}
                    value={activeSelectedItem.size || (selectedItemType === 'text' ? 56 : 52)}
                    onChange={(e) => setItemExactSize(activeSelectedItem.id, selectedItemType, Number(e.target.value))}
                    className="flex-1 accent-wa-teal h-1.5"
                  />
                  <button
                    type="button"
                    onClick={() => updateItemSize(activeSelectedItem.id, selectedItemType, +6)}
                    className="w-6 h-6 rounded-md bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center font-bold text-sm"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItemId(null)}
                    className="text-[10px] text-neutral-300 hover:text-white px-2 py-0.5 rounded bg-neutral-800 font-semibold"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── DUAL-HANDLE VIDEO TRIMMER BAR (Pure Dark Mode) ──────────────── */}
        {mediaType === 'video' && mediaSrc && videoDuration > 0 && (
          <div className="relative z-30 px-3.5 py-2.5 bg-[#111b21] border-t border-neutral-800 text-white text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold flex items-center gap-1 text-wa-teal">
                <span>✂️ Video Trimmer</span>
                <span className="text-[10px] text-neutral-400">(Max 30s)</span>
              </span>
              <span className="font-mono text-neutral-300">
                {trimStart}s - {trimEnd}s <span className="text-wa-teal font-bold">({trimEnd - trimStart}s)</span>
              </span>
            </div>

            <div className="relative w-full h-3 bg-neutral-800 rounded-full overflow-hidden mb-2">
              <div
                className="absolute top-0 bottom-0 bg-wa-teal rounded-full transition-all"
                style={{
                  left: `${(trimStart / videoDuration) * 100}%`,
                  width: `${((trimEnd - trimStart) / videoDuration) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Start: {trimStart}s</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTrimStartChange(trimStart - 1)}
                      className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    >
                      -1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrimStartChange(trimStart + 1)}
                      className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
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

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>End: {trimEnd}s</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTrimEndChange(trimEnd - 1)}
                      className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                    >
                      -1s
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTrimEndChange(trimEnd + 1)}
                      className="px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
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

        {/* ── BOTTOM CAPTION, @ MENTION & SEND BAR (Pure Dark Mode) ────────── */}
        <div className="relative z-30 p-3 bg-[#111b21] border-t border-neutral-800/80 flex flex-col gap-2">
          
          {/* Contact Mention Dropdown Popup (Dark Theme & Full Directory Search) */}
          {showMentionPicker && (
            <div
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              className="absolute inset-x-3 bottom-16 z-50 p-3 bg-[#111b21] border border-neutral-700 rounded-2xl shadow-2xl text-white animate-scale-in"
            >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
                <span className="text-xs font-bold text-wa-teal">@ Mention Contact in Status</span>
                <button
                  type="button"
                  onClick={() => setShowMentionPicker(false)}
                  className="text-neutral-400 hover:text-white text-xs px-2"
                >
                  ✕
                </button>
              </div>

              {/* Search contacts input */}
              <div className="relative mb-2">
                <input
                  type="text"
                  autoFocus
                  value={mentionSearch}
                  onChange={(e) => setMentionSearch(e.target.value)}
                  placeholder="Search by name or phone number..."
                  className="w-full pl-8 pr-7 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-wa-teal"
                />
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                  🔍
                </span>
                {mentionSearch && (
                  <button
                    type="button"
                    onClick={() => setMentionSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs p-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Contacts list with isolated overscroll contain */}
              <div
                onWheel={(e) => e.stopPropagation()}
                className="max-h-56 overflow-y-auto overscroll-contain custom-scroll flex flex-col gap-1 pr-1 touch-pan-y"
                style={{ overscrollBehavior: 'contain' }}
              >
                {filteredContacts.length === 0 ? (
                  <div className="py-6 text-center text-neutral-400 text-xs">
                    {contactDirectory.length === 0
                      ? 'Loading contacts directory...'
                      : 'No matching contacts found'}
                  </div>
                ) : (
                  filteredContacts.map((contact, idx) => {
                    const displayName = contact.name || 'Unnamed Contact';
                    const displayPhone = contact.phone || '';
                    return (
                      <button
                        key={contact.phone || contact._id || idx}
                        type="button"
                        onClick={() => handleSelectMention(contact)}
                        className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-800 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-wa-teal/20 text-wa-teal border border-wa-teal/40 flex items-center justify-center font-bold text-xs shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {displayName}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {displayPhone}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-wa-teal bg-wa-teal/15 px-2.5 py-1 rounded-md">
                          Tag
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Mentioned contacts badges */}
          {mentionedContacts.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 custom-scroll">
              <span className="text-[10px] text-wa-teal font-bold shrink-0">Tagged:</span>
              {mentionedContacts.map((m) => (
                <div
                  key={m.phone}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-wa-teal/20 border border-wa-teal/40 text-wa-teal text-[10px] font-semibold shrink-0"
                >
                  <span>@{m.name || m.phone}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMentionTag(m.phone)}
                    className="hover:text-red-400 font-bold ml-0.5"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Caption Input Bar with @ Mention trigger & Send Button */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full bg-neutral-800/90 border border-neutral-700 text-white text-sm focus-within:border-wa-teal focus-within:bg-neutral-900 transition-all">
              {/* @ Mention button */}
              <button
                type="button"
                onClick={() => setShowMentionPicker((p) => !p)}
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  showMentionPicker ? 'bg-wa-teal text-white' : 'hover:bg-neutral-700 text-neutral-300'
                }`}
                title="Mention a contact (@)"
              >
                @
              </button>

              <input
                ref={captionInputRef}
                type="text"
                value={caption}
                onChange={(e) => {
                  const val = e.target.value;
                  setCaption(val);
                  if (val.endsWith('@')) {
                    setShowMentionPicker(true);
                  }
                }}
                placeholder="Add a caption... (use @ to mention)"
                className="w-full bg-transparent text-white placeholder-neutral-500 text-xs sm:text-sm focus:outline-none"
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
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
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
