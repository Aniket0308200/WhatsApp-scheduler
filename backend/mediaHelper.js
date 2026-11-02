const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * Ensures buffer is a valid WhatsApp WebP sticker (512x512, transparent, WebP container).
 * Fixes the issue where stickers wouldn't render on WhatsApp mobile (Android/iOS).
 */
async function formatStickerBuffer(buffer) {
  try {
    let sharpInstance;
    try {
      sharpInstance = sharp(buffer, { animated: true });
      const meta = await sharpInstance.metadata();
      if (meta.format === 'webp' && meta.width === 512 && meta.height === 512 && (!meta.pages || meta.pages <= 1)) {
        return buffer;
      }
      return await sharpInstance
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
    } catch {
      // Fallback for non-animated images
      return await sharp(buffer)
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
    }
  } catch (err) {
    console.warn('[mediaHelper] Sticker formatting warning:', err.message);
    return buffer;
  }
}

/**
 * Ensures GIF buffer is converted into WhatsApp-compatible MP4 for native looping autoplay.
 */
async function formatGifBuffer(buffer) {
  // Check if buffer is already MP4 (contains 'ftyp' box near start)
  const isMp4 = buffer.length > 8 && buffer.indexOf(Buffer.from('ftyp')) >= 4 && buffer.indexOf(Buffer.from('ftyp')) <= 16;
  if (isMp4) {
    return buffer;
  }

  // Convert .gif to WhatsApp-compatible mp4 video with ffmpeg
  const id = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const tmpIn = path.join(os.tmpdir(), `wa_in_${id}.gif`);
  const tmpOut = path.join(os.tmpdir(), `wa_out_${id}.mp4`);

  try {
    await fs.promises.writeFile(tmpIn, buffer);
    // Use h264, yuv420p, even dimensions, faststart
    execSync(
      `ffmpeg -y -i "${tmpIn}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -an "${tmpOut}"`,
      { stdio: 'ignore', timeout: 15000 }
    );
    const mp4Buffer = await fs.promises.readFile(tmpOut);
    return mp4Buffer;
  } catch (err) {
    console.warn('[mediaHelper] GIF to MP4 ffmpeg conversion fallback:', err.message);
    return buffer;
  } finally {
    try { await fs.promises.unlink(tmpIn); } catch {}
    try { await fs.promises.unlink(tmpOut); } catch {}
  }
}

module.exports = {
  formatStickerBuffer,
  formatGifBuffer
};

