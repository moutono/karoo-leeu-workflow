import { Page } from 'puppeteer';

export interface BookingData {
    guestName: string;
    grossAmount: number;
    platformFee: number;
}

/**
 * Extracts booking data from the reservation table for a specific target Reservation ID.
 * @param page The Puppeteer page object (already navigated to the search results)
 * @param targetResId The reservation ID we are looking for
 */
export async function extractBookingInfo(page: Page, targetResId: string): Promise<BookingData | null> {
    console.log(`Extracting data for Reservation ID: ${targetResId}`);
    
    try {
        // Wait for the table to load
        await page.waitForSelector('.reservation-table__wrapper table tbody tr', { timeout: 10000 });
    } catch (err) {
        console.error('Reservation table did not load in time.');
        return null;
    }

    const result = await page.evaluate((resId: string) => {
        // Find the correct row
        const rows = document.querySelectorAll('.reservation-table__wrapper table tbody tr');
        
        for (const row of Array.from(rows)) {
            const rowText = (row as HTMLElement).innerText || '';
            
            // Check if this row contains our target reservation ID
            if (rowText.includes(resId)) {
                // Approximate columns based on common Booking.com layouts
                const nameCellHTMLElement = row.querySelector('td.guest-name-column, td:nth-child(2)');
                const grossAmountHTMLElement = row.querySelector('td.gross-amount-column, td:nth-child(5), td:nth-child(6)');
                const platformFeeHTMLElement = row.querySelector('td.commission-column, td:nth-child(7), td:nth-child(8)');

                const parseCurrency = (text: string) => {
                    const cleanText = text.replace(/[^0-9.-]+/g,"");
                    return parseFloat(cleanText) || 0;
                };

                return {
                    guestName: nameCellHTMLElement ? (nameCellHTMLElement as HTMLElement).innerText.trim() : 'Unknown',
                    grossAmount: grossAmountHTMLElement ? parseCurrency((grossAmountHTMLElement as HTMLElement).innerText) : 0,
                    platformFee: platformFeeHTMLElement ? parseCurrency((platformFeeHTMLElement as HTMLElement).innerText) : 0
                };
            }
        }
        
        return null; // Reservation not found on this page
    }, targetResId);

    return result as BookingData | null;
}
