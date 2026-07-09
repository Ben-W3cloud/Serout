# Serout - Solana AI Agent

A production-ready Solana AI agent with a glassmorphism chat interface. Users interact via natural language to execute on-chain transactions: direct SOL transfers, token swaps via Jupiter, and bank payouts (mock).

## Architecture

```
User (wallet connected)
  -> Chat UI sends natural language message
  -> Express API forwards to Groq LLM for intent parsing
  -> Server returns structured intent (type, params)
  -> Server generates 3 route options (via Jupiter API / priority fee tiers / mock)
  -> User picks a route
  -> Client builds + simulates transaction via @solana/web3.js
  -> User confirms, wallet signs, transaction executes on-chain
```

**Security model**: Transaction building and signing stays client-side. The server never touches private keys.

## Transaction Types

| Type | Description | Route Options |
|------|-------------|---------------|
| **Direct Send** | Send SOL to any address | Economy / Standard / Express (priority fee tiers) |
| **Swap** | Swap tokens via Jupiter DEX | 3 slippage levels (0.3%, 0.5%, 1.0%) |
| **Bank Payout** | Cash out to bank (mock) | Wire / ACH / Express Wire |

## Tech Stack

- **Client**: React 18, Vite, TypeScript, Tailwind CSS, Solana Wallet Adapter
- **Server**: Express, TypeScript, Groq SDK (Llama 3.1 70B), Zod validation
- **Blockchain**: @solana/web3.js, Jupiter Swap API (lite-api.jup.ag/swap/v1)
- **Design**: Glassmorphism dark theme, Inter + JetBrains Mono fonts

## Setup

### Prerequisites

- Node.js 18+
- A Groq API key (https://console.groq.com)
- A Solana wallet browser extension (Phantom or Solflare)

### 1. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and set your Groq API key:

```
GROQ_API_KEY=gsk_your_real_key_here
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_CLUSTER=devnet
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### 2. Install Dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Run Development

Terminal 1 (server):
```bash
cd server && npm run dev
```

Terminal 2 (client):
```bash
cd client && npm run dev
```

Open http://localhost:5173

The Vite dev server proxies `/api` to the Express server on port 3001.

### 4. Production Build

```bash
cd client && npm run build    # outputs to client/dist/
cd ../server && npm run build # outputs to server/dist/
```

## API Endpoints

### `POST /api/parse`

Parse natural language into a structured intent via Groq AI.

```json
// Request
{ "message": "send 2 SOL to 7xKXtg...", "walletAddress": "YourWallet..." }

// Response (success)
{ "success": true, "intent": { "type": "DIRECT_SEND", "confidence": 0.98, "params": { ... } } }

// Response (clarification needed)
{ "success": true, "clarification": "Could you rephrase? ..." }
```

### `POST /api/routes`

Generate 3 route options for a parsed intent.

```json
// Request
{ "intent": { "type": "SWAP", "confidence": 0.97, "params": { ... } }, "walletAddress": "..." }

// Response
{ "success": true, "routes": [ { "id": "...", "label": "Tight Slippage (0.3%)", ... }, ... ] }
```

### `GET /api/health`

Health check. Returns `{ "status": "ok", "timestamp": "..." }`.

## User Flow

1. Connect wallet (Phantom / Solflare)
2. Type a natural language command in the chat
3. AI parses intent and confirms understanding
4. 3 route options are presented as cards
5. Select a route - transaction is simulated on-chain
6. Review simulation results (fee, compute units) - confirm or cancel
7. Wallet popup for signing - transaction executes
8. Success with Solana Explorer link, or clear error message

## Error Handling

- **AI parsing failures**: Graceful clarification messages, never crashes
- **Invalid addresses**: Validated at both base58 decode and before transaction build
- **Insufficient funds**: Caught during simulation with clear user message
- **User rejection**: Clean cancellation, flow resets
- **Race conditions**: Ref-based guard prevents double-submission
- **Network errors**: Normalized error messages at all layers
- **Rate limiting**: 30 requests/minute per IP on all API routes
- **Input validation**: Zod schemas on every endpoint, 500-char message limit
- **Blockhash expiry**: Fresh blockhash fetched right before signing

## Supported Tokens (Swap)

SOL, USDC, USDT, BONK, JUP, RAY

## Project Structure

```
serout/
├── .env.example
├── client/
│   ├── src/
│   │   ├── components/     # UI components (chat, routes, transaction, layout)
│   │   ├── config/         # Solana cluster, constants
│   │   ├── providers/      # WalletProvider, ChatProvider (state machine)
│   │   ├── services/       # API client, transaction builders
│   │   ├── styles/         # Tailwind + glassmorphism CSS
│   │   └── types/          # TypeScript interfaces
│   ├── vite.config.ts
│   └── tailwind.config.js
└── server/
    └── src/
        ├── config/         # Env validation, token registry, constants
        ├── controllers/    # Request handlers
        ├── middleware/      # Error handler, rate limiter, Zod validation
        ├── prompts/        # Groq system prompt with few-shot examples
        ├── routes/         # Express route definitions
        ├── services/       # AI service (Groq), route generation (Jupiter)
        ├── types/          # Shared type definitions
        └── utils/          # Logger
```

## License

MIT
