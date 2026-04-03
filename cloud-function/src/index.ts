import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud function that triggers on creation or update of a Booking document.
 * Calculates `mot_net_amount` and `manager_commission` 
 * given `gross_amount` and `platform_fee`.
 */
export const calculateFinancials = functions.firestore
    .document('bookings/{bookingId}')
    .onWrite(async (change, context) => {
        // Exit when the data is deleted.
        if (!change.after.exists) {
            return null;
        }

        const bookingData = change.after.data();
        if (!bookingData || !bookingData.financials) {
            return null;
        }

        const financials = bookingData.financials;

        // Skip if we already calculated to avoid infinite loops
        if (financials.mot_net_amount !== undefined && financials.manager_commission !== undefined) {
            return null;
        }

        const grossAmount = financials.gross_amount || 0;
        const platformFee = financials.platform_fee || 0;

        const motNetAmount = grossAmount - platformFee;
        const managerCommission = motNetAmount * 0.15; // 15% commission base

        // Update the document with new calculations
        return change.after.ref.set({
            financials: {
                ...financials,
                mot_net_amount: motNetAmount,
                manager_commission: managerCommission
            }
        }, { merge: true });
    });
