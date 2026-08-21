# 🏥 MediSync — Personal Health Passport

<div align="center">

**AI-powered Personal Health Passport with Blockchain Security**

Upload medical PDFs, structure them with AI, build a longitudinal timeline, prepare doctor visits, and share Stellar-verified records with tamper detection.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Stellar](https://img.shields.io/badge/Stellar-Testnet-7B3ED3?style=flat&logo=stellar)](https://stellar.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

</div>

---

## ✨ Key Features

### 🚀 High-Impact Demo Features

- **🆘 Emergency QR Access** — One-tap emergency access to critical medical information (blood type, allergies, medications, emergency contact) without full login
- **🔐 Stellar Tamper Detection** — Visual demonstration of blockchain security with "Simulate Tamper" button and "Restore Original" functionality
- **📋 AI-Powered Document Processing** — Upload medical PDFs and let AI extract structured data
- **📊 Longitudinal Timeline** — Chronological view of all medical events and consultations
- **🤖 AI Health Insights** — Evidence-backed insights from recorded values only
- **🔗 Stellar Blockchain Verification** — Register and verify medical records on Stellar Testnet
- **📱 Secure QR Sharing** — Share verified records with clinicians via QR codes
- **📅 Calendar Integration** — Add follow-ups to Google Calendar automatically
- **📄 PDF Export** — Generate professional medical passport PDFs

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Vite
- **Backend**: Express
- **AI**: Google Gemini (`@google/genai`)
- **Blockchain**: Stellar SDK (Testnet / Soroban)
- **Calendar**: Corsair + `@corsair-dev/googlecalendar`
- **PDF Generation**: jsPDF
- **QR Codes**: qrcode.react

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/Tanya-garg10/MediSync---Personal-Health-Passport.git
cd MediSync---Personal-Health-Passport

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Environment Configuration

Edit `.env` and set at minimum:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Optional for blockchain features:
```env
STELLAR_SECRET_KEY=your_stellar_secret_key
MEDISYNC_CONTRACT_ID=your_soroban_contract_id
CORSAIR_KEK=your_corsair_encryption_key
```

### Generate Demo PDF

```bash
node scripts/generate-sample-pdf.mjs
```

### Development

```bash
npm run dev
```

Open `http://localhost:3000` and use **Enter Demo Health Passport** (`demo` / `12345`).

### Production

```bash
npm run build
npm start
```

---

## 🎬 Demo Flow

### Complete Demo Experience

1. **🔐 Login** — Enter Demo Health Passport (`demo` / `12345`)
2. **📄 Upload Report** — Try Sample Report → confirm structured values → timeline
3. **🤖 AI Insights** — Bindu Hub → Prepare Doctor Visit
4. **🔗 Stellar Verification** — Timeline → Verify on Stellar
5. **🔒 Tamper Detection** — Click "Simulate Tamper" → See "Tampering Detected" → Click "Restore Original"
6. **📱 Share QR** — Share Verified Record QR
7. **🆘 Emergency Access** — Click "EMERGENCY QR" button → Scan QR code → View critical info
8. **📅 Calendar** — Follow-up chip → Add to Calendar

---

## 🔗 Blockchain Integration

### Stellar Testnet

MediSync uses Stellar blockchain for record verification:

- **Record Registration**: Hashes are registered on Stellar Testnet
- **Verification**: Records can be verified against blockchain hashes
- **Tamper Detection**: Visual demonstration of blockchain security

### Soroban Contract

Source: `contracts/medisync_registry`

Functions:
- `register_record(hash)` — Register medical record hash
- `verify_record(hash)` — Verify record authenticity

Deploy to Stellar Testnet, then set `MEDISYNC_CONTRACT_ID`. Without it, MediSync still registers hashes on Testnet via account ManageData.

---

## 📅 Calendar Integration

Configure with Corsair CLI:

```bash
corsair setup --plugin=googlecalendar
```

Set `CORSAIR_KEK` in `.env`. If unset, the Calendar action returns a clear configuration error.

---

## 🌐 Network Configuration

For QR code scanning from mobile devices:

The server is configured to listen on all network interfaces (`0.0.0.0`). Update the QR code URLs in `src/App.tsx` to use your network IP instead of `localhost`.

---

## 🚀 Deployment

### Render

Use `render.yaml` or connect the repo as a single Node web service:

```bash
npm run build
npm start
```

### Other Platforms

- Vercel
- Railway
- DigitalOcean App Platform
- AWS Elastic Beanstalk

---

## 📋 Project Structure

```
medisync/
├── contracts/           # Soroban smart contracts
├── public/              # Static assets
├── scripts/             # Utility scripts
├── src/
│   ├── components/      # React components
│   ├── server/          # Backend services
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── App.tsx          # Main application
├── server.ts            # Express server
├── vite.config.ts       # Vite configuration
└── package.json         # Dependencies
```

---

## ⚠️ Important Notes

- **Demo MVP**: This is a demonstration project. Do not upload real sensitive medical information.
- **Testnet Only**: Currently uses Stellar Testnet for blockchain operations.
- **Local Development**: QR codes use localhost by default; update for network access.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Stellar Development Foundation for blockchain infrastructure
- Google for Gemini AI
- Corsair for calendar integration
- The open-source community

---

<div align="center">

**Built with ❤️ for healthcare innovation**

</div>
