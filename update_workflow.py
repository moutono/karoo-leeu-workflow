import json

workflow_path = 'scraper_workflow.json'
with open(workflow_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

new_code = """const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// Try to grab credentials from item.json (n8n standard input)
const username = $input && $input.item && $input.item.json ? $input.item.json.username : process.env.BOOKING_USER;
const password = $input && $input.item && $input.item.json ? $input.item.json.password : process.env.BOOKING_PASS;

// 1. Navigation Logic
const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

// Navigate to Booking.com
await page.goto('https://admin.booking.com/', { waitUntil: 'networkidle2' });

if (username && password) {
    try {
        console.log('Attempting login');
        await page.waitForSelector('input[name="loginname"], input[name="username"]', { timeout: 5000 });
        await page.type('input[name="loginname"], input[name="username"]', username, { delay: 100 });
        await page.click('button[type="submit"]');
        
        await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 5000 });
        await page.type('input[name="password"], input[type="password"]', password, { delay: 100 });
        
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('button[type="submit"]')
        ]);
        console.log('Logged in successfully');
    } catch (e) {
        console.log('Login prompt not found or already logged in:', e.message);
    }
}

// Date Selection (1st of month to +30 days)
try {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await page.waitForSelector('input[name="date_from"]', { timeout: 5000 });
    await page.click('input[name="date_from"]', { clickCount: 3 });
    await page.type('input[name="date_from"]', firstOfMonth);
    await page.type('input[name="date_to"]', thirtyDaysOut);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
} catch (e) {
    console.log('Date fields not found, proceeding to extract.', e.message);
}

// 2. Extraction Logic 
const bookingData = await page.evaluate(() => {
    // Attempting to identify rows. If we are on reservations, this should match.
    const rows = Array.from(document.querySelectorAll('.reservation-table__wrapper table tbody tr'));
    return rows.slice(0, 5).map(row => ({
        guestName: row.querySelector('.guest-name-cell')?.innerText.trim(),
        grossAmount: row.querySelector('.price-cell')?.innerText.trim(),
        platformFee: row.querySelector('.commission-cell')?.innerText.trim()
    }));
});

await browser.close();
return { bookingData };"""

modified = False
if isinstance(data, list):
    for item in data:
        if 'nodes' in item:
            for node in item['nodes']:
                if node['type'] == 'n8n-nodes-puppeteer.puppeteer' and 'code' in node.get('parameters', {}):
                    node['parameters']['code'] = new_code
                    modified = True

if modified:
    with open(workflow_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    print("Updated scraper_workflow.json")
    
    # Update the local mapping inside .n8n as well
    with open('.n8n/scraper_workflow.json', 'w', encoding='utf-8') as f2:
        json.dump(data, f2, indent=2)
    print("Updated .n8n/scraper_workflow.json")
else:
    print("Code node not found!")
