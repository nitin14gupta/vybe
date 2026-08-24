We need to add a one-time host verification system for Gorave.

Since Gorave is a marketplace where an individual person can host events, for example a house party or meetup, we need a way to verify that the person hosting the event is real and trustworthy.

I want to understand what the best verification approach would be in India. For example, should we use:

PAN verification
DigiLocker
Aadhaar-based verification, if appropriate
Government ID verification through a third-party provider
Phone and email verification combined with identity verification
Another method used by large peer-to-peer marketplaces

The main goal is simple: before someone becomes an active host, we should verify their identity once and mark them as a Verified Host.

We already have the host onboarding flow, so first review the existing flow and UI here:

@client\src\components\host-onboarding

Understand the current onboarding steps and then suggest exactly where the verification step should be added. Also consider whether verification should happen:

During host onboarding
When creating their first event
Only before publishing an event
In a separate verification flow

Before building anything, I want a proper analysis and plan.

Please research how large peer-to-peer marketplaces and event platforms handle identity verification for individual hosts or organizers. Then compare the available options based on:

User trust and safety
Ease of onboarding
User friction
Verification accuracy
Privacy
Legal considerations in India
Implementation complexity
API/provider availability
Cost per verification
Scalability

I want a few practical options, such as a basic MVP approach, a balanced approach, and a strong verification approach.

Then give me one clear recommendation for Gorave. Keep in mind that hosts are mostly normal people hosting things like house parties, so the verification should be strong enough to build trust and prevent fake hosts, but it should not make onboarding unnecessarily difficult.

Also suggest how the Verified Host status and verification process should appear in the existing onboarding UI.

The final output should be a clear implementation plan so I can choose the approach and finalize it before we start building.