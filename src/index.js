/**
 * AI-vs-AfD Main Entry Point
 */

const { AfDFetcher } = require('./fetcher/afdFetcher');
const { FactCheckAgent } = require('./analyzer/agents/factCheckAgent');
const fs = require('fs').promises;

class AIvsAfD {
    constructor() {
        this.fetcher = new AfDFetcher();
        this.analyzer = new FactCheckAgent();
        this.dataDir = path.join(__dirname, '../data');
    }

    async init() {
        console.log('[AIvsAfD] Starte...');
        await fs.mkdir(this.dataDir, { recursive: true });
        await this.fetcher.init();
    }

    async run() {
        console.log('[AIvsAfD] Fetcher gestartet...');
        
        // 1. Sammle neue Aussagen
        const rawData = await this.fetcher.fetchPressReleases();
        
        // 2. Speichere Rohdaten
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.writeFile(
            path.join(this.dataDir, `raw-${timestamp}.json`),
            JSON.stringify(rawData, null, 2)
        );
        
        console.log('[AIvsAfD] Rohdaten gespeichert');
        return rawData;
    }

    async close() {
        await this.fetcher.close();
    }
}

// CLI Runner
if (require.main === module) {
    const app = new AIvsAfD();
    
    (async () => {
        try {
            await app.init();
            await app.run();
        } catch (err) {
            console.error('[AIvsAfD] Fehler:', err);
        } finally {
            await app.close();
        }
    })();
}

module.exports = { AIvsAfD };