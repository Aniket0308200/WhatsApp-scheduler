// ─── WhatsApp Media Library (GIFs & Stickers) ──────────────────────────────────
// Includes rich tags for full-text searching in English, Hindi & Hinglish

export const GIF_CATEGORIES = [
  { id: 'all', label: '🔥 All / Trending' },
  { id: 'haha', label: '😂 Haha & Funny' },
  { id: 'love', label: '❤️ Love & Romantic' },
  { id: 'namaste', label: '🙏 Namaste & Greetings' },
  { id: 'party', label: '🎉 Party & Dance' },
  { id: 'birthday', label: '🎂 Birthday & Wishes' },
  { id: 'claps', label: '👏 Claps & Superb' },
  { id: 'chai', label: '☕ Chai & Break' },
  { id: 'thumbsup', label: '👍 Thumbs Up & OK' },
  { id: 'sad', label: '😢 Sad & Sorry' },
  { id: 'morning', label: '☀️ Good Morning' },
  { id: 'night', label: '🌙 Good Night' },
  { id: 'fire', label: '🚀 Fire & Energy' },
  { id: 'festive', label: '🪔 Desi & Festivals' },
];

export const POPULAR_GIFS = [
  // ── Haha / Funny ──
  {
    id: 'gif-laugh-cat',
    category: 'haha',
    title: 'Laughing Cat',
    url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
    tags: ['laugh', 'funny', 'haha', 'cat', 'lol', 'rofl', 'hasna', 'joke', 'chuckle', 'comedy', 'cute']
  },
  {
    id: 'gif-minion-laugh',
    category: 'haha',
    title: 'Minion Laughing',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    tags: ['minion', 'laugh', 'haha', 'funny', 'lol', 'rofl', 'hasna', 'cartoon', 'hilarious']
  },
  {
    id: 'gif-baby-laugh',
    category: 'haha',
    title: 'Baby Giggle',
    url: 'https://media.giphy.com/media/9MFsKQ8A6HCN2/giphy.gif',
    tags: ['baby', 'giggle', 'laugh', 'cute', 'haha', 'smile', 'hasna', 'bachha']
  },
  {
    id: 'gif-dog-sideeye',
    category: 'haha',
    title: 'Suspicious Dog Meme',
    url: 'https://media.giphy.com/media/H5C8CevNMbpBqNqFjl/giphy.gif',
    tags: ['dog', 'meme', 'side eye', 'funny', 'suspicious', 'kya', 'doubt', 'haha']
  },

  // ── Namaste / Greetings ──
  {
    id: 'gif-namaste-monk',
    category: 'namaste',
    title: 'Namaste Folded Hands',
    url: 'https://media.giphy.com/media/3o7TKOCXul7QC5sznG/giphy.gif',
    tags: ['namaste', 'pranam', 'folded hands', 'respect', 'greetings', 'hello', 'pranaam', 'vanakkam', 'adab', 'welcome']
  },
  {
    id: 'gif-hello-wave',
    category: 'namaste',
    title: 'Friendly Hello Wave',
    url: 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.gif',
    tags: ['hello', 'hi', 'wave', 'namaste', 'greetings', 'hey', 'kaise ho', 'welcome']
  },
  {
    id: 'gif-modi-namaste',
    category: 'namaste',
    title: 'Respectful Greeting',
    url: 'https://media.giphy.com/media/3o6wrvptnCSIGEvwkE/giphy.gif',
    tags: ['namaste', 'greeting', 'respect', 'pranam', 'hello', 'india', 'welcome']
  },

  // ── Love / Romance ──
  {
    id: 'gif-heart-flying',
    category: 'love',
    title: 'Flying Hearts',
    url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
    tags: ['love', 'heart', 'flying hearts', 'pyar', 'dil', 'romantic', 'valentine', 'pyaar', 'kiss']
  },
  {
    id: 'gif-bear-hug',
    category: 'love',
    title: 'Warm Hug',
    url: 'https://media.giphy.com/media/l2QDM9Jnim1YV5bxC/giphy.gif',
    tags: ['hug', 'love', 'bear', 'pyar', 'care', 'sweet', 'warm', 'gale milna', 'friends']
  },
  {
    id: 'gif-cat-heart',
    category: 'love',
    title: 'Heart Eyes Kitty',
    url: 'https://media.giphy.com/media/MDJ9IbxxvDUQM/giphy.gif',
    tags: ['love', 'cat', 'heart eyes', 'cute', 'pyar', 'crush', 'sweet', 'kitty']
  },

  // ── Party & Dance ──
  {
    id: 'gif-dance-celebration',
    category: 'party',
    title: 'Happy Dance Party',
    url: 'https://media.giphy.com/media/blSTtZehjAZ8I/giphy.gif',
    tags: ['party', 'dance', 'nacho', 'music', 'celebrate', 'dj', 'club', 'yay', 'bhangra', 'fun']
  },
  {
    id: 'gif-confetti-pop',
    category: 'party',
    title: 'Confetti Celebration',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    tags: ['confetti', 'party', 'celebrate', 'winner', 'cheers', 'yay', 'khushi', 'badhai']
  },
  {
    id: 'gif-dancing-snoopy',
    category: 'party',
    title: 'Dancing Groove',
    url: 'https://media.giphy.com/media/oXnN2TsfLRde0/giphy.gif',
    tags: ['dance', 'groove', 'nacho', 'fun', 'happy', 'party', 'enjoy']
  },

  // ── Birthday ──
  {
    id: 'gif-birthday-cake',
    category: 'birthday',
    title: 'Birthday Cake Candles',
    url: 'https://media.giphy.com/media/LzwcNOrbA3aYvXK6r7/giphy.gif',
    tags: ['birthday', 'cake', 'happy birthday', 'candles', 'janamdin', 'wishes', 'party', 'mubarak']
  },
  {
    id: 'gif-happy-birthday-banner',
    category: 'birthday',
    title: 'Happy Birthday Celebration',
    url: 'https://media.giphy.com/media/hkE6wynetELGa7xOjq/giphy.gif',
    tags: ['birthday', 'happy birthday', 'janamdin', 'wishes', 'celebrate', 'party', 'gift']
  },

  // ── Claps & Superb ──
  {
    id: 'gif-applause-claps',
    category: 'claps',
    title: 'Standing Ovation Claps',
    url: 'https://media.giphy.com/media/7rj2ZgttvgomY/giphy.gif',
    tags: ['claps', 'applause', 'taali', 'superb', 'great', 'congrats', 'bravo', 'shabash', 'well done']
  },
  {
    id: 'gif-dicaprio-cheers',
    category: 'claps',
    title: 'Cheers Great Gatsby',
    url: 'https://media.giphy.com/media/GCLlQnV7dXZ2E/giphy.gif',
    tags: ['cheers', 'gatsby', 'congrats', 'badhai', 'toast', 'superb', 'legend', 'boss']
  },

  // ── Chai & Coffee ──
  {
    id: 'gif-chai-cup',
    category: 'chai',
    title: 'Hot Cup of Chai',
    url: 'https://media.giphy.com/media/3o85xGocUH8RYoDKKs/giphy.gif',
    tags: ['chai', 'tea', 'garam chai', 'break', 'morning chai', 'coffee', 'evening', 'subah', 'chill']
  },

  // ── Thumbs Up & OK ──
  {
    id: 'gif-thumbs-up',
    category: 'thumbsup',
    title: 'Double Thumbs Up',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    tags: ['thumbs up', 'ok', 'theek he', 'done', 'yes', 'superb', 'great', 'approved', 'like', 'sahi']
  },
  {
    id: 'gif-nodding-agree',
    category: 'thumbsup',
    title: 'Nodding In Agreement',
    url: 'https://media.giphy.com/media/xT9IgBwFPEhVnNAJWg/giphy.gif',
    tags: ['agree', 'yes', 'haan', 'ok', 'nod', 'bilkul', 'done', 'sure']
  },

  // ── Sad & Sorry ──
  {
    id: 'gif-crying-kitten',
    category: 'sad',
    title: 'Cute Sad Kitty',
    url: 'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif',
    tags: ['sad', 'crying', 'cry', 'tears', 'dukh', 'rona', 'upset', 'cute', 'sorry']
  },
  {
    id: 'gif-sorry-puppy',
    category: 'sad',
    title: 'Puppy Eyes Sorry',
    url: 'https://media.giphy.com/media/BEob50RZoNN2E/giphy.gif',
    tags: ['sorry', 'maaf', 'puppy', 'eyes', 'apology', 'forgive me', 'sad', 'galti']
  },

  // ── Good Morning & Night ──
  {
    id: 'gif-good-morning-sun',
    category: 'morning',
    title: 'Bright Sunshine Morning',
    url: 'https://media.giphy.com/media/3o7aCRZYNerX4ovPwI/giphy.gif',
    tags: ['morning', 'good morning', 'sun', 'sunrise', 'subah', 'shubh prabhat', 'wakeup', 'tea']
  },
  {
    id: 'gif-good-night-moon',
    category: 'night',
    title: 'Peaceful Night Moon',
    url: 'https://media.giphy.com/media/1dIo6kDOPMzsnMOJTj/giphy.gif',
    tags: ['night', 'good night', 'moon', 'stars', 'sleep', 'shubh ratri', 'sweet dreams', 'so jao']
  },

  // ── Fire & Energy ──
  {
    id: 'gif-fire-rocket',
    category: 'fire',
    title: 'Rocket Launch Lit',
    url: 'https://media.giphy.com/media/mi6DsSSNKDbUY/giphy.gif',
    tags: ['fire', 'rocket', 'aag', 'lit', 'lets go', 'superb', 'fast', 'blast', 'top']
  },
  {
    id: 'gif-fire-flames',
    category: 'fire',
    title: 'Pure Fire Energy',
    url: 'https://media.giphy.com/media/l41JGlwa1xY7Btxfs/giphy.gif',
    tags: ['fire', 'flames', 'aag', 'lit', 'hot', 'epic', 'zabardast', 'bawaal']
  },

  // ── Festive & Desi ──
  {
    id: 'gif-diwali-diya',
    category: 'festive',
    title: 'Diya Lights Diwali',
    url: 'https://media.giphy.com/media/26ufcYAkp8e66vanu/giphy.gif',
    tags: ['diwali', 'diya', 'festival', 'lights', 'shubh diwali', 'festive', 'celebrate', 'mubarak', 'deepawali']
  },
  {
    id: 'gif-holi-colors',
    category: 'festive',
    title: 'Colorful Splash Holi',
    url: 'https://media.giphy.com/media/l2YWAG215P3znhy6Y/giphy.gif',
    tags: ['holi', 'colors', 'rang', 'happy holi', 'festival', 'festive', 'celebrate', 'pichkari']
  }
];

export const STICKER_CATEGORIES = [
  { id: 'all', label: '🔥 All Stickers' },
  { id: 'popular', label: '⭐ Popular' },
  { id: 'desi', label: '🇮🇳 Desi & Hindi' },
  { id: 'feelings', label: '❤️ Love & Feelings' },
  { id: 'reactions', label: '😂 Fun & Reactions' },
  { id: 'celebrations', label: '🎉 Celebrations' },
  { id: 'greetings', label: '🙏 Greetings' },
  { id: 'work', label: '💼 Work & Daily' },
];

export const POPULAR_STICKERS_LIST = [
  // ── Desi & Hindi ──
  {
    id: 'stk-namaste',
    category: 'desi',
    emoji: '🙏',
    label: 'नमस्ते',
    sub: 'Namaste',
    bg: '#fed7aa',
    border: '#f97316',
    tags: ['namaste', 'pranam', 'greetings', 'pranaam', 'hindi', 'respect', 'ram ram', 'jai shree ram', 'hello', 'welcome']
  },
  {
    id: 'stk-dhanyawad',
    category: 'desi',
    emoji: '💐',
    label: 'धन्यवाद!',
    sub: 'Thank You',
    bg: '#bbf7d0',
    border: '#16a34a',
    tags: ['dhanyawad', 'thank you', 'shukriya', 'thanks', 'gratitude', 'hindi', 'welcome']
  },
  {
    id: 'stk-shubh-prabhat',
    category: 'desi',
    emoji: '🌅',
    label: 'शुभ प्रभात',
    sub: 'Good Morning',
    bg: '#fef08a',
    border: '#eab308',
    tags: ['shubh prabhat', 'good morning', 'subah', 'morning', 'sunrise', 'chai', 'suraj', 'hindi']
  },
  {
    id: 'stk-shubh-ratri',
    category: 'desi',
    emoji: '🌙',
    label: 'शुभ रात्रि',
    sub: 'Good Night',
    bg: '#e0e7ff',
    border: '#6366f1',
    tags: ['shubh ratri', 'good night', 'night', 'sleep', 'sweet dreams', 'so jao', 'chand', 'hindi']
  },
  {
    id: 'stk-jai-shree-ram',
    category: 'desi',
    emoji: '🚩',
    label: 'जय श्री राम',
    sub: 'Jai Shree Ram',
    bg: '#ffedd5',
    border: '#ea580c',
    tags: ['jai shree ram', 'ram', 'mandir', 'ayodhya', 'bhagwan', 'flag', 'dharmik', 'hindi']
  },
  {
    id: 'stk-radhe-radhe',
    category: 'desi',
    emoji: '🦚',
    label: 'राधे राधे',
    sub: 'Radhe Radhe',
    bg: '#dcfce7',
    border: '#15803d',
    tags: ['radhe radhe', 'krishna', 'vrindavan', 'bhagwan', 'peacock', 'dharmik', 'hindi']
  },
  {
    id: 'stk-badhai-ho',
    category: 'desi',
    emoji: '🎊',
    label: 'बधाई हो!',
    sub: 'Badhai Ho',
    bg: '#fef9c3',
    border: '#ca8a04',
    tags: ['badhai ho', 'congrats', 'mubarak', 'celebrate', 'khushi', 'hindi']
  },
  {
    id: 'stk-garam-chai',
    category: 'desi',
    emoji: '☕',
    label: 'गरम चाय',
    sub: 'Chai Peelo',
    bg: '#fed7aa',
    border: '#b45309',
    tags: ['chai', 'garam chai', 'tea', 'break', 'subah', 'peelo', 'kadak chai', 'hindi']
  },
  {
    id: 'stk-mauj-kardi',
    category: 'desi',
    emoji: '🕺',
    label: 'मौज़ करदी!',
    sub: 'Wah Bhai',
    bg: '#fbcfe8',
    border: '#db2777',
    tags: ['mauj kardi', 'wah bhai', 'epic', 'funny', 'haha', 'meme', 'zabardast', 'bawaal', 'hindi']
  },

  // ── Popular / Standard ──
  {
    id: 'stk-party',
    category: 'popular',
    emoji: '🎉',
    label: 'Party Time!',
    sub: 'Celebrate',
    bg: '#fef08a',
    border: '#ca8a04',
    tags: ['party', 'celebrate', 'dance', 'fun', 'happy', 'yay', 'weekend']
  },
  {
    id: 'stk-love',
    category: 'feelings',
    emoji: '❤️',
    label: 'Dil Se Love',
    sub: 'Love You',
    bg: '#fecdd3',
    border: '#e11d48',
    tags: ['love', 'pyar', 'dil', 'heart', 'romantic', 'valentine', 'pyaar', 'kiss', 'crush']
  },
  {
    id: 'stk-thumbsup',
    category: 'popular',
    emoji: '👍',
    label: 'Superb!',
    sub: 'Great Work',
    bg: '#bae6fd',
    border: '#0284c7',
    tags: ['thumbsup', 'great', 'superb', 'ok', 'done', 'yes', 'approved', 'like', 'sahi']
  },
  {
    id: 'stk-laugh',
    category: 'reactions',
    emoji: '😂',
    label: 'Haha LOL',
    sub: 'So Funny',
    bg: '#fef08a',
    border: '#eab308',
    tags: ['haha', 'lol', 'rofl', 'funny', 'laugh', 'hasna', 'joke', 'comedy']
  },
  {
    id: 'stk-fire',
    category: 'reactions',
    emoji: '🔥',
    label: 'Aag Hai!',
    sub: 'Full Fire',
    bg: '#ffedd5',
    border: '#f97316',
    tags: ['fire', 'aag', 'lit', 'hot', 'superb', 'mast', 'gazab', 'rocking']
  },
  {
    id: 'stk-birthday',
    category: 'celebrations',
    emoji: '🎂',
    label: 'Happy Birthday',
    sub: 'Best Wishes',
    bg: '#fbcfe8',
    border: '#ec4899',
    tags: ['birthday', 'cake', 'happy birthday', 'janamdin', 'wishes', 'party', 'mubarak']
  },
  {
    id: 'stk-congrats',
    category: 'celebrations',
    emoji: '✨',
    label: 'Congrats!',
    sub: 'Well Done',
    bg: '#fef9c3',
    border: '#eab308',
    tags: ['congrats', 'congratulations', 'badhai', 'mubarak', 'winner', 'trophy', 'star']
  },
  {
    id: 'stk-rocket',
    category: 'work',
    emoji: '🚀',
    label: "Let's Go!",
    sub: 'Speed Up',
    bg: '#ddd6fe',
    border: '#7c3aed',
    tags: ['rocket', 'lets go', 'launch', 'fast', 'success', 'startup', 'work']
  },
  {
    id: 'stk-claps',
    category: 'reactions',
    emoji: '👏',
    label: 'Zabardast!',
    sub: 'Round of Applause',
    bg: '#bbf7d0',
    border: '#16a34a',
    tags: ['claps', 'applause', 'taali', 'superb', 'great', 'zabardast', 'shabash']
  },
  {
    id: 'stk-cool',
    category: 'popular',
    emoji: '😎',
    label: 'Bindaas!',
    sub: 'Stay Cool',
    bg: '#fef08a',
    border: '#ca8a04',
    tags: ['cool', 'bindaas', 'swag', 'boss', 'mast', 'glasses', 'attitude']
  },
  {
    id: 'stk-100',
    category: 'popular',
    emoji: '💯',
    label: '100% Sahi',
    sub: 'Pure Fact',
    bg: '#fee2e2',
    border: '#dc2626',
    tags: ['100', 'perfect', 'pakka', 'sahi', 'true', 'agree', 'fact']
  },
  {
    id: 'stk-flower',
    category: 'feelings',
    emoji: '🌸',
    label: 'Khush Raho',
    sub: 'Always Smile',
    bg: '#fce7f3',
    border: '#f43f5e',
    tags: ['flower', 'smile', 'khush', 'rose', 'pink', 'spring', 'beauty', 'peace']
  },
  {
    id: 'stk-star',
    category: 'reactions',
    emoji: '⭐',
    label: 'Superstar!',
    sub: 'You Rock',
    bg: '#fef08a',
    border: '#eab308',
    tags: ['star', 'superstar', 'rockstar', 'top', 'winner', 'bright', 'number 1']
  },
  {
    id: 'stk-sorry',
    category: 'feelings',
    emoji: '🥺',
    label: 'Sorry Yaar',
    sub: 'Maaf Kardo',
    bg: '#ede9fe',
    border: '#8b5cf6',
    tags: ['sorry', 'maaf', 'galti', 'plea', 'sad', 'rona', 'forgive', 'puppy eyes']
  },
  {
    id: 'stk-busy',
    category: 'work',
    emoji: '💻',
    label: 'Busy at Work',
    sub: 'Call Later',
    bg: '#e2e8f0',
    border: '#64748b',
    tags: ['busy', 'work', 'laptop', 'office', 'meeting', 'kam', 'call later']
  },
  {
    id: 'stk-call-me',
    category: 'work',
    emoji: '📞',
    label: 'Call Me Free',
    sub: 'Important',
    bg: '#ccfbf1',
    border: '#0d9488',
    tags: ['call', 'phone', 'contact', 'urgent', 'jaruri', 'baat karo', 'ring']
  }
];
