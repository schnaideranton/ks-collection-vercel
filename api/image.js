const { google } = require('googleapis');
const fs = require('fs');

// Load credentials from environment
const credentials = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  type: 'authorized_user'
};

const oauth2Client = new google.auth.OAuth2(
  credentials.client_id,
  credentials.client_secret
);

oauth2Client.setCredentials({
  refresh_token: credentials.refresh_token
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

export default async (req, res) => {
  try {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'No file ID provided' });
    }

    console.log(`Fetching file: ${id}`);

    // Get file metadata
    const fileRes = await drive.files.get(
      {
        fileId: id,
        fields: 'mimeType, name'
      },
      { responseType: 'stream' }
    );

    const mimeType = fileRes.data.mimeType || 'application/octet-stream';
    console.log(`File MIME type: ${mimeType}`);

    // Get file content
    const contentRes = await drive.files.get(
      {
        fileId: id,
        alt: 'media'
      },
      { responseType: 'stream' }
    );

    res.setHeader('Content-Type', mimeType);
    contentRes.data.pipe(res);

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
