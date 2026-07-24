<div align="center">
  <h1>MediSync - Personal Health Passport</h1>
  <p>Your comprehensive digital health record powered by AI and blockchain technology</p>
</div>

## Overview

MediSync is a Personal Health Passport application that enables users to manage their medical records, generate health passports, and gain AI-powered insights. Built with React, it integrates with Stellar blockchain for secure record management and Google's AI for intelligent health analysis.

## Features

- 🏥 **Personal Health Records** - Store and manage your medical information securely
- 📄 **Health Passport Generation** - Generate professional PDF health passports
- 🤖 **AI-Powered Insights** - Get intelligent health analysis using Google Gemini AI
- 🔗 **Blockchain Integration** - Secure record management using Stellar blockchain
- 📊 **Timeline View** - Visual timeline of your health history
- 👨‍⚕️ **Clinician Overview** - Professional view for healthcare providers
- 📤 **Document Upload** - Upload and manage medical documents

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4
- **Backend**: Express.js
- **AI Integration**: Google GenAI (Gemini)
- **Blockchain**: Stellar SDK
- **PDF Generation**: jsPDF
- **Build Tool**: Vite
- **Animations**: Motion (Framer Motion)

## Prerequisites

- Node.js (v18 or higher)
- npm or bun
- Google Gemini API Key
- Stellar Wallet (optional, for blockchain features)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Tanya-garg10/MediSync---Personal-Health-Passport.git
   cd MediSync---Personal-Health-Passport
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   STELLAR_SECRET_KEY=your_stellar_secret_key_here
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
medisync/
├── src/
│   ├── components/
│   │   ├── AIInsightWidget.tsx    # AI-powered health insights
│   │   ├── ClinicianOverview.tsx  # Healthcare provider view
│   │   ├── DocumentUploader.tsx   # Document management
│   │   ├── LandingLoginPage.tsx   # Authentication and landing
│   │   ├── PassportForm.tsx       # Health passport form
│   │   └── TimelineWidget.tsx     # Health timeline visualization
│   ├── utils/
│   │   ├── pdfGenerator.ts        # PDF generation utilities
│   │   └── stellarService.ts      # Blockchain integration
│   ├── App.tsx                    # Main application component
│   ├── main.tsx                   # Application entry point
│   └── types.ts                   # TypeScript type definitions
├── server.ts                      # Express server
├── package.json
└── tsconfig.json
```

## Features in Detail

### Health Passport
- Generate comprehensive PDF health passports
- Include personal information, medical history, and current conditions
- Professional formatting suitable for healthcare providers

### AI Insights
- Leverage Google Gemini AI for health analysis
- Get personalized recommendations based on your health data
- Interactive chat interface for health queries

### Blockchain Security
- Store health records on Stellar blockchain
- Immutable and secure record keeping
- Patient-controlled data access

### Timeline View
- Visual representation of health events
- Track appointments, procedures, and milestones
- Easy navigation through health history

## API Keys Setup

### Google Gemini API
1. Visit [Google AI Studio](https://ai.google.dev/)
2. Create a project and generate an API key
3. Add it to your `.env` file as `GEMINI_API_KEY`

### Stellar Network
1. Create a Stellar wallet at [Stellar Laboratory](https://laboratory.stellar.org/)
2. Get your secret key
3. Add it to your `.env` file as `STELLAR_SECRET_KEY`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Copyright 2024 MediSync Project

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Support

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/Tanya-garg10/MediSync---Personal-Health-Passport).

## Acknowledgments

- Google AI for Gemini API
- Stellar Development Foundation for blockchain infrastructure
- The open-source community for the amazing tools and libraries used
