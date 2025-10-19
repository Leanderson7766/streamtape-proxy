const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/proxy', async (req, res) => {
  const videoURL = req.query.url;
  if (!videoURL) return res.status(400).send("Missing url");

  try {
    // aceita opcionalmente um Referer custom via query (se precisar)
    const referer = req.query.referer || '';

    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': '*/*'
      },
      redirect: 'follow'
    };
    if (referer) fetchOptions.headers['Referer'] = referer;

    // usa fetch global do Node (Node 18+). Railway/Render já suportam.
    const response = await fetch(videoURL, fetchOptions);

    if (!response.ok) return res.status(502).send(`Origin returned ${response.status}`);

    // repassa headers essenciais
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    const contentLength = response.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // stream do corpo para o cliente
    response.body.pipe(res);

  } catch (err) {
    res.status(500).send("Proxy error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
