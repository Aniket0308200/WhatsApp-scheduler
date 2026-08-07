import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { format, addMinutes } from 'date-fns';
import { scheduleMessage, fetchContactName, resolveContactLive, searchContacts, importContacts, fetchAllContacts } from '../api';

// ─── Complete country-code list ───────────────────────────────────────────────
// ─── Complete country-code list ───────────────────────────────────────────────
const INDIA_ITEM = { code: '91', name: 'India' };
const OTHER_COUNTRIES = [
  { code: '93',  name: 'Afghanistan' },    { code: '355', name: 'Albania' },
  { code: '213', name: 'Algeria' },        { code: '376', name: 'Andorra' },
  { code: '244', name: 'Angola' },         { code: '54',  name: 'Argentina' },
  { code: '374', name: 'Armenia' },        { code: '61',  name: 'Australia' },
  { code: '43',  name: 'Austria' },        { code: '994', name: 'Azerbaijan' },
  { code: '973', name: 'Bahrain' },        { code: '880', name: 'Bangladesh' },
  { code: '32',  name: 'Belgium' },        { code: '229', name: 'Benin' },
  { code: '975', name: 'Bhutan' },         { code: '591', name: 'Bolivia' },
  { code: '387', name: 'Bosnia' },         { code: '267', name: 'Botswana' },
  { code: '55',  name: 'Brazil' },         { code: '673', name: 'Brunei' },
  { code: '359', name: 'Bulgaria' },       { code: '226', name: 'Burkina Faso' },
  { code: '855', name: 'Cambodia' },       { code: '237', name: 'Cameroon' },
  { code: '1',   name: 'Canada / USA' },   { code: '236', name: 'Central African Rep.' },
  { code: '56',  name: 'Chile' },          { code: '86',  name: 'China' },
  { code: '57',  name: 'Colombia' },       { code: '243', name: 'Congo (DRC)' },
  { code: '506', name: 'Costa Rica' },     { code: '385', name: 'Croatia' },
  { code: '53',  name: 'Cuba' },           { code: '357', name: 'Cyprus' },
  { code: '420', name: 'Czech Republic' }, { code: '45',  name: 'Denmark' },
  { code: '593', name: 'Ecuador' },        { code: '20',  name: 'Egypt' },
  { code: '503', name: 'El Salvador' },    { code: '372', name: 'Estonia' },
  { code: '251', name: 'Ethiopia' },       { code: '358', name: 'Finland' },
  { code: '33',  name: 'France' },         { code: '241', name: 'Gabon' },
  { code: '995', name: 'Georgia' },        { code: '49',  name: 'Germany' },
  { code: '233', name: 'Ghana' },          { code: '30',  name: 'Greece' },
  { code: '502', name: 'Guatemala' },      { code: '224', name: 'Guinea' },
  { code: '509', name: 'Haiti' },          { code: '504', name: 'Honduras' },
  { code: '852', name: 'Hong Kong' },      { code: '36',  name: 'Hungary' },
  { code: '354', name: 'Iceland' },
  { code: '62',  name: 'Indonesia' },      { code: '98',  name: 'Iran' },
  { code: '964', name: 'Iraq' },           { code: '353', name: 'Ireland' },
  { code: '972', name: 'Israel' },         { code: '39',  name: 'Italy' },
  { code: '225', name: 'Ivory Coast' },    { code: '1876',name: 'Jamaica' },
  { code: '81',  name: 'Japan' },          { code: '962', name: 'Jordan' },
  { code: '7',   name: 'Kazakhstan' },     { code: '254', name: 'Kenya' },
  { code: '82',  name: 'South Korea' },    { code: '965', name: 'Kuwait' },
  { code: '996', name: 'Kyrgyzstan' },     { code: '856', name: 'Laos' },
  { code: '371', name: 'Latvia' },         { code: '961', name: 'Lebanon' },
  { code: '231', name: 'Liberia' },        { code: '218', name: 'Libya' },
  { code: '370', name: 'Lithuania' },      { code: '352', name: 'Luxembourg' },
  { code: '853', name: 'Macau' },          { code: '261', name: 'Madagascar' },
  { code: '265', name: 'Malawi' },         { code: '60',  name: 'Malaysia' },
  { code: '960', name: 'Maldives' },       { code: '223', name: 'Mali' },
  { code: '356', name: 'Malta' },          { code: '222', name: 'Mauritania' },
  { code: '230', name: 'Mauritius' },      { code: '52',  name: 'Mexico' },
  { code: '373', name: 'Moldova' },        { code: '976', name: 'Mongolia' },
  { code: '212', name: 'Morocco' },        { code: '258', name: 'Mozambique' },
  { code: '95',  name: 'Myanmar' },        { code: '264', name: 'Namibia' },
  { code: '977', name: 'Nepal' },          { code: '31',  name: 'Netherlands' },
  { code: '64',  name: 'New Zealand' },    { code: '505', name: 'Nicaragua' },
  { code: '227', name: 'Niger' },          { code: '234', name: 'Nigeria' },
  { code: '47',  name: 'Norway' },         { code: '968', name: 'Oman' },
  { code: '92',  name: 'Pakistan' },       { code: '507', name: 'Panama' },
  { code: '675', name: 'Papua New Guinea'},{ code: '595', name: 'Paraguay' },
  { code: '51',  name: 'Peru' },           { code: '63',  name: 'Philippines' },
  { code: '48',  name: 'Poland' },         { code: '351', name: 'Portugal' },
  { code: '974', name: 'Qatar' },          { code: '40',  name: 'Romania' },
  { code: '7',   name: 'Russia' },         { code: '250', name: 'Rwanda' },
  { code: '966', name: 'Saudi Arabia' },   { code: '221', name: 'Senegal' },
  { code: '381', name: 'Serbia' },         { code: '232', name: 'Sierra Leone' },
  { code: '65',  name: 'Singapore' },      { code: '421', name: 'Slovakia' },
  { code: '386', name: 'Slovenia' },       { code: '252', name: 'Somalia' },
  { code: '27',  name: 'South Africa' },   { code: '211', name: 'South Sudan' },
  { code: '34',  name: 'Spain' },          { code: '94',  name: 'Sri Lanka' },
  { code: '249', name: 'Sudan' },          { code: '46',  name: 'Sweden' },
  { code: '41',  name: 'Switzerland' },    { code: '963', name: 'Syria' },
  { code: '886', name: 'Taiwan' },         { code: '992', name: 'Tajikistan' },
  { code: '255', name: 'Tanzania' },       { code: '66',  name: 'Thailand' },
  { code: '228', name: 'Togo' },           { code: '216', name: 'Tunisia' },
  { code: '90',  name: 'Turkey' },         { code: '993', name: 'Turkmenistan' },
  { code: '256', name: 'Uganda' },         { code: '380', name: 'Ukraine' },
  { code: '971', name: 'UAE' },            { code: '44',  name: 'United Kingdom' },
  { code: '598', name: 'Uruguay' },        { code: '998', name: 'Uzbekistan' },
  { code: '58',  name: 'Venezuela' },      { code: '84',  name: 'Vietnam' },
  { code: '967', name: 'Yemen' },          { code: '260', name: 'Zambia' },
  { code: '263', name: 'Zimbabwe' },
].sort((a, b) => a.name.localeCompare(b.name));

const ALL_COUNTRIES = [INDIA_ITEM, ...OTHER_COUNTRIES];

// ─── Searchable Country Picker ────────────────────────────────────────────────
function CountryPicker({ value, onChange, disabled }) {
  const [open,    setOpen]    = useState(false);
  const [search,  setSearch]  = useState('');
  const ref                   = useRef(null);

  const cleanSearch = search.trim().toLowerCase();
  const searchDigits = search.replace(/\D/g, '');

  const filtered = cleanSearch
    ? ALL_COUNTRIES.filter(c => {
        const matchesName = c.name.toLowerCase().includes(cleanSearch);
        const matchesCode = searchDigits ? c.code.includes(searchDigits) : false;
        return matchesName || matchesCode;
      })
    : ALL_COUNTRIES;

  const selected = ALL_COUNTRIES.find(c => c.code === value) || null;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (code) => {
    onChange(code);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative flex-shrink-0 ${disabled ? 'opacity-40 pointer-events-none' : ''}`} ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 border border-slate-200 dark:border-wa-dbdr rounded-xl px-3 py-2.5 text-sm bg-slate-50 dark:bg-wa-dsurf hover:bg-slate-100/80 dark:hover:bg-wa-dbdr/50 focus:outline-none focus:ring-2 focus:ring-wa-teal/40 min-w-[110px] justify-between transition-colors text-gray-700 dark:text-wa-dtext"
      >
        <span className="font-medium">
          {selected ? `+${selected.code}` : 'Code'}
        </span>
        <span className="text-gray-400 dark:text-wa-dmuted text-xs">{selected?.name?.split(' ')[0] ?? ''}</span>
        <svg className={`w-3.5 h-3.5 text-gray-400 dark:text-wa-dmuted transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 w-72 bg-white dark:bg-wa-dpanel border border-gray-200 dark:border-wa-dbdr rounded-xl shadow-xl overflow-hidden transition-colors">
          {/* Search box */}
          <div className="p-2 border-b border-gray-100 dark:border-wa-dbdr">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country or code…"
              className="w-full border border-gray-200 dark:border-wa-dbdr bg-white dark:bg-wa-dsurf text-gray-900 dark:text-wa-dtext rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-wa-teal/40"
            />
          </div>
          {/* Options */}
          <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50 dark:divide-wa-dbdr/50 custom-scroll">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-gray-400 dark:text-wa-dmuted text-center">No results</li>
            ) : filtered.map(c => (
              <li key={`${c.code}-${c.name}`}>
                <button
                  type="button"
                  onClick={() => pick(c.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-teal-50 dark:hover:bg-wa-dsurf flex items-center justify-between transition-colors
                    ${c.code === value ? 'bg-teal-50 dark:bg-wa-dsurf/80 font-semibold text-wa-teal dark:text-wa-green' : 'text-gray-700 dark:text-wa-dtext'}`}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-gray-400 dark:text-wa-dmuted font-mono">+{c.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const EMOJI_LIST = {
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳', '🥵', '🥶', '😱', '🤫', '🫠', '🙄', '😴', '🤤'
  ],
  gestures: [
    '👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '👏', '🙏', '✍️', '🤝', '💪', '🤳'
  ],
  hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'
  ],
  symbols: [
    '🎉', '🔥', '✨', '💡', '🚀', '🎈', '🎁', '🎂', '🌟', '🍀', '✈️', '🚗', '💻', '📱', '📞', '📧', '📅', '💯', '⚠️', '✅', '❌', '🍕', '☕', '🍻'
  ]
};

// WhatsApp-style core categories. Keeping these strings compact makes the picker
// fast to render while covering the standard everyday emoji set.
const WHATSAPP_EMOJI_CATEGORIES = {
  people: { label: 'Smileys & People', icon: '😀', emojis: '😀 😃 😄 😁 😆 😅 😂 🤣 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🫡 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕 🤑 🤠 😈 👿 👹 👺 🤡 💩 👻 💀 ☠️ 👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🙏 ✍️ 💅 🤝 💪 🦾 🧠 👀 👁️ 👅 👄'.split(' ') },
  nature: { label: 'Animals & Nature', icon: '🐶', emojis: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐒 🦍 🦧 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🪱 🐛 🦋 🐌 🐞 🐜 🪰 🪲 🪳 🦟 🦗 🕷️ 🦂 🐢 🐍 🦎 🦖 🦕 🐙 🦑 🦐 🦞 🦀 🐡 🐠 🐟 🐬 🐳 🐋 🦈 🐊 🐅 🐆 🦓 🦍 🦣 🐘 🦛 🦏 🐪 🐫 🦒 🦘 🦬 🐃 🐂 🐄 🐎 🐖 🐏 🐑 🦙 🐐 🦌 🐕 🐩 🐈 🐓 🦃 🕊️ 🐇 🦝 🦨 🦡 🦦 🦥 🐁 🐀 🐿️ 🦔 🌵 🎄 🌲 🌳 🌴 🪴 🌱 🌿 ☘️ 🍀 🍁 🍂 🍃 🌷 🌹 🥀 🌺 🌸 💐 🌼 🌻 🌞 🌝 🌛 🌜 🌚 🌕 🌖 🌗 🌘 🌑 🌒 🌓 🌔 🌙 ⭐ 🌟 ✨ ⚡ 🔥 🌈 ☀️ 🌤️ ⛅ 🌧️ ⛈️ 🌩️ ❄️ ☃️ 🌬️ 💨 🌪️ 🌫️ 🌊'.split(' ') },
  food: { label: 'Food & Drink', icon: '🍔', emojis: '🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🫐 🍈 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🍆 🥑 🥦 🥬 🥒 🌶️ 🫑 🌽 🥕 🫒 🧄 🧅 🥔 🍠 🫘 🥐 🥯 🍞 🥖 🥨 🧀 🥚 🍳 🧈 🥞 🧇 🥓 🥩 🍗 🍖 🦴 🌭 🍔 🍟 🍕 🫓 🥪 🥙 🧆 🌮 🌯 🫔 🥗 🥘 🫕 🥫 🍝 🍜 🍲 🍛 🍣 🍱 🥟 🦪 🍤 🍙 🍚 🍘 🍥 🥠 🥮 🍢 🍡 🍧 🍨 🍦 🥧 🧁 🍰 🎂 🍮 🍭 🍬 🍫 🍿 🍩 🍪 🌰 🥜 🍯 🥛 🍼 ☕ 🫖 🍵 🧃 🥤 🧋 🍶 🍺 🍻 🥂 🍷 🫗 🥃 🍸 🍹 🧉 🍾 🧊 🥢 🍽️ 🍴 🥄 🔪 🫙'.split(' ') },
  activities: { label: 'Activities', icon: '⚽', emojis: '⚽ 🏀 🏈 ⚾ 🥎 🎾 🏐 🏉 🥏 🎱 🪀 🏓 🏸 🏒 🏑 🥍 🏏 ⛳ 🪁 🏹 🎣 🤿 🥊 🥋 🎽 🛹 🛼 🛷 ⛸️ 🥌 🎿 ⛷️ 🏂 🪂 🏋️ 🤼 🤸 ⛹️ 🤺 🤾 🏌️ 🏇 🧘 🏄 🏊 🤽 🚣 🧗 🚵 🚴 🏆 🥇 🥈 🥉 🏅 🎖️ 🏵️ 🎗️ 🎫 🎟️ 🎪 🤹 🎭 🎨 🎬 🎤 🎧 🎼 🎹 🥁 🪘 🎷 🎺 🎸 🪕 🎻 🎲 ♟️ 🎯 🎳 🎮 🎰 🧩'.split(' ') },
  travel: { label: 'Travel & Places', icon: '🚗', emojis: '🚗 🚕 🚙 🚌 🚎 🏎️ 🚓 🚑 🚒 🚐 🛻 🚚 🚛 🚜 🛵 🏍️ 🛺 🚲 🛴 🚏 🛣️ 🛤️ ⛽ 🚨 🚥 🚦 🛑 🚧 ⚓ ⛵ 🛶 🚤 🛳️ ⛴️ 🛥️ 🚢 ✈️ 🛩️ 🛫 🛬 🪂 💺 🚁 🚟 🚠 🚡 🛰️ 🚀 🛸 🛎️ 🧳 ⌛ ⏳ ⌚ ⏰ ⏱️ ⏲️ 🕰️ 🕛 🌍 🌎 🌏 🗺️ 🗾 🧭 🏔️ ⛰️ 🌋 🗻 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🧱 🪨 🛖 🏘️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🛕 🕍 ⛩️ 🕋 ⛲ ⛺ 🌁 🌃 🌄 🌅 🌆 🌇 🌉 🎠 🎡 🎢 💈 🎪'.split(' ') },
  objects: { label: 'Objects', icon: '💡', emojis: '⌚ 📱 📲 💻 ⌨️ 🖥️ 🖨️ 🖱️ 🖲️ 🕹️ 🗜️ 💽 💾 💿 📀 📼 📷 📸 📹 🎥 📽️ 🎞️ 📞 ☎️ 📟 📠 📺 📻 🎙️ ⏱️ ⏲️ ⌚ ⏰ 🕰️ ⌛ ⏳ 📡 🔋 🪫 🔌 💡 🔦 🕯️ 🪔 🧯 🛢️ 💸 💵 💴 💶 💷 🪙 💰 💳 🧾 💎 ⚖️ 🪜 🧰 🪛 🔧 🔨 ⚒️ 🛠️ ⛏️ 🪚 🔩 ⚙️ ⛓️ 🧲 🔫 💣 🧨 🪓 🔪 🗡️ ⚔️ 🛡️ 🚬 ⚰️ 🪦 ⚱️ 🏺 🔮 📿 🧿 💈 ⚗️ 🔭 🔬 🕳️ 🩹 🩺 💊 💉 🩸 🧬 🦠 🧫 🧪 🌡️ 🧹 🧺 🧻 🚽 🚰 🚿 🛁 🪥 🪒 🧴 🧷 🧸 🖼️ 🛍️ 🛒 🎁 🎈 🎏 🎀 🪄 🪅 🪩 🪆 🧵 🧶 🪢 🧥 🥼 🦺 👔 👕 👖 🧣 🧤 🧦 👗 👘 🥻 🩱 🩲 🩳 👙 👚 👜 👝 🎒'.split(' ') },
  symbols: { label: 'Symbols', icon: '❤️', emojis: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ☮️ ✝️ ☪️ 🕉️ ☸️ ✡️ 🔯 🕎 ☯️ ☦️ 🛐 ⛎ ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ 🆔 ⚛️ 🉑 ☢️ ☣️ 📴 📳 🈶 🈚 🈸 🈺 🈷️ ✴️ 🆚 💮 🉐 ㊙️ ㊗️ 🈴 🈵 🈹 🈲 🅰️ 🅱️ 🆎 🆑 🅾️ 🆘 ❌ ⭕ 🛑 ⛔ 📛 🚫 💯 💢 ♨️ 🚷 🚯 🚳 🚱 🔞 📵 🚭 ❗ ❕ ❓ ❔ ‼️ ⁉️ 🔅 🔆 ⚠️ 🚸 🔱 ⚜️ 🔰 ♻️ ✅ 🈯 💹 ❇️ ✳️ ❎ 🌐 💠 Ⓜ️ 🌀 💤 🏧 🚾 ♿ 🅿️ 🈳 🈂️ 🛂 🛃 🛄 🛅 🚹 🚺 🚼 🚻 🚮 🎦 📶 🈁 🔣 ℹ️ 🔤 🔡 🔠 🔢 #️⃣ *️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 ▶️ ⏸️ ⏹️ ⏺️ ⏭️ ⏮️ 🔼 🔽 ⏫ ⏬ ◀️ 🔄 🔃 🔀 🔁 🔂'.split(' ') },
  flags: { label: 'Flags', icon: '🏳️', emojis: '🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🇮🇳 🇺🇸 🇬🇧 🇨🇦 🇦🇺 🇳🇿 🇿🇦 🇦🇪 🇸🇦 🇸🇬 🇲🇾 🇮🇩 🇹🇭 🇯🇵 🇰🇷 🇨🇳 🇭🇰 🇹🇼 🇫🇷 🇩🇪 🇮🇹 🇪🇸 🇵🇹 🇳🇱 🇧🇪 🇨🇭 🇦🇹 🇸🇪 🇳🇴 🇩🇰 🇫🇮 🇵🇱 🇷🇴 🇺🇦 🇷🇺 🇹🇷 🇬🇷 🇮🇱 🇪🇬 🇳🇬 🇰🇪 🇧🇷 🇦🇷 🇲🇽 🇨🇱 🇨🇴 🇵🇪 🇵🇭 🇵🇰 🇧🇩 🇳🇵 🇱🇰 🇻🇳 🇮🇷 🇮🇶 🇶🇦 🇰🇼 🏴‍☠️'.split(' ') },
};

// ─── SchedulerForm ────────────────────────────────────────────────────────────
function ContactsImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const chooseFile = (nextFile) => {
    if (!nextFile) return;
    if (!/\.(vcf|csv)$/i.test(nextFile.name)) {
      toast.error('Please choose a .vcf or .csv contacts file.');
      return;
    }
    setFile(nextFile);
  };

  const upload = async () => {
    if (!file) return toast.error('Choose a contacts file first.');
    setUploading(true);
    try {
      const result = await importContacts(file);
      toast.success('Successfully imported ' + result.imported + ' contacts!');
      onImported?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg bg-white dark:bg-wa-dpanel rounded-2xl shadow-2xl border border-gray-200 dark:border-wa-dbdr overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-wa-dbdr flex items-center justify-between">
          <div><h3 className="font-semibold text-gray-800 dark:text-wa-dtext">Import Contacts</h3><p className="text-xs text-gray-400 mt-0.5">Supported formats: VCF / vCard and CSV</p></div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl" aria-label="Close">×</button>
        </div>
        <div className="p-5 space-y-4">
          <button type="button" onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files?.[0]); }}
            className={`w-full border-2 border-dashed rounded-xl p-7 text-center transition-colors ${dragging ? 'border-wa-teal bg-teal-50 dark:bg-wa-dsurf' : 'border-gray-300 dark:border-wa-dbdr hover:border-wa-teal'}`}>
            <span className="block text-sm font-medium text-gray-700 dark:text-wa-dtext">Drop your .vcf or .csv file here</span>
            <span className="block text-xs text-gray-400 mt-1">or click to select a file</span>
            {file && <span className="block mt-3 text-xs text-wa-teal dark:text-wa-green font-semibold">Selected: {file.name}</span>}
          </button>
          <input ref={inputRef} type="file" accept=".vcf,.csv,text/vcard,text/csv" className="hidden" onChange={e => chooseFile(e.target.files?.[0])} />
          <div className="rounded-xl bg-gray-50 dark:bg-wa-dsurf p-3 text-xs text-gray-600 dark:text-wa-dmuted space-y-2">
            <p className="font-semibold text-gray-700 dark:text-wa-dtext">How to export contacts</p>
            <p><strong>Android:</strong> Contacts app → Fix &amp; manage / Settings → Export → save as .vcf.</p>
            <p><strong>iPhone:</strong> iCloud.com → Contacts → Select all → Export vCard. You can also export a CSV from Google Contacts.</p>
            <p>Use full international numbers where possible. A plain 10-digit number uses the default country code (+91).</p>
          </div>
          <button type="button" onClick={upload} disabled={!file || uploading}
            className="w-full rounded-xl bg-wa-teal hover:bg-wa-dark text-white py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'Importing contacts…' : 'Bulk Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulerForm({ isConnected, onScheduled, isSyncing }) {
  const getFullPhone = (cc, ph) => {
    if (ph && ph.endsWith('@g.us')) {
      return ph;
    }
    const cleanedInput = ph.replace(/\D/g, '');
    if (!cleanedInput) return '';
    if (cleanedInput.startsWith(cc) && cleanedInput.length > cc.length + 5) {
      return cleanedInput;
    }
    for (const c of ALL_COUNTRIES) {
      if (cleanedInput.startsWith(c.code) && cleanedInput.length > c.code.length + 5) {
        return cleanedInput;
      }
    }
    return cc + cleanedInput;
  };

  const getMinTime = () => {
    const d = addMinutes(new Date(), 1);
    d.setSeconds(0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const getDefaultTime = () => {
    const d = addMinutes(new Date(), 5);
    d.setSeconds(0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  };

  const [countryCode,   setCountryCode]   = useState('91');
  const [phone,         setPhone]         = useState('');
  const [contactName,   setContactName]   = useState(null);   // fetched name
  const [contactExists, setContactExists] = useState(false);
  const [fetchingName,  setFetchingName]  = useState(false);
  const [message,       setMessage]       = useState('');
  const [scheduledAt,   setScheduledAt]   = useState(getDefaultTime);
  const [timeConfirmed, setTimeConfirmed] = useState(false);  // "Done" clicked
  const [loading,       setLoading]       = useState(false);

  // Auto-suggest states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const formRef = useRef(null);

  // Directory and Contacts list states
  const [showDirectory,   setShowDirectory]   = useState(false);
  const [contactsList,    setContactsList]    = useState({ all: [], personal: [], groups: [] });
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryTab,    setDirectoryTab]    = useState('all');

  const loadContactsList = useCallback(async () => {
    if (!isConnected) return;
    setLoadingContacts(true);
    try {
      const data = await fetchAllContacts();
      setContactsList(data || { all: [], personal: [], groups: [] });
    } catch (err) {
      console.error('Failed to load contacts directory:', err);
    } finally {
      setLoadingContacts(false);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) {
      setContactsList({ all: [], personal: [], groups: [] });
      return;
    }

    // Load contacts immediately if the directory modal is open,
    // or when the backend reports that initial history sync is complete.
    if (showDirectory || !isSyncing) {
      loadContactsList();
    }
  }, [isConnected, isSyncing, showDirectory, loadContactsList]);

  // Emoji picker states & refs
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('people');
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const handleInsertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setMessage(before + emoji + after);

    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 10);
  };

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse full phone number into countryCode and local phone number
  const parseFullPhone = (fullPhone) => {
    const digits = fullPhone.replace(/\D/g, '');
    let bestMatch = null;
    for (const c of ALL_COUNTRIES) {
      if (digits.startsWith(c.code)) {
        if (!bestMatch || c.code.length > bestMatch.code.length) {
          bestMatch = c;
        }
      }
    }
    if (bestMatch) {
      return {
        countryCode: bestMatch.code,
        phone: digits.slice(bestMatch.code.length)
      };
    }
    if (digits.length > 10) {
      return {
        countryCode: digits.slice(0, 2),
        phone: digits.slice(2)
      };
    }
    return {
      countryCode: '91', // default fallback
      phone: digits
    };
  };

  const handleSelectContactFromDirectory = (c) => {
    const isGroup = c.phone && c.phone.endsWith('@g.us');
    if (isGroup) {
      setPhone(c.phone);
      setContactName(c.name || null);
      setContactExists(true);
    } else {
      const { countryCode: cc, phone: ph } = parseFullPhone(c.phone);
      setCountryCode(cc);
      setPhone(ph);
      setContactName(c.name || null);
      setContactExists(true);
    }
    setShowDirectory(false);
    toast.success(`Selected contact: ${c.name || `+${c.phone}`}`);
  };

  const handleSelectSuggestion = (contact) => {
    const isGroup = contact.phone && contact.phone.endsWith('@g.us');
    if (isGroup) {
      setPhone(contact.phone);
      setContactName(contact.name || null);
      setContactExists(true);
    } else {
      const { countryCode: cc, phone: ph } = parseFullPhone(contact.phone);
      setCountryCode(cc);
      setPhone(ph);
      setContactName(contact.name || null);
      setContactExists(true);
    }
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success(`Selected: ${contact.name || `+${contact.phone}`}`);
  };

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Debounced Contact Search Suggestions ──────────────────────────────────
  useEffect(() => {
    if (!phone || phone.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchContacts(phone);
        setSuggestions(res || []);
      } catch (err) {
        console.error('Failed to search contacts:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [phone]);

  // ── Auto-fetch contact name on phone change (if numeric) ──────────────────
  const nameTimer = useRef(null);

  const lookupContact = useCallback(async (cc, ph) => {
    // If it's a contact name rather than a phone number, skip lookup
    if (ph && /[A-Za-z]/.test(ph)) return;

    const full = getFullPhone(cc, ph);
    if (!isConnected || full.length < 8) { 
      setContactName(null); 
      setContactExists(false); 
      return; 
    }
    
    setFetchingName(true);
    try {
      // Use the new live resolver for immediate results
      const res = await resolveContactLive(full);
      if (res.name) {
        setContactName(res.name);
        setContactExists(res.exists);
        console.log(`[Contact] Resolved ${full} -> ${res.name} (${res.source})`);
      } else {
        // Fallback to regular lookup
        const fallback = await fetchContactName(full);
        setContactName(fallback.name || null);
        setContactExists(Boolean(fallback.exists));
      }
    } catch (err) {
      console.error('[Contact] Lookup error:', err);
      setContactName(null); 
      setContactExists(false);
    } finally { 
      setFetchingName(false); 
    }
  }, [isConnected]);

  useEffect(() => {
    clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => lookupContact(countryCode, phone), 800);
    return () => clearTimeout(nameTimer.current);
  }, [countryCode, phone, lookupContact]);

  // Reset time confirmation if datetime changes
  const handleDateChange = (val) => {
    setScheduledAt(val);
    setTimeConfirmed(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!timeConfirmed) {
      toast.error('Please confirm the scheduled time first.');
      return;
    }

    const fullPhone = getFullPhone(countryCode, phone);
    if (!fullPhone || fullPhone.length < 7) {
      toast.error('Enter a valid phone number.');
      return;
    }
    if (!message.trim()) {
      toast.error('Message cannot be empty.');
      return;
    }

    const utcISO = new Date(scheduledAt).toISOString();
    setLoading(true);
    try {
      await scheduleMessage({
        phone: fullPhone,
        message: message.trim(),
        scheduledAt: utcISO,
        recipientName: contactName
      });
      toast.success('Message scheduled!');
      
      // Reset form
      setPhone('');
      setMessage('');
      setScheduledAt(getDefaultTime());
      setTimeConfirmed(false);
      setContactName(null);
      setContactExists(false);
      setSuggestions([]);
      
      // Trigger instant refresh
      onScheduled?.();
      
      // Refresh contacts cache if a new contact was resolved
      if (contactName && fullPhone) {
        try {
          await resolveContactLive(fullPhone);
        } catch (e) {
          console.log('Contact refresh failed:', e.message);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const minTime = getMinTime();

  const cleanDirSearch = directorySearch.trim().toLowerCase();
  const dirSearchDigits = cleanDirSearch.replace(/\D/g, '');
  const activeList = directoryTab === 'group' ? (contactsList.groups || []) : (directoryTab === 'personal' ? (contactsList.personal || []) : (contactsList.all || []));
  const filteredContacts = activeList.filter(c => {
    if (!cleanDirSearch) return true;
    const matchesName = c.name ? String(c.name).toLowerCase().includes(cleanDirSearch) : false;
    const matchesPhone = dirSearchDigits ? (c.phone ? String(c.phone).includes(dirSearchDigits) : false) : false;
    return matchesName || matchesPhone;
  });

  return (
    <div className={`bg-white dark:bg-wa-dpanel rounded-2xl shadow-sm border overflow-visible transition-colors duration-200 mt-3
      ${isConnected ? 'border-slate-200 dark:border-wa-dbdr' : 'border-slate-200 dark:border-wa-dbdr opacity-60 pointer-events-none select-none'}`}>

      {/* ── Panel header ───────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-200 dark:border-wa-dbdr flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-wa-dtext">Schedule a Message</h2>
          <p className="text-xs text-gray-400 dark:text-wa-dmuted mt-0.5">
            {isConnected ? 'Fill in the details below.' : 'Connect WhatsApp first.'}
          </p>
        </div>
        {isConnected ? (
          <button
            type="button"
            onClick={() => {
              setShowDirectory(true);
              loadContactsList();
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-wa-teal/30 bg-wa-teal/10 px-3 py-2 sm:py-1.5 text-xs font-semibold text-wa-teal hover:bg-wa-teal/20 backdrop-blur-xs transition-colors focus:outline-none w-full sm:w-auto"
          >
            👥 Contacts Directory
          </button>
        ) : (
          <span className="text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium w-fit">
            Not connected
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">

        {/* ── Recipient ─────────────────────────────────────────────────── */}
        <div>
          <div className="mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-wa-dtext">
              Recipient Phone Number or Contact Name
            </label>
            <button type="button" onClick={() => setShowImportModal(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 sm:py-1 text-xs font-semibold text-emerald-500 backdrop-blur-sm transition-colors hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 w-full sm:w-auto shrink-0">
              <span aria-hidden="true">↑</span>
              Import Contacts (.vcf / .csv)
            </button>
          </div>
          <div className="flex gap-2">
            <CountryPicker value={countryCode} onChange={setCountryCode} disabled={phone && phone.endsWith('@g.us')} />
            <div className="flex-1 relative" ref={formRef}>
              <input
                type="text"
                value={phone}
                onFocus={() => setShowSuggestions(true)}
                onChange={e => {
                  setPhone(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder="Search name or type number…"
                required
                className="w-full border border-slate-200 dark:border-wa-dbdr rounded-xl px-4 py-2.5 text-sm bg-slate-50 focus:bg-white dark:bg-wa-dsurf text-gray-900 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-wa-teal/40 focus:border-wa-teal pr-14 transition-colors"
              />
              {phone && (
                <button
                  type="button"
                  onClick={() => {
                    setPhone('');
                    setContactName(null);
                    setContactExists(false);
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:scale-110 active:scale-95 transition-transform ${fetchingName ? 'right-9' : 'right-3'}`}
                  title="Clear recipient"
                >
                  ✕
                </button>
              )}
              {fetchingName && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-wa-teal border-t-transparent rounded-full animate-spin" />
              )}

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute left-0 right-0 mt-1 bg-white dark:bg-wa-dpanel border border-gray-200 dark:border-wa-dbdr rounded-xl shadow-xl max-h-52 overflow-y-auto z-50 divide-y divide-gray-100 dark:divide-wa-dbdr/50 custom-scroll">
                  {suggestions.map((c) => {
                    const isGroup = c.isGroup || c.is_group || (c.phone && c.phone.endsWith('@g.us')) || (c.jid && c.jid.endsWith('@g.us'));
                    return (
                      <li key={c.jid}>
                        <button
                          type="button"
                          onClick={() => handleSelectSuggestion(c)}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 dark:hover:bg-wa-dsurf flex flex-col transition-colors"
                        >
                          <span className="font-semibold text-gray-800 dark:text-wa-dtext flex items-center gap-1.5">
                            {isGroup ? '👥 ' : ''}{c.name || (isGroup ? c.phone : `+${c.phone}`)}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-wa-dmuted font-mono">
                            {isGroup ? 'Group' : `+${c.phone}`}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Preview + contact name */}
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 dark:text-wa-dmuted">
              Full number: <span className="font-mono text-gray-600 dark:text-wa-dtext">+{getFullPhone(countryCode, phone)}</span>
            </span>
            {contactExists && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-green-200/50 dark:border-green-900/30">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                  {contactName || `+${getFullPhone(countryCode, phone)}`}
                </span>
                {!contactName && (
                  <span className="text-xs bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium border border-green-200/50 dark:border-green-900/30">
                    ✓ Valid WhatsApp Number
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Message ───────────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-wa-dtext mb-1.5">
            Message
          </label>
          <div className="relative z-10 border border-slate-200 dark:border-wa-dbdr rounded-xl overflow-visible focus-within:z-[70] focus-within:ring-2 focus-within:ring-wa-teal/40 focus-within:border-wa-teal bg-slate-50 focus-within:bg-white dark:bg-wa-dsurf transition-colors">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message here… (e.g: Happy birthday 🎉)"
              rows={4}
              required
              className="w-full px-4 py-2.5 text-sm bg-transparent text-gray-900 dark:text-wa-dtext focus:outline-none resize-y min-h-[80px] custom-scroll"
            />
            {/* Toolbar under textarea */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t border-slate-200/60 dark:border-wa-dbdr/50 bg-slate-50/50 dark:bg-wa-dpanel/50 transition-colors">
              {/* Emoji button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-wa-teal dark:text-wa-dmuted dark:hover:text-wa-green hover:bg-gray-200 dark:hover:bg-wa-dsurf transition-colors"
                  title="Insert emoji"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute left-0 mb-2 w-[288px] min-[360px]:w-[320px] sm:w-[22rem] max-w-[92vw] bg-white dark:bg-[#202c33] border-[3px] border-gray-800 dark:border-wa-dbdr rounded-xl shadow-2xl z-[80] p-3 overflow-hidden transition-all"
                  >
                    <div className="flex overflow-x-auto custom-scroll border-b border-gray-100 dark:border-wa-dbdr/50 pb-2 mb-2 gap-1 justify-start text-lg">
                      {Object.entries(WHATSAPP_EMOJI_CATEGORIES).map(([cat, config]) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setEmojiCategory(cat)}
                          title={config.label}
                          aria-label={config.label}
                          className={`w-8 h-8 shrink-0 rounded-lg transition-colors ${emojiCategory === cat ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}
                        >
                          {config.icon}
                        </button>
                      ))}
                    </div>
                    <p className="mb-2 text-[11px] font-semibold text-gray-500 dark:text-gray-300">{WHATSAPP_EMOJI_CATEGORIES[emojiCategory].label}</p>
                    <div className="grid grid-cols-9 gap-1 max-h-56 overflow-y-auto custom-scroll pr-1">
                      {WHATSAPP_EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji, index) => (
                        <button
                          key={emoji + index}
                          type="button"
                          onClick={() => handleInsertEmoji(emoji)}
                          className="w-8 h-8 text-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-wa-dmuted">{message.length} chars</p>
            </div>
          </div>
        </div>

        {/* ── Date & Time ───────────────────────────────────────────────── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-wa-dtext mb-1.5">
            Scheduled Date & Time
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 w-full">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-wa-dmuted pointer-events-none text-sm select-none">
                📅
              </span>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => handleDateChange(e.target.value)}
                min={minTime}
                required
                className={`w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-slate-50 focus:bg-white dark:bg-wa-dsurf text-gray-900 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-wa-teal/40 focus:border-wa-teal transition-colors
                  ${timeConfirmed ? 'border-green-400 dark:border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-300' : 'border-slate-200 dark:border-wa-dbdr'}`}
              />
            </div>
            {/* Confirm / Done button */}
            <button
              type="button"
              onClick={() => {
                if (!scheduledAt) { toast.error('Pick a date & time first.'); return; }
                const picked = new Date(scheduledAt);
                if (picked <= addMinutes(new Date(), 0)) {
                  toast.error('Must be at least 1 minute in the future.');
                  return;
                }
                setTimeConfirmed(true);
                toast.success('Time confirmed!');
              }}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-1.5
                ${timeConfirmed
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-wa-teal hover:bg-wa-dark text-white'}`}
            >
              {timeConfirmed ? '✓ Done' : 'Confirm'}
            </button>
          </div>
          
          {/* WhatsApp themed premium success block */}
          {timeConfirmed ? (
            <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in">
              <span className="text-sm mt-0.5 select-none">⏰</span>
              <div>
                <p className="font-semibold text-emerald-950 dark:text-emerald-200">Time Lock Active</p>
                <p className="mt-0.5 text-emerald-700/90 dark:text-emerald-300/80 leading-relaxed">
                  Message will be dispatched at <span className="font-bold underline">{new Date(scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</span>.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-wa-dmuted mt-1.5 flex items-center gap-1.5 pl-1 leading-normal">
              <span className="select-none">💡</span>
              Select a time at least 1 minute ahead, then click Confirm.
            </p>
          )}
        </div>

        {/* ── Submit ────────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={loading || !isConnected || !timeConfirmed}
          className={`w-full font-semibold py-3 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-colors
            ${timeConfirmed && isConnected
              ? 'bg-wa-green hover:bg-wa-teal text-white'
              : 'bg-gray-200 dark:bg-wa-dsurf text-gray-400 dark:text-wa-dmuted cursor-not-allowed border dark:border-wa-dbdr'}`}
        >
          {loading && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {loading ? 'Scheduling…' : '📅  Schedule Message'}
        </button>
      </form>
      {showImportModal && (
        <ContactsImportModal
          onClose={() => setShowImportModal(false)}
          onImported={() => {
            setSuggestions([]);
            setShowSuggestions(false);
            loadContactsList();
          }}
        />
      )}

      {/* Sliding Contacts Directory Drawer */}
      {showDirectory && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={() => setShowDirectory(false)} />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-sm sm:max-w-md h-full bg-white dark:bg-wa-dpanel shadow-2xl border-l border-slate-200 dark:border-wa-dbdr flex flex-col z-10 animate-slide-in">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-wa-dbdr flex items-center justify-between bg-emerald-600 dark:bg-wa-dpanel text-white">
              <div>
                <h3 className="font-semibold text-white dark:text-wa-dtext flex items-center gap-1.5 text-base">
                  👥 Contacts Directory
                  <span className="text-xs px-2 py-0.5 bg-white/20 text-white dark:bg-wa-green/20 dark:text-wa-green rounded-full font-bold">
                    {contactsList.all?.length || 0}
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/90 dark:text-wa-dmuted mt-0.5">Click a contact to fill the scheduler form</p>
              </div>
              <button type="button" onClick={() => setShowDirectory(false)} className="text-emerald-100 hover:text-white dark:text-gray-400 dark:hover:text-white text-2xl font-light focus:outline-none">
                &times;
              </button>
            </div>

            {/* Syncing status indicator in directory */}
            {isSyncing ? (
              <div className="bg-blue-50 dark:bg-blue-950/20 px-5 py-3 border-b border-blue-100/50 dark:border-wa-dbdr/30 flex flex-col gap-1.5 text-xs text-blue-700 dark:text-blue-300 font-medium">
                <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300 animate-pulse">
                  <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span>Syncing contacts in progress...</span>
                </div>
                <p className="text-gray-500 dark:text-wa-dmuted pl-5">
                  Loaded <strong>{contactsList.all?.length || 0}</strong> contacts in batches. Names are populating progressively.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-wa-dsurf/30 px-5 py-2.5 border-b border-slate-100 dark:border-wa-dbdr/30 text-xs text-gray-500 dark:text-wa-dmuted">
                💡 Missing contact names? Syncing depends on your active chat history. Use the <strong>"Import Contacts"</strong> button to upload all names instantly.
              </div>
            )}
            
            {/* Search Input */}
            <div className="p-4 pb-2 bg-slate-50/20 dark:bg-transparent">
              <div className="relative">
                <input
                  type="text"
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  placeholder="Search by name or number…"
                  className="w-full border border-slate-200 dark:border-wa-dbdr rounded-xl pl-9 pr-4 py-2 text-sm bg-white dark:bg-wa-dsurf text-gray-900 dark:text-wa-dtext focus:outline-none focus:ring-2 focus:ring-wa-teal/40 focus:border-wa-teal transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                {directorySearch && (
                  <button type="button" onClick={() => setDirectorySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Tabs inside directory */}
            <div className="px-4 pb-3 flex gap-1.5 border-b border-slate-100 dark:border-wa-dbdr/40 bg-slate-50/20 dark:bg-transparent">
              <button
                type="button"
                onClick={() => setDirectoryTab('all')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${directoryTab === 'all' ? 'bg-wa-teal text-white' : 'bg-slate-100 dark:bg-wa-dsurf text-gray-600 dark:text-wa-dmuted hover:bg-slate-200/70 dark:hover:bg-wa-dbdr/50'}`}
              >
                All ({contactsList.all?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryTab('personal')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${directoryTab === 'personal' ? 'bg-wa-teal text-white' : 'bg-slate-100 dark:bg-wa-dsurf text-gray-600 dark:text-wa-dmuted hover:bg-slate-200/70 dark:hover:bg-wa-dbdr/50'}`}
              >
                Personal ({contactsList.personal?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setDirectoryTab('group')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${directoryTab === 'group' ? 'bg-wa-teal text-white' : 'bg-slate-100 dark:bg-wa-dsurf text-gray-600 dark:text-wa-dmuted hover:bg-slate-200/70 dark:hover:bg-wa-dbdr/50'}`}
              >
                Groups ({contactsList.groups?.length || 0})
              </button>
            </div>
            
            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto custom-scroll divide-y divide-slate-100 dark:divide-wa-dbdr/40 p-2">
              {loadingContacts ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400 dark:text-wa-dmuted">
                  <span className="w-6 h-6 border-2 border-wa-teal border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs">Loading contacts directory…</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-wa-dmuted gap-2">
                  <span className="text-2xl">👥</span>
                  <p className="text-xs">{directorySearch ? 'No matching contacts found' : 'No contacts saved yet.'}</p>
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isGroup = Boolean(c.type === 'group' || c.isGroup || c.is_group || String(c.phone || '').endsWith('@g.us'));
                  const contactNameDisplay = c.name || (isGroup ? c.phone : `+${c.phone}`);
                  const hasName = Boolean(c.name);
                  
                  // Simple source pill styling
                  const isVcf = c.source === 'import_vcf';
                  const isCsv = c.source === 'import_csv';
                  const isLive = c.source === 'live_lookup' || c.source === 'whatsapp';
                  const isGroupSource = c.source === 'group_sync' || isGroup;
                  const badgeCls = isVcf
                    ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-100/50'
                    : isCsv
                    ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 border border-indigo-100/50'
                    : isLive
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100/50'
                    : isGroupSource
                    ? 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 border border-purple-100/50'
                    : 'bg-slate-50 dark:bg-wa-dsurf text-gray-600';
                  
                  const sourceLabel = isVcf
                    ? 'VCF Import'
                    : isCsv
                    ? 'CSV Import'
                    : isLive
                    ? 'WhatsApp Live'
                    : isGroupSource
                    ? 'Group Sync'
                    : c.source || 'WhatsApp';
                  
                  return (
                    <button
                      key={c.phone + '-' + c.jid}
                      type="button"
                      onClick={() => handleSelectContactFromDirectory(c)}
                      className="w-full text-left px-4 py-3.5 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-xl flex items-center justify-between gap-3 transition-colors group border-b border-slate-100/50 dark:border-wa-dbdr/20"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Initial/Avatar */}
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-500/20">
                          {hasName ? c.name.charAt(0).toUpperCase() : '#'}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${hasName ? 'text-gray-800 dark:text-wa-dtext' : 'text-gray-500 dark:text-wa-dmuted font-mono'}`}>
                            {contactNameDisplay}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-wa-dmuted font-mono truncate">
                            {String(c.phone || '').endsWith('@g.us') ? c.phone : `+${c.phone}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${badgeCls}`}>
                          {sourceLabel}
                        </span>
                        <span className="text-[10px] text-wa-teal dark:text-wa-green opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center gap-0.5">
                          Select ➔
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
