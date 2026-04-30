/**
 * AI-vs-AfD Graph Tracker
 * 
 * Nutzt Graphify um AfD Aussagen zu tracken und zu strukturieren.
 * Erstellt eine Wissensdatenbank aller analysierten Claims.
 */

const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const GRAPH_DIR = path.join(__dirname, '../graph');

// AfD Topics Kategorien
const TOPIC_AREAS = {
    'wirtschaft': {
        name: 'Wirtschaft & Finanzen',
        keywords: ['inflation', 'steuern', 'schulden', 'jobs', 'arbeitsplätze', 'wirtschaft', 'krise'],
        sources: ['bundesbank', 'destatis', 'ifw', 'iw']
    },
    'migration': {
        name: 'Migration & Asyl',
        keywords: ['migration', 'asyl', 'flüchtlinge', 'grenzen', 'einwanderung'],
        sources: ['bamf', 'destatis', 'bmi']
    },
    'klima': {
        name: 'Klima & Energie',
        keywords: ['klima', 'co2', 'energiewende', 'strom', 'verbrenner'],
        sources: ['uBA', 'fraunhofer', 'bnetza']
    },
    'sicherheit': {
        name: 'Innere Sicherheit',
        keywords: ['kriminalität', 'polizei', 'grenzschutz', 'terror'],
        sources: ['bka', 'bundespolizei', 'BMI']
    },
    'eu': {
        name: 'EU & Außenpolitik',
        keywords: ['eu', 'euro', 'dexit', 'sanktionen', 'ukraine'],
        sources: ['ec', 'auswaertiges-amt', 'bpb']
    },
    'gesellschaft': {
        name: 'Gesellschaft & Kultur',
        keywords: ['gender', 'kultur', 'identität', 'religion'],
        sources: ['bpb', 'fes']
    }
};

// Bekannte Falschaussagen mit Quellen
const KNOWN_CLAIMS = {
    'wirtschaft': [
        { claim: '200.000 Jobs in Gefahr', verdict: 'false', topic: 'arbeitsmarkt', fact: 'Arbeitslosenquote 5,8%, unter 10-Jahres-Schnitt' },
        { claim: 'Regierung geht das Geld aus', verdict: 'false', topic: 'staatsschulden', fact: 'Neuverschuldung 50 Mrd, deutlich weniger als 2020-2022' },
        { claim: 'Höchste Steuern in Europa', verdict: 'false', topic: 'steuern', fact: 'Steueranteil am BIP unter OECD-Durchschnitt' },
        { claim: 'Elektromobilität gescheitert', verdict: 'false', topic: 'e-mobilitaet', fact: '25% Neuzulassungen 2025, Markt wächst' }
    ],
    'migration': [
        { claim: 'Migration Hauptursache Wohnungskrise', verdict: 'false', topic: 'wohnungskrise', fact: 'Demografischer Wandel + Bauregulierung Hauptfaktoren' },
        { claim: 'Asylbewerber mehr als Rentner', verdict: 'false', topic: 'sozialleistungen', fact: 'AsylbLG unter Grundsicherungsniveau' },
        { claim: 'Grenzen nicht sicher', verdict: 'false', topic: 'grenzschutz', fact: 'Bundespolizei meldet sinkende illegale Grenzübertritte' }
    ],
    'klima': [
        { claim: 'Klimawandel nicht menschengemacht', verdict: 'false', topic: 'klimawandel', fact: '97% Wissenschaftler stimmen überein' },
        { claim: 'Energiewende gescheitert', verdict: 'false', topic: 'energiewende', fact: 'Erneuerbare billiger als fossil, Strompreise 2024 gesunken' }
    ],
    'sicherheit': [
        { claim: 'Kriminalität steigt durch Migration', verdict: 'false', topic: 'kriminalitaet', fact: 'PKS: meisten Straftaten von deutschen Staatsbürgern' }
    ],
    'eu': [
        { claim: 'EU undemokratisch', verdict: 'false', topic: 'eu-demokratie', fact: 'EU-Parlament direkt gewählt' },
        { claim: 'Dexit keine wirtschaftlichen Folgen', verdict: 'false', topic: 'dexit', fact: 'IW Köln: katastrophale wirtschaftliche Folgen' }
    ]
};

class GraphTracker {
    constructor() {
        this.graph = {
            meta: {
                created: new Date().toISOString(),
                version: '1.0',
                entries: 0,
                topics: Object.keys(TOPIC_AREAS).length
            },
            topics: {},
            claims: [],
            sources: [],
            persons: {}
        };
    }

    async loadExisting() {
        try {
            const files = await fs.readdir(DATA_DIR);
            const entries = [];
            for (const file of files) {
                if (file.startsWith('entry-') && file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
                    entries.push(JSON.parse(content));
                }
            }
            return entries;
        } catch {
            return [];
        }
    }

    analyzeEntry(entry) {
        // Find topic for this entry
        let topic = 'unknown';
        const text = (entry.statement + ' ' + entry.title).toLowerCase();
        
        for (const [key, area] of Object.entries(TOPIC_AREAS)) {
            for (const kw of area.keywords) {
                if (text.includes(kw)) {
                    topic = key;
                    break;
                }
            }
            if (topic !== 'unknown') break;
        }

        // Extract person if mentioned
        const personMatch = (entry.source || '').match(/([A-Z][a-zäöü]+ [A-Z][a-zäöü]+)/);
        const person = personMatch ? personMatch[1] : null;

        return {
            id: entry.id,
            topic,
            claim: entry.statement || entry.title,
            verdict: entry.verdict || 'unverified',
            person,
            date: entry.date || entry.fetched,
            sources: entry.sources || [],
            url: entry.url || ''
        };
    }

    async buildGraph() {
        console.log('[GraphTracker] Baue Wissensgraph...');
        
        const entries = await this.loadExisting();
        console.log(`[GraphTracker] ${entries.length} Entries geladen`);

        // Initialize topics
        for (const [key, area] of Object.entries(TOPIC_AREAS)) {
            this.graph.topics[key] = {
                name: area.name,
                keywords: area.keywords,
                claims: [],
                verdictCounts: { false: 0, misleading: 0, fact: 0 }
            };
        }

        // Process entries
        for (const entry of entries) {
            const analyzed = this.analyzeEntry(entry);
            
            if (this.graph.topics[analyzed.topic]) {
                this.graph.topics[analyzed.topic].claims.push(analyzed);
                this.graph.topics[analyzed.topic].verdictCounts[analyzed.verdict]++;
            }

            this.graph.claims.push(analyzed);

            // Track persons
            if (analyzed.person) {
                if (!this.graph.persons[analyzed.person]) {
                    this.graph.persons[analyzed.person] = { claims: [], verdicts: {} };
                }
                this.graph.persons[analyzed.person].claims.push(analyzed.id);
                this.graph.persons[analyzed.person].verdicts[analyzed.verdict]++;
            }

            // Track sources
            for (const src of (analyzed.sources || [])) {
                if (!this.graph.sources.find(s => s.url === src.url)) {
                    this.graph.sources.push(src);
                }
            }
        }

        this.graph.meta.entries = entries.length;
        this.graph.meta.lastUpdate = new Date().toISOString();

        // Save graph
        await fs.mkdir(GRAPH_DIR, { recursive: true });
        await fs.writeFile(
            path.join(GRAPH_DIR, 'afd-knowledge-graph.json'),
            JSON.stringify(this.graph, null, 2)
        );

        console.log(`[GraphTracker] Graph erstellt mit ${entries.length} Claims`);
        return this.graph;
    }

    getStats() {
        const stats = {
            total: this.graph.claims.length,
            byTopic: {},
            byPerson: {},
            verdicts: { false: 0, misleading: 0, fact: 0 }
        };

        for (const topic of Object.keys(this.graph.topics)) {
            stats.byTopic[topic] = this.graph.topics[topic].claims.length;
        }

        for (const person of Object.keys(this.graph.persons)) {
            stats.byPerson[person] = this.graph.persons[person].claims.length;
        }

        for (const claim of this.graph.claims) {
            if (stats.verdicts[claim.verdict] !== undefined) {
                stats.verdicts[claim.verdict]++;
            }
        }

        return stats;
    }
}

// CLI
if (require.main === module) {
    const tracker = new GraphTracker();
    tracker.buildGraph().then(() => {
        const stats = tracker.getStats();
        console.log('Stats:', JSON.stringify(stats, null, 2));
        process.exit(0);
    }).catch(err => {
        console.error('Fehler:', err);
        process.exit(1);
    });
}

module.exports = { GraphTracker, TOPIC_AREAS };