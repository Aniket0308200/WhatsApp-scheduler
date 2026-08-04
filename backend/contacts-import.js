/**
 * Isolated VCF/CSV contact-file parser. It has no WhatsApp or scheduler side effects.
 */

const DEFAULT_COUNTRY_CODE = String(process.env.DEFAULT_COUNTRY_CODE || '91').replace(/\D/g, '');

function normalizePhone(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const hasPlus = raw.startsWith('+');
  let digits = raw.replace(/(?:ext\.?|x)\s*\d+$/i, '').replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Strip leading 0 trunk prefix for domestic 11-digit numbers
  if (!hasPlus && digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  // A 10-digit local number is interpreted using the configured default country code.
  if (!hasPlus && digits.length === 10 && DEFAULT_COUNTRY_CODE) digits = DEFAULT_COUNTRY_CODE + digits;
  return /^\d{7,15}$/.test(digits) ? digits : null;
}

function unescapeVCard(value) {
  return String(value || '')
    .replace(/\\n/gi, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function decodeQuotedPrintable(str) {
  let decoded = String(str || '').replace(/=\r?\n/g, '');
  decoded = decoded.replace(/=([0-9A-F]{2})/gi, (_, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  try {
    return decodeURIComponent(escape(decoded));
  } catch (_) {
    return decoded;
  }
}

function parseVCard(content) {
  const unfolded = String(content || '')
    .replace(/\r?\n[ \t]/g, '')
    .replace(/=\r?\n/g, '');
  const cards = unfolded.split(/BEGIN:VCARD/i).slice(1);
  const contacts = [];

  for (const card of cards) {
    const lines = card.split(/\r?\n/);
    let name = '';
    const phones = [];
    for (const line of lines) {
      const separator = line.indexOf(':');
      if (separator < 0) continue;
      
      const rawField = line.slice(0, separator).toUpperCase();
      const cleanField = rawField.split('.').pop();
      const baseField = cleanField.split(';')[0];
      
      let value = line.slice(separator + 1);
      if (rawField.includes('ENCODING=QUOTED-PRINTABLE') || rawField.includes('ENCODING=Q')) {
        value = decodeQuotedPrintable(value);
      }
      value = unescapeVCard(value);

      if (baseField === 'FN' && value) name = value;
      if (baseField === 'N' && !name && value) {
        name = value.split(';').filter(Boolean).reverse().join(' ').trim();
      }
      if (baseField === 'TEL') phones.push(value);
    }
    for (const rawPhone of phones) {
      const phone = normalizePhone(rawPhone);
      if (phone) contacts.push({ phone, name, source: 'import_vcf' });
    }
  }
  return contacts;
}

function parseCsvRows(content) {
  const rows = [];
  let row = [], value = '', quoted = false;
  const text = String(content || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value.trim()); value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; value = '';
    } else value += char;
  }
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function parseCsv(content) {
  const rows = parseCsvRows(content);
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const nameIndex = headers.findIndex(h => ['name', 'contactname', 'fullname', 'displayname'].includes(h));
  const phoneIndex = headers.findIndex(h => ['phone', 'mobile', 'phonenumber', 'mobilenumber', 'number'].includes(h));
  if (phoneIndex < 0) throw new Error('CSV must include a Phone, Mobile, or Phone Number column.');

  return rows.slice(1).flatMap(row => {
    const phone = normalizePhone(row[phoneIndex]);
    return phone ? [{ phone, name: nameIndex >= 0 ? row[nameIndex] : '', source: 'import_csv' }] : [];
  });
}

function parseContactsFile(filename, content) {
  const extension = String(filename || '').toLowerCase().split('.').pop();
  if (extension === 'vcf') return parseVCard(content);
  if (extension === 'csv') return parseCsv(content);
  throw new Error('Only .vcf and .csv contact files are supported.');
}

module.exports = { parseContactsFile };
