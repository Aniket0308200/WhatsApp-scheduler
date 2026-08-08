const express = require('express');
const { google } = require('googleapis');
const db = require('../db');
const router = express.Router();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// GET /api/auth/google/url
router.get('/url', (req, res) => {
  const sessionId = req.query.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId query parameter is required.' });
  }

  try {
    const oauth2Client = getOAuth2Client();
    const scopes = [
      'https://www.googleapis.com/auth/contacts.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: sessionId,
      prompt: 'consent'
    });

    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/google/callback
router.get('/callback', async (req, res) => {
  const { code, state: sessionId } = req.query;

  if (!code || !sessionId) {
    return res.status(400).send(`
      <html>
        <body>
          <h3 style="color: red;">Error: Invalid authorization code or session ID.</h3>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_SYNC_ERROR', error: 'Invalid auth response' }, '*');
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `);
  }

  try {
    const oauth2Client = getOAuth2Client();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info to identify email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      throw new Error('Could not identify user email address.');
    }

    // Check linked accounts limit (max 2 per session)
    const count = await db.LinkedGoogleAccount.countDocuments({ sessionId });
    const exists = await db.LinkedGoogleAccount.findOne({ sessionId, email });

    if (!exists && count >= 2) {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h3 style="color: red;">Link Limit Exceeded</h3>
            <p>You can link a maximum of 2 Gmail accounts per session.</p>
            <script>
              window.opener.postMessage({ type: 'GOOGLE_SYNC_ERROR', error: 'Maximum 2 linked accounts limit reached' }, '*');
              setTimeout(() => window.close(), 4000);
            </script>
          </body>
        </html>
      `);
    }

    // Save linked email if it is new
    if (!exists) {
      await db.LinkedGoogleAccount.create({ sessionId, email });
    }

    // Fetch contacts using People API
    const peopleService = google.people({ version: 'v1', auth: oauth2Client });
    const response = await peopleService.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,phoneNumbers',
      pageSize: 1000
    });

    const connections = response.data.connections || [];
    const parsedContacts = [];

    for (const person of connections) {
      const name = person.names?.[0]?.displayName || person.names?.[0]?.givenName || '';
      const phoneObj = person.phoneNumbers?.find(p => p.value);
      const rawPhone = phoneObj ? phoneObj.value : '';
      if (!rawPhone) continue;

      // Format to standard format: strip out non-digits
      let digits = rawPhone.replace(/\D/g, '');
      if (!digits) continue;

      // If number is a 10-digit format (defaulting to +91 if missing)
      if (digits.length === 10) {
        digits = '91' + digits;
      }

      if (digits.length >= 7 && digits.length <= 15) {
        parsedContacts.push({ name: name.trim(), phone: digits });
      }
    }

    // Bulk upsert into MongoDB Contact model
    if (parsedContacts.length > 0) {
      const operations = parsedContacts.map(c => {
        const jid = `${c.phone}@s.whatsapp.net`;
        const encryptedNumberOrJid = db.encrypt(c.phone);
        const encryptedName = db.encrypt(c.name);

        return {
          updateOne: {
            filter: { sessionId, jid },
            update: {
              $set: {
                encryptedNumberOrJid,
                encryptedName,
                type: 'personal',
                source: 'google_contacts',
                linkedEmail: email,
                createdAt: new Date()
              }
            },
            upsert: true
          }
        };
      });

      await db.Contact.bulkWrite(operations, { ordered: false });
    }

    // Return success page to close popup
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h3 style="color: #059669;">Sync Successful!</h3>
          <p>Successfully synced ${parsedContacts.length} contacts from <strong>${email}</strong>.</p>
          <p>This window will close automatically.</p>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_SYNC_SUCCESS', email: '${email}', count: ${parsedContacts.length} }, '*');
            setTimeout(() => window.close(), 2500);
          </script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error('[Google Sync Error]', err.message);
    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h3 style="color: red;">Sync Failed</h3>
          <p>Error details: ${err.message}</p>
          <script>
            window.opener.postMessage({ type: 'GOOGLE_SYNC_ERROR', error: '${err.message}' }, '*');
            setTimeout(() => window.close(), 5000);
          </script>
        </body>
      </html>
    `);
  }
});

// GET /api/auth/google/linked
router.get('/linked', async (req, res) => {
  const sessionId = req.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required.' });
  }

  try {
    const accounts = await db.LinkedGoogleAccount.find({ sessionId }).lean();
    res.json({ linkedEmails: accounts.map(a => a.email) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
