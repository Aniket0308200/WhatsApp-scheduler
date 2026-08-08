import axios from 'axios';

// Get or generate a unique session ID for this browser client
let sessionId = localStorage.getItem('wa_session_id');
if (!sessionId) {
  sessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  localStorage.setItem('wa_session_id', sessionId);
}

// In local development use Vite's /api proxy, so the UI and the backend being
// edited in this workspace always talk to each other. Deployments can override
// this with VITE_API_BASE_URL.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://whatsapp-scheduler-backend-ubkz.onrender.com');
const API_BASE_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-Session-ID': sessionId,
  },
});

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
export const fetchStatus        = ()       => api.get('/status').then(r => r.data);
export const requestPairingCode = (phone)  => api.post('/pairing-code', { phone }).then(r => r.data);
export const logout             = ()       => api.post('/logout').then(r => r.data);
export const syncGroups         = ()       => api.post('/contacts/sync-groups').then(r => r.data);

/** Look up a contact's display name. Returns { name, exists } */
export const fetchContactName = (phone) =>
  api.get(`/contact/${phone}`).then(r => r.data);

/** Active live contact resolution for immediate name lookup */
export const resolveContactLive = (phone) =>
  api.post('/contacts/resolve', { phone }).then(r => r.data);

/** Fetch all contacts from database */
export const fetchAllContacts = () =>
  api.get('/contacts').then(r => r.data);

/** Search contacts by name or phone for autosuggest. Returns [{ phone, name }] */
export const searchContacts = (q) =>
  api.get(`/contacts/search?q=${encodeURIComponent(q)}`).then(r => r.data);

export const importContacts = (file) =>
  api.post('/contacts/import', file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream', 'X-File-Name': file.name },
  }).then(r => r.data);

// ─── Google Contacts ─────────────────────────────────────────────────────────
export const fetchGoogleAuthUrl = () =>
  api.get(`/auth/google/url?sessionId=${sessionId}`).then(r => r.data);

export const fetchLinkedGoogleAccounts = () =>
  api.get('/auth/google/linked').then(r => r.data);

// ─── Messages ────────────────────────────────────────────────────────────────
export const fetchMessages   = ()        => api.get('/messages').then(r => r.data);
export const scheduleMessage = (payload) => api.post('/messages', payload).then(r => r.data);
export const cancelMessage   = (id)      => api.delete(`/messages/${id}`).then(r => r.data);
export const deleteMessage   = (id)      => api.delete(`/messages/${id}?permanent=true`).then(r => r.data);
