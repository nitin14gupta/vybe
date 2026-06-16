# Phase 7 — Booking + Payment

## Goal
End-to-end ticket booking with Razorpay (India UPI/card/wallet), QR ticket generation, and post-booking state management.

---

## Flow

Event Detail → "Book Now" → Booking Confirm screen → Razorpay sheet → Processing → Success / Fail

---

## Screen: Booking Confirm

**Header**: Back left. "Confirm Booking" centre 18pt semibold.

**Order summary card**:
- Event photo + title
- Date + time
- 1× ticket
- Platform fee (5%) line item
- Total in bold

**Payment method selector**:
- UPI (default, most common in India)
- Card (Visa/MC/RuPay)
- Wallets (Paytm, PhonePe)

**T&C checkbox**: "I agree to the event rules and Vybe's T&C"

**"Pay ₹[total]" gradient button**: disabled until T&C checked.

**Refund policy note**: muted text below button.

---

## Screen: Processing

Full screen loader. "Don't close the app" note. No back gesture.

---

## Screen: Success

- Celebration animation (confetti)
- QR ticket (full-width)
- Booking ID below QR
- "Save to Photos" button
- "Share" button
- "View My Tickets" link → My Tickets screen
- Also added to Profile → My Tickets automatically

---

## Screen: Failed

- Error icon
- Error message (payment declined / network issue)
- "Try Again" gradient button → back to Booking Confirm (same order)
- "Try Different Method" → back to Booking Confirm, payment selector open

---

## Razorpay Integration

**Package**: `react-native-razorpay`

**Flow**:
1. Client calls `POST /bookings` → server creates Razorpay order, returns `{ order_id, amount, currency, key_id }`
2. Client opens Razorpay checkout sheet with order details
3. On payment success: Razorpay returns `{ razorpay_payment_id, razorpay_order_id, razorpay_signature }`
4. Client calls `POST /bookings/{id}/verify` with those three values
5. Server verifies HMAC signature → marks booking confirmed → decrements `spots_left` → creates ticket
6. Client shows Success screen

**On failure**: Razorpay returns error code → client shows Failed screen with error message.

---

## API

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/bookings` | `{ event_id }` | creates Razorpay order, returns order details |
| POST | `/bookings/{id}/verify` | `{ payment_id, order_id, signature }` | verifies + confirms |
| GET | `/tickets` | — | my tickets (see Phase 5) |
| GET | `/tickets/{id}/qr` | — | returns booking ID for QR |

---

## DB Tables

```sql
-- bookings
id UUID PK
user_id UUID → users.id
event_id UUID → events.id
status TEXT DEFAULT 'pending'  -- pending | confirmed | cancelled | refunded
razorpay_order_id TEXT
razorpay_payment_id TEXT
amount_inr INT
platform_fee_inr INT
created_at TIMESTAMPTZ DEFAULT NOW()
confirmed_at TIMESTAMPTZ

-- tickets
id UUID PK
booking_id UUID → bookings.id
user_id UUID → users.id
event_id UUID → events.id
qr_data TEXT  -- the booking ID, used for QR generation
checked_in BOOL DEFAULT FALSE
checked_in_at TIMESTAMPTZ
```

**On booking confirmed**:
- `events.spots_left -= 1`
- `users.events_attended_count += 1` (or trigger)
- Create event group conversation membership if first booking

---

## QR Ticket
Generated client-side from `booking_id` using `react-native-qrcode-svg`. No separate QR API needed — the data is just the booking UUID. At event entry, host scans and checks against `tickets` table.

---

## Test Cases

1. Tap "Book Now" → Booking Confirm screen with correct price breakdown
2. "Pay" button disabled until T&C checked
3. Tap Pay → Razorpay sheet opens (correct amount shown)
4. Successful UPI payment → Processing screen → Success screen
5. QR visible on Success screen with correct booking ID
6. "Save to Photos" → QR saved to device gallery
7. My Tickets → new ticket appears under Upcoming
8. Event spots_left decrements by 1
9. Payment failure → Failed screen with error message
10. "Try Again" → back to Booking Confirm, same order preserved
11. Double booking prevention (second attempt returns error)
12. HMAC verification failure → booking NOT confirmed, error shown
