// Must match values in server/routes/payments.py — display-only here, the
// server is the authoritative source for the actual charge.

// Flat platform fee attendees pay on top of the host's ticket price.
export const PLATFORM_FEE_INR = 50

// Commission taken out of the host's ticket price when they get paid out.
// Attendees never see this — they only see PLATFORM_FEE_INR.
export const HOST_COMMISSION_RATE = 0.10
export const HOST_COMMISSION_PERCENT_LABEL = '10%'
