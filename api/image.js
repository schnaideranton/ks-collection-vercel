export default async (req, res) => {
  try {
    // Enable CORS for all domains
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'No file ID provided' });
    }

    console.log(`Fetching file: ${id}`);

    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'Failed to get access token' });
    }

    const accessToken = tokenData.access_token;
    console.log(`Got access token: ${accessToken.substring(0, 20)}...`);

    // Fetch file from Google Drive
    const fileResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!fileResponse.ok) {
      return res.status(fileResponse.status).json({ 
        error: `Drive API error: ${fileResponse.status}` 
      });
    }

    // Get content type
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    // Stream response
    const buffer = await fileResponse.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
