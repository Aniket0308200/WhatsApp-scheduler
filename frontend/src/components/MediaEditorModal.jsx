import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  '#000000', // Black
  '#25D366', // WhatsApp Green
  '#34B7F1', // Sky Blue
  '#FFD700', // Gold / Yellow
  '#FF3B30', // Red
  '#FF2D55', // Pink
  '#AF52DE', // Purple
  '#FF9500', // Orange
  'transparent', // Transparent fill
];

// ─── 10 WhatsApp Fonts ────────────────────────────────────────────────────────
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

// ─── 10 Text Box Shapes / Labels ─────────────────────────────────────────────
const BOX_SHAPES = [
  { id: 'pill', name: 'Pill', icon: '💊', desc: 'Classic Rounded' },
  { id: 'rounded', name: 'Rounded', icon: '🔲', desc: 'Smooth Card' },
  { id: 'sharp', name: 'Square', icon: '⏹️', desc: 'Crisp Rectangle' },
  { id: 'oval', name: 'Oval', icon: '🥚', desc: 'Stadium Oval' },
  { id: 'tag', name: 'Tag / Label', icon: '🏷️', desc: 'Pointed Tag' },
  { id: 'badge', name: 'Badge', icon: '⬢', desc: 'Hexagon Badge' },
  { id: 'bubble', name: 'Speech Bubble', icon: '💬', desc: 'Chat Bubble' },
  { id: 'ticket', name: 'Ticket', icon: '🎟️', desc: 'Coupon Ticket' },
  { id: 'banner', name: 'Ribbon', icon: '🎗️', desc: 'Banner Ribbon' },
  { id: 'starburst', name: 'Starburst', icon: '💥', desc: 'Comic Burst' },
];

// ─── Interactive Standalone Shapes (Selectable, Resizable, Movable) ──────────
const SHAPE_PRESETS = [
  { id: 'arrow', label: 'Arrow', icon: '↗️', desc: 'Directional Arrow' },
  { id: 'rect', label: 'Box', icon: '⏹️', desc: 'Rectangle Box' },
  { id: 'rounded', label: 'Rounded Box', icon: '🔲', desc: 'Rounded Card' },
  { id: 'circle', label: 'Circle / Oval', icon: '⭕', desc: 'Circle or Ellipse' },
  { id: 'line', label: 'Straight Line', icon: '📏', desc: 'Horizontal Line' },
  { id: 'star', label: 'Star', icon: '⭐', desc: '5-Point Star' },
  { id: 'tag', label: 'Tag Badge', icon: '🏷️', desc: 'Pointed Label' },
  { id: 'bubble', label: 'Speech Bubble', icon: '💬', desc: 'Callout Bubble' },
];

// ─── CSS Box Shape Generator ────────────────────────────────────────────────
const getBoxShapeStyles = (shapeId = 'pill', padX = 14, padY = 6) => {
  const base = {
    padding: `${padY}px ${padX}px`,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    position: 'relative',
  };

  switch (shapeId) {
    case 'pill':
      return { ...base, borderRadius: '9999px' };
    case 'rounded':
      return { ...base, borderRadius: '16px' };
    case 'sharp':
      return { ...base, borderRadius: '4px' };
    case 'oval':
      return { ...base, borderRadius: '50% / 100%' };
    case 'tag':
      return {
        ...base,
        padding: `${padY}px ${padX + 8}px ${padY}px ${padX + 16}px`,
        clipPath: 'polygon(16px 0%, 100% 0%, 100% 100%, 16px 100%, 0% 50%)',
      };
    case 'badge':
      return {
        ...base,
        padding: `${padY}px ${padX + 14}px`,
        clipPath: 'polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)',
      };
    case 'bubble':
      return {
        ...base,
        padding: `${padY}px ${padX}px ${padY + 8}px ${padX}px`,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 78%, 24px 78%, 12px 100%, 15px 78%, 0% 78%)',
      };
    case 'ticket':
      return {
        ...base,
        padding: `${padY}px ${padX + 10}px`,
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 32%, 93% 50%, 100% 68%, 100% 100%, 0% 100%, 0% 68%, 7% 50%, 0% 32%)',
      };
    case 'banner':
      return {
        ...base,
        padding: `${padY}px ${padX + 14}px`,
        clipPath: 'polygon(0% 0%, 100% 0%, calc(100% - 14px) 50%, 100% 100%, 0% 100%, 14px 50%)',
      };
    case 'starburst':
      return {
        ...base,
        padding: `${padY + 6}px ${padX + 14}px`,
        clipPath: 'polygon(50% 0%, 65% 15%, 85% 5%, 85% 28%, 100% 38%, 90% 58%, 100% 75%, 80% 82%, 75% 100%, 55% 90%, 40% 100%, 30% 85%, 10% 90%, 15% 70%, 0% 60%, 12% 42%, 0% 25%, 20% 20%, 25% 0%, 42% 12%)',
      };
    default:
      return { ...base, borderRadius: '9999px' };
  }
};

// ─── Canvas Box Shape Drawer ────────────────────────────────────────────────
const drawBoxShapeOnCanvas = (ctx, shapeId, x, y, w, h) => {
  ctx.beginPath();
  switch (shapeId) {
    case 'pill':
      ctx.roundRect(x, y, w, h, Math.min(w, h) / 2);
      break;
    case 'rounded':
      ctx.roundRect(x, y, w, h, 16);
      break;
    case 'sharp':
      ctx.rect(x, y, w, h);
      break;
    case 'oval':
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'tag':
      ctx.moveTo(x + 16, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + 16, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      break;
    case 'badge':
      ctx.moveTo(x + 14, y);
      ctx.lineTo(x + w - 14, y);
      ctx.lineTo(x + w, y + h / 2);
      ctx.lineTo(x + w - 14, y + h);
      ctx.lineTo(x + 14, y + h);
      ctx.lineTo(x, y + h / 2);
      ctx.closePath();
      break;
    case 'bubble':
      ctx.roundRect(x, y, w, h * 0.8, 12);
      ctx.moveTo(x + 20, y + h * 0.8);
      ctx.lineTo(x + 10, y + h);
      ctx.lineTo(x + 28, y + h * 0.8);
      break;
    case 'ticket':
      ctx.rect(x, y, w, h);
      break;
    case 'banner':
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - 14, y + h / 2);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + 14, y + h / 2);
      ctx.closePath();
      break;
    case 'starburst':
      ctx.roundRect(x, y, w, h, 16);
      break;
    default:
      ctx.roundRect(x, y, w, h, Math.min(w, h) / 2);
      break;
  }
};

export default function MediaEditorModal({
  isOpen,
  onClose,
  mediaItem,
  onSave,
  plan = 'pro',
  onUpgrade,
}) {
  if (!isOpen || !mediaItem) return null;

  // Active Tool Mode: null | 'shapes' | 'draw' | 'text' | 'sticker' | 'blur'
  const [activeTool, setActiveTool] = useState(null);

  // 1. Shapes State (Interactive Selectable Layers)
  const [shapes, setShapes] = useState([]);

  // 2. Text Elements State
  const [textElements, setTextElements] = useState([]);

  // 3. Stickers & Emojis State
  const [stickers, setStickers] = useState([]);
  const [stickerPickerTab, setStickerPickerTab] = useState('emoji'); // 'emoji' | 'giphy' | 'trending'
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyResults, setGiphyResults] = useState([]);
  const [loadingGiphy, setLoadingGiphy] = useState(false);

  // Selection & Dragging
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'shape' | 'text' | 'sticker'
  const [draggingItem, setDraggingItem] = useState(null);

  // 4. Freehand Pen & Blur Drawing on Base Canvas
  const [penColor, setPenColor] = useState('#25D366');
  const [penWidth, setPenWidth] = useState(6);
  const [strokes, setStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);

  // Canvas & Image Refs
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const imageElementRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const mediaSrc = mediaItem.preview || mediaItem.data;

  // Initialize Base Image
  useEffect(() => {
    if (!mediaSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = mediaSrc;
    img.onload = () => {
      imageElementRef.current = img;
      setImageLoaded(true);
      redrawCanvas();
    };
  }, [mediaSrc]);

  // Redraw Canvas (base photo + freehand pen strokes & blur redaction)
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElementRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imageElementRef.current;

    canvas.width = img.naturalWidth || 1080;
    canvas.height = img.naturalHeight || 1080;

    // 1. Draw base photo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. Render freehand strokes & blur boxes
    strokes.forEach((stroke) => {
      ctx.lineWidth = stroke.width || 6;
      ctx.strokeStyle = stroke.color || '#25D366';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'brush' && stroke.points?.length > 0) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.tool === 'blur' && stroke.start && stroke.end) {
        // Redaction pixelate
        const x = Math.round(Math.min(stroke.start.x, stroke.end.x));
        const y = Math.round(Math.min(stroke.start.y, stroke.end.y));
        const w = Math.round(Math.abs(stroke.end.x - stroke.start.x));
        const h = Math.round(Math.abs(stroke.end.y - stroke.start.y));

        if (w > 2 && h > 2) {
          try {
            const pixelSize = Math.max(12, Math.round(stroke.width * 2));
            const imgData = ctx.getImageData(x, y, w, h);
            const d = imgData.data;

            for (let py = 0; py < h; py += pixelSize) {
              for (let px = 0; px < w; px += pixelSize) {
                const idx = (py * w + px) * 4;
                const r = d[idx];
                const g = d[idx + 1];
                const b = d[idx + 2];
                for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
                  for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
                    const tIdx = ((py + dy) * w + (px + dx)) * 4;
                    d[tIdx] = r;
                    d[tIdx + 1] = g;
                    d[tIdx + 2] = b;
                  }
                }
              }
            }
            ctx.putImageData(imgData, x, y);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
          } catch {}
        }
      }
    });

    // 3. Live temporary stroke while drawing
    if (currentStroke) {
      ctx.lineWidth = currentStroke.width || 6;
      ctx.strokeStyle = currentStroke.color || '#25D366';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentStroke.tool === 'brush' && currentStroke.points?.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
        for (let i = 1; i < currentStroke.points.length; i++) {
          ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
        }
        ctx.stroke();
      } else if (currentStroke.tool === 'blur' && currentStroke.start && currentStroke.end) {
        const x = Math.min(currentStroke.start.x, currentStroke.end.x);
        const y = Math.min(currentStroke.start.y, currentStroke.end.y);
        const w = Math.abs(currentStroke.end.x - currentStroke.start.x);
        const h = Math.abs(currentStroke.end.y - currentStroke.start.y);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = '#34B7F1';
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
      }
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    if (imageLoaded) redrawCanvas();
  }, [strokes, currentStroke, imageLoaded, redrawCanvas]);

  // Convert client mouse/touch to Canvas coordinates
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

  // Freehand Pen / Blur mouse events
  const handleCanvasMouseDown = (e) => {
    if (activeTool !== 'draw' && activeTool !== 'blur') return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);

    if (activeTool === 'draw') {
      setCurrentStroke({
        tool: 'brush',
        color: penColor,
        width: penWidth,
        points: [coords],
      });
    } else if (activeTool === 'blur') {
      setCurrentStroke({
        tool: 'blur',
        width: penWidth,
        start: coords,
        end: coords,
      });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || !currentStroke) return;
    const coords = getCanvasCoords(e);

    if (currentStroke.tool === 'brush') {
      setCurrentStroke((prev) => ({
        ...prev,
        points: [...prev.points, coords],
      }));
    } else if (currentStroke.tool === 'blur') {
      setCurrentStroke((prev) => ({
        ...prev,
        end: coords,
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    setStrokes((prev) => [...prev, currentStroke]);
    setCurrentStroke(null);
  };

  // ─── ADD INTERACTIVE SHAPES ────────────────────────────────────────────────
  const handleAddShape = (shapeType) => {
    const newShape = {
      id: Date.now().toString(),
      type: shapeType, // 'arrow' | 'rect' | 'rounded' | 'circle' | 'line' | 'star' | 'tag' | 'bubble'
      x: 50,
      y: 50,
      width: shapeType === 'line' ? 180 : shapeType === 'arrow' ? 160 : 130,
      height: shapeType === 'line' ? 8 : shapeType === 'arrow' ? 44 : 90,
      strokeColor: '#25D366',
      bgColor: shapeType === 'rect' || shapeType === 'rounded' || shapeType === 'circle' ? 'transparent' : '#25D366',
      fill: false,
      strokeWidth: 4,
      rotation: 0,
    };
    setShapes((prev) => [...prev, newShape]);
    setSelectedItemId(newShape.id);
    setSelectedItemType('shape');
    setActiveTool(null);
    toast.success(`Added ${shapeType.toUpperCase()} shape`);
  };

  // ─── ADD TEXT ─────────────────────────────────────────────────────────────
  const handleAddText = () => {
    const newText = {
      id: Date.now().toString(),
      text: 'Sample Text',
      font: STATUS_FONTS[0],
      color: '#FFFFFF',
      bgColor: '#000000',
      boxShape: 'pill',
      paddingX: 16,
      paddingY: 8,
      size: 38,
      x: 50,
      y: 50,
    };
    setTextElements((prev) => [...prev, newText]);
    setSelectedItemId(newText.id);
    setSelectedItemType('text');
    setActiveTool('text');
  };

  // ─── ADD STICKER / EMOJI ──────────────────────────────────────────────────
  const handleAddEmoji = (emojiObj) => {
    const emoji = emojiObj.emoji;
    if (!emoji) return;
    const newSticker = {
      id: Date.now().toString(),
      type: 'emoji',
      content: emoji,
      x: 45 + (stickers.length % 4) * 8,
      y: 50,
      size: 54,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedItemId(newSticker.id);
    setSelectedItemType('sticker');
    toast.success('Emoji attached!');
  };

  const handleAddGiphyMedia = (item) => {
    const imgUrl = item.images?.fixed_height?.url || item.images?.original?.url;
    if (!imgUrl) return;
    const newSticker = {
      id: Date.now().toString(),
      type: 'image',
      content: imgUrl,
      x: 45 + (stickers.length % 4) * 8,
      y: 50,
      size: 100,
    };
    setStickers((prev) => [...prev, newSticker]);
    setSelectedItemId(newSticker.id);
    setSelectedItemType('sticker');
    toast.success('Sticker attached!');
  };

  // ─── DRAGGING & SELECTION HANDLERS ─────────────────────────────────────────
  const handleDragStart = (e, type, id, currentX, currentY) => {
    if (activeTool === 'draw' || activeTool === 'blur') return;
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

    if (draggingItem.type === 'shape') {
      setShapes((prev) =>
        prev.map((s) => (s.id === draggingItem.id ? { ...s, x: newX, y: newY } : s))
      );
    } else if (draggingItem.type === 'text') {
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

  // ─── RESIZE / SIZE STEPPERS ───────────────────────────────────────────────
  const handleUpdateItemSize = (id, type, delta) => {
    if (type === 'shape') {
      setShapes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                width: Math.max(30, Math.min(400, s.width + delta * 1.5)),
                height: Math.max(10, Math.min(400, s.height + delta)),
              }
            : s
        )
      );
    } else if (type === 'text') {
      setTextElements((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, size: Math.max(18, Math.min(120, (t.size || 38) + delta)) } : t
        )
      );
    } else if (type === 'sticker') {
      setStickers((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, size: Math.max(24, Math.min(260, (s.size || 54) + delta)) } : s
        )
      );
    }
  };

  // ─── DELETE SELECTED ITEM ─────────────────────────────────────────────────
  const handleDeleteItem = (id, type) => {
    if (type === 'shape') {
      setShapes((prev) => prev.filter((s) => s.id !== id));
    } else if (type === 'text') {
      setTextElements((prev) => prev.filter((t) => t.id !== id));
    } else if (type === 'sticker') {
      setStickers((prev) => prev.filter((s) => s.id !== id));
    }
    if (selectedItemId === id) {
      setSelectedItemId(null);
      setSelectedItemType(null);
    }
  };

  // ─── FINAL BAKE & SAVE ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!imageElementRef.current) return;
    const toastId = toast.loading('Applying edits & rendering photo...');

    try {
      const bakeCanvas = document.createElement('canvas');
      const baseCanvas = canvasRef.current;
      bakeCanvas.width = baseCanvas.width;
      bakeCanvas.height = baseCanvas.height;
      const ctx = bakeCanvas.getContext('2d');

      // 1. Draw base photo + freehand pen strokes
      ctx.drawImage(baseCanvas, 0, 0);

      // Scale factor relative to viewport
      const scale = bakeCanvas.width / 450;

      // 2. Draw Interactive Shapes
      shapes.forEach((s) => {
        const posX = (s.x / 100) * bakeCanvas.width;
        const posY = (s.y / 100) * bakeCanvas.height;
        const w = s.width * scale * 0.7;
        const h = s.height * scale * 0.7;

        ctx.save();
        ctx.translate(posX, posY);
        if (s.rotation) ctx.rotate((s.rotation * Math.PI) / 180);

        ctx.lineWidth = (s.strokeWidth || 4) * scale * 0.5;
        ctx.strokeStyle = s.strokeColor || '#25D366';
        ctx.fillStyle = s.bgColor === 'transparent' ? 'rgba(0,0,0,0)' : s.bgColor || '#25D366';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (s.type === 'rect') {
          if (s.fill && s.bgColor !== 'transparent') ctx.fillRect(-w / 2, -h / 2, w, h);
          ctx.strokeRect(-w / 2, -h / 2, w, h);
        } else if (s.type === 'rounded') {
          ctx.beginPath();
          ctx.roundRect(-w / 2, -h / 2, w, h, 16 * scale * 0.5);
          if (s.fill && s.bgColor !== 'transparent') ctx.fill();
          ctx.stroke();
        } else if (s.type === 'circle') {
          ctx.beginPath();
          ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          if (s.fill && s.bgColor !== 'transparent') ctx.fill();
          ctx.stroke();
        } else if (s.type === 'line') {
          ctx.beginPath();
          ctx.moveTo(-w / 2, 0);
          ctx.lineTo(w / 2, 0);
          ctx.stroke();
        } else if (s.type === 'arrow') {
          // Draw Directional Arrow
          const fromX = -w / 2;
          const toX = w / 2;
          const headLen = Math.max(16, ctx.lineWidth * 3.5);

          ctx.beginPath();
          ctx.moveTo(fromX, 0);
          ctx.lineTo(toX, 0);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(toX, 0);
          ctx.lineTo(toX - headLen * Math.cos(-Math.PI / 6), -headLen * Math.sin(-Math.PI / 6));
          ctx.moveTo(toX, 0);
          ctx.lineTo(toX - headLen * Math.cos(Math.PI / 6), -headLen * Math.sin(Math.PI / 6));
          ctx.stroke();
        } else if (s.type === 'star') {
          ctx.beginPath();
          const spikes = 5;
          const outerR = Math.min(w, h) / 2;
          const innerR = outerR / 2.2;
          let rot = (Math.PI / 2) * 3;
          let cx = 0;
          let cy = 0;
          let x = cx;
          let y = cy;
          const step = Math.PI / spikes;

          ctx.moveTo(cx, cy - outerR);
          for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerR;
            y = cy + Math.sin(rot) * outerR;
            ctx.lineTo(x, y);
            rot += step;

            x = cx + Math.cos(rot) * innerR;
            y = cy + Math.sin(rot) * innerR;
            ctx.lineTo(x, y);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerR);
          ctx.closePath();
          if (s.fill && s.bgColor !== 'transparent') ctx.fill();
          ctx.stroke();
        } else {
          // Default Shape (tag / bubble)
          drawBoxShapeOnCanvas(ctx, s.type, -w / 2, -h / 2, w, h);
          if (s.fill && s.bgColor !== 'transparent') ctx.fill();
          ctx.stroke();
        }

        ctx.restore();
      });

      // 3. Draw Stickers & Emojis
      for (const s of stickers) {
        const posX = (s.x / 100) * bakeCanvas.width;
        const posY = (s.y / 100) * bakeCanvas.height;
        const renderSize = (s.size || 54) * scale * 0.7;

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
          } catch {}
        }
      }

      // 4. Draw Text Overlays
      textElements.forEach((t) => {
        const posX = (t.x / 100) * bakeCanvas.width;
        const posY = (t.y / 100) * bakeCanvas.height;
        const fontPx = Math.round((t.size || 38) * scale * 0.7);
        const fontFamily = t.font?.family || 'sans-serif';

        ctx.font = `bold ${fontPx}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(t.text);
        const textW = metrics.width;
        const padX = Math.round((t.paddingX ?? 16) * scale * 0.7);
        const padY = Math.round((t.paddingY ?? 8) * scale * 0.7);
        const pillH = fontPx + padY * 2;
        const pillW = textW + padX * 2;
        const rectX = posX - pillW / 2;
        const rectY = posY - pillH / 2;

        // Draw Box Background
        if (t.bgColor && t.bgColor !== 'transparent') {
          ctx.fillStyle = t.bgColor;
          drawBoxShapeOnCanvas(ctx, t.boxShape || 'pill', rectX, rectY, pillW, pillH);
          ctx.fill();
        }

        // Draw Text
        ctx.fillStyle = t.color || '#FFFFFF';
        ctx.fillText(t.text, posX, posY);
      });

      const finalDataUrl = bakeCanvas.toDataURL('image/jpeg', 0.95);

      onSave({
        ...mediaItem,
        data: finalDataUrl,
        preview: finalDataUrl,
        isEdited: true,
      });

      toast.success('🎨 Image updated with edits!', { id: toastId });
      onClose();
    } catch (err) {
      toast.error('Failed to save edited media: ' + err.message, { id: toastId });
    }
  };

  const selectedShape = shapes.find((s) => s.id === selectedItemId);
  const selectedText = textElements.find((t) => t.id === selectedItemId);
  const selectedSticker = stickers.find((s) => s.id === selectedItemId);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex flex-col justify-between text-white select-none animate-fade-in"
      onMouseMove={handleDragMove}
      onTouchMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
      onClick={() => {
        // Deselect if clicked on backdrop
        if (selectedItemId && !draggingItem) {
          setSelectedItemId(null);
          setSelectedItemType(null);
        }
      }}
    >
      {/* ── Top Bar ── */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-black/70 border-b border-white/10 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-colors cursor-pointer"
            title="Cancel"
          >
            ✕
          </button>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🎨</span> Smart Media &amp; Photo Editor
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-purple-500 text-black">
                PRO
              </span>
            </h3>
            <p className="text-[10px] text-white/60 truncate max-w-[200px]">{mediaItem.name}</p>
          </div>
        </div>

        {/* Action Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Shapes Picker Toggle */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'shapes' ? null : 'shapes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'shapes'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>↗️</span>
            <span>Shapes &amp; Arrows</span>
          </button>

          {/* Add Text Button */}
          <button
            type="button"
            onClick={handleAddText}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'text'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>✍️</span>
            <span>Add Text</span>
          </button>

          {/* Emojis, Stickers & GIFs Drawer Toggle */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'sticker' ? null : 'sticker')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'sticker'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>😊</span>
            <span>Stickers / GIFs</span>
          </button>

          {/* Freehand Pen */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'draw' ? null : 'draw')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'draw'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Freehand Doodle"
          >
            <span>✏️</span>
            <span className="hidden sm:inline">Doodle</span>
          </button>

          {/* Blur / Redact Tool */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'blur' ? null : 'blur')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              activeTool === 'blur'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Redact sensitive phone/face with blur"
          >
            <span>🪟</span>
            <span className="hidden sm:inline">Blur</span>
          </button>

          {/* Clear all strokes */}
          {strokes.length > 0 && (
            <button
              type="button"
              onClick={() => setStrokes([])}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/40 text-xs font-bold text-rose-300 transition-colors cursor-pointer"
              title="Clear drawings & blur"
            >
              Clear
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ml-2"
          >
            <span>✓</span>
            <span>Apply &amp; Save</span>
          </button>
        </div>
      </div>

      {/* ── Sub Toolbars ── */}

      {/* 1. Shapes Palette Sub-Bar */}
      {activeTool === 'shapes' && (
        <div
          className="bg-slate-900/95 border-b border-white/10 px-4 py-2.5 flex items-center gap-2 overflow-x-auto custom-scroll z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs font-bold text-white/70 whitespace-nowrap">Add Shape:</span>
          {SHAPE_PRESETS.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => handleAddShape(sp.id)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-purple-600/80 text-white text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer hover:scale-105"
              title={sp.desc}
            >
              <span>{sp.icon}</span>
              <span>{sp.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 2. Selected Shape Properties Sub-Bar */}
      {selectedShape && (
        <div
          className="bg-slate-900/95 border-b border-purple-500/40 px-4 py-2 flex items-center justify-between gap-3 flex-wrap z-20 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 flex-wrap text-xs">
            <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <span>Selected {selectedShape.type.toUpperCase()}</span>
            </span>

            {/* Stroke Color */}
            <div className="flex items-center gap-1">
              <span className="text-white/60">Border:</span>
              {COLOR_PALETTE.filter((c) => c !== 'transparent').map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setShapes((prev) =>
                      prev.map((s) => (s.id === selectedShape.id ? { ...s, strokeColor: c } : s))
                    )
                  }
                  className={`w-5 h-5 rounded-full border cursor-pointer ${
                    selectedShape.strokeColor === c ? 'scale-125 border-white ring-2 ring-purple-400' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Background / Fill Color */}
            <div className="flex items-center gap-1">
              <span className="text-white/60">Fill / BG:</span>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setShapes((prev) =>
                      prev.map((s) =>
                        s.id === selectedShape.id
                          ? { ...s, bgColor: c, fill: c !== 'transparent' }
                          : s
                      )
                    )
                  }
                  className={`w-5 h-5 rounded-full border cursor-pointer ${
                    selectedShape.bgColor === c ? 'scale-125 border-white ring-2 ring-purple-400' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: c === 'transparent' ? '#1e293b' : c }}
                  title={c === 'transparent' ? 'No Fill (Transparent)' : c}
                >
                  {c === 'transparent' && <span className="text-[10px] text-white/60">∅</span>}
                </button>
              ))}
            </div>

            {/* Stroke Thickness */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/60">Width:</span>
              <input
                type="range"
                min="2"
                max="24"
                value={selectedShape.strokeWidth || 4}
                onChange={(e) =>
                  setShapes((prev) =>
                    prev.map((s) =>
                      s.id === selectedShape.id ? { ...s, strokeWidth: Number(e.target.value) } : s
                    )
                  )
                }
                className="w-16 accent-purple-500"
              />
              <span className="text-[10px] font-mono">{selectedShape.strokeWidth}px</span>
            </div>
          </div>

          {/* Quick Steppers & Delete */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleUpdateItemSize(selectedShape.id, 'shape', 15)}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
              title="Increase Size"
            >
              ➕ Bigger
            </button>
            <button
              type="button"
              onClick={() => handleUpdateItemSize(selectedShape.id, 'shape', -15)}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
              title="Decrease Size"
            >
              ➖ Smaller
            </button>
            <button
              type="button"
              onClick={() => handleDeleteItem(selectedShape.id, 'shape')}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      {/* 3. Selected Text Properties Sub-Bar */}
      {selectedText && (
        <div
          className="bg-slate-900/95 border-b border-purple-500/40 px-4 py-2.5 space-y-2 z-20 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Text Input */}
            <input
              type="text"
              value={selectedText.text}
              onChange={(e) =>
                setTextElements((prev) =>
                  prev.map((t) => (t.id === selectedText.id ? { ...t, text: e.target.value } : t))
                )
              }
              placeholder="Edit text..."
              className="flex-1 max-w-xs px-3 py-1 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Font Picker */}
            <select
              value={selectedText.font?.id || 'sans'}
              onChange={(e) => {
                const f = STATUS_FONTS.find((font) => font.id === e.target.value);
                setTextElements((prev) =>
                  prev.map((t) => (t.id === selectedText.id ? { ...t, font: f } : t))
                );
              }}
              className="text-xs px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none cursor-pointer"
            >
              {STATUS_FONTS.map((f) => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  Font: {f.name}
                </option>
              ))}
            </select>

            {/* 10 Box Shapes Picker */}
            <select
              value={selectedText.boxShape || 'pill'}
              onChange={(e) =>
                setTextElements((prev) =>
                  prev.map((t) => (t.id === selectedText.id ? { ...t, boxShape: e.target.value } : t))
                )
              }
              className="text-xs px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none cursor-pointer"
            >
              {BOX_SHAPES.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  Shape: {s.icon} {s.name}
                </option>
              ))}
            </select>

            {/* Size Steppers */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleUpdateItemSize(selectedText.id, 'text', 6)}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => handleUpdateItemSize(selectedText.id, 'text', -6)}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
              >
                A-
              </button>
            </div>

            {/* Delete Text */}
            <button
              type="button"
              onClick={() => handleDeleteItem(selectedText.id, 'text')}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              🗑️ Delete
            </button>
          </div>

          {/* Text Color & Background Fill Color Pickers */}
          <div className="flex items-center gap-4 flex-wrap text-xs">
            {/* Text Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/60">Text Color:</span>
              {COLOR_PALETTE.filter((c) => c !== 'transparent').map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setTextElements((prev) =>
                      prev.map((t) => (t.id === selectedText.id ? { ...t, color: c } : t))
                    )
                  }
                  className={`w-5 h-5 rounded-full border cursor-pointer ${
                    selectedText.color === c ? 'scale-125 border-white ring-2 ring-purple-400' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Background Color */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/60">Background:</span>
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setTextElements((prev) =>
                      prev.map((t) => (t.id === selectedText.id ? { ...t, bgColor: c } : t))
                    )
                  }
                  className={`w-5 h-5 rounded-full border cursor-pointer ${
                    selectedText.bgColor === c ? 'scale-125 border-white ring-2 ring-purple-400' : 'border-white/30'
                  }`}
                  style={{ backgroundColor: c === 'transparent' ? '#1e293b' : c }}
                  title={c === 'transparent' ? 'Transparent' : c}
                >
                  {c === 'transparent' && <span className="text-[10px] text-white/60">∅</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Freehand Pen Sub-Bar */}
      {activeTool === 'draw' && (
        <div
          className="bg-slate-900/95 border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 flex-wrap z-20 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-white/80">✏️ Doodle Pen:</span>
            {COLOR_PALETTE.filter((c) => c !== 'transparent').map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPenColor(c)}
                className={`w-5 h-5 rounded-full border cursor-pointer ${
                  penColor === c ? 'scale-125 border-white ring-2 ring-purple-400' : 'border-white/30'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/60">Thickness:</span>
            <input
              type="range"
              min="2"
              max="28"
              value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
              className="w-20 accent-purple-500"
            />
            <span className="font-mono text-[10px]">{penWidth}px</span>
          </div>
        </div>
      )}

      {/* 5. Blur Tool Sub-Bar */}
      {activeTool === 'blur' && (
        <div
          className="bg-slate-900/95 border-b border-white/10 px-4 py-2 flex items-center justify-between gap-3 flex-wrap z-20 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-xs text-purple-300">
            <span>🪟</span>
            <span className="font-bold">Redaction Blur Tool:</span>
            <span className="text-white/70">Drag a box over faces, phone numbers, or text to pixelate &amp; hide.</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/60">Blur Size:</span>
            <input
              type="range"
              min="6"
              max="24"
              value={penWidth}
              onChange={(e) => setPenWidth(Number(e.target.value))}
              className="w-20 accent-purple-500"
            />
          </div>
        </div>
      )}

      {/* ── Main Viewport + Side Panel Layout ── */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Center Viewport Canvas */}
        <div
          ref={viewportRef}
          className="flex-1 relative flex items-center justify-center p-3 sm:p-5 overflow-hidden touch-none"
        >
          <div className="relative max-w-full max-h-[76vh] flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black">
            {/* HTML5 Base Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onTouchStart={handleCanvasMouseDown}
              onTouchMove={handleCanvasMouseMove}
              onTouchEnd={handleCanvasMouseUp}
              className={`max-w-full max-h-[76vh] object-contain block ${
                activeTool === 'draw' || activeTool === 'blur' ? 'cursor-crosshair' : 'cursor-default'
              }`}
            />

            {/* ── Interactive Shapes Layer ── */}
            {shapes.map((s) => {
              const isSelected = selectedItemId === s.id;
              return (
                <div
                  key={s.id}
                  onMouseDown={(e) => handleDragStart(e, 'shape', s.id, s.x, s.y)}
                  onTouchStart={(e) => handleDragStart(e, 'shape', s.id, s.x, s.y)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemId(s.id);
                    setSelectedItemType('shape');
                  }}
                  style={{
                    position: 'absolute',
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    width: `${s.width}px`,
                    height: `${s.height}px`,
                    transform: `translate(-50%, -50%) rotate(${s.rotation || 0}deg)`,
                    cursor: activeTool === 'draw' || activeTool === 'blur' ? 'crosshair' : 'move',
                  }}
                  className={`select-none group ${isSelected ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-black' : ''}`}
                >
                  {/* Shape Rendering via SVG for Ultra Sharp Display */}
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${s.width} ${s.height}`}
                    className="overflow-visible pointer-events-none"
                  >
                    {s.type === 'rect' && (
                      <rect
                        x={s.strokeWidth}
                        y={s.strokeWidth}
                        width={s.width - s.strokeWidth * 2}
                        height={s.height - s.strokeWidth * 2}
                        stroke={s.strokeColor}
                        strokeWidth={s.strokeWidth}
                        fill={s.bgColor === 'transparent' ? 'none' : s.bgColor}
                      />
                    )}
                    {s.type === 'rounded' && (
                      <rect
                        x={s.strokeWidth}
                        y={s.strokeWidth}
                        width={s.width - s.strokeWidth * 2}
                        height={s.height - s.strokeWidth * 2}
                        rx="16"
                        stroke={s.strokeColor}
                        strokeWidth={s.strokeWidth}
                        fill={s.bgColor === 'transparent' ? 'none' : s.bgColor}
                      />
                    )}
                    {s.type === 'circle' && (
                      <ellipse
                        cx={s.width / 2}
                        cy={s.height / 2}
                        rx={(s.width - s.strokeWidth * 2) / 2}
                        ry={(s.height - s.strokeWidth * 2) / 2}
                        stroke={s.strokeColor}
                        strokeWidth={s.strokeWidth}
                        fill={s.bgColor === 'transparent' ? 'none' : s.bgColor}
                      />
                    )}
                    {s.type === 'line' && (
                      <line
                        x1="0"
                        y1={s.height / 2}
                        x2={s.width}
                        y2={s.height / 2}
                        stroke={s.strokeColor}
                        strokeWidth={s.strokeWidth}
                        strokeLinecap="round"
                      />
                    )}
                    {s.type === 'arrow' && (
                      <g>
                        <line
                          x1="4"
                          y1={s.height / 2}
                          x2={s.width - 16}
                          y2={s.height / 2}
                          stroke={s.strokeColor}
                          strokeWidth={s.strokeWidth}
                          strokeLinecap="round"
                        />
                        <polygon
                          points={`${s.width - 2},${s.height / 2} ${s.width - 22},${s.height / 2 - 12} ${s.width - 16},${s.height / 2} ${s.width - 22},${s.height / 2 + 12}`}
                          fill={s.strokeColor}
                        />
                      </g>
                    )}
                    {s.type === 'star' && (
                      <polygon
                        points={`${s.width * 0.5},4 ${s.width * 0.63},${s.height * 0.35} ${s.width * 0.95},${s.height * 0.38} ${s.width * 0.71},${s.height * 0.62} ${s.width * 0.79},${s.height * 0.95} ${s.width * 0.5},${s.height * 0.78} ${s.width * 0.21},${s.height * 0.95} ${s.width * 0.29},${s.height * 0.62} ${s.width * 0.05},${s.height * 0.38} ${s.width * 0.37},${s.height * 0.35}`}
                        stroke={s.strokeColor}
                        strokeWidth={s.strokeWidth}
                        fill={s.bgColor === 'transparent' ? 'none' : s.bgColor}
                      />
                    )}
                    {(s.type === 'tag' || s.type === 'bubble') && (
                      <rect
                        x={s.strokeWidth}
                        y={s.strokeWidth}
                        width={s.width - s.strokeWidth * 2}
                        height={s.height - s.strokeWidth * 2}
                        rx="12"
                        stroke={s.strokeColor}
                        strokeWidth={s.strokeWidth}
                        fill={s.bgColor === 'transparent' ? 'none' : s.bgColor}
                      />
                    )}
                  </svg>

                  {/* Corner Resize & Delete Handles (When Selected) */}
                  {isSelected && (
                    <>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(s.id, 'shape');
                        }}
                        className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 active:scale-95"
                        title="Delete Shape"
                      >
                        ✕
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateItemSize(s.id, 'shape', 15);
                        }}
                        className="absolute -bottom-3 -right-3 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer hover:scale-110 active:scale-95"
                        title="Enlarge Shape"
                      >
                        +
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* ── Interactive Stickers & Emojis Layer ── */}
            {stickers.map((s) => {
              const isSelected = selectedItemId === s.id;
              return (
                <div
                  key={s.id}
                  onMouseDown={(e) => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
                  onTouchStart={(e) => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemId(s.id);
                    setSelectedItemType('sticker');
                  }}
                  style={{
                    position: 'absolute',
                    left: `${s.x}%`,
                    top: `${s.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: activeTool === 'draw' || activeTool === 'blur' ? 'crosshair' : 'move',
                  }}
                  className={`select-none ${isSelected ? 'ring-2 ring-purple-400 rounded-lg p-1' : ''}`}
                >
                  {s.type === 'emoji' ? (
                    <span style={{ fontSize: `${s.size}px`, lineHeight: 1 }}>{s.content}</span>
                  ) : (
                    <img
                      src={s.content}
                      alt="sticker"
                      style={{ width: `${s.size}px`, height: `${s.size}px` }}
                      className="object-contain pointer-events-none"
                    />
                  )}

                  {/* Delete Handle */}
                  {isSelected && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(s.id, 'sticker');
                      }}
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer"
                    >
                      ✕
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Interactive Text Elements Layer ── */}
            {textElements.map((t) => {
              const isSelected = selectedItemId === t.id;
              const shapeStyles = getBoxShapeStyles(t.boxShape, t.paddingX, t.paddingY);

              return (
                <div
                  key={t.id}
                  onMouseDown={(e) => handleDragStart(e, 'text', t.id, t.x, t.y)}
                  onTouchStart={(e) => handleDragStart(e, 'text', t.id, t.x, t.y)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemId(t.id);
                    setSelectedItemType('text');
                  }}
                  style={{
                    position: 'absolute',
                    left: `${t.x}%`,
                    top: `${t.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: activeTool === 'draw' || activeTool === 'blur' ? 'crosshair' : 'move',
                  }}
                  className={`select-none ${isSelected ? 'ring-2 ring-purple-400' : ''}`}
                >
                  <div
                    style={{
                      ...shapeStyles,
                      fontFamily: t.font?.family || 'sans-serif',
                      fontSize: `${t.size}px`,
                      color: t.color || '#FFFFFF',
                      backgroundColor: t.bgColor === 'transparent' ? 'transparent' : t.bgColor || '#000000',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.text}
                  </div>

                  {/* Delete Handle */}
                  {isSelected && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(t.id, 'text');
                      }}
                      className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shadow-md cursor-pointer"
                    >
                      ✕
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Emojis, Stickers & GIFs Side Panel (Compact Width ~30% / 340px) ── */}
        {activeTool === 'sticker' && (
          <div
            className="w-full sm:w-[340px] md:w-[30%] max-w-[380px] h-full bg-slate-900/98 border-l border-white/10 p-3 flex flex-col justify-between z-30 shadow-2xl animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Tabs */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                <div className="flex items-center gap-1.5 p-0.5 bg-white/10 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setStickerPickerTab('emoji')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      stickerPickerTab === 'emoji' ? 'bg-purple-600 text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    😊 Emojis
                  </button>
                  <button
                    type="button"
                    onClick={() => setStickerPickerTab('giphy')}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                      stickerPickerTab === 'giphy' ? 'bg-purple-600 text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    🏷️ Stickers / GIFs
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTool(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white/70 hover:text-white"
                  title="Close panel"
                >
                  ✕
                </button>
              </div>

              {/* Emoji Tab */}
              {stickerPickerTab === 'emoji' && (
                <div className="h-[62vh] overflow-y-auto custom-scroll">
                  <EmojiPicker
                    onEmojiClick={handleAddEmoji}
                    theme={Theme.DARK}
                    emojiStyle={EmojiStyle.APPLE}
                    width="100%"
                    height="100%"
                    searchDisabled={false}
                  />
                </div>
              )}

              {/* Giphy Stickers & GIFs Tab */}
              {stickerPickerTab === 'giphy' && (
                <div className="space-y-2 h-[62vh] flex flex-col">
                  <input
                    type="text"
                    value={giphySearch}
                    onChange={async (e) => {
                      setGiphySearch(e.target.value);
                      if (e.target.value.trim().length > 1) {
                        try {
                          setLoadingGiphy(true);
                          const res = await fetch(
                            `https://api.giphy.com/v1/stickers/search?api_key=${ACTIVE_GIPHY_KEY}&q=${encodeURIComponent(
                              e.target.value
                            )}&limit=24&rating=g`
                          );
                          const data = await res.json();
                          setGiphyResults(data.data || []);
                        } catch {} finally {
                          setLoadingGiphy(false);
                        }
                      }
                    }}
                    placeholder="Search stickers &amp; GIFs..."
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />

                  {/* Quick tags */}
                  <div className="flex gap-1 overflow-x-auto custom-scroll pb-1">
                    {['Party', 'Love', 'Chai', 'Fire', 'Haha', 'Cat', 'Thumbs Up'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={async () => {
                          setGiphySearch(tag);
                          try {
                            setLoadingGiphy(true);
                            const res = await fetch(
                              `https://api.giphy.com/v1/stickers/search?api_key=${ACTIVE_GIPHY_KEY}&q=${encodeURIComponent(
                                tag
                              )}&limit=24&rating=g`
                            );
                            const data = await res.json();
                            setGiphyResults(data.data || []);
                          } catch {} finally {
                            setLoadingGiphy(false);
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-purple-600/80 text-[10px] font-bold whitespace-nowrap cursor-pointer text-white/80"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="flex-1 overflow-y-auto custom-scroll grid grid-cols-3 gap-2 p-1">
                    {loadingGiphy && (
                      <div className="col-span-3 text-center py-8 text-xs text-purple-400">
                        Searching Giphy...
                      </div>
                    )}
                    {giphyResults.map((item) => (
                      <img
                        key={item.id}
                        src={item.images?.fixed_height_small?.url}
                        alt="sticker"
                        onClick={() => handleAddGiphyMedia(item)}
                        className="w-full h-16 object-contain rounded-lg hover:bg-white/15 p-1 cursor-pointer transition-transform hover:scale-110"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-[10px] text-white/50 text-center pt-2 border-t border-white/10">
              Tap any item to add onto photo · Drag &amp; resize freely
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom Help Hint ── */}
      <div className="px-4 py-2 bg-black/70 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
        <span>
          💡 <strong>Tip:</strong> Click any shape, arrow, or text to select it · Use <strong>+ / -</strong> to resize · Drag to move · Tap <strong>Apply &amp; Save</strong> when done.
        </span>
        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider hidden sm:inline">
          Pro Smart Editor
        </span>
      </div>
    </div>,
    document.body
  );
}
