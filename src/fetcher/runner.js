/**
 * Fetcher Runner - Automatisiert das Sammeln von AfD Aussagen
 * Nutzt headless Chrome für Scraping
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
        this.stats = { fetched: 0, errors: 0, entries: [] };
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

    async fetchPage(url, retries = 2) {
        const page = await this.browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(800);
            return await page.content();
        } catch (err) {
            if (retries > 0) {
                console.log(`[Runner] Retry für ${url}`);
                await this.randomDelay(1000, 2000);
                return this.fetchPage(url, retries - 1);
            }
            throw err;
        } finally {
            await page.close();
        }
    }

    async fetchAll() {
        console.log('[Runner] Sammle Pressemitteilungen...');
        
        // 1. Bundesebene
        console.log('[Runner] -> Bund (afd.de)');
        try {
            const bundContent = await this.fetchPage(SOURCES.bundesebene.pressReleases);
            const entries = this.parsePressPage(bundContent, 'bund', 'AfD Bundespartei');
            this.stats.entries.push(...entries);
            console.log(`[Runner]   ${entries.length} Einträge von Bund`);
        } catch (err) {
            console.log(`[Runner]   Fehler Bund: ${err.message}`);
            this.stats.errors++;
        }

        await this.randomDelay(1500, 3000);

        // 2. Alle 16 Bundesländer
        for (const land of SOURCES.laender) {
            try {
                console.log(`[Runner] -> ${land.name} (${land.abbreviation})`);
                const content = await this.fetchPage(land.pressReleases);
                const entries = this.parsePressPage(content, land.abbreviation, `AfD ${land.name}`);
                this.stats.entries.push(...entries);
                console.log(`[Runner]   ${entries.length} Einträge`);
            } catch (err) {
                console.log(`[Runner]   Fehler ${land.name}: ${err.message}`);
                this.stats.errors++;
            }
            
            await this.randomDelay(2000, 4000);
        }

        return this.stats.entries;
    }

    parsePressPage(html, level, sourceName) {
        const entries = [];
        
        // Extrahiere Titel aus h2, h3, article tags
        const titleMatches = html.match(/<h[23][^>]*>\s*<a[^>]*>([^<]+)<\/a>/gi) || [];
        const articleMatches = html.match(/<article[^>]*>[\s\S]*?<h[23][^>]*>\s*([^<]+)/gi) || [];
        
        // Sammle alle Titel
        const titles = new Set();
        
        for (const match of titleMatches) {
            const titleMatch = match.match(/>([^<]+)</);
            if (titleMatch && titleMatch[1].length > 15 && !titleMatch[1].includes('Datenschutz') && !titleMatch[1].includes('Impressum')) {
                titles.add(titleMatch[1].trim());
            }
        }
        
        // Für jedes Land relevante Titel
        for (const title of titles) {
            entries.push({
                id: this.generateId(),
                level,
                source: sourceName,
                title: title,
                url: '',
                fetched: new Date().toISOString(),
                statement: title,
                analyzed: false,
                verdict: null,
                factCheck: null,
                sources: []
            });
        }
        
        return entries.slice(0, 10);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    randomDelay(min, max) {
        return new Promise(resolve => setTimeout(resolve, min + Math.random() * (max - min)));
    }

    async saveEntries() {
        const saved = [];
        for (const entry of this.stats.entries) {
            try {
                const file = path.join(DATA_DIR, `entry-${entry.id}.json`);
                await fs.writeFile(file, JSON.stringify(entry, null, 2));
                saved.push(entry.id);
            } catch (err) {
                console.log(`[Runner] Fehler beim Speichern: ${err.message}`);
            }
        }
        console.log(`[Runner] ${saved.length} Einträge gespeichert`);
        return saved;
    }

    async close() {
        if (this.browser) await this.browser.close();
    }
}

// CLI
if (require.main === module) {
    const runner = new Runner();
    
    (async () => {
        try {
            await runner.init();
            await runner.fetchAll();
            await runner.saveEntries();
            console.log('[Runner] Stats:', runner.stats);
        } catch (err) {
            console.error('[Runner] Fehler:', err);
        } finally {
            await runner.close();
        }
    })();
}

module.exports = { Runner };