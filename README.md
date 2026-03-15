# Games Manager Pro

A comprehensive dashboard application for discord game account management, built with Next.js. Create and manage bot account, track balances, analyze reports, and handle cross-trade entries all in one place.

# Features

### Account Management

- User Authentication - Secure sign-up and login with NextAuth
- Bot Accounts - Create bot accounts under your main account
- Bot Selection - Easily manage and switch between different bot accounts

### Wallet & Finance

- Balance Tracking - Monitor balances across different currency types (Tickets, Jade, Wist)
- Bulk Balance Editing - Update multiple bot balances simultaneously
- Transaction History - View complete history of all wallet transactions

# Analytics & Reporting

- Interactive Charts - Visualize your data with beautiful, responsive charts using Recharts
- Export Functionality - Export reports and analytics data for external use
- Cross-Trade Management - Handle entry crosstrades and currency-crosstrades efficiently

# Security

- Password Hashing - Secure password storage with bcryptjs
- Rate Limiting - IP-based rate limiting using Upstash Redis
- Session Management - Secure session handling with NextAuth

# Technology Stack

### Core Framework

- Next.js 16.1.4 - React framework with App Router
- TypeScript - Type safety and better developer experience

### Database & Caching

- MySQL2 - Primary database for storing user and bot data
- Upstash Redis - Rate limiting and caching

### Authentication

- NextAuth.js - Complete authentication solution
- bcryptjs - Password hashing

### UI Components & Styling

- Tailwind CSS - Utility-first CSS framework
- Framer Motion - Smooth animations
- Lucide React - Beautiful icons
- Recharts - Composable charting library

### Utilities

- Axios - HTTP client for API requests
- React Hot Toast - Elegant toast notifications
- UUID - Generate unique identifiers

# Installation

Clone the repository

```bash
git clone https://github.com/yourusername/games-manager-pro.git
cd games-manager-pro
```

Install dependencies

```bash
npm install
```

Set up environment variables
Create a `.env` file in the root directory and setup using the `.env.sample`

Start the development server

```bash
npm run dev
```

### Available Scripts

- npm run dev - Start development server with hot reload
- npm run build - Build the application for production
- npm run start - Start the production server
- npm run lint - Run ESLint for code linting

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch `(git checkout -b feature/AmazingFeature)`
3. Commit your changes `(git commit -m 'Add some AmazingFeature')`
4. Push to the branch `(git push origin feature/AmazingFeature)`
5. Open a Pull Request

# Links

1. Website: https://games-manager-pro.vercel.app/
2. YouTube Video: https://youtu.be/eDXwfjrHNUI
