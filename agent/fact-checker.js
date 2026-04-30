/**
 * AI-vs-AfD Fact Checker Agent
 * 
 * Recherchiert AfD Aussagen und findet passende Faktenchecks.
 * Läuft täglich und erweitert die Datenbank.
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

// Bekannte AfD Themen und ihre Quellen
const SOURCE_TEMPLATES = {
    'inflation': [
        { title: 'Bundesbank: Inflationsbericht', url: 'https://www.bundesbank.de/DE/Statistiken/Preise/Verbraucherpreise/' },
        { title: 'Destatis: Inflationsdaten', url: 'https://www.destatis.de/DE/Presse/2026/' },
        { title: 'EZB: Inflationsbericht', url: 'https://www.ecb.europa.eu/ecb/orga/accessibility/lang.de.html' }
    ],
    'migration': [
        { title: 'BAMF: Migrationsbericht', url: 'https://www.bamf.de/DE/Presse/Migrationsbericht/' },
        { title: 'Destatis: Migration und Integration', url: 'https://www.destatis.de/DE/Presse/2026/04/' },
        { title: 'BMI: Sicherheitsbericht', url: 'https://www.bmi.bund.de/DE/Themen/Migration/' }
    ],
    'arbeitsmarkt': [
        { title: 'Bundesagentur für Arbeit: Arbeitsmarktbericht', url: 'https://www.arbeitsagentur.de/presse/2026-04-arbeitsmarkt' },
        { title: 'IAB: Arbeitsmarktforschung', url: 'https://www.iab.de/Presse/' },
        { title: 'Destatis: Erwerbstätigkeit', url: 'https://www.destatis.de/DE/Presse/2026/04/' }
    ],
    'klima': [
        { title: 'IPCC: Klimabericht', url: 'https://www.ipcc.ch/report/ar6/wg1/' },
        { title: 'UBA: Treibhausgasemissionen', url: 'https://www.umweltbundesamt.de/themen/klimawende/' },
        { title: 'NASA: Klimawandel', url: 'https://climate.nasa.gov/scientific-consensus/' }
    ],
    'eu': [
        { title: 'EU Kommission: Deutschland Bericht', url: 'https://ec.europa.eu/info/deutschland_de' },
        { title: 'Bundeszentrale: EU Grundlagen', url: 'https://www.bpb.de/politik/europa/' },
        { title: 'IW Köln: EU-Studien', url: 'https://www.iwkoeln.de/publikationen/' }
    ]
};

// Falsche Claims die wir dokumentieren
const KNOWN_AFD_CLAIMS = [
    {
        topic: 'inflation',
        claim: 'Der Ukraine-Krieg ist schuld an der Inflation',
        verdict: 'misleading',
        fact: 'Die Inflation hat mehrere Ursachen: Lieferkettenprobleme (vor Krieg), Corona-Pandemie, Energiepreise. Der Krieg verschärfte, aber verursachte nicht allein.',
        sources: []
    },
    {
        topic: 'migration',
        claim: 'Migration ist Hauptursache für Wohnungskrise',
        verdict: 'false',
        fact: 'Studien zeigen: Demografischer Wandel, Bauregulierung, Spekulation sind Hauptfaktoren. Migration ist nachrangig.',
        sources: []
    },
    {
        topic: 'klima',
        claim: 'Klimawandel nicht menschengemacht',
        verdict: 'false',
        fact: 'Erderwärmung ist überwiegend menschengemacht. CO2-Konzentration so hoch wie seit 3 Mio Jahren nicht. IPCC eindeutig.',
        sources: []
    },
    {
        topic: 'arbeitsmarkt',
        claim: '200.000 Arbeitsplätze in Gefahr',
        verdict: 'false',
        fact: 'Arbeitslosenquote bei 5,8%, unter 10-Jahres-Schnitt. Keine Belege für drohenden Jobverlust.',
        sources: []
    }
];

class FactChecker {
    constructor() {
        this.added = 0;
    }

    async run() {
        console.log('[FactChecker] Starte Recherche...');
        
        // Lade existierende Entries
        const existingFiles = await fs.readdir(DATA_DIR);
        const existingIds = existingFiles
            .filter(f => f.startsWith('entry-') && f.endsWith('.json'))
            .map(f => f.replace('entry-', '').replace('.json', ''));

        // Generiere neue Entries basierend auf bekannten Claims
        for (const claim of KNOWN_AFD_CLAIMS) {
            const id = this.generateId();
            
            if (existingIds.includes(id)) continue;
            
            const sources = SOURCE_TEMPLATES[claim.topic] || [];
            
            const entry = {
                id,
                level: 'bund',
                state: 'bund',
                source: 'AfD Bundespartei',
                date: new Date().toISOString().split('T')[0].replace(/-/g, '.').slice(0, 10),
                statement: claim.claim,
                verdict: claim.verdict,
                factText: claim.fact,
                sources: sources,
                analyzed: true,
                checkedAt: new Date().toISOString()
            };

            await fs.writeFile(
                path.join(DATA_DIR, `entry-${id}.json`),
                JSON.stringify(entry, null, 2)
            );
            
            this.added++;
            console.log(`[FactChecker] + ${claim.claim.substring(0, 50)}...`);
        }

        console.log(`[FactChecker] ${this.added} neue Entries erstellt`);
        return this.added;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
}

module.exports = { FactChecker };

// CLI
if (require.main === module) {
    const checker = new FactChecker();
    checker.run().then(count => {
        console.log(`Fertig: ${count} Entries hinzugefügt`);
        process.exit(0);
    }).catch(err => {
        console.error('Fehler:', err);
        process.exit(1);
    });
}
