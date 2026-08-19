ShimmerText on more headers. You already built and tested it on Recently Viewed. "Trending in <city>", "You're Going", "You're Hosting" are the same tier of section header — reusing it there is close to free now that the component exists.

RSVP confirmation — a checkmark that draws in, not just appears, when someone successfully joins an event. Right now "Going" just becomes true. A small animated check (Skia or Reanimated path-draw, or even just a scale+fade) on the exact moment of confirmation is the single most emotionally-loaded UI action in the app (you just committed to going somewhere) and currently gets zero flourish.

Wallet balance — count up, not jump. When a refund/credit lands and the balance changes, animate the number counting from old→new over ~500ms instead of snapping. Small, but money changing is a moment people actually watch.


Host badge earned — a genuine celebration moment. Right now hitting a new host tier (Rising/Established/Elite/Legend) just produces a notification row like any other. That's a real milestone — worth a one-time confetti/scale-in treatment the first time you see that specific notification, or on the profile screen when the badge itself first appears.

Ticket/QR screen reveal. When you land on /ticket, the QR code could scale/fade in slightly delayed after the rest of the card, giving it a small "here's your ticket" beat instead of everything rendering flat at once.