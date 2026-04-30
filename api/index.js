const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'data');
const FRONTEND_DIR = path.join(process.cwd(), 'src/frontend');

module.exports = (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const url = req.url.split('?')[0];
    
    // API endpoint
    if (url === '/api/entries') {
        try {
            const files = fs.readdirSync(DATA_DIR);
            const entries = [];
            
            for (const file of files) {
                if (file.startsWith('entry-') && file.endsWith('.json')) {
                    const content = fs.readFileSync(path.join(DATA_DIR, file), 'utf8');
                    entries.push(JSON.parse(content));
                }
            }
            
            entries.sort((a, b) => new Date(b.fetched) - new Date(a.fetched));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(entries));
        } catch {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([]));
        }
        return;
    }
    
    // Serve index.html for all other routes (SPA behavior)
    const htmlPath = path.join(FRONTEND_DIR, 'index.html');
    if (fs.existsSync(htmlPath)) {
        res.setHeader('Content-Type', 'text/html');
        res.end(fs.readFileSync(htmlPath));
    } else {
        res.status(404).end('Not found');
    }
};