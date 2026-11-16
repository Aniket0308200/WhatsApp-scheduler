const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MEDIA_DIR = path.join(__dirname, '..', 'data', 'media_storage');
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

/**
 * Saves a base64 or Data URI payload to disk if it exceeds threshold (or all media).
 * Returns 'disk:<absoluteFilePath>' or original payload if small string.
 */
async function saveMediaToDisk(payload, filename = null, mimeType = null) {
  if (!payload || typeof payload !== 'string') return payload;

  // If already on disk, return as is
  if (payload.startsWith('disk:') || payload.startsWith('http://') || payload.startsWith('https://')) {
    return payload;
  }

  try {
    let buffer;
    let ext = 'bin';

    if (payload.startsWith('data:')) {
      const commaIdx = payload.indexOf(',');
      if (commaIdx !== -1) {
        const header = payload.slice(0, commaIdx);
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
          const m = mimeMatch[1].toLowerCase();
          if (m.includes('jpeg') || m.includes('jpg')) ext = 'jpg';
          else if (m.includes('png')) ext = 'png';
          else if (m.includes('webp')) ext = 'webp';
          else if (m.includes('gif')) ext = 'gif';
          else if (m.includes('mp4')) ext = 'mp4';
          else if (m.includes('mpeg') || m.includes('mp3')) ext = 'mp3';
          else if (m.includes('pdf')) ext = 'pdf';
          else if (m.includes('ogg')) ext = 'ogg';
          else if (m.includes('wav')) ext = 'wav';
        }
        const rawBase64 = payload.slice(commaIdx + 1).replace(/\s+/g, '');
        buffer = Buffer.from(rawBase64, 'base64');
      } else {
        buffer = Buffer.from(payload.replace(/\s+/g, ''), 'base64');
      }
    } else {
      buffer = Buffer.from(payload.replace(/\s+/g, ''), 'base64');
    }

    if (filename) {
      const extMatch = filename.match(/\.([a-zA-Z0-9]+)$/);
      if (extMatch) ext = extMatch[1].toLowerCase();
    }

    const uniqueId = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const filePath = path.join(MEDIA_DIR, `media_${uniqueId}.${ext}`);
    await fs.promises.writeFile(filePath, buffer);

    return `disk:${filePath}`;
  } catch (err) {
    console.error('[MediaStorage] Error offloading media to disk:', err.message);
    return payload;
  }
}

/**
 * Reads a media payload into a Buffer.
 * Supports 'disk:<filePath>', 'data:<mime>;base64,<data>', raw base64, or Buffer.
 */
async function readMediaBuffer(storedPayload) {
  if (!storedPayload) return null;

  if (Buffer.isBuffer(storedPayload)) {
    return storedPayload;
  }

  if (typeof storedPayload === 'string') {
    if (storedPayload.startsWith('disk:')) {
      const filePath = storedPayload.slice(5);
      if (fs.existsSync(filePath)) {
        return await fs.promises.readFile(filePath);
      }
      throw new Error(`Media file on disk not found: ${filePath}`);
    }

    if (storedPayload.startsWith('http://') || storedPayload.startsWith('https://')) {
      const axios = require('axios');
      const res = await axios.get(storedPayload, { responseType: 'arraybuffer', timeout: 30000 });
      return Buffer.from(res.data);
    }

    if (storedPayload.startsWith('data:')) {
      const commaIdx = storedPayload.indexOf(',');
      if (commaIdx !== -1) {
        const rawBase64 = storedPayload.slice(commaIdx + 1).replace(/\s+/g, '');
        return Buffer.from(rawBase64, 'base64');
      }
    }

    return Buffer.from(storedPayload.replace(/\s+/g, ''), 'base64');
  }

  return null;
}

/**
 * Safely removes a file from disk if path starts with disk:
 */
async function removeMediaFile(storedPayload) {
  if (typeof storedPayload === 'string' && storedPayload.startsWith('disk:')) {
    const filePath = storedPayload.slice(5);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (_) {}
  }
}

module.exports = {
  saveMediaToDisk,
  readMediaBuffer,
  removeMediaFile,
  MEDIA_DIR
};
