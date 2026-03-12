const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'YOUR_API_KEY_HERE'; // paste your Anthropic API key

const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // Proxy API calls
    if (req.method === 'POST' && req.url === '/api/chat') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const options = {
                hostname: 'api.anthropic.com',
                path: '/v1/messages',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY,
                    'anthropic-version': '2023-06-01',
                },
            };
            const proxyReq = https.request(options, proxyRes => {
                let data = '';
                proxyRes.on('data', chunk => data += chunk);
                proxyRes.on('end', () => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(data); });
            });
            proxyReq.on('error', e => { res.writeHead(500); res.end(JSON.stringify({ error: e.message })); });
            proxyReq.write(body);
            proxyReq.end();
        });
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);
    const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript' };
    fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
        res.end(content);
    });
});

server.listen(3000, () => console.log('Aimee running at http://localhost:3000'));