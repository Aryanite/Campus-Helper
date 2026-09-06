export const PRIVACY_POLICY = {
  title: 'Privacy Policy',
  lastUpdated: 'September 2026',
  sections: [
    {
      heading: '1. No Personal Data Collection',
      content:
        'CampusHelper does not require user accounts, email addresses, phone numbers, or institutional passwords. We do not track, profile, or sell personal student identity data.',
    },
    {
      heading: '2. Client-Side Preferences & Local Storage',
      content:
        'When you select a preferred student batch (e.g. 2CSE13) or toggle display filters, your preferences are stored strictly on your local device via standard browser localStorage. This data never leaves your client device.',
    },
    {
      heading: '3. EduPage Session Handling',
      content:
        'Timetable requests are proxied through our backend service using standard, anonymous guest sessions established with the university EduPage portal. No private user session tokens or personal credentials are required or intercepted.',
    },
    {
      heading: '4. Analytics & Cookies',
      content:
        'CampusHelper operates zero third-party advertising cookies, zero social tracking pixels, and zero cross-site monitoring scripts. Diagnostic logs are strictly ephemeral and anonymized for uptime monitoring.',
    },
  ],
};
