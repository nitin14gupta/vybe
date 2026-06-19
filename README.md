01. Market Research — Why India, Why Now
India is at an inflection point for social experiences. The data across multiple dimensions points to one conclusion: a platform that connects people around live social events has a massive, underserved market.

1.1 The Live Events Market
Metric	Value	Source
India events & exhibition market (2025)	USD 5.69 Billion	Mordor Intelligence
Projected market size by 2031	USD 9.04 Billion	Mordor Intelligence
Market CAGR (2026–2031)	8.05%	Mordor Intelligence
India live entertainment market (2026 proj.)	USD 35.91 Billion	Apparel Resources
India dating apps market (2024)	USD 788 Million	MarkNtel Advisors
Dating apps CAGR (2025–2030)	10.65%	MarkNtel Advisors
Projected dating apps market (2030)	USD 1.42 Billion	MarkNtel Advisors

1.2 Cultural Tailwinds
These are not just numbers — they reflect a real cultural shift happening right now in Indian cities:
•	Urban millennials and Gen-Z are reshaping the Indian home party scene — investment in party decor, premium drinkware, LED setups, and themed gatherings has seen remarkable year-on-year growth (NotThatHigh Trend Report, Nov 2025).
•	Going-out culture is filling a void. Young urban Indians are actively seeking real-life connections and experiences after years of digital fatigue (Apparel Resources, Sept 2025).
•	FOMO amplified by social media is driving desire to be physically present at social events — this creates a perfect demand signal for a discovery platform.
•	The live entertainment sector is expanding from Tier-1 into Tier-2 and Tier-3 cities — this is your expansion roadmap.
•	Gen-Z is moving away from traditional bars toward house parties and soft clubbing events. Eventbrite globally recorded a 478% increase in coffee clubbing events and a 20% rise in morning dance parties in 2025.
•	India has 900 million+ social media users. Average daily social media time: 2.5 hours. The attention is there — the IRL connection layer is missing.

1.3 The Gap VYBE Fills
Platform	What They Do	What They Miss
Bumble / Tinder	Dating & social discovery	No IRL event layer, no house parties
Eventbrite / BookMyShow	Event discovery & ticketing	No social graph, no personal connections
Instagram	Content & following	No meetup intent, no private events
Meetup.com	Group events	Not India-native, no social vibe layer
VYBE	Social discovery + IRL events + connections	THIS IS THE GAP

1.4 Target User
Segment	Profile	Primary Need
Attendee	18-30, urban, college or working professional	Find interesting parties & people
Host	21-35, has space, wants to monetize or socialize	Fill their event, earn money
Social Explorer	Any urban 18-30	Meet people with similar interests IRL
01. Market Research — Why India, Why Now
India is at an inflection point for social experiences. The data across multiple dimensions points to one conclusion: a platform that connects people around live social events has a massive, underserved market.

1.1 The Live Events Market
Metric	Value	Source
India events & exhibition market (2025)	USD 5.69 Billion	Mordor Intelligence
Projected market size by 2031	USD 9.04 Billion	Mordor Intelligence
Market CAGR (2026–2031)	8.05%	Mordor Intelligence
India live entertainment market (2026 proj.)	USD 35.91 Billion	Apparel Resources
India dating apps market (2024)	USD 788 Million	MarkNtel Advisors
Dating apps CAGR (2025–2030)	10.65%	MarkNtel Advisors
Projected dating apps market (2030)	USD 1.42 Billion	MarkNtel Advisors

1.2 Cultural Tailwinds
These are not just numbers — they reflect a real cultural shift happening right now in Indian cities:
•	Urban millennials and Gen-Z are reshaping the Indian home party scene — investment in party decor, premium drinkware, LED setups, and themed gatherings has seen remarkable year-on-year growth (NotThatHigh Trend Report, Nov 2025).
•	Going-out culture is filling a void. Young urban Indians are actively seeking real-life connections and experiences after years of digital fatigue (Apparel Resources, Sept 2025).
•	FOMO amplified by social media is driving desire to be physically present at social events — this creates a perfect demand signal for a discovery platform.
•	The live entertainment sector is expanding from Tier-1 into Tier-2 and Tier-3 cities — this is your expansion roadmap.
•	Gen-Z is moving away from traditional bars toward house parties and soft clubbing events. Eventbrite globally recorded a 478% increase in coffee clubbing events and a 20% rise in morning dance parties in 2025.
•	India has 900 million+ social media users. Average daily social media time: 2.5 hours. The attention is there — the IRL connection layer is missing.

1.3 The Gap VYBE Fills
Platform	What They Do	What They Miss
Bumble / Tinder	Dating & social discovery	No IRL event layer, no house parties
Eventbrite / BookMyShow	Event discovery & ticketing	No social graph, no personal connections
Instagram	Content & following	No meetup intent, no private events
Meetup.com	Group events	Not India-native, no social vibe layer
VYBE	Social discovery + IRL events + connections	THIS IS THE GAP

1.4 Target User
Segment	Profile	Primary Need
Attendee	18-30, urban, college or working professional	Find interesting parties & people
Host	21-35, has space, wants to monetize or socialize	Fill their event, earn money
Social Explorer	Any urban 18-30	Meet people with similar interests IRL






Scanner / Check-in (host side)

A. scanner.tsx — Event starts in >3h → Countdown timer screen ("Check-in opens in 2h 34m 12s") instead of pill. You specifically mentioned this one. ✅ clear yes

B. scanner.tsx — Event has already ended → "Event Ended" screen instead of the scanner just failing silently

Booking flow (attendee side)

C. book.tsx — API rejects due to age (e.g. user is 18, event is 21+) → Age gate screen with icon + "This event is for 21+ only". You mentioned this one. ✅ clear yes

D. book.tsx — Booking returns status: waitlist → Waitlist confirmation screen ("You're on the waitlist at position #3, we'll notify you if a spot opens") instead of pill + back navigation

E. index.tsx — spots_left = 0 at load time → Sold out screen/state instead of just disabling the Book button silently

Event detail states

F. index.tsx — Event is live right now (between date_time and end_time) → "Live Now" banner/state — orange pulsing dot, "Happening now until 4 AM"

G. index.tsx — Event is cancelled → already shows a badge inline, but could be a more impactful full cancelled overlay when the detail screen loads

Attendee ticket side

H. ticket.tsx — User is already checked-in → "You're checked in!" celebration screen (green, timestamp) instead of just showing the QR code

So that's 8 cases: A, B, C, D, E, F, G, H

Which ones do you want as full UI screens? Say yes to each letter (or just "A C D" etc.) and I'll build them all in one go.