export default async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    return res.status(200).end();
  }

  const url = req.url || '/';

  // Root health check
  if (url === '/' || url === '') {
    return res.status(200).json({
      status: 'ok',
      region: 'Frankfurt, Germany (fra1)',
      message: 'Binance Germany Bridge is online and ready.',
    });
  }

  try {
    const targetHost = url.startsWith('/binancepay')
      ? 'https://bpay.binanceapi.com'
      : 'https://api.binance.com';

    const targetUrl = `${targetHost}${url}`;

    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (lower !== 'host' && lower !== 'connection' && lower !== 'content-length' && !lower.startsWith('x-vercel')) {
        headers[key] = value;
      }
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    res.setHeader('Access-Control-Allow-Origin', '*');
    const contentType = response.headers.get('content-type') || 'application/json';
    res.setHeader('Content-Type', contentType);

    return res.status(response.status).send(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Bridge internal error' });
  }
}
