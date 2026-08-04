# WhatsApp Message Scheduler

A lightweight, local WhatsApp message scheduler built with React (Vite) + Tailwind CSS on the frontend and Node.js (Express) + Baileys on the backend.

---

## Project Structure

```
Wp sheduler/
├── backend/
│   ├── server.js       # Express API server
│   ├── whatsapp.js     # Baileys WhatsApp client & session management
│   ├── scheduler.js    # node-cron job — sends due messages every minute
│   └── db.js           # sql.js SQLite database helpers
├── frontend/
│   ├── src/
│   │   ├── App.jsx                        # Root component + polling logic
│   │   ├── api.js                         # Axios API client
│   │   ├── main.jsx                       # React entry point
│   │   ├── index.css                      # Tailwind directives
│   │   └── components/
│   │       ├── Header.jsx                 # App header + status badge + logout
│   │       ├── ConnectionPanel.jsx        # QR code + pairing-code tabs
│   │       ├── SchedulerForm.jsx          # Schedule a message form
│   │       └── MessageTable.jsx           # Dashboard table with filters
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── data/                                  # Auto-created: session files & DB
├── .env
└── package.json
```

---

## Quick Start

### 1. Install dependencies

```bash
# Root (backend)
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 2. Start the backend

```bash
node backend/server.js
```

Server starts at **http://localhost:3001**

### 3. Start the frontend (in a separate terminal)

```bash
cd frontend
npm run dev
```

Frontend starts at **http://localhost:5173**

### 4. Or run both together (with concurrently)

```bash
npm run dev
```

---

## How to Connect WhatsApp

### QR Code (Desktop)
1. Open the app at http://localhost:5173
2. The QR code auto-appears in the "Connect WhatsApp" panel
3. In WhatsApp → **Linked Devices** → **Link a Device** → scan the QR

### Pairing Code (Mobile)
1. Click the **Phone Number** tab in the connection panel
2. Enter your number with country code (e.g. `+918000000000`)
3. Click **Get Pairing Code**
4. In WhatsApp → **Linked Devices** → **Link with phone number** → enter the 8-char code

---

## Scheduling a Message

1. Make sure WhatsApp is connected (green badge in the header)
2. Fill in the **Recipient Phone Number** (select country code from dropdown)
3. Type your **Message**
4. Pick the **Date & Time** (must be in the future)
5. Click **Schedule Message**

The cron job checks for due messages every minute and sends them automatically.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/status` | WA connection status, QR, pairing code |
| POST | `/api/pairing-code` | Request a pairing code `{ phone }` |
| POST | `/api/logout` | Logout and clear session |
| GET | `/api/messages` | List all scheduled messages |
| POST | `/api/messages` | Create a new message `{ phone, message, scheduledAt }` |
| DELETE | `/api/messages/:id` | Cancel (`?permanent=false`) or delete (`?permanent=true`) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| WhatsApp | @whiskeysockets/baileys |
| Scheduler | node-cron |
| Database | sql.js (SQLite, pure JS) |
| Notifications | react-hot-toast |

---

## Notes

- Session files are stored in `data/session/` — **do not commit this folder**.
- The SQLite database is at `data/scheduler.db`.
- All times are stored in UTC; the form converts your local datetime automatically.
- The cron fires every 60 seconds — messages may be up to ~60s late.
