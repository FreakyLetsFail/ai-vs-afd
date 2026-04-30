/**
 * Fetcher Runner - Automatisiert das Sammeln von AfD Aussagen
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const CHROME_PATH = '/home/adm1n/.agent-browser/browsers/chrome-146.0.7680.153/chrome';
const DATA_DIR = path.join(__dirname, '../../data');
const SOURCES = require('../../sources.json');

class Runner {
    constructor() {
        this.browser = null;
        this.stats = { fetched: 0, errors: 0 };
    }

    async init() {
        console.log('[Runner] Starte Chrome...');
        this.browser = await chromium.launch({
            executablePath: CHROME_PATH,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        });
        await fs.mkdir(DATA_DIR, { recursive: true });
    }

    async fetchPage(url) {
        const page = await this.browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
            await page.waitForTimeout(1000); // Let content render
            return await page.content();
        } finally {
            await page.close();
        }
    }

    async fetchPressReleases() {
        console.log('[Runner] Sammle Pressemitteilungen...');
        const entries = [];
        
        // Bundesebene
        console.log('[Runner] -> AfD Bundespresse');
        const bundContent = await this.fetchPage('https://www.afd.de/presse/');
        const bundEntries = this.parseAfDPresse(bundContent, 'bund');
        entries.push(...bundEntries);
        
        // Landesebene - iterate through states
        for (const land of SOURCES.laender) {
            try {
                console.log(`[Runner] -> ${land.name}`);
                const content = await this.fetchPage(land.website + 'presse/');
                const landEntries = this.parseAfDPresse(content, land.abbreviation);
                entries.push(...landEntries);
                await this.randomDelay(2000, 4000); // Be polite, delay between requests
            } catch (err) {
                console.log(`[Runner] Fehler bei ${land.name}: ${err.message}`);
                this.stats.errors++;
            }
        }
        
        return entries;
    }

    parseAfDPresse(html, level) {
        // Simple extraction - in reality would need more sophisticated parsing
        // Looking for article titles, dates, links
        const entries = [];
        
        // Extract page title
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1] : '';
        
        // Look for article-like structures
        const articlePatterns = [
            /<h[23][^>]*>([^<]+)<\/h[23]>/gi,
            /<a[^>]+href="([^"]+press[^"]+)"[^>]*>([^<]+)<\/a>/gi
        ];
        
        for (const pattern of articlePatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                const text = match[2] || match[1];
                const url = match[1] || '';
                
                // Filter for actual press release content
                if (text.length > 30 && !text.includes('Datenschutz') && !text.includes('Impressum')) {
                    entries.push({
                        id: this.generateId(),
                        level,
                        source: 'AfD',
                        title: text.trim(),
                        url: url.startsWith('http') ? url : 'https://www.afd.de' + url,
                        fetched: new Date().toISOString(),
                        content: '',
                        analyzed: false
                    });
                }
            }
        }
        
        return entries.slice(0, 20); // Limit per source
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    randomDelay(min, max) {
        return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
    }

    async saveEntries(entries) {
        for (const entry of entries) {
            const file = path.join(DATA_DIR, `entry-${entry.id}.json`);
            await fs.writeFile(file, JSON.stringify(entry, null, 2));
        }
        console.log(`[Runner] ${entries.length} Einträge gespeichert`);
    }

    async close() {
        if (this.browser) await this.browser.close();
        console.log('[Runner] Beendet. Stats:', this.stats);
    }
}

// CLI
if (require.main === module) {
    const runner = new Runner();
    
    (async () => {
        try {
            await runner.init();
            const entries = await runner.fetchPressReleases();
            await runner.saveEntries(entries);
        } catch (err) {
            console.error('[Runner] Fehler:', err);
        } finally {
            await runner.close();
        }
    })();
}

module.exports = { Runner };