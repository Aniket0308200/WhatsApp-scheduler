import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { WhatsAppGifIcon } from './GifStickerPickerModal';

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
  { id: '1:1', label: '1:1 Square', ratio: 1 },
  { id: '4:5', label: '4:5 Portrait', ratio: 4 / 5 },
  { id: '16:9', label: '16:9 Wide', ratio: 16 / 9 },
  { id: '9:16', label: '9:16 Story', ratio: 9 / 16 },
  { id: '3:4', label: '3:4 Photo', ratio: 3 / 4 },
];

// ─── 10 Text Box Shapes / Labels ─────────────────────────────────────────────
const BOX_SHAPES = [
  { id: 'pill', name: 'Pill', icon: '💊', desc: 'Classic Rounded' },
  { id: 'rounded', name: 'Rounded', icon: '🔲', desc: 'Smooth Card' },
  { id: 'sharp', name: 'Square', icon: '⏹️', desc: 'Crisp Rectangle' },
  { id: 'oval', name: 'Oval', icon: '🥚', desc: 'Stadium' },
  { id: 'tag', name: 'Tag / Label', icon: '🏷️', desc: 'Pointed Tag' },
  { id: 'badge', name: 'Badge', icon: '⬢', desc: 'Hexagon Badge' },
  { id: 'bubble', name: 'Speech Bubble', icon: '💬', desc: 'Chat Bubble' },
  { id: 'ticket', name: 'Ticket', icon: '🎟️', desc: 'Coupon Ticket' },
  { id: 'banner', name: 'Ribbon', icon: '🎗️', desc: 'Banner Ribbon' },
  { id: 'starburst', name: 'Starburst', icon: '💥', desc: 'Comic Burst' },
];

// ─── Draw Tools (Brush, Arrow, Line, Rectangle, Circle, Blur) ────────────────
const DRAW_TOOLS = [
  { id: 'brush', label: 'Pen', icon: '✏️', desc: 'Freehand Drawing' },
  { id: 'arrow', label: 'Arrow', icon: '↗️', desc: 'Directional Arrow' },
  { id: 'line', label: 'Line', icon: '📏', desc: 'Straight Line' },
  { id: 'rect', label: 'Box', icon: '⏹️', desc: 'Rectangle Box' },
  { id: 'circle', label: 'Circle', icon: '⭕', desc: 'Oval / Circle' },
  { id: 'blur', label: 'Blur', icon: '🪟', desc: 'Redact & Pixelate' },
];

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

  // Active Tools: null | 'draw' | 'text' | 'sticker' | 'crop'
  const [activeTool, setActiveTool] = useState(null);

  // Drawing & Shapes state
  const [drawToolType, setDrawToolType] = useState('brush'); // 'brush' | 'arrow' | 'line' | 'rect' | 'circle' | 'blur'
  const [brushColor, setBrushColor] = useState('#25D366');
  const [brushWidth, setBrushWidth] = useState(6);
  const [fillShape, setFillShape] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState(null);

  // Text Elements state
  const [textElements, setTextElements] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedItemType, setSelectedItemType] = useState(null); // 'text' | 'sticker'

  // Stickers & GIFs state
  const [stickers, setStickers] = useState([]);
  const [stickerPickerTab, setStickerPickerTab] = useState('emoji');
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyResults, setGiphyResults] = useState([]);
  const [loadingGiphy, setLoadingGiphy] = useState(false);

  // Aspect ratio / Crop
  const [cropRatio, setCropRatio] = useState('free');

  // DOM refs
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const imageElementRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [draggingItem, setDraggingItem] = useState(null);

  const mediaSrc = mediaItem.preview || mediaItem.data;

  // Initialize image on load
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

  // Redraw canvas whenever strokes change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageElementRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imageElementRef.current;

    canvas.width = img.naturalWidth || 1080;
    canvas.height = img.naturalHeight || 1080;

    // 1. Draw base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 2. Render all strokes & shapes
    strokes.forEach(stroke => {
      ctx.lineWidth = stroke.width || 6;
      ctx.strokeStyle = stroke.color || '#25D366';
      ctx.fillStyle = stroke.color || '#25D366';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'brush' && stroke.points && stroke.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      } else if (stroke.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(stroke.start.x, stroke.start.y);
        ctx.lineTo(stroke.end.x, stroke.end.y);
        ctx.stroke();
      } else if (stroke.tool === 'arrow') {
        const fromX = stroke.start.x;
        const fromY = stroke.start.y;
        const toX = stroke.end.x;
        const toY = stroke.end.y;
        const headLength = Math.max(16, stroke.width * 3);
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (stroke.tool === 'rect') {
        const x = Math.min(stroke.start.x, stroke.end.x);
        const y = Math.min(stroke.start.y, stroke.end.y);
        const w = Math.abs(stroke.end.x - stroke.start.x);
        const h = Math.abs(stroke.end.y - stroke.start.y);

        if (stroke.fill) {
          ctx.fillRect(x, y, w, h);
        } else {
          ctx.strokeRect(x, y, w, h);
        }
      } else if (stroke.tool === 'circle') {
        const rx = Math.abs(stroke.end.x - stroke.start.x) / 2;
        const ry = Math.abs(stroke.end.y - stroke.start.y) / 2;
        const cx = (stroke.start.x + stroke.end.x) / 2;
        const cy = (stroke.start.y + stroke.end.y) / 2;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (stroke.fill) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      } else if (stroke.tool === 'blur') {
        // Redaction blur box
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
            // Draw clean subtle border around blur region
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, w, h);
          } catch {}
        }
      }
    });

    // Draw live temporary stroke if user is dragging
    if (currentStroke) {
      ctx.lineWidth = currentStroke.width || 6;
      ctx.strokeStyle = currentStroke.color || '#25D366';
      ctx.fillStyle = currentStroke.color || '#25D366';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (currentStroke.tool === 'brush' && currentStroke.points && currentStroke.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentStroke.points[0].x, currentStroke.points[0].y);
        for (let i = 1; i < currentStroke.points.length; i++) {
          ctx.lineTo(currentStroke.points[i].x, currentStroke.points[i].y);
        }
        ctx.stroke();
      } else if (currentStroke.tool === 'line') {
        ctx.beginPath();
        ctx.moveTo(currentStroke.start.x, currentStroke.start.y);
        ctx.lineTo(currentStroke.end.x, currentStroke.end.y);
        ctx.stroke();
      } else if (currentStroke.tool === 'arrow') {
        const fromX = currentStroke.start.x;
        const fromY = currentStroke.start.y;
        const toX = currentStroke.end.x;
        const toY = currentStroke.end.y;
        const headLength = Math.max(16, currentStroke.width * 3);
        const dx = toX - fromX;
        const dy = toY - fromY;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (currentStroke.tool === 'rect') {
        const x = Math.min(currentStroke.start.x, currentStroke.end.x);
        const y = Math.min(currentStroke.start.y, currentStroke.end.y);
        const w = Math.abs(currentStroke.end.x - currentStroke.start.x);
        const h = Math.abs(currentStroke.end.y - currentStroke.start.y);

        if (currentStroke.fill) {
          ctx.fillRect(x, y, w, h);
        } else {
          ctx.strokeRect(x, y, w, h);
        }
      } else if (currentStroke.tool === 'circle') {
        const rx = Math.abs(currentStroke.end.x - currentStroke.start.x) / 2;
        const ry = Math.abs(currentStroke.end.y - currentStroke.start.y) / 2;
        const cx = (currentStroke.start.x + currentStroke.end.x) / 2;
        const cy = (currentStroke.start.y + currentStroke.end.y) / 2;

        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (currentStroke.fill) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
      } else if (currentStroke.tool === 'blur') {
        // Preview box for blur
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

  // Canvas coordinates converter
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

  // Drawing mouse handlers
  const handleMouseDown = (e) => {
    if (activeTool !== 'draw') return;
    const coords = getCanvasCoords(e);
    setIsDrawing(true);

    if (drawToolType === 'brush') {
      setCurrentStroke({
        tool: 'brush',
        color: brushColor,
        width: brushWidth,
        points: [coords],
      });
    } else {
      setCurrentStroke({
        tool: drawToolType,
        color: brushColor,
        width: brushWidth,
        fill: fillShape,
        start: coords,
        end: coords,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentStroke) return;
    const coords = getCanvasCoords(e);

    if (currentStroke.tool === 'brush') {
      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, coords],
      }));
    } else {
      setCurrentStroke(prev => ({
        ...prev,
        end: coords,
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentStroke) return;
    setIsDrawing(false);
    setStrokes(prev => [...prev, currentStroke]);
    setCurrentStroke(null);
  };

  // Add new Text Layer
  const handleAddText = () => {
    const newText = {
      id: Date.now().toString(),
      text: 'Sample Text',
      font: STATUS_FONTS[0],
      color: '#FFFFFF',
      textColorMode: 'solid',
      textGrad1: '#FF512F',
      textGrad2: '#DD2476',
      textDegree: 135,
      bgMode: 'solid',
      bgColor: '#000000',
      bgGrad1: '#FF512F',
      bgGrad2: '#DD2476',
      bgDegree: 135,
      boxShape: 'pill',
      paddingX: 14,
      paddingY: 6,
      size: 40,
      x: 50,
      y: 50,
    };
    setTextElements(prev => [...prev, newText]);
    setSelectedItemId(newText.id);
    setSelectedItemType('text');
    setActiveTool('text');
  };

  // Add Emoji / Sticker
  const handleAddEmoji = (emojiObj) => {
    const emoji = emojiObj.emoji;
    if (!emoji) return;
    const newSticker = {
      id: Date.now().toString(),
      type: 'emoji',
      content: emoji,
      x: 45 + (stickers.length % 3) * 10,
      y: 50,
      size: 52,
    };
    setStickers(prev => [...prev, newSticker]);
    setSelectedItemId(newSticker.id);
    setSelectedItemType('sticker');
    setActiveTool(null);
  };

  // Add Giphy GIF / Sticker
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
    setStickers(prev => [...prev, newSticker]);
    setSelectedItemId(newSticker.id);
    setSelectedItemType('sticker');
    setActiveTool(null);
  };

  // Item dragging
  const handleDragStart = (e, type, id, currentX, currentY) => {
    if (activeTool === 'draw') return;
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
      setTextElements(prev => prev.map(t => (t.id === draggingItem.id ? { ...t, x: newX, y: newY } : t)));
    } else if (draggingItem.type === 'sticker') {
      setStickers(prev => prev.map(s => (s.id === draggingItem.id ? { ...s, x: newX, y: newY } : s)));
    }
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
  };

  // Helper to bake angled linear gradient onto Canvas
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

  // Final Bake & Save
  const handleSave = async () => {
    if (!imageElementRef.current) return;
    const toastId = toast.loading('Applying edits & rendering photo...');

    try {
      const bakeCanvas = document.createElement('canvas');
      const baseCanvas = canvasRef.current;
      bakeCanvas.width = baseCanvas.width;
      bakeCanvas.height = baseCanvas.height;
      const ctx = bakeCanvas.getContext('2d');

      // 1. Draw strokes from base canvas
      ctx.drawImage(baseCanvas, 0, 0);

      // 2. Draw Stickers & Emojis
      for (const s of stickers) {
        const posX = (s.x / 100) * bakeCanvas.width;
        const posY = (s.y / 100) * bakeCanvas.height;
        const renderSize = (s.size || 52) * (bakeCanvas.width / 400);

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

      // 3. Draw Text Overlays
      textElements.forEach(t => {
        const posX = (t.x / 100) * bakeCanvas.width;
        const posY = (t.y / 100) * bakeCanvas.height;
        const scale = bakeCanvas.width / 500;
        const fontPx = Math.round((t.size || 40) * scale * 0.7);
        const fontFamily = t.font?.family || 'sans-serif';

        ctx.font = `bold ${fontPx}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const metrics = ctx.measureText(t.text);
        const textW = metrics.width;
        const padX = Math.round((t.paddingX ?? 14) * scale);
        const padY = Math.round((t.paddingY ?? 6) * scale);
        const pillH = fontPx + padY * 2;
        const pillW = textW + padX * 2;
        const rectX = posX - pillW / 2;
        const rectY = posY - pillH / 2;

        // Draw Box Background
        if (t.bgMode === 'solid') {
          ctx.fillStyle = t.bgColor || '#000000';
          drawBoxShapeOnCanvas(ctx, t.boxShape || 'pill', rectX, rectY, pillW, pillH);
          ctx.fill();
        } else if (t.bgMode === 'gradient') {
          const grad = createAngledGradient(ctx, rectX, rectY, pillW, pillH, t.bgDegree ?? 135, t.bgGrad1 || '#FF512F', t.bgGrad2 || '#DD2476');
          ctx.fillStyle = grad;
          drawBoxShapeOnCanvas(ctx, t.boxShape || 'pill', rectX, rectY, pillW, pillH);
          ctx.fill();
        }

        // Draw Text
        if (t.textColorMode === 'gradient') {
          const textGrad = createAngledGradient(ctx, rectX, rectY, pillW, pillH, t.textDegree ?? 135, t.textGrad1 || '#FF512F', t.textGrad2 || '#DD2476');
          ctx.fillStyle = textGrad;
        } else {
          ctx.fillStyle = t.color || '#FFFFFF';
        }
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

  const selectedText = textElements.find(t => t.id === selectedItemId);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col justify-between text-white select-none animate-fade-in"
      onMouseMove={handleDragMove}
      onTouchMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onTouchEnd={handleDragEnd}
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10 z-20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-colors cursor-pointer"
            title="Cancel"
          >
            ✕
          </button>
          <div className="hidden sm:block">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🎨</span> Smart Media &amp; Photo Editor
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-purple-500 text-black">
                PRO
              </span>
            </h3>
            <p className="text-[10px] text-white/60 truncate max-w-[200px]">{mediaItem.name}</p>
          </div>
        </div>

        {/* Toolbar Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Draw / Shapes Button */}
          <button
            type="button"
            onClick={() => setActiveTool(activeTool === 'draw' ? null : 'draw')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTool === 'draw'
                ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <span>✏️</span>
            <span className="hidden sm:inline">Draw &amp; Shapes</span>
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
            <span className="hidden sm:inline">Add Text</span>
          </button>

          {/* Stickers & Emojis */}
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
            <span className="hidden sm:inline">Stickers / GIFs</span>
          </button>

          {/* Undo */}
          {strokes.length > 0 && (
            <button
              type="button"
              onClick={() => setStrokes(prev => prev.slice(0, -1))}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-colors cursor-pointer"
              title="Undo last stroke"
            >
              ↩️
            </button>
          )}

          {/* Clear */}
          {strokes.length > 0 && (
            <button
              type="button"
              onClick={() => setStrokes([])}
              className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-rose-500/40 text-[11px] font-bold transition-colors cursor-pointer text-rose-300"
              title="Clear all drawings"
            >
              Clear
            </button>
          )}

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <span>✓</span>
            <span>Apply &amp; Save</span>
          </button>
        </div>
      </div>

      {/* ── Sub Toolbars ── */}

      {/* 1. Drawing & Shapes Sub-Bar */}
      {activeTool === 'draw' && (
        <div className="bg-slate-900/90 border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap z-20">
          {/* Tool Types: Brush, Arrow, Line, Rect, Circle, Blur */}
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
            {DRAW_TOOLS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setDrawToolType(t.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                  drawToolType === t.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-white/70 hover:text-white'
                }`}
                title={t.desc}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Fill Toggle for Rect & Circle */}
          {(drawToolType === 'rect' || drawToolType === 'circle') && (
            <button
              type="button"
              onClick={() => setFillShape(!fillShape)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                fillShape ? 'bg-purple-600 border-purple-400 text-white' : 'border-white/20 text-white/70'
              }`}
            >
              {fillShape ? 'Filled' : 'Outline'}
            </button>
          )}

          {/* Colors */}
          {drawToolType !== 'blur' && (
            <div className="flex items-center gap-1.5">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setBrushColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    brushColor === c ? 'scale-125 border-white ring-2 ring-purple-500' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          {/* Stroke Width */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/60">Width:</span>
            <input
              type="range"
              min="2"
              max="36"
              value={brushWidth}
              onChange={e => setBrushWidth(Number(e.target.value))}
              className="w-20 accent-purple-500"
            />
            <span className="text-[11px] font-mono w-6">{brushWidth}px</span>
          </div>
        </div>
      )}

      {/* 2. Text Editing Sub-Bar */}
      {activeTool === 'text' && selectedText && (
        <div className="bg-slate-900/95 border-b border-white/10 px-4 py-3 space-y-2.5 z-20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Text input */}
            <input
              type="text"
              value={selectedText.text}
              onChange={e =>
                setTextElements(prev =>
                  prev.map(t => (t.id === selectedText.id ? { ...t, text: e.target.value } : t))
                )
              }
              placeholder="Type your message text..."
              className="flex-1 max-w-sm px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* Font Picker */}
            <select
              value={selectedText.font?.id || 'sans'}
              onChange={e => {
                const f = STATUS_FONTS.find(font => font.id === e.target.value);
                setTextElements(prev =>
                  prev.map(t => (t.id === selectedText.id ? { ...t, font: f } : t))
                );
              }}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none cursor-pointer"
            >
              {STATUS_FONTS.map(f => (
                <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                  Font: {f.name}
                </option>
              ))}
            </select>

            {/* Box Shape / Label Picker */}
            <select
              value={selectedText.boxShape || 'pill'}
              onChange={e =>
                setTextElements(prev =>
                  prev.map(t => (t.id === selectedText.id ? { ...t, boxShape: e.target.value } : t))
                )
              }
              className="text-xs px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none cursor-pointer"
            >
              {BOX_SHAPES.map(s => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  Shape: {s.icon} {s.name}
                </option>
              ))}
            </select>

            {/* Delete Layer */}
            <button
              type="button"
              onClick={() => {
                setTextElements(prev => prev.filter(t => t.id !== selectedText.id));
                setSelectedItemId(null);
                setActiveTool(null);
              }}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Delete Layer
            </button>
          </div>

          {/* Color & Size Controls */}
          <div className="flex items-center gap-4 flex-wrap text-xs">
            {/* Color mode */}
            <div className="flex items-center gap-1.5">
              <span className="text-white/60">Color:</span>
              {COLOR_PALETTE.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    setTextElements(prev =>
                      prev.map(t => (t.id === selectedText.id ? { ...t, color: c, textColorMode: 'solid' } : t))
                    )
                  }
                  className="w-5 h-5 rounded-full border border-white/30 cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Text Size */}
            <div className="flex items-center gap-2">
              <span className="text-white/60">Size:</span>
              <input
                type="range"
                min="20"
                max="90"
                value={selectedText.size || 40}
                onChange={e =>
                  setTextElements(prev =>
                    prev.map(t => (t.id === selectedText.id ? { ...t, size: Number(e.target.value) } : t))
                  )
                }
                className="w-24 accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. Stickers & Emoji Drawer */}
      {activeTool === 'sticker' && (
        <div className="bg-slate-900/95 border-b border-white/10 p-3 max-h-60 overflow-y-auto custom-scroll z-20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStickerPickerTab('emoji')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  stickerPickerTab === 'emoji' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Emojis
              </button>
              <button
                type="button"
                onClick={() => setStickerPickerTab('giphy')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  stickerPickerTab === 'giphy' ? 'bg-purple-600 text-white' : 'text-white/60 hover:text-white'
                }`}
              >
                Giphy Stickers
              </button>
            </div>
            <button
              type="button"
              onClick={() => setActiveTool(null)}
              className="text-white/60 hover:text-white text-xs"
            >
              ✕ Close
            </button>
          </div>

          {stickerPickerTab === 'emoji' ? (
            <div className="max-h-48 overflow-y-auto">
              <EmojiPicker
                onEmojiClick={handleAddEmoji}
                theme={Theme.DARK}
                emojiStyle={EmojiStyle.APPLE}
                width="100%"
                height={200}
                searchDisabled={false}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={giphySearch}
                onChange={async e => {
                  setGiphySearch(e.target.value);
                  if (e.target.value.trim().length > 1) {
                    try {
                      setLoadingGiphy(true);
                      const res = await fetch(
                        `https://api.giphy.com/v1/stickers/search?api_key=${ACTIVE_GIPHY_KEY}&q=${encodeURIComponent(
                          e.target.value
                        )}&limit=15&rating=g`
                      );
                      const data = await res.json();
                      setGiphyResults(data.data || []);
                    } catch {} finally {
                      setLoadingGiphy(false);
                    }
                  }
                }}
                placeholder="Search Giphy stickers..."
                className="w-full px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none"
              />
              <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto custom-scroll">
                {giphyResults.map(item => (
                  <img
                    key={item.id}
                    src={item.images?.fixed_height_small?.url}
                    alt="sticker"
                    onClick={() => handleAddGiphyMedia(item)}
                    className="w-full h-14 object-contain rounded-lg hover:bg-white/10 p-1 cursor-pointer transition-transform hover:scale-110"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Center Viewport Canvas ── */}
      <div
        ref={viewportRef}
        className="flex-1 relative flex items-center justify-center p-4 overflow-hidden touch-none"
      >
        <div className="relative max-w-full max-h-[75vh] flex items-center justify-center shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-black">
          {/* Main Drawing Canvas */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className={`max-w-full max-h-[75vh] object-contain block ${
              activeTool === 'draw' ? 'cursor-crosshair' : 'cursor-default'
            }`}
          />

          {/* Stickers Overlay */}
          {stickers.map(s => (
            <div
              key={s.id}
              onMouseDown={e => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
              onTouchStart={e => handleDragStart(e, 'sticker', s.id, s.x, s.y)}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                transform: 'translate(-50%, -50%)',
                fontSize: `${s.size}px`,
                cursor: activeTool === 'draw' ? 'crosshair' : 'move',
              }}
              className={`select-none transition-transform ${
                selectedItemId === s.id ? 'ring-2 ring-purple-400 rounded-lg p-1' : ''
              }`}
            >
              {s.type === 'emoji' ? (
                <span>{s.content}</span>
              ) : (
                <img
                  src={s.content}
                  alt="sticker"
                  style={{ width: `${s.size}px`, height: `${s.size}px` }}
                  className="object-contain pointer-events-none"
                />
              )}
            </div>
          ))}

          {/* Text Elements Overlay */}
          {textElements.map(t => (
            <div
              key={t.id}
              onMouseDown={e => handleDragStart(e, 'text', t.id, t.x, t.y)}
              onTouchStart={e => handleDragStart(e, 'text', t.id, t.x, t.y)}
              style={{
                position: 'absolute',
                left: `${t.x}%`,
                top: `${t.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: activeTool === 'draw' ? 'crosshair' : 'move',
              }}
              className={`select-none ${
                selectedItemId === t.id ? 'ring-2 ring-purple-400' : ''
              }`}
            >
              <div
                style={{
                  fontFamily: t.font?.family || 'sans-serif',
                  fontSize: `${t.size}px`,
                  color: t.color || '#FFFFFF',
                  backgroundColor: t.bgMode === 'solid' ? t.bgColor || '#000000' : 'transparent',
                  padding: `${t.paddingY}px ${t.paddingX}px`,
                  borderRadius: t.boxShape === 'sharp' ? '4px' : '9999px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Help Hint ── */}
      <div className="px-4 py-2 bg-black/60 border-t border-white/10 text-center text-[11px] text-white/60">
        💡 Use <strong>Draw &amp; Shapes</strong> for arrows, blur redaction &amp; boxes · Drag text or stickers to position · Click <strong>Apply &amp; Save</strong> when done
      </div>
    </div>,
    document.body
  );
}

