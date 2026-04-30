/**
 * Simple API Server for AI-vs-AfD
 */

const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, '../data');
const FRONTEND_DIR = path.join(__dirname, '../frontend');

async function loadEntries() {
    try {
        const files = await fs.readdir(DATA_DIR);
        const entries = [];
        
        for (const file of files) {
            if (file.startsWith('entry-') && file.endsWith('.json')) {
                const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
                entries.push(JSON.parse(content));
            }
        }
        
        return entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch {
        return [];
    }
}

const server = http.createServer(async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/api/entries') {
        const entries = await loadEntries();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(entries));
    } else if (req.url === '/' || req.url === '/index.html') {
        const html = await fs.readFile(path.join(FRONTEND_DIR, 'index.html'), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`[AI-vs-AfD] Server läuft auf http://localhost:${PORT}`);
});