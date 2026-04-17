# CLAUDE.md - cloistr-me-ui

**Public signup and management UI for @cloistr.xyz addresses**

## Project Information

- **Company:** Coldforge
- **Type:** SolidJS Web Application
- **Purpose:** User-facing UI for purchasing and managing Nostr addresses

## Tech Stack

| Component | Choice |
|-----------|--------|
| Framework | SolidJS |
| Build | Vite |
| Router | @solidjs/router |
| Auth | nostr-tools (NIP-07 + NIP-46) |
| Styling | Plain CSS |

## Architecture

```
src/
├── lib/
│   ├── api.ts          # API client with NIP-98 auth
│   ├── nostr.ts        # NIP-07/NIP-46 authentication
│   ├── nip98.ts        # HTTP auth header generation
│   └── types.ts        # TypeScript types
├── components/
│   ├── LoginButton.tsx     # NIP-07/NIP-46 login modal
│   ├── UsernameInput.tsx   # Live availability checking
│   ├── PaymentQR.tsx       # BOLT11 invoice QR
│   ├── LightningConfig.tsx # Lightning settings
│   └── CreditBalance.tsx   # Credits display
└── pages/
    ├── Home.tsx        # Landing + signup
    ├── Purchase.tsx    # Payment flow
    ├── Success.tsx     # Post-purchase
    ├── Dashboard.tsx   # Address management
    └── NotFound.tsx    # 404 page
```

## User Flows

### Public Signup
1. Enter desired username (live availability check)
2. Login with NIP-07/NIP-46 if not authenticated
3. View quote and create invoice
4. Pay Lightning invoice (QR or copy)
5. Redirect to success page

### Management Dashboard
1. Login required
2. View current address info
3. Configure Lightning (proxy mode)
4. View/withdraw credits

## API Integration

Backend: `cloistr-me` service at `/api/v1/*`

### Public Endpoints
- `GET /api/v1/addresses/check/:username` - Availability

### Authenticated (NIP-98)
- `POST /api/v1/purchase/quote` - Get pricing
- `POST /api/v1/purchase/invoice` - Create invoice
- `GET /api/v1/purchase/status/:id` - Payment status
- `GET /api/v1/addresses/me` - My address
- `PUT /api/v1/addresses/lightning` - Update config
- `GET /api/v1/credits` - Credit balance
- `POST /api/v1/credits/withdraw` - Withdraw

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

- Docker image: `registry.aegis-hq.xyz/coldforge/cloistr-me-ui`
- Namespace: `cloistr`
- Routing: cloistr-tunnel routes `/*` to this UI, `/api/*` to backend

## Related

- Backend: cloistr-me (`~/Development/cloistr-me/`)
- Auth patterns: cloistr-discovery-ui (`~/Development/cloistr-discovery-ui/`)
