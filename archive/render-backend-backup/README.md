# Render Backend Backup & Recovery Guide

Agar future me kabhi bhi Render par wapas shift hona ho ya emergency backup ke roop me Render use karna ho, to yeh document aur settings use kar sakte hain.

---

## 1. Render Deployment Details
- **Service Name:** `whatsapp-scheduler-backend`
- **Render Service URL:** `https://whatsapp-scheduler-backend-ubkz.onrender.com`
- **Health Check Endpoint:** `https://whatsapp-scheduler-backend-ubkz.onrender.com/api/health`
- **Root Directory:** `./backend` (ya root agar `server.js` run ho raha ho)
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

---

## 2. Environment Variables Required on Render
Render ke Dashboard me Environment Variables section me yeh keys set rahengi:
```env
PORT=10000
NODE_ENV=production
MONGODB_URI=<Your_MongoDB_Atlas_Connection_String>
ENCRYPTION_KEY=<Your_32_Character_Hex_Key>
CLIENT_URL=https://wascheduler.site
GOOGLE_CLIENT_ID=<Your_Google_OAuth_Client_ID>
GOOGLE_CLIENT_SECRET=<Your_Google_OAuth_Client_Secret>
GOOGLE_REDIRECT_URI=https://whatsapp-scheduler-backend-ubkz.onrender.com/api/auth/google/callback
```

---

## 3. How to Switch Frontend Back to Render (If Needed in Future)
Agar kabhi bhi wapas Render use karna ho:
1. `frontend/src/api.js` me line 14 par URL change karke wapas Render ka daal dein:
   ```javascript
   export const BASE_URL = import.meta.env.VITE_API_BASE_URL ||
     (import.meta.env.DEV ? '/api' : 'https://whatsapp-scheduler-backend-ubkz.onrender.com');
   ```
2. Frontend ka build run karein:
   ```bash
   npm run build
   ```
3. `dist/` folder ko Hostinger par re-upload kar dein.
