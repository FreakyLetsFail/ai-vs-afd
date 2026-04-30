/**
 * Test script for Chrome/Playwright setup
 */

const { chromium } = require('playwright');

const CHROME_PATH = '/home/adm1n/.agent-browser/browsers/chrome-146.0.7680.153/chrome';

async function testChrome() {
    console.log('Teste Chrome...');
    
    const browser = await chromium.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    
    console.log('Browser gestartet');
    
    const page = await browser.newPage();
    console.log('Page erstellt');
    
    // Test page load
    await page.goto('https://www.afd.de/presse/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    
    const title = await page.title();
    console.log('Seite geladen, Titel:', title);
    
    // Get some basic content
    const bodyText = await page.textContent('body');
    console.log('Body Text Länge:', bodyText.length);
    
    await browser.close();
    console.log('Test erfolgreich!');
}

testChrome().catch(err => {
    console.error('Test fehlgeschlagen:', err.message);
    process.exit(1);
});