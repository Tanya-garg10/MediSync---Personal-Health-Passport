# MediSync — Personal Health Passport

AI-powered Personal Health Passport: upload medical PDFs, structure them with Bindu agents, build a longitudinal timeline, prepare doctor visits, and share Stellar-verified records.

## Features

- Text-based PDF ingestion (extraction without AI)
- Bindu Document → Timeline → Insight agents + Prepare Doctor Visit
- Evidence-backed insights from recorded values only
- User-triggered Stellar record verification (Soroban when `MEDISYNC_CONTRACT_ID` is set)
- Single-record verification QR for clinicians
- Corsair → Google Calendar for detected follow-ups (when configured)
- Emergency passport view (`#emergency-{id}`)
- PDF health passport export

## Stack

- React 19, TypeScript, Tailwind CSS 4, Vite
- Express
- Google Gemini (`@google/genai`)
- Stellar SDK (Testnet / Soroban)
- Corsair + `@corsair-dev/googlecalendar`
- jsPDF

## Setup

```bash
npm install
cp .env.example .env
```

Set at least `GEMINI_API_KEY`. Optional: `STELLAR_SECRET_KEY`, `MEDISYNC_CONTRACT_ID`, `CORSAIR_KEK`.

Generate the demo sample PDF:

```bash
node scripts/generate-sample-pdf.mjs
```

## Run

```bash
npm run dev
```

Open `http://localhost:3000` — use **Enter Demo Health Passport** (`demo` / `12345`).

Production:

```bash
npm run build
npm start
```

## Demo flow

1. Enter Demo Health Passport
2. Try Sample Report → confirm structured values → timeline
3. Bindu Hub → Prepare Doctor Visit
4. Timeline → Verify on Stellar → Share Verified Record QR
5. Follow-up chip → Add to Calendar (Corsair, if configured)

## Soroban contract

Source: `contracts/medisync_registry` — `register_record(hash)` / `verify_record(hash)`.

Deploy to Stellar Testnet, then set `MEDISYNC_CONTRACT_ID`. Without it, MediSync still registers hashes on Testnet via account ManageData.

## Corsair

Configure with Corsair CLI (`corsair setup --plugin=googlecalendar`) and `CORSAIR_KEK`. If unset, the Calendar action returns a clear configuration error (do not fake Calendar URLs).

## Render

Use `render.yaml` or connect the repo as a single Node web service (`npm run build` / `npm start`).

## Hackathon note

This is a demo MVP. Do not upload real sensitive medical information.
