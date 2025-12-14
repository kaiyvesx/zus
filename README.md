# ZUS Coffee Gift Card Sender - React App

React JSX version of the ZUS Coffee Gift Card Sender application with Node.js/Express backend.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy JSON data files to `public/`:
   - `zus_messages.json`
   - `zus_names.json`

3. Start both the backend server and React app:
```bash
npm run dev
```

This will start:
- **Backend API Server**: `http://localhost:3001` (Node.js/Express)
- **React App**: `http://localhost:3000`

Alternatively, you can run them separately:
```bash
# Terminal 1: Start backend server
npm run server

# Terminal 2: Start React app
npm start
```

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## Features

- **Login**: Two-step OTP login to get bearer token
- **Signup**: Three-step signup (OTP request, verify, register)
- **Gift Card Sender**: Send 100 gift cards in parallel
- **Redeem**: Redeem single or multiple gift cards
- **Auto Redeem**: Automatically fetch and redeem all incoming gift cards
- **Delete Account**: Delete user account
- **Activate Balance**: Activate account balance

## Project Structure

```
zus-react/
├── server.js              # Node.js/Express backend API
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Header.js
│   │   ├── GiftCardSender.js
│   │   ├── LoginForm.js
│   │   ├── SignupForm.js
│   │   ├── RedeemForm.js
│   │   └── DeleteAccountForm.js
│   ├── services/
│   │   └── api.js         # API service (calls Node.js backend)
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
└── package.json
```

## Backend

The React app communicates with a **Node.js/Express backend** (`server.js`) which handles all API requests to the ZUS Coffee API. The backend runs on port 3001 and provides RESTful endpoints for:

- `/api/request-otp` - Request OTP code
- `/api/get-bearer-token` - Login with OTP
- `/api/register-account` - Register new account
- `/api/batch-send` - Send multiple gift cards
- `/api/redeem-gift-card` - Redeem single gift card
- `/api/batch-redeem` - Redeem multiple gift cards
- `/api/get-incoming-gift-cards` - Fetch incoming gift cards
- `/api/activate-balance` - Activate account balance
- `/api/delete-account` - Delete account

**No PHP required!** The entire application is now in JavaScript/Node.js.

