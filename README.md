# Askio

Askio turns your FAQs into a chatbot that looks like your brand. Visitors get
instant answers, you capture their details, and it goes live on any website
with one line of code.

**Hosted version:** [getaskio.xyz](https://getaskio.xyz), with a free plan and no
setup needed. This repository is the full source of that service.

## Features

**Free (Starter)**

- Unlimited chatbots built from your own questions and answers
- Your colours, avatar, greeting and launcher, including Kio, the animated
  launcher that reacts to visitors
- Lead capture and a "talk to a human" link
- Analytics: questions asked, unanswered questions, ratings and leads
- Widget and dashboard in English, French, Dutch, German and Spanish
- Embed with a script tag, or install on WordPress, Shopify or Wix

**Pro**

- AI answers to visitors' questions, in the visitor's language
- Website scan that writes your FAQs for you
- AI persona and tone
- Up to 10 AI chatbots and 3,000 AI replies a month
- Conversation history, kept 90 days

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Vercel serverless functions (`api/`)
- **Data and sign-in:** Firebase Auth and Cloud Firestore
- **AI:** Anthropic Claude (Haiku 5.5 for replies, Sonnet 5.5 for FAQ writing), with Google Gemini as the fallback
- **Billing:** Lemon Squeezy
- **Monitoring:** Sentry (optional)

## Project structure

```
api/              Vercel functions: AI replies, visitor records, billing,
                  account actions, Shopify, cron
  _lib/           Shared server code (auth, plans, rate limits, safe fetch)
src/
  components/     The widget (Chatbot.tsx), the editor and shared UI
  pages/          Dashboard, Analytics, Conversations, Settings, Admin, homepage
  i18n/           Translations for the app and the widget
public/           Static files, including chatbot-embed.js and brand assets
firestore.rules   Who may read and write what
tests/            Unit tests (Vitest) and Firestore rules tests
scripts/          One-off admin and maintenance scripts
```

## Running it locally

You need Node.js 20 or later and a Firebase project.

```bash
git clone https://github.com/Salaheddine999/askio.git
cd askio
npm install
cp .env.example .env   # then fill in your values
npm run dev
```

The app runs at http://localhost:5173. By default, `/api` requests are
forwarded to the live site, so you can work on the frontend with only the
Firebase web settings filled in. To run the API on your machine too, start
`npx vercel dev` and set `VITE_API_PROXY_TARGET` to its address.

See [`.env.example`](.env.example) for every setting and what it's for.

### Firebase setup

1. Create a Firebase project and enable **Authentication** (Email/Password and
   Google) and **Cloud Firestore**.
2. Add a web app and copy its settings into the `VITE_FIREBASE_*` variables.
3. Create a service account key and set `FIREBASE_CLIENT_EMAIL` and
   `FIREBASE_PRIVATE_KEY`.
4. Deploy the security rules and indexes:

   ```bash
   npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <your-project-id>
   ```

5. To open the admin page (`/admin`), give your account the admin role:

   ```bash
   node --env-file=.env scripts/set-admin.mjs you@example.com
   ```

## Deploying

Askio is built for [Vercel](https://vercel.com):

1. Import the repository in Vercel. It detects Vite automatically.
2. Add the variables from `.env.example` under **Settings → Environment
   Variables**.
3. Deploy. `vercel.json` sets up the routes, the widget's headers and the
   nightly cleanup cron.

The Hobby plan allows 12 serverless functions. Askio uses 11, which is why
related endpoints share one file (`api/*/[action].js`).

For billing, point a Lemon Squeezy webhook at `/api/webhooks/lemonsqueezy` and
set `LEMONSQUEEZY_WEBHOOK_SECRET` to its signing secret.

## Tests

```bash
npm test            # unit tests: billing, webhooks, visitor records, safety, translations
npm run test:rules  # Firestore rules in the emulator (needs Java)
npx tsc -b          # type check
```

GitHub Actions runs all three on every push.

## Contributing

Issues and pull requests are welcome. For anything larger than a small fix,
please open an issue first so we can agree on the approach. Before you open a
pull request, run `npm test` and `npx tsc -b`.

## License

Askio is free software under the
[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0), with
[additional terms](ADDITIONAL_TERMS.md) allowed by section 7 of that license.

You may use, change and share it. In short:

- **Share your changes.** If you run a modified version as a service that
  other people use, you must make your changed source code available to them
  under the same license.
- **Keep the credit.** Every copy must show "Based on Askio" with a link to
  https://getaskio.xyz in the chat widget and in the dashboard or website.
- **Use your own name.** The license gives no rights to the Askio name, the
  Askio logo or Kio. A modified version you offer to others needs its own
  name and logo, and must not claim to be Askio or to be made by its authors.

[ADDITIONAL_TERMS.md](ADDITIONAL_TERMS.md) has the full wording.

Copyright © 2024–2026 Salaheddine
([github.com/Salaheddine999](https://github.com/Salaheddine999)), operating as
Askio.
