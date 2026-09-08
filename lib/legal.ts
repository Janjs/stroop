export const LEGAL_PAGES = {
  privacy: {
    title: 'Privacy Policy',
    updated: 'September 7, 2026',
    sections: [
      {
        heading: 'Who we are',
        body: 'Stroop (“we”, “us”) is an AI-powered Strudel generator operated at stroop.app. Contact: janjs.dev.',
      },
      {
        heading: 'What we collect',
        body: 'If you sign in with Google, we store your name, email, and profile image. We also store the prompts and Strudel you generate, chat history, model choice, and how much usage your account has consumed. Anonymous visitors are tracked with a random session id in local storage so we can enforce the free generation limit. Payment details are collected by Polar, not by us.',
      },
      {
        heading: 'How we use it',
        body: 'We use this data to run the product: generate Strudel, keep your chats, enforce free and paid limits, and process subscriptions. We do not sell your personal data. We do not use your prompts or generated music to train our own models.',
      },
      {
        heading: 'Processors',
        body: 'Google (sign-in), Convex (database and auth), OpenRouter and OpenAI (model inference), and Polar (payments, as merchant of record). Each processes data only to provide their service.',
      },
      {
        heading: 'Cookies',
        body: 'We use cookies and similar storage for sign-in sessions and theme preference. We do not use advertising cookies.',
      },
      {
        heading: 'Retention',
        body: 'Account data and chats stay until you delete them or close your account. Anonymous session usage is kept only to enforce the free limit. Polar keeps payment records as required by law.',
      },
      {
        heading: 'Your rights',
        body: 'You can request access, correction, or deletion of your account data by contacting us. If you are in the EEA or UK, you also have GDPR rights including objection and complaint to a supervisory authority.',
      },
      {
        heading: 'Children',
        body: 'Stroop is not directed at children under 16. Do not create an account if you are under 16.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    updated: 'September 7, 2026',
    sections: [
      {
        heading: 'The service',
        body: 'Stroop generates playable Strudel code from your prompts. It embeds the AGPL-licensed Strudel REPL. The music you create is yours. The Stroop source is licensed AGPL-3.0-or-later; you can get it from the public repository linked on the site.',
      },
      {
        heading: 'Accounts and free use',
        body: 'You can try Stroop without an account: 3 generations. After you sign in, a subscription is required to keep generating. You must be 16 or older.',
      },
      {
        heading: 'Subscription',
        body: 'Stroop Pro is $5 per month, billed by Polar. It is required after you sign in and includes every model in the picker plus a monthly usage allowance. Better models use more of that allowance. You can cancel anytime in the customer portal; access continues until the end of the paid period. Prices are shown at checkout and include applicable taxes Polar collects as merchant of record.',
      },
      {
        heading: 'Acceptable use',
        body: 'Do not abuse the generators, attempt to bypass limits, attack the service, or use it for anything illegal. We may suspend accounts that do.',
      },
      {
        heading: 'Disclaimer',
        body: 'Stroop is provided as-is. Generated code may be wrong or unplayable. We are not liable for lost data, failed generations, or consequential damages to the extent the law allows. Strudel and third-party sample banks have their own licenses.',
      },
    ],
  },
  refunds: {
    title: 'Refunds and cancellation',
    updated: 'September 7, 2026',
    sections: [
      {
        heading: 'Cancel anytime',
        body: 'Cancel in the billing portal from your account menu. You keep access until the current period ends. We do not charge a cancellation fee.',
      },
      {
        heading: 'Refunds',
        body: 'Payments are processed by Polar. If you have not used paid generations in the current period, ask for a refund within 14 days of purchase (EEA/UK withdrawal right). After you use paid generations, the digital service has been supplied and that payment is not refundable, except where Polar or the law requires otherwise.',
      },
      {
        heading: 'How to request one',
        body: 'Use the Polar customer portal or contact us via janjs.dev. Include the email on the subscription.',
      },
    ],
  },
} as const

export type LegalSlug = keyof typeof LEGAL_PAGES
