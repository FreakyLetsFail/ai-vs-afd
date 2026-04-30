const html = require('fs').readFileSync(__dirname + '/../src/frontend/index.html', 'utf8');

module.exports = (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end(html);
};