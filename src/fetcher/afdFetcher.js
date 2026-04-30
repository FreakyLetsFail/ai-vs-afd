/**
 * Fetcher für AfD Quellen
 * Nutzt den lokalen headless Chrome Browser
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Chrome Pfad aus agent-browser Setup
const CHROME_PATH = '/home/adm1n/.agent-browser/browsers/chrome-146.0.7680.153/chrome';

class AfDFetcher {
    constructor() {
        this.browser = null;
        this.sources = require('../../sources.json');
    }

    async init() {
        console.log('[AfDFetcher] Starte Chrome...');
        this.browser = await chromium.launch({
            executablePath: CHROME_PATH,
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });
        console.log('[AfDFetcher] Chrome gestartet');
    }

    async fetchPage(url, selector = 'body') {
        const page = await this.browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
            const content = await page.content();
            return content;
        } finally {
            await page.close();
        }
    }

    async fetchPressReleases() {
        console.log('[AfDFetcher] Sammle Pressemitteilungen...');
        const results = [];
        
        // Bundesebene
        const bundesUrl = this.sources.bundesebene.pressReleases;
        console.log(`[AfDFetcher] Lade: ${bundesUrl}`);
        
        const content = await this.fetchPage(bundesUrl);
        // TODO: Parse content, extract articles
        
        results.push({
            level: 'bund',
            source: 'afd.de',
            url: bundesUrl,
            fetched: new Date().toISOString(),
            articles: []
        });
        
        return results;
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

module.exports = { AfDFetcher };