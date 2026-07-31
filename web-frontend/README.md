# BlockScore Web Frontend

Decentralized credit scoring platform frontend built with React, Material-UI, and Web3 integration.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Building](#building)
- [Integration with Backend](#integration-with-backend)
- [Project Structure](#project-structure)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)

## Overview

The BlockScore web frontend provides an intuitive interface for users to:

- View their blockchain-based credit scores
- Check loan eligibility
- Track transaction history
- Manage wallet connections
- Monitor credit factors and improvements

## Features

- **Real-time Credit Scoring**: View credit scores updated from blockchain data
- **Loan Calculator**: Calculate loan eligibility and monthly payments
- **Wallet Integration**: Connect MetaMask and other Web3 wallets
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Interactive Visualizations**: Charts and gauges for credit data
- **Secure Authentication**: JWT-based authentication with Web3 signatures

## Tech Stack

- **Framework**: React 18.2.0
- **UI Library**: Material-UI (MUI) 5.12.1
- **State Management**: React Context API
- **Routing**: React Router v7
- **Web3**: Web3.js 4.16.0, ethers.js (planned)
- **Charts**: Chart.js 4.2.1, D3.js 7.8.4
- **Animations**: Framer Motion 10.12.4
- **HTTP Client**: Axios 1.3.6
- **Testing**: Vitest, React Testing Library
- **Build Tool**: Vite

## Prerequisites

Before running the frontend, ensure you have:

- **Node.js**: v16 or higher
- **npm**: v8 or higher (comes with Node.js)
- **MetaMask** or another Web3 wallet browser extension (for full functionality)
- **Backend API**: BlockScore backend running on `http://localhost:5000` (see backend README)

## Installation

1. **Clone the repository** (if not already done):

   ```bash
   git clone https://github.com/quantsingularity/BlockScore.git
   cd BlockScore/web-frontend
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Create environment file**:

   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** (see [Configuration](#configuration))

## Configuration

Create a `.env` file in the root of `web-frontend` directory with the following variables:

```bash
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_API_TIMEOUT=10000

# Blockchain Configuration
REACT_APP_NETWORK_ID=1
REACT_APP_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000

# Feature Flags
REACT_APP_ENABLE_DEBUG=false
REACT_APP_ENABLE_MOCK_DATA=true

# App Configuration
REACT_APP_NAME=BlockScore
REACT_APP_VERSION=1.0.0
```

### Environment Variables Explained

- `REACT_APP_API_URL`: Backend API base URL
- `REACT_APP_API_TIMEOUT`: API request timeout in milliseconds
- `REACT_APP_NETWORK_ID`: Ethereum network ID (1=Mainnet, 3=Ropsten, etc.)
- `REACT_APP_CONTRACT_ADDRESS`: Deployed smart contract address
- `REACT_APP_ENABLE_DEBUG`: Enable debug logging
- `REACT_APP_ENABLE_MOCK_DATA`: Use mock data when API calls fail

## Development

### Start Development Server

```bash
npm start
```

The app will open at `http://localhost:3000`. Hot-reloading is enabled.

### Development with Backend

1. **Start the backend**:

   ```bash
   cd ../code/backend
   npm install
   npm start
   ```

   Backend should run on `http://localhost:5000`

2. **Start the frontend** (in another terminal):
   ```bash
   cd web-frontend
   npm start
   ```

The frontend proxies API requests to the backend automatically in development mode.

## Testing

### Run Unit Tests

```bash
npm test
```

Runs tests in interactive watch mode.

### Run All Tests Once

```bash
npm test -- --watchAll=false
```

### Run Tests with Coverage

```bash
npm test -- --coverage --watchAll=false
```

### Test Files

- `src/App.test.js`: Main application tests
- `src/__tests__/`: Additional test suites (to be added)
- `src/__mocks__/`: Mock implementations for testing

## Building

### Create Production Build

```bash
npm run build
```

Builds the app for production to the `build` folder. The build is optimized and minified.

### Serve Production Build Locally

```bash
npm install -g serve
serve -s build -l 3000
```

## Integration with Backend

### API Endpoints Used

The frontend integrates with the following backend endpoints:

#### Credit Endpoints

- `GET /api/credit/score/:address` - Get credit score
- `GET /api/credit/history/:address` - Get credit history
- `POST /api/credit/calculate-score` - Calculate credit score with AI

#### Loan Endpoints

- `POST /api/loans/calculate` - Calculate loan eligibility
- `POST /api/loans/apply` - Apply for a loan

#### Auth Endpoints

- `POST /api/auth/login` - Authenticate with wallet
- `POST /api/auth/logout` - Logout

### Testing Backend Integration

1. Ensure backend is running on `http://localhost:5000`
2. Check backend health:
   ```bash
   curl http://localhost:5000/health
   ```
3. Start frontend and check browser console for API calls
4. Use browser DevTools Network tab to inspect requests/responses

## Project Structure

```
web-frontend/
├── public/                 # Static assets
│   ├── index.html         # HTML template
│   ├── manifest.json      # PWA manifest
│   └── favicon.ico        # Favicon
├── src/
│   ├── components/        # Reusable components
│   │   ├── common/        # Common components (LoadingScreen, etc.)
│   │   ├── dashboard/     # Dashboard-specific components
│   │   └── navigation/    # Navigation components (Navbar, Sidebar, Footer)
│   ├── contexts/          # React Context providers
│   │   ├── AuthContext.js
│   │   ├── Web3Context.js
│   │   └── CreditContext.js
│   ├── layouts/           # Page layouts
│   │   └── MainLayout.js
│   ├── pages/             # Page components
│   │   ├── Landing.js
│   │   ├── Dashboard.js
│   │   ├── LoanCalculator.js
│   │   ├── Profile.js
│   │   └── NotFound.js
│   ├── utils/             # Utility functions
│   │   └── api.js         # API service
│   ├── __mocks__/         # Test mocks
│   ├── __tests__/         # Test suites
│   ├── App.js             # Main application component
│   ├── App.test.js        # App tests
│   ├── index.js           # Application entry point
│   ├── index.css          # Global styles
│   └── theme.js           # MUI theme configuration
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
├── jest.config.js         # Jest configuration
└── README.md              # This file
```

## Available Scripts

### `npm start` (alias: `npm run dev`)

Runs the app in development mode on `http://localhost:3000`, with fast HMR via Vite.

### `npm test`

Runs the test suite once (Vitest). Use `npm run test:watch` for interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder, with route-based code splitting.

### `npm run preview`

Serves the production build locally, for a final check before deploying.

### `npm run lint`

Runs ESLint over the project.

## Troubleshooting

### Common Issues

#### 1. **Module Not Found Errors**

```bash
npm install
npm audit fix
```

#### 2. **API Connection Errors**

- Verify backend is running: `curl http://localhost:5000/health`
- Check `.env` file has correct `REACT_APP_API_URL`
- Check browser console for CORS errors
- Ensure backend has CORS enabled

#### 3. **Web3/MetaMask Not Working**

- Install MetaMask browser extension
- Connect MetaMask to the correct network
- Check console for Web3 provider errors
- Fallback: App works in read-only mode without wallet

#### 4. **Build Timeouts**

- Increase Node.js memory:
  ```bash
  export NODE_OPTIONS="--max-old-space-size=4096"
  npm run build
  ```

#### 5. **Port 3000 Already in Use**

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm start
```

### Debugging Tips

1. **Enable Debug Mode**: Set `REACT_APP_ENABLE_DEBUG=true` in `.env`
2. **Check Console**: Open browser DevTools (F12) → Console tab
3. **Network Inspection**: DevTools → Network tab to see API calls
4. **React DevTools**: Install React Developer Tools browser extension

### Getting Help

- Check [GitHub Issues](https://github.com/quantsingularity/BlockScore/issues)
- Review backend API documentation
- Check console logs for specific error messages

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Write/update tests
4. Run tests: `npm test`
5. Build: `npm run build`
6. Commit: `git commit -m "Add my feature"`
7. Push: `git push origin feature/my-feature`
8. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
