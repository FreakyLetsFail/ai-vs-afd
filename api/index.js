/**
 * AI-vs-AfD API Server for Vercel
 */

const DATA_DIR = path.join(process.cwd(), 'data');
const FRONTEND_DIR = path.join(process.cwd(), 'src/frontend');

function loadEntries() {
    const fs = require('fs');
    try {
        const files = fs.readdirSync(DATA_DIR);
        const entries = [];
        
        for (const file of files) {
            if (file.startsWith('entry-') && file.endsWith('.json')) {
                const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
                entries.push(JSON.parse(content));
            }
        }
        
        return entries.sort((a, b) => new Date(b.fetched) - new Date(a.fetched));
    } catch {
        return [];
    }
}

module.exports = (req, res) => {
    const fs = require('fs');
    const path = require('path');
    
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/api/entries') {
        const entries = loadEntries();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(entries));
    } else if (req.url === '/') {
        const htmlPath = path.join(FRONTEND_DIR, 'index.html');
        if (fs.existsSync(htmlPath)) {
            res.setHeader('Content-Type', 'text/html');
            res.end(fs.readFileSync(htmlPath));
        } else {
            res.status(404).end('Not found');
        }
    } else {
        res.status(404).end('Not found');
    }
};