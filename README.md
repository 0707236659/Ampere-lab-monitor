# Sensor Chip Manufacturing Test

Dashboard for factory, lab, and sensor chip test results. This first pass is a [Next.js](https://nextjs.org/) App Router app with mock JSON and a delayed `setTimeout` fetch so loading states feel real.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Home `/` — Factory Overview (8 factory cards)
- Factory detail `/factories/1` — chip table and stats
- Mock data lives in `src/data/factories.json` and `src/data/chips.json`
- Delayed load helper: `src/lib/fake-fetch.ts` (used by `src/hooks/use-fake-fetch.ts`)

## Continuation checklist

Pick these up when you come back:

- [ ] Replace `fakeFetch` / JSON with a real API
- [ ] Labs list and lab detail pages
- [ ] Global Sensor Chips page
- [ ] Reports (charts / scheduled exports)
- [ ] Settings (profile, thresholds, notifications)
- [ ] Real Export (CSV / Excel)
- [ ] Auth and a working user menu
- [ ] Live refresh (polling or WebSocket)
- [ ] Empty, error, and zero-result states
- [ ] Responsive / mobile sidebar
- [ ] Tests for filter and sort helpers
- [ ] Row action menu (view chip, retest, etc.)
