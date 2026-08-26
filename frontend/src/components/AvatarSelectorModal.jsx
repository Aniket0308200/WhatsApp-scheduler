import React, { useState, useRef, useEffect } from 'react';

// Preset background color options for Initial Letter avatar
export const COLOR_OPTIONS = [
  { id: 'emerald', bg: 'bg-emerald-600', hex: '#059669', name: 'WhatsApp Emerald' },
  { id: 'teal', bg: 'bg-teal-600', hex: '#0d9488', name: 'Deep Teal' },
  { id: 'blue', bg: 'bg-blue-600', hex: '#2563eb', name: 'Ocean Blue' },
  { id: 'indigo', bg: 'bg-indigo-600', hex: '#4f46e5', name: 'Royal Indigo' },
  { id: 'purple', bg: 'bg-purple-600', hex: '#9333ea', name: 'Vibrant Purple' },
  { id: 'amber', bg: 'bg-amber-600', hex: '#d97706', name: 'Sunset Amber' },
  { id: 'rose', bg: 'bg-rose-600', hex: '#e11d48', name: 'Coral Rose' },
  { id: 'slate', bg: 'bg-slate-700', hex: '#334155', name: 'Dark Slate' },
];

// 8 High quality preset SVG avatars
export const PRESET_AVATARS = [
  {
    id: 'cool-shades',
    name: 'Cool Sunglasses',
    bg: '#E8F5E9',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#e2f5ec"/>
        {/* Shirt */}
        <path d="M22 88 C 22 70, 78 70, 78 88 L 78 100 L 22 100 Z" fill="#2e7d32"/>
        {/* Neck */}
        <rect x="43" y="55" width="14" height="18" fill="#f5c6a5" rx="3"/>
        {/* Face */}
        <ellipse cx="50" cy="45" rx="20" ry="23" fill="#f5c6a5"/>
        {/* Hair background */}
        <path d="M25 45 C 25 20, 75 20, 75 45 C 75 52, 70 60, 68 62 C 60 55, 40 55, 32 62 C 30 60, 25 52, 25 45 Z" fill="#00acc1"/>
        <path d="M28 35 C 32 18, 68 18, 72 35 C 65 25, 35 25, 28 35 Z" fill="#00838f"/>
        {/* Sunglasses */}
        <rect x="32" y="40" width="16" height="10" rx="3" fill="#212121"/>
        <rect x="52" y="40" width="16" height="10" rx="3" fill="#212121"/>
        <line x1="48" y1="44" x2="52" y2="44" stroke="#212121" strokeWidth="2"/>
        <line x1="34" y1="42" x2="44" y2="47" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
        <line x1="54" y1="42" x2="64" y2="47" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.6"/>
        {/* Smile */}
        <path d="M43 56 Q 50 62 57 56" stroke="#bf360c" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'smart-tie',
    name: 'Smart Glasses',
    bg: '#FFF3E0',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#fff3e0"/>
        {/* Shirt & Tie */}
        <path d="M20 90 C 20 70, 80 70, 80 90 L 80 100 L 20 100 Z" fill="#ffffff"/>
        <path d="M44 72 L 56 72 L 54 100 L 46 100 Z" fill="#d32f2f"/>
        {/* Neck */}
        <rect x="42" y="54" width="16" height="18" fill="#ffcc80" rx="3"/>
        {/* Face */}
        <ellipse cx="50" cy="44" rx="19" ry="22" fill="#ffcc80"/>
        {/* Orange Hair */}
        <path d="M30 38 C 28 15, 72 15, 70 38 C 65 24, 35 24, 30 38 Z" fill="#e65100"/>
        <path d="M40 22 Q 50 14 62 20 Q 52 28 40 22 Z" fill="#ff6d00"/>
        {/* Glasses */}
        <circle cx="39" cy="43" r="7" fill="none" stroke="#37474f" strokeWidth="2.5"/>
        <circle cx="61" cy="43" r="7" fill="none" stroke="#37474f" strokeWidth="2.5"/>
        <line x1="46" y1="43" x2="54" y2="43" stroke="#37474f" strokeWidth="2.5"/>
        {/* Smile */}
        <path d="M44 55 Q 50 60 56 55" stroke="#e65100" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'mustache-guy',
    name: 'Classic Mustache',
    bg: '#E1F5FE',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#e1f5fe"/>
        {/* Shirt */}
        <path d="M20 90 C 20 68, 80 68, 80 90 L 80 100 L 20 100 Z" fill="#0288d1"/>
        {/* Neck */}
        <rect x="42" y="55" width="16" height="18" fill="#d7ccc8" rx="3"/>
        {/* Face */}
        <ellipse cx="50" cy="45" rx="20" ry="23" fill="#d7ccc8"/>
        {/* Dark Hair */}
        <path d="M28 42 C 26 18, 74 18, 72 42 C 68 25, 32 25, 28 42 Z" fill="#212121"/>
        {/* Eyes */}
        <circle cx="40" cy="42" r="2.5" fill="#212121"/>
        <circle cx="60" cy="42" r="2.5" fill="#212121"/>
        {/* Mustache */}
        <path d="M36 53 Q 44 49 50 53 Q 56 49 64 53 Q 57 58 50 55 Q 43 58 36 53 Z" fill="#212121"/>
      </svg>
    )
  },
  {
    id: 'top-bun-girl',
    name: 'Top Bun Girl',
    bg: '#FCE4EC',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#fce4ec"/>
        {/* Top Bun */}
        <circle cx="50" cy="18" r="12" fill="#212121"/>
        {/* Shirt */}
        <path d="M22 88 C 22 70, 78 70, 78 88 L 78 100 L 22 100 Z" fill="#ffffff"/>
        {/* Neck & Earrings */}
        <rect x="43" y="56" width="14" height="16" fill="#ffcc80" rx="3"/>
        <polygon points="27,48 31,56 27,56" fill="#fbc02d"/>
        <polygon points="73,48 69,56 73,56" fill="#fbc02d"/>
        {/* Face */}
        <ellipse cx="50" cy="46" rx="19" ry="21" fill="#ffcc80"/>
        {/* Hair front */}
        <path d="M30 42 C 30 25, 70 25, 70 42 C 62 30, 38 30, 30 42 Z" fill="#212121"/>
        {/* Eyes & Blushing */}
        <circle cx="41" cy="44" r="2" fill="#212121"/>
        <circle cx="59" cy="44" r="2" fill="#212121"/>
        <circle cx="36" cy="48" r="3" fill="#f48fb1" opacity="0.6"/>
        <circle cx="64" cy="48" r="3" fill="#f48fb1" opacity="0.6"/>
        {/* Smile */}
        <path d="M44 54 Q 50 59 56 54" stroke="#c2185b" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'curly-yellow',
    name: 'Curly Hair Guy',
    bg: '#FFF8E1',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#fff8e1"/>
        {/* Shirt */}
        <path d="M20 90 C 20 68, 80 68, 80 90 L 80 100 L 20 100 Z" fill="#fbc02d"/>
        <line x1="25" y1="80" x2="75" y2="80" stroke="#37474f" strokeWidth="2.5"/>
        <line x1="28" y1="88" x2="72" y2="88" stroke="#37474f" strokeWidth="2.5"/>
        {/* Neck */}
        <rect x="42" y="55" width="16" height="18" fill="#ffcc80" rx="3"/>
        {/* Face */}
        <ellipse cx="50" cy="45" rx="19" ry="22" fill="#ffcc80"/>
        {/* Curly Hair Curls */}
        <circle cx="32" cy="30" r="8" fill="#8d6e63"/>
        <circle cx="44" cy="24" r="9" fill="#8d6e63"/>
        <circle cx="56" cy="24" r="9" fill="#8d6e63"/>
        <circle cx="68" cy="30" r="8" fill="#8d6e63"/>
        <circle cx="38" cy="34" r="7" fill="#6d4c41"/>
        <circle cx="62" cy="34" r="7" fill="#6d4c41"/>
        {/* Glasses */}
        <rect x="33" y="40" width="14" height="10" rx="2" fill="none" stroke="#5d4037" strokeWidth="2"/>
        <rect x="53" y="40" width="14" height="10" rx="2" fill="none" stroke="#5d4037" strokeWidth="2"/>
        <line x1="47" y1="44" x2="53" y2="44" stroke="#5d4037" strokeWidth="2"/>
        {/* Smile */}
        <path d="M44 56 Q 50 61 56 56" stroke="#5d4037" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'headphone-hoodie',
    name: 'Gamer Headphones',
    bg: '#E0F2F1',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#e0f2f1"/>
        {/* Hoodie */}
        <path d="M18 90 C 18 66, 82 66, 82 90 L 82 100 L 18 100 Z" fill="#43a047"/>
        <path d="M42 70 L 50 82 L 58 70 Z" fill="#ffffff" opacity="0.3"/>
        {/* Neck */}
        <rect x="43" y="54" width="14" height="18" fill="#ffcc80" rx="3"/>
        {/* Face */}
        <ellipse cx="50" cy="44" rx="19" ry="21" fill="#ffcc80"/>
        {/* Dark Hair */}
        <path d="M31 38 C 30 20, 70 20, 69 38 C 62 27, 38 27, 31 38 Z" fill="#263238"/>
        {/* Headphones band */}
        <path d="M26 44 C 26 16, 74 16, 74 44" fill="none" stroke="#212121" strokeWidth="4"/>
        <rect x="23" y="38" width="8" height="14" rx="4" fill="#ff5722"/>
        <rect x="69" y="38" width="8" height="14" rx="4" fill="#ff5722"/>
        {/* Eyes & Smile */}
        <circle cx="41" cy="43" r="2.5" fill="#212121"/>
        <circle cx="59" cy="43" r="2.5" fill="#212121"/>
        <path d="M44 53 Q 50 58 56 53" stroke="#212121" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'beanie-hat',
    name: 'Winter Beanie',
    bg: '#F3E5F5',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#f3e5f5"/>
        {/* Sweater */}
        <path d="M20 90 C 20 68, 80 68, 80 90 L 80 100 L 20 100 Z" fill="#0288d1"/>
        {/* Neck */}
        <rect x="42" y="55" width="16" height="18" fill="#ffcc80" rx="3"/>
        {/* Face */}
        <ellipse cx="50" cy="46" rx="19" ry="21" fill="#ffcc80"/>
        {/* Hair sides */}
        <path d="M28 45 L 28 65 L 34 50 Z" fill="#3e2723"/>
        <path d="M72 45 L 72 65 L 66 50 Z" fill="#3e2723"/>
        {/* Beanie Hat */}
        <path d="M30 38 C 30 18, 70 18, 70 38 Z" fill="#d81b60"/>
        <rect x="27" y="34" width="46" height="8" rx="3" fill="#ad1457"/>
        {/* Eyes & Smile */}
        <circle cx="41" cy="46" r="2" fill="#212121"/>
        <circle cx="59" cy="46" r="2" fill="#212121"/>
        <path d="M44 55 Q 50 60 56 55" stroke="#ad1457" strokeWidth="2" fill="none" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'ginger-cat',
    name: 'Ginger Cat / Character',
    bg: '#FFF3E0',
    svg: (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="50" fill="#fff3e0"/>
        {/* Cat Body */}
        <path d="M28 90 C 28 66, 72 66, 72 90 L 72 100 L 28 100 Z" fill="#fb8c00"/>
        {/* Cat Ears */}
        <polygon points="28,32 38,15 44,32" fill="#ef6c00"/>
        <polygon points="32,32 38,20 42,32" fill="#ffcc80"/>
        <polygon points="72,32 62,15 56,32" fill="#ef6c00"/>
        <polygon points="68,32 62,20 58,32" fill="#ffcc80"/>
        {/* Cat Face */}
        <ellipse cx="50" cy="48" rx="22" ry="20" fill="#fb8c00"/>
        <ellipse cx="40" cy="52" rx="7" ry="6" fill="#ffffff"/>
        <ellipse cx="60" cy="52" rx="7" ry="6" fill="#ffffff"/>
        {/* Cat Eyes */}
        <ellipse cx="40" cy="46" rx="3" ry="4" fill="#212121"/>
        <ellipse cx="60" cy="46" rx="3" ry="4" fill="#212121"/>
        <circle cx="41" cy="45" r="1" fill="#ffffff"/>
        <circle cx="61" cy="45" r="1" fill="#ffffff"/>
        {/* Nose & Whiskers */}
        <polygon points="48,51 52,51 50,54" fill="#e91e63"/>
        <line x1="28" y1="50" x2="36" y2="52" stroke="#424242" strokeWidth="1.5"/>
        <line x1="26" y1="56" x2="35" y2="55" stroke="#424242" strokeWidth="1.5"/>
        <line x1="72" y1="50" x2="64" y2="52" stroke="#424242" strokeWidth="1.5"/>
        <line x1="74" y1="56" x2="65" y2="55" stroke="#424242" strokeWidth="1.5"/>
      </svg>
    )
  }
];

export default function AvatarSelectorModal({ isOpen, onClose, currentAvatar, onSave, userName }) {
  const [activeTab, setActiveTab] = useState(currentAvatar?.type || 'initial'); // 'initial' | 'preset' | 'custom'
  
  // Initial Letter State
  const [selectedColor, setSelectedColor] = useState(currentAvatar?.colorId || 'emerald');

  // Preset State
  const [selectedPreset, setSelectedPreset] = useState(currentAvatar?.presetId || 'cool-shades');

  // Custom Image Upload & Crop State
  const [imageSrc, setImageSrc] = useState(currentAvatar?.type === 'custom' ? currentAvatar.value : null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadError, setUploadError] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentAvatar) {
      setActiveTab(currentAvatar.type || 'initial');
      if (currentAvatar.colorId) setSelectedColor(currentAvatar.colorId);
      if (currentAvatar.presetId) setSelectedPreset(currentAvatar.presetId);
      if (currentAvatar.type === 'custom') setImageSrc(currentAvatar.value);
    }
  }, [currentAvatar]);

  if (!isOpen) return null;

  const initialLetter = userName ? userName.replace('+','').trim().charAt(0).toUpperCase() : '?';

  // Handle image file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate static image type (No videos, no gifs)
    if (!file.type.match(/^image\/(jpeg|png|webp|jpg)$/i)) {
      setUploadError('Please select a valid image file (.jpg, .png, or .webp). Videos and GIFs are not allowed.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setUploadError('Image size should be less than 8MB.');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target.result);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Mouse pan handlers for crop box preview
  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Generate cropped base64 image data url using canvas
  const getCroppedImageDataUrl = () => {
    return new Promise((resolve) => {
      if (!imageSrc) {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 300; // Output high resolution 300x300 avatar canvas
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        // Create circular clip path for perfect avatar
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Calculate scaling and positioning
        const scale = zoom;
        const aspect = img.width / img.height;
        let renderWidth = size * scale;
        let renderHeight = (size / aspect) * scale;

        if (aspect < 1) {
          renderHeight = size * scale;
          renderWidth = (size * aspect) * scale;
        }

        const dx = (size - renderWidth) / 2 + (pan.x * (size / 180));
        const dy = (size - renderHeight) / 2 + (pan.y * (size / 180));

        ctx.drawImage(img, dx, dy, renderWidth, renderHeight);
        ctx.restore();

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imageSrc;
    });
  };

  const handleSave = async () => {
    if (activeTab === 'initial') {
      const colorObj = COLOR_OPTIONS.find(c => c.id === selectedColor) || COLOR_OPTIONS[0];
      onSave({
        type: 'initial',
        colorId: selectedColor,
        bgClass: colorObj.bg,
        hex: colorObj.hex,
        value: initialLetter,
      });
    } else if (activeTab === 'preset') {
      const presetObj = PRESET_AVATARS.find(p => p.id === selectedPreset) || PRESET_AVATARS[0];
      onSave({
        type: 'preset',
        presetId: selectedPreset,
        name: presetObj.name,
      });
    } else if (activeTab === 'custom') {
      if (!imageSrc) {
        setUploadError('Please select or upload an image first.');
        return;
      }
      const croppedBase64 = await getCroppedImageDataUrl();
      onSave({
        type: 'custom',
        value: croppedBase64 || imageSrc,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-slate-900 dark:bg-wa-dpanel text-slate-100 border border-slate-700 dark:border-wa-dbdr rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 dark:border-wa-dbdr flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="text-xl">📷</span>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">Customize Profile Picture</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 bg-slate-950/60 p-1.5 border-b border-slate-800 dark:border-wa-dbdr text-xs font-semibold">
          <button
            onClick={() => setActiveTab('initial')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'initial'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🔤</span>
            <span>Name Initial</span>
          </button>

          <button
            onClick={() => setActiveTab('preset')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'preset'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🎭</span>
            <span>8 Avatars</span>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-emerald-600 text-white shadow-md font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🖼️</span>
            <span>Upload Photo</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scroll">
          {/* ── TAB 1: Initial Letter Customizer ── */}
          {activeTab === 'initial' && (
            <div className="space-y-6 text-center">
              <div>
                <p className="text-xs text-slate-400 mb-3">Live Preview:</p>
                <div className="flex justify-center">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-extrabold shadow-xl border-4 border-slate-700/50 transition-all ${
                    COLOR_OPTIONS.find(c => c.id === selectedColor)?.bg || 'bg-emerald-600'
                  }`}>
                    {initialLetter}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Background Color:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 justify-center max-w-xs mx-auto">
                  {COLOR_OPTIONS.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => setSelectedColor(col.id)}
                      className={`w-8 h-8 rounded-full ${col.bg} transition-transform flex items-center justify-center border-2 ${
                        selectedColor === col.id ? 'border-white scale-110 shadow-lg ring-2 ring-emerald-400' : 'border-transparent hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      title={col.name}
                    >
                      {selectedColor === col.id && <span className="text-white text-xs font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: 8 Preset Avatars ── */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 text-center font-medium">
                Choose one of our 8 illustrated avatars:
              </p>

              {/* 4-4 Form / 4 columns 2 rows grid */}
              <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`relative rounded-2xl p-1.5 transition-all duration-200 aspect-square flex items-center justify-center border-2 ${
                      selectedPreset === preset.id
                        ? 'border-emerald-400 bg-emerald-500/20 scale-105 shadow-lg ring-2 ring-emerald-400/40'
                        : 'border-slate-700/60 hover:border-slate-500 bg-slate-800/50 hover:scale-102'
                    }`}
                    title={preset.name}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden shadow-sm">
                      {preset.svg}
                    </div>
                    {selectedPreset === preset.id && (
                      <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 3: Upload Custom Image with Crop/Resize ── */}
          {activeTab === 'custom' && (
            <div className="space-y-4 text-center">
              {!imageSrc ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-800/40 hover:bg-slate-800/80 rounded-2xl p-8 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-14 h-14 rounded-full bg-slate-700 group-hover:bg-emerald-600/30 text-emerald-400 flex items-center justify-center text-2xl transition-colors">
                    📤
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200 group-hover:text-emerald-300">
                      Click to Upload Image
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports JPG, PNG, WEBP (Square cropped preview)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Interactive Crop & Resize Canvas Box */}
                  <div className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-emerald-500 shadow-2xl bg-black cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={imageSrc}
                      alt="Crop preview"
                      className="absolute max-w-none transition-transform pointer-events-none"
                      style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center',
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                    <div className="absolute inset-0 rounded-full border-2 border-white/30 pointer-events-none" />
                  </div>

                  {/* Controls */}
                  <div className="max-w-xs mx-auto space-y-3 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span>Zoom:</span>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-emerald-500"
                      />
                      <span className="font-mono w-8 text-right">{Math.round(zoom * 100)}%</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/50">
                      <button
                        onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        🔄 Reset Position
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
                      >
                        📁 Choose Different Photo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp, image/jpg"
                className="hidden"
              />

              {uploadError && (
                <p className="text-xs text-red-400 bg-red-950/40 border border-red-500/30 p-2 rounded-xl">
                  ⚠️ {uploadError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 dark:border-wa-dbdr flex items-center justify-between bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md hover:shadow-emerald-600/30 active:scale-98 transition-all flex items-center gap-1.5"
          >
            <span>Save Avatar</span>
            <span>✓</span>
          </button>
        </div>
      </div>
    </div>
  );
}
