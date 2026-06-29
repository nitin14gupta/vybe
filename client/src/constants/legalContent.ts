export interface LegalSection {
  title: string
  body: string
}

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: 'Acceptance',
    body: "By using Vybe you agree to these terms. If you don't agree, please don't use the app.",
  },
  {
    title: 'Eligibility',
    body: 'You must be 18 or older to use Vybe. We reserve the right to terminate accounts that violate this rule.',
  },
  {
    title: 'Your Content',
    body: 'You own the photos, voice intros, and content you post. By posting, you grant Vybe a licence to display that content to other users within the app.',
  },
  {
    title: 'Prohibited Conduct',
    body: "Don't impersonate others, post illegal content, harass other users, or attempt to reverse-engineer the app. Violations result in immediate account termination.",
  },
  {
    title: 'Payments & Wallet',
    body: 'Event ticket purchases are final. Vybe Wallet credits are issued when events are cancelled and can only be redeemed on future Vybe events. Credits are not purchasable and are not subject to Apple In-App Purchase rules. Razorpay processes all payments.',
  },
  {
    title: 'Hosted Events',
    body: 'If you delete your account, all upcoming events you host will be cancelled and attendees will be refunded to their Vybe Wallet automatically.',
  },
  {
    title: 'Limitation of Liability',
    body: 'Vybe is provided as-is. We are not liable for any damages arising from your use of the app beyond what is required by applicable Indian law.',
  },
  {
    title: 'Changes',
    body: 'We may update these terms occasionally. Continued use of Vybe after updates means you accept the new terms.',
  },
  {
    title: 'Contact',
    body: 'Questions? Email us at legal@vybe.in',
  },
]

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: 'Information We Collect',
    body: 'We collect information you provide — like your name, phone number, photos, voice intro, and interests — when you create and use your Vybe profile. We also collect your approximate location when you grant permission.',
  },
  {
    title: 'How We Use It',
    body: 'Your information helps us show you relevant people and events nearby, personalise your feed, and keep Vybe safe. We never sell your personal data to third parties.',
  },
  {
    title: 'Photos & Voice',
    body: 'Your photos and voice intro are stored securely and displayed only to other Vybe users. You can delete them at any time from your profile settings.',
  },
  {
    title: 'Payments',
    body: 'Payments are processed by Razorpay. We do not store card or UPI details on our servers. Wallet credits are issued automatically on event cancellation.',
  },
  {
    title: 'Data Retention',
    body: 'You can delete your account at any time from Settings → Delete Account. Your profile, photos, voice intro, and wallet credits are permanently removed within 30 days. Email privacy@vybe.in within 30 days to recover.',
  },
  {
    title: 'Contact',
    body: 'Questions? Reach us at privacy@vybe.in',
  },
]

export const LEGAL_UPDATED = 'Last updated: June 2025'
