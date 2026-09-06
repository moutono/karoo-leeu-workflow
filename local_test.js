const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    // Read from CLI arguments (for example: node local_test.js moutono mypassword)
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
        console.error("Please provide your username and password: node local_test.js <username> <password>");
        process.exit(1);
    }

    try {
        console.log("Launching browser visually...");
        // headless: false forces Chrome to open physically on your screen!
        const browser = await puppeteer.launch({
            headless: false, 
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        console.log("Navigating to Booking.com Admin...");
        await page.goto('https://admin.booking.com/', { waitUntil: 'networkidle2' });

        try {
            console.log("Waiting for login field...");
            await page.waitForSelector('input[name="loginname"], input[name="username"], input[type="email"]', { timeout: 10000 });
            
            console.log("Typing username slowly...");
            await page.type('input[name="loginname"], input[name="username"], input[type="email"]', username, { delay: 150 });
            
            console.log("Clicking Next...");
            await page.click('button[type="submit"]');
            
            console.log("Waiting for password field...");
            await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 10000 });
            
            console.log("Typing password slowly...");
            await page.type('input[name="password"], input[type="password"]', password, { delay: 150 });
            
            console.log("Logging in...");
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                page.click('button[type="submit"]')
            ]);
            console.log("Login sequence finished!");
        } catch (e) {
            console.log("Did not find standard login sequence. You might be blocked, or the layout changed.");
        }

        console.log("We will leave the browser open for 60 seconds so you can see what happened!");
        await new Promise(r => setTimeout(r, 60000));

        await browser.close();
        
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
