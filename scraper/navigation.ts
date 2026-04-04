import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * Navigates the Booking.com extranet to the reservations page,
 * inputs the date range and executes the search.
 */
export async function navigateToReservations(): Promise<{ browser: Browser, page: Page }> {
    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set a realistic viewport
    await page.setViewport({ width: 1280, height: 800 });

    // Assuming we start on the Extranet Login page or jump directly to Reservations if session cookies are injected by n8n
    await page.goto('https://admin.booking.com/', { waitUntil: 'networkidle2' });

    console.log('Navigated to admin.booking.com');
    
    // Attempt to navigate to reservations and set dates
    try {
        // Wait for the date inputs (Booking.com selectors can be dynamic, using generic ones as per plan)
        await page.waitForSelector('input[name="date_from"], .date-from-input', { timeout: 5000 });
        
        // Constructing date strings (1st of the month, and 30 days out)
        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const thirtyDaysOut = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        // Clear and type start date
        const dateFromInput = await page.$('input[name="date_from"], .date-from-input');
        if (dateFromInput) {
            await dateFromInput.click({ clickCount: 3 });
            await dateFromInput.type(formatDate(firstOfMonth));
        }

        // Clear and type end date
        const dateToInput = await page.$('input[name="date_to"], .date-to-input');
        if (dateToInput) {
            await dateToInput.click({ clickCount: 3 });
            await dateToInput.type(formatDate(thirtyDaysOut));
        }
        
        // Click search and wait for network idle
        await page.click('button[type="submit"], button.search-btn');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        console.log('Search executed successfully.');
    } catch (e) {
        console.warn('Could not interact with date pickers successfully or they are already set. Error:', e);
    }

    return { browser, page };
}
