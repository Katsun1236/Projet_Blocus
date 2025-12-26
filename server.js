const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.xml': 'application/xml',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    let filePath = req.url.split('?')[0];

    if (filePath === '/') {
        filePath = '/index.html';
    }

    const fullPath = path.join(__dirname, filePath);

    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            const indexPath = path.join(__dirname, 'index.html');
            fs.readFile(indexPath, (err, content) => {
                if (err) {
                    res.writeHead(404);
                    res.end('404 Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                }
            });
            return;
        }

        fs.readFile(fullPath, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('500 Internal Server Error');
                return;
            }

            const ext = path.extname(filePath);
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            });

            res.end(content, 'utf-8');
        });
    });
});

server.listen(PORT, () => {
    console.log('🚀 Serveur de développement démarré !');
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log('⚠️  ATTENTION: Ce serveur n\'a PAS de CSP (pour développement uniquement)');
    console.log('✅ Google Auth devrait fonctionner sans problème');
    console.log('\n🛑 Pour arrêter: Ctrl+C');
});
